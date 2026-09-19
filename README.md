# Promptly website (Vercel)

Static site: product home, support, privacy.

## Deploy on Vercel

1. Import this Git repo (or upload the `site` folder).
2. Set **Root Directory** to `site`.
3. Framework Preset: **Other** (no build command).
4. Output: leave empty (static files served from root of `site`).
5. Deploy.

URLs after deploy:
- `/` — product
- `/support` — support
- `/privacy` — privacy policy (use this HTTPS URL in Chrome Web Store)

## Before go-live

1. Replace `support@promptly.app` in `support.html` and `privacy.html` with your real inbox.
2. In `index.html`, set `CHROME_STORE_URL` to your published Chrome Web Store link.
