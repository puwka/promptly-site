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

## RollyPay

1. Keep **Get Pro** → `/checkout`.
2. When the payment link is ready, set `checkoutUrl` in `config.js` to the RollyPay URL.
3. The Pay button on `/checkout` will open that URL.
