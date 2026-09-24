/**
 * Promptly admin panel — talks only to Edge Function `admin`.
 * Privileges are never inferred from the browser; the server checks ADMIN_* secrets.
 */
(function () {
  const cfg = window.PROMPTLY_CONFIG || {};
  const TOKEN_KEY = 'promptly_admin_token';
  const ACTOR_KEY = 'promptly_admin_actor';
  const PAGE_SIZE = 50;

  function storageGet(key) {
    try {
      return localStorage.getItem(key) || '';
    } catch {
      return '';
    }
  }

  const root = document.querySelector('[data-admin-root]');
  const loginView = document.querySelector('[data-view="login"]');
  const appView = document.querySelector('[data-view="app"]');
  const flashEl = document.querySelector('[data-flash]');
  const dialog = document.querySelector('[data-sub-dialog]');
  const subForm = document.querySelector('[data-sub-form]');

  const state = {
    token: storageGet(TOKEN_KEY),
    actor: storageGet(ACTOR_KEY),
    tab: 'dashboard',
    query: '',
    plan: 'all',
    offset: 0,
    total: 0,
  };

  function adminUrl() {
    const base = String(cfg.supabaseUrl || '').replace(/\/$/, '');
    if (!base) return '';
    return `${base}/functions/v1/admin`;
  }

  function setFlash(message, kind) {
    if (!flashEl) return;
    if (!message) {
      flashEl.hidden = true;
      flashEl.textContent = '';
      flashEl.className = 'admin-flash';
      return;
    }
    flashEl.hidden = false;
    flashEl.textContent = message;
    flashEl.className = `admin-flash admin-flash--${kind || 'info'}`;
  }

  function persistSession(token, actor) {
    state.token = token || '';
    state.actor = actor || '';
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(ACTOR_KEY, actor || '');
      } else {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(ACTOR_KEY);
      }
    } catch {
      /* private mode / blocked storage — keep in-memory session */
    }
  }

  async function api(action, body) {
    const url = adminUrl();
    if (!url) {
      const err = new Error('Missing supabaseUrl in config.js');
      err.code = 'config';
      err.status = 0;
      throw err;
    }
    const headers = {
      'Content-Type': 'application/json',
      apikey: cfg.supabaseAnonKey || '',
      Authorization: `Bearer ${cfg.supabaseAnonKey || ''}`,
    };
    if (state.token && action !== 'login') {
      headers['x-admin-token'] = state.token;
    }
    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action, ...body }),
      });
    } catch (networkErr) {
      const err = new Error(
        'Network error — cannot reach admin API. Check that supabaseUrl is correct and the site is served over https.',
      );
      err.code = 'network';
      err.status = 0;
      err.cause = networkErr;
      throw err;
    }
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok) {
      const err = new Error((data && data.error) || `Request failed (${res.status})`);
      err.code = data && data.code;
      err.status = res.status;
      throw err;
    }
    return data;
  }

  function showView(name) {
    if (loginView) loginView.hidden = name !== 'login';
    if (appView) appView.hidden = name !== 'app';
  }

  function setTab(tab) {
    state.tab = tab;
    document.querySelectorAll('[data-tab]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.getAttribute('data-tab') === tab);
    });
    document.querySelectorAll('[data-panel]').forEach((panel) => {
      panel.hidden = panel.getAttribute('data-panel') !== tab;
    });
    if (tab === 'dashboard') loadStats();
    if (tab === 'users') loadUsers();
  }

  function formatDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function formatSource(source) {
    if (source === 'rollypay') return 'RollyPay';
    if (source === 'manual') return 'Manual';
    return '—';
  }

  function planBadge(effective) {
    const plan = effective === 'pro' ? 'pro' : 'free';
    return `<span class="admin-badge admin-badge--${plan}">${plan === 'pro' ? 'Pro' : 'Free'}</span>`;
  }

  function statusBadge(status, effective) {
    if (effective !== 'pro') return `<span class="admin-badge admin-badge--muted">inactive</span>`;
    const s = String(status || 'active');
    return `<span class="admin-badge admin-badge--status">${escapeHtml(s)}</span>`;
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function usageCell(u) {
    const used = Number(u.credits_used || 0);
    const limit = Number(u.credits_limit || 0);
    if (!limit && !used) return '—';
    return `${used}${limit ? ` / ${limit}` : ''}`;
  }

  async function loadStats() {
    try {
      const data = await api('stats', {});
      const keys = [
        'total_users',
        'free_users',
        'pro_users',
        'new_registrations_7d',
        'new_registrations_30d',
        'active_subscriptions',
        'credits_used_week',
      ];
      keys.forEach((key) => {
        const el = document.querySelector(`[data-stat="${key}"]`);
        if (el) el.textContent = data[key] == null ? '—' : String(data[key]);
      });
    } catch (err) {
      if (err.status === 401) return logout(true);
      setFlash(err.message || 'Failed to load stats', 'error');
    }
  }

  async function loadUsers() {
    const body = document.querySelector('[data-users-body]');
    const meta = document.querySelector('[data-users-meta]');
    if (body) {
      body.innerHTML = `<tr><td colspan="8" class="admin-empty">Loading…</td></tr>`;
    }
    try {
      const data = await api('users', {
        query: state.query || null,
        plan: state.plan || 'all',
        limit: PAGE_SIZE,
        offset: state.offset,
      });
      state.total = Number(data.total || 0);
      const users = Array.isArray(data.users) ? data.users : [];
      if (meta) {
        meta.textContent = `${state.total} user${state.total === 1 ? '' : 's'}`;
      }
      updatePager();
      if (!body) return;
      if (!users.length) {
        body.innerHTML = `<tr><td colspan="8" class="admin-empty">No users found</td></tr>`;
        return;
      }
      body.innerHTML = users
        .map((u) => {
          const install = u.installation_id || '';
          const canManage = Boolean(install);
          return `<tr>
            <td>
              <div class="admin-email">${escapeHtml(u.email || '—')}</div>
              <div class="admin-id">${escapeHtml(install || 'no installation')}</div>
            </td>
            <td>${escapeHtml(formatDate(u.registered_at))}</td>
            <td>${planBadge(u.effective_plan)}</td>
            <td>${statusBadge(u.status, u.effective_plan)}</td>
            <td>${escapeHtml(formatDate(u.current_period_end))}</td>
            <td>${escapeHtml(formatSource(u.source))}</td>
            <td>${escapeHtml(usageCell(u))}</td>
            <td>
              <button
                type="button"
                class="btn btn--ghost btn--sm"
                data-manage
                data-email="${escapeHtml(u.email || '')}"
                data-install="${escapeHtml(install)}"
                data-status="${escapeHtml(u.status || '')}"
                data-ends="${escapeHtml(u.current_period_end || '')}"
                data-source="${escapeHtml(u.source || '')}"
                ${canManage ? '' : 'disabled title="No installation_id linked"'}
              >Manage</button>
            </td>
          </tr>`;
        })
        .join('');
    } catch (err) {
      if (err.status === 401) return logout(true);
      if (body) {
        body.innerHTML = `<tr><td colspan="8" class="admin-empty">${escapeHtml(err.message)}</td></tr>`;
      }
    }
  }

  function updatePager() {
    const prev = document.querySelector('[data-page-prev]');
    const next = document.querySelector('[data-page-next]');
    const label = document.querySelector('[data-page-label]');
    const page = Math.floor(state.offset / PAGE_SIZE) + 1;
    const pages = Math.max(1, Math.ceil(state.total / PAGE_SIZE));
    if (label) label.textContent = `Page ${page} of ${pages}`;
    if (prev) prev.disabled = state.offset <= 0;
    if (next) next.disabled = state.offset + PAGE_SIZE >= state.total;
  }

  function logout(expired) {
    persistSession('', '');
    showView('login');
    if (expired) {
      const note = document.querySelector('[data-login-note]');
      if (note) note.textContent = 'Session expired. Sign in again.';
    }
  }

  function openManage(btn) {
    if (!dialog || !subForm) return;
    subForm.installation_id.value = btn.getAttribute('data-install') || '';
    subForm.email.value = btn.getAttribute('data-email') || '';
    const emailEl = document.querySelector('[data-sub-email]');
    const metaEl = document.querySelector('[data-sub-meta]');
    const note = document.querySelector('[data-sub-note]');
    if (emailEl) emailEl.textContent = btn.getAttribute('data-email') || '';
    if (metaEl) {
      const src = formatSource(btn.getAttribute('data-source'));
      const ends = formatDate(btn.getAttribute('data-ends'));
      metaEl.textContent = `Status: ${btn.getAttribute('data-status') || '—'} · Source: ${src} · Ends: ${ends}`;
    }
    if (note) note.textContent = '';
    subForm.ends_at.value = '';
    subForm.status.value = 'active';
    dialog.showModal();
  }

  async function grantPro(days) {
    const note = document.querySelector('[data-sub-note]');
    if (note) note.textContent = 'Saving…';
    const installation_id = subForm.installation_id.value;
    const email = subForm.email.value;
    const status = subForm.status.value || 'active';
    const ends_at = subForm.ends_at.value
      ? new Date(`${subForm.ends_at.value}T23:59:59.000Z`).toISOString()
      : null;
    try {
      const payload = {
        installation_id,
        email,
        status,
        target_plan: 'pro',
      };
      if (typeof days === 'number' && days > 0) payload.days = days;
      else if (ends_at) payload.ends_at = ends_at;
      // else: server keeps existing current_period_end (status-only update)
      await api('set_subscription', payload);
      if (note) note.textContent = 'Saved.';
      setFlash(`Pro updated for ${email || installation_id}`, 'ok');
      dialog.close();
      loadUsers();
      loadStats();
    } catch (err) {
      if (err.status === 401) return logout(true);
      if (note) note.textContent = err.message || 'Failed';
    }
  }

  async function revokePro() {
    const note = document.querySelector('[data-sub-note]');
    if (!confirm('Revoke Pro and set this user to Free?')) return;
    if (note) note.textContent = 'Revoking…';
    try {
      await api('set_subscription', {
        installation_id: subForm.installation_id.value,
        email: subForm.email.value,
        target_plan: 'free',
        status: 'revoked',
      });
      setFlash(`Subscription revoked for ${subForm.email.value || subForm.installation_id.value}`, 'ok');
      dialog.close();
      loadUsers();
      loadStats();
    } catch (err) {
      if (err.status === 401) return logout(true);
      if (note) note.textContent = err.message || 'Failed';
    }
  }

  function bind() {
    const loginForm = document.querySelector('[data-login-form]');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const note = document.querySelector('[data-login-note]');
        const submitBtn = document.querySelector('[data-login-submit]');
        if (note) note.textContent = '';
        const fd = new FormData(loginForm);
        const username = String(fd.get('username') || '').trim();
        const password = String(fd.get('password') || '').trim();
        if (!username || !password) {
          if (note) note.textContent = 'Enter username and password.';
          return;
        }
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Signing in…';
        }
        try {
          const data = await api('login', { username, password });
          if (!data || !data.token) {
            throw Object.assign(new Error('Login succeeded but no token returned'), { status: 502 });
          }
          persistSession(data.token, username);
          const actorEl = document.querySelector('[data-admin-actor]');
          if (actorEl) actorEl.textContent = username;
          showView('app');
          setTab('dashboard');
        } catch (err) {
          let msg = err.message || 'Sign in failed';
          if (err.code === 'bad_credentials' || err.status === 401) {
            msg = 'Invalid username or password. Use the admin operator login (username is usually “admin”), not your Promptly account.';
          } else if (err.code === 'admin_not_configured') {
            msg = 'Admin is not configured on the server (missing ADMIN_PASSWORD secret).';
          } else if (err.code === 'network') {
            msg = err.message;
          }
          if (note) note.textContent = msg;
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign in';
          }
        }
      });
    }

    document.querySelector('[data-logout]')?.addEventListener('click', () => logout(false));
    document.querySelector('[data-refresh-stats]')?.addEventListener('click', () => loadStats());

    document.querySelectorAll('[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => setTab(btn.getAttribute('data-tab')));
    });

    document.querySelector('[data-users-filter]')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      state.query = String(fd.get('query') || '').trim();
      state.plan = String(fd.get('plan') || 'all');
      state.offset = 0;
      loadUsers();
    });

    document.querySelector('[data-page-prev]')?.addEventListener('click', () => {
      state.offset = Math.max(0, state.offset - PAGE_SIZE);
      loadUsers();
    });
    document.querySelector('[data-page-next]')?.addEventListener('click', () => {
      state.offset += PAGE_SIZE;
      loadUsers();
    });

    document.querySelector('[data-users-body]')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-manage]');
      if (btn && !btn.disabled) openManage(btn);
    });

    document.querySelectorAll('[data-days]').forEach((chip) => {
      chip.addEventListener('click', () => {
        const days = Number(chip.getAttribute('data-days'));
        grantPro(days);
      });
    });
    document.querySelector('[data-sub-grant]')?.addEventListener('click', () => grantPro(0));
    document.querySelector('[data-sub-revoke]')?.addEventListener('click', () => revokePro());
  }

  function boot() {
    if (!root) return;
    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
      showView('login');
      const note = document.querySelector('[data-login-note]');
      if (note) note.textContent = 'Missing supabaseUrl / supabaseAnonKey in config.js';
      bind();
      return;
    }
    bind();
    if (state.token) {
      const actorEl = document.querySelector('[data-admin-actor]');
      if (actorEl) actorEl.textContent = state.actor || 'admin';
      showView('app');
      setTab('dashboard');
    } else {
      showView('login');
    }
  }

  boot();
})();
