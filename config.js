/**
 * Promptly site configuration
 * Replace placeholder values before publishing.
 * Do not invent legal entity details — fill these with real data.
 */
window.PROMPTLY_CONFIG = {
  productName: 'Promptly',
  tagline: 'AI Browser Assistant',

  /** Public site URL (no trailing slash) */
  siteUrl: 'https://promptly-site-ten.vercel.app',

  /** Legal / business identity — replace before go-live */
  companyName: 'Promptly',
  companyAddress: '548 Market Street, Suite 34567, San Francisco, CA 94104',
  country: 'United States',

  /** Contact */
  supportEmail: 'promptlly@gmail.com',
  legalEmail: 'promptlly@gmail.com',

  /** Chrome Web Store listing */
  chromeStoreUrl:
    'https://chromewebstore.google.com/detail/promptly-%E2%80%94-ai-browser-ass/hjfcilbkngmdpompmjdigendhldfjlcp',

  /**
   * RollyPay (or other) checkout URL.
   * Leave empty to keep the local /checkout page as the payment entry.
   * When ready, set to your full payment-provider checkout link.
   */
  checkoutUrl: '',

  /** Display name of the payment provider on legal / checkout pages */
  paymentProvider: 'RollyPay',

  /**
   * Public Supabase client config. The anon key is safe in the browser.
   * Never put the service role key here.
   */
  supabaseUrl: 'https://dagfxkbqvmgegwlynsla.supabase.co',
  supabaseAnonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhZ2Z4a2Jxdm1nZWd3bHluc2xhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NDM3ODQsImV4cCI6MjEwNTMxOTc4NH0.Dg-qNcnlZYwSW33dF_p7Gx_5TIYu32d2cVNbbmtIbiY',

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
