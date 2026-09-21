/**
 * Promptly site configuration
 * Replace placeholder values before publishing.
 * Do not invent legal entity details — fill these with real data.
 */
window.PROMPTLY_CONFIG = {
  productName: 'Promptly',
  tagline: 'AI Browser Assistant',

  /** Public site URL (no trailing slash), e.g. https://promptly.app */
  siteUrl: 'https://YOUR_DOMAIN.com',

  /** Legal / business identity — replace before go-live */
  companyName: 'Promptly',
  companyAddress: '548 Market Street, Suite 34567, San Francisco, CA 94104',
  country: 'United States',

  /** Contact */
  supportEmail: 'promptlly@gmail.com',
  legalEmail: 'promptlly@gmail.com',

  /** Chrome Web Store listing */
  chromeStoreUrl:
    'https://chromewebstore.google.com/detail/promptly-ai-browser-assistant',

  /**
   * RollyPay (or other) checkout URL.
   * Leave empty to keep the local /checkout page as the payment entry.
   * When ready, set to your full payment-provider checkout link.
   */
  checkoutUrl: '',

  /** Display name of the payment provider on legal / checkout pages */
  paymentProvider: 'RollyPay',

  /** Pro plan */
  plan: {
    name: 'Promptly Pro',
    priceLabel: '$10',
    period: 'month',
    priceDisplay: '$10/month',
  },

  /** Policy dates */
  policiesUpdated: 'September 21, 2026',
};
