(function () {
  const cfg = window.PROMPTLY_CONFIG || {};

  function text(value, fallback) {
    return value && String(value).trim() ? String(value).trim() : fallback || '';
  }

  function isPlaceholder(value) {
    if (!value) return true;
    const v = String(value).trim();
    return v.startsWith('[') && v.endsWith(']');
  }

  function brandMark(id) {
    return (
      `<svg class="brand__mark" viewBox="0 0 64 64" aria-hidden="true">` +
      `<defs>` +
      `<linearGradient id="${id}" x1="10" y1="8" x2="54" y2="56" gradientUnits="userSpaceOnUse">` +
      `<stop stop-color="#3b5bfd"/>` +
      `<stop offset="0.55" stop-color="#6b7cff"/>` +
      `<stop offset="1" stop-color="#a78bfa"/>` +
      `</linearGradient>` +
      `</defs>` +
      `<path fill="url(#${id})" d="M32 4 38.2 25.8 60 32 38.2 38.2 32 60 25.8 38.2 4 32 25.8 25.8Z"/>` +
      `<path fill="#8b5cf6" d="M48 38 50.2 45.8 58 48 50.2 50.2 48 58 45.8 50.2 38 48 45.8 45.8Z"/>` +
      `</svg>`
    );
  }

  function currentPath() {
    const p = (location.pathname || '/').replace(/\/$/, '') || '/';
    return p;
  }

  function navLink(href, label) {
    const path = currentPath();
    const active =
      path === href ||
      (href !== '/' && path.startsWith(href)) ||
      (href === '/' && path === '/');
    return `<a href="${href}"${active ? ' aria-current="page"' : ''}>${label}</a>`;
  }

  function renderHeader() {
    const el = document.querySelector('[data-site-header]');
    if (!el) return;

    const chromeUrl = text(cfg.chromeStoreUrl, '#');
    el.innerHTML = `
      <div class="wrap">
        <nav class="nav" aria-label="Primary">
          <a class="brand" href="/">
            ${brandMark('brand-grad')}
            <span>Promptly</span>
          </a>
          <button class="nav__toggle" type="button" aria-expanded="false" aria-controls="primary-nav" aria-label="Menu">
            <span></span><span></span>
          </button>
          <div class="nav__links" id="primary-nav">
            ${navLink('/', 'Product')}
            ${navLink('/pricing', 'Pricing')}
            ${navLink('/documentation', 'Docs')}
            ${navLink('/support', 'Support')}
            <a class="btn btn--ghost btn--sm" href="${chromeUrl}" data-cfg-href="chromeStoreUrl">Add to Chrome</a>
            <a class="btn btn--primary btn--sm" href="/pricing">Get Pro</a>
          </div>
        </nav>
      </div>
    `;

    const toggle = el.querySelector('.nav__toggle');
    const links = el.querySelector('.nav__links');
    if (toggle && links) {
      toggle.addEventListener('click', () => {
        const open = links.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
  }

  function renderFooter() {
    const el = document.querySelector('[data-site-footer]');
    if (!el) return;

    const year = new Date().getFullYear();
    el.innerHTML = `
      <div class="wrap footer__grid">
        <div class="footer__brand">
          <a class="brand" href="/">
            ${brandMark('footer-grad')}
            <span>Promptly</span>
          </a>
          <p>AI Browser Assistant for Chrome.</p>
        </div>
        <div class="footer__cols">
          <div>
            <h3>Product</h3>
            <a href="/">Home</a>
            <a href="/pricing">Pricing</a>
            <a href="/documentation">Documentation</a>
          </div>
          <div>
            <h3>Help</h3>
            <a href="/support">Support</a>
            <a href="/documentation#faq">FAQ</a>
            <a href="/checkout">Checkout</a>
          </div>
          <div>
            <h3>Legal</h3>
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
            <a href="/refund">Refund Policy</a>
          </div>
        </div>
      </div>
      <div class="wrap footer__bottom">
        <span>© ${year} Promptly</span>
        <span class="footer__legal-note" data-cfg="companyName"></span>
      </div>
    `;
  }

  function applyConfig() {
    document.querySelectorAll('[data-cfg]').forEach((node) => {
      const key = node.getAttribute('data-cfg');
      const value = cfg[key];
      if (value == null) return;
      if (node.tagName === 'A' && key.toLowerCase().includes('email')) {
        node.href = 'mailto:' + value;
        node.textContent = value;
      } else if (isPlaceholder(value)) {
        node.textContent = value;
        node.classList.add('is-placeholder');
      } else {
        node.textContent = value;
        node.classList.remove('is-placeholder');
      }
    });

    document.querySelectorAll('[data-cfg-href]').forEach((node) => {
      const key = node.getAttribute('data-cfg-href');
      const value = cfg[key];
      if (value) node.setAttribute('href', value);
    });

    document.querySelectorAll('[data-cfg-mail]').forEach((node) => {
      const key = node.getAttribute('data-cfg-mail');
      const value = cfg[key];
      if (!value || isPlaceholder(value)) return;
      node.setAttribute('href', 'mailto:' + value);
      if (!node.dataset.keepLabel) node.textContent = value;
    });

    const plan = cfg.plan || {};
    document.querySelectorAll('[data-plan]').forEach((node) => {
      const key = node.getAttribute('data-plan');
      if (plan[key] != null) node.textContent = plan[key];
    });

    document.querySelectorAll('[data-policies-updated]').forEach((node) => {
      node.textContent = text(cfg.policiesUpdated, 'September 21, 2026');
    });
  }

  function wireCheckoutButtons() {
    const external = text(cfg.checkoutUrl, '');
    document.querySelectorAll('[data-checkout]').forEach((node) => {
      if (external && /^https?:\/\//i.test(external)) {
        node.setAttribute('href', external);
        node.setAttribute('rel', 'noopener noreferrer');
      } else {
        node.setAttribute('href', '/checkout');
      }
    });
  }

  function wireSupportForm() {
    const form = document.querySelector('[data-support-form]');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = text(cfg.supportEmail, '');
      if (!email || isPlaceholder(email)) {
        alert('Set supportEmail in config.js before sending support requests.');
        return;
      }

      const data = new FormData(form);
      const name = String(data.get('name') || '').trim();
      const from = String(data.get('email') || '').trim();
      const topic = String(data.get('topic') || 'General').trim();
      const message = String(data.get('message') || '').trim();

      const subject = encodeURIComponent(`[Promptly Support] ${topic}`);
      const body = encodeURIComponent(
        `Name: ${name}\nEmail: ${from}\nTopic: ${topic}\n\n${message}`
      );
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    });
  }

  function wireHeaderScroll() {
    const header = document.querySelector('.site-header');
    if (!header) return;
    const onScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderHeader();
    renderFooter();
    applyConfig();
    wireCheckoutButtons();
    wireSupportForm();
    wireHeaderScroll();

    const payBtn = document.querySelector('[data-pay-now]');
    if (payBtn) {
      const external = text(cfg.checkoutUrl, '');
      const status = document.querySelector('[data-checkout-status]');
      if (external && /^https?:\/\//i.test(external)) {
        payBtn.setAttribute('href', external);
        payBtn.setAttribute('rel', 'noopener noreferrer');
        if (status) {
          status.textContent = `You will continue to ${text(cfg.paymentProvider, 'the payment provider')} to complete your purchase.`;
        }
      } else {
        payBtn.setAttribute('href', '#');
        payBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (status) {
            status.textContent =
              'Checkout URL is not configured yet. Set checkoutUrl in config.js to your RollyPay payment link.';
            status.classList.add('is-warn');
          }
        });
        if (status) {
          status.textContent =
            'Payment link pending. Configure checkoutUrl in config.js when RollyPay is ready.';
        }
      }
    }
  });
})();
