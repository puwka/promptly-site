(function () {
  const cfg = window.PROMPTLY_CONFIG || {};
  const INSTALL_KEY = 'promptly_install_id';
  const listeners = new Set();
  let client = null;
  let session = null;

  function siteOrigin() {
    const configured = String(cfg.siteUrl || '').replace(/\/$/, '');
    if (/^https?:\/\//i.test(configured) && !configured.includes('YOUR_DOMAIN')) return configured;
    return location.origin;
  }

  /** Always return to the public site, never a stale localhost from the Supabase dashboard. */
  function redirectTarget() {
    const next = new URLSearchParams(location.search).get('next') || '/account';
    const path = next.startsWith('/') && !next.startsWith('//') ? next : '/account';
    const url = new URL(path, siteOrigin() + '/');
    const install = getInstallId();
    if (install && !url.searchParams.get('install')) {
      url.searchParams.set('install', install);
    }
    return url.toString();
  }

  function isUuidLike(value) {
    return /^[a-zA-Z0-9_-]{8,64}$/.test(value);
  }

  function captureInstallParam() {
    const params = new URLSearchParams(location.search);
    const incoming = (params.get('install') || '').trim();
    if (incoming && isUuidLike(incoming)) {
      localStorage.setItem(INSTALL_KEY, incoming);
    }
    return localStorage.getItem(INSTALL_KEY) || '';
  }

  function getInstallId() {
    return localStorage.getItem(INSTALL_KEY) || '';
  }

  function getClient() {
    if (client) return client;
    if (!window.supabase || !cfg.supabaseUrl || !cfg.supabaseAnonKey) return null;
    client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    return client;
  }

  function emit() {
    listeners.forEach((fn) => {
      try {
        fn(session);
      } catch {
        /* ignore */
      }
    });
  }

  function notifyExtension(type) {
    const email = session?.user?.email || '';
    const installationId = getInstallId();
    window.postMessage(
      {
        source: 'promptly-site',
        type,
        email,
        installationId,
      },
      window.location.origin,
    );
  }

  async function linkInstallation() {
    const sb = getClient();
    const installationId = getInstallId();
    if (!sb || !session || !installationId) {
      return { ok: false, code: installationId ? 'auth_required' : 'install_missing' };
    }
    const { data, error } = await sb.rpc('link_account_installation', {
      p_installation_id: installationId,
    });
    if (error) return { ok: false, code: 'link_failed', message: error.message };
    notifyExtension('account-linked');
    return data || { ok: true };
  }

  async function startProCheckout() {
    if (!session) {
      const next = location.pathname + location.search;
      location.href = '/login?next=' + encodeURIComponent(next || '/pricing');
      return { ok: false, code: 'auth_required' };
    }
    const installationId = getInstallId();
    if (!installationId) {
      return {
        ok: false,
        code: 'install_missing',
        message:
          'Open Pricing from Promptly in Chrome (Upgrade to Pro) so this purchase attaches to your extension.',
      };
    }
    const sb = getClient();
    const email = session.user?.email || null;
    const { data, error } = await sb.functions.invoke('create-checkout', {
      body: { installation_id: installationId, email },
    });
    if (error || !data?.url) {
      let message = data?.error || error?.message || 'Could not start checkout';
      try {
        const ctx = error?.context;
        if (ctx && typeof ctx.json === 'function') {
          const json = await ctx.json();
          if (json?.error) message = json.error;
        }
      } catch {
        /* ignore */
      }
      return { ok: false, message };
    }
    notifyExtension('checkout-started');
    location.href = data.url;
    return { ok: true, url: data.url };
  }

  async function loadAccount() {
    const sb = getClient();
    if (!sb || !session) return { ok: false, code: 'auth_required' };
    const { data, error } = await sb.rpc('get_account_snapshot');
    if (error) return { ok: false, message: error.message };
    return data || { ok: false };
  }

  async function saveDisplayName(name) {
    const sb = getClient();
    if (!sb || !session) return { ok: false, code: 'auth_required' };
    const { data, error } = await sb.rpc('update_account_profile', {
      p_display_name: name,
    });
    if (error) return { ok: false, message: error.message };
    return data || { ok: false };
  }

  async function manageSubscription() {
    const installationId = getInstallId();
    const sb = getClient();
    if (!sb || !installationId) {
      location.href = '/support';
      return;
    }
    const { data, error } = await sb.functions.invoke('create-customer-portal', {
      body: {
        installation_id: installationId,
        email: session?.user?.email || null,
      },
    });
    if (data?.url) {
      location.href = data.url;
      return;
    }
    const note = document.querySelector('[data-account-note]');
    if (note) {
      note.textContent =
        error?.message ||
        data?.error ||
        'Billing management opens after Pro is active. You can also write to support.';
    }
  }

  async function signInGoogle() {
    const sb = getClient();
    if (!sb) throw new Error('Supabase is not configured');
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTarget(),
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) throw error;
  }

  async function signInEmail(email, password) {
    const sb = getClient();
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUpEmail(email, password) {
    const sb = getClient();
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTarget() },
    });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    const sb = getClient();
    if (sb) await sb.auth.signOut();
    session = null;
    emit();
    location.href = '/';
  }

  async function boot() {
    captureInstallParam();
    const sb = getClient();
    if (!sb) {
      window.PromptlyAuth = api;
      return;
    }
    const { data } = await sb.auth.getSession();
    session = data.session;
    sb.auth.onAuthStateChange((_event, next) => {
      session = next;
      emit();
      if (next && getInstallId()) void linkInstallation();
    });
    if (session && getInstallId()) await linkInstallation();
    emit();
  }

  const api = {
    getSession: () => session,
    onChange(fn) {
      listeners.add(fn);
      fn(session);
      return () => listeners.delete(fn);
    },
    captureInstallParam,
    getInstallId,
    redirectTarget,
    linkInstallation,
    startProCheckout,
    loadAccount,
    saveDisplayName,
    manageSubscription,
    signInGoogle,
    signInEmail,
    signUpEmail,
    signOut,
    ready: boot(),
  };

  window.PromptlyAuth = api;
})();
