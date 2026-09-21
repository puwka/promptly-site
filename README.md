# Promptly website

Official marketing site for **Promptly — AI Browser Assistant**.
Static HTML/CSS/JS, ready for Vercel and RollyPay checkout wiring.

## Pages

| URL | Page |
|---|---|
| `/` | Home |
| `/pricing` | Pricing (Pro $10/month) |
| `/documentation` | Docs, FAQ, troubleshooting |
| `/support` | Support form + email |
| `/privacy` | Privacy Policy |
| `/terms` | Terms of Service |
| `/refund` | Refund Policy |
| `/checkout` | Checkout flow (RollyPay-ready) |

## Before go-live — edit `config.js`

Replace every placeholder:

- `siteUrl` — your public HTTPS domain
- `companyName`, `companyAddress`, `country` — legal entity details
- `supportEmail`, `legalEmail` — real inboxes
- `chromeStoreUrl` — Chrome Web Store listing
- `checkoutUrl` — full RollyPay payment URL (leave empty until ready; `/checkout` stays as the entry page)
- `paymentProvider` — defaults to `RollyPay`

Do not invent legal details in HTML — they are injected from this config.

## Deploy on Vercel

1. Import this repo (or the `site` folder).
2. Framework Preset: **Other** (no build).
3. Output directory: leave empty.
4. Deploy.

`vercel.json` enables clean URLs (`/pricing` → `pricing.html`).

## Local preview

Any static server, for example:

```bash
npx serve .
```

## Account

Sign in on the site (`/login`) with Google or email. Installing Promptly opens the site with this browser’s installation id. If you are already signed in, the install links without another prompt.

Upgrade to Pro in the extension opens `/pricing`. Get Pro starts a RollyPay checkout tied to that installation. After the webhook confirms payment, the extension reads Pro from Supabase.

The anon key in `config.js` is public. Do not add the Supabase service role key to the site or the extension.

In the Supabase dashboard, add these redirect URLs:

- `https://promptly-site-ten.vercel.app/account`
- `https://promptly-site-ten.vercel.app/pricing`
- `http://localhost:4173/account` for local preview

Apply migration `supabase/migrations/20260329220000_account_profiles.sql` before using Account.

## RollyPay

1. Keep **Get Pro** → `/checkout`.
2. When the payment link is ready, set `checkoutUrl` in `config.js` to the RollyPay URL.
3. The Pay button on `/checkout` will open that URL.
