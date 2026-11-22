# Deployment Guide

Production topology — everything is behind Cloudflare:

| Host | Target | Notes |
| --- | --- | --- |
| `www.aurainteriors.live` | Render service `aurainteriors-web` | Storefront (Docker + nginx) |
| `aurainteriors.live` (apex) | Render (same service) | 301 → `www` |
| `admin.aurainteriors.live` | Vercel project (admin build) | SPA with legacy `routes` fallback |
| `api.aurainteriors.live` | Render service (API) | Node server + Socket.IO |

Domain registrar: Name.com. Cloudflare: free plan, SSL mode **Full
(Strict)**, Always Use HTTPS. DNS records are proxied (orange cloud)
except admin-related verification records (e.g. Brevo DKIM), which must stay
DNS-only.

## 1. API (Render)

1. Create a Web Service from `aurainteriors-server` (Docker or Node
   runtime), region Singapore.
2. Set every required variable from
   [Environment Variables](environment-variables.md) — at minimum
   `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL=https://www.aurainteriors.live`,
   `ADMIN_URL=https://admin.aurainteriors.live`,
   `BACKEND_URL=https://api.aurainteriors.live`, `NODE_ENV=production`.
3. Health check path: `/health`.
4. Add the custom domain `api.aurainteriors.live` and point its Cloudflare
   DNS record at the service.
5. First boot only: run the seed (`npm run seed`) with `ADMIN_EMAIL` /
   `ADMIN_PASSWORD` set — then change the admin password in the panel.

## 2. Storefront (Render, from `render.yaml`)

The repo ships a Render Blueprint (`render.yaml`): Docker build, free plan,
Singapore, health check `/`, auto-deploy on `main`, with build args
`VITE_API_BASE_URL=https://api.aurainteriors.live` and `APP_MODE=customer`.
The Dockerfile builds the customer app (including prerendering) and serves
it with nginx on port 8080. Attach both `www` and the apex domain; the apex
redirects to `www`.

## 3. Admin (Vercel)

1. Import `aurainteriors-web` as a Vercel project; build command
   `npm run build:admin`, output `dist/admin`.
2. `vercel.json` already carries the required legacy `routes` (asset
   caching, security headers incl. the CSP, filesystem, SPA catch-all).
   **Do not replace it with `rewrites`** — on this project Vercel ignores
   the rewrite and deep links 404 (verified the hard way).
3. Build env: `VITE_API_BASE_URL=https://api.aurainteriors.live`.
4. Attach `admin.aurainteriors.live`.

## 4. Cloudflare

- Nameservers point to Cloudflare; SSL/TLS mode **Full (Strict)**.
- Proxy `www`, apex and `api`; keep verification/DKIM records DNS-only.
- Known leftover: static assets may show `cf-cache-status: DYNAMIC`
  because the origin sends duplicate `Cache-Control` headers; add a
  Cloudflare cache rule if edge caching of build assets is wanted.

## 5. Post-deploy verification

1. `https://api.aurainteriors.live/health` → 200.
2. `https://www.aurainteriors.live` loads; check a product page's source
   for exactly one canonical pointing at `www`.
3. `GET /api/v1/settings/public` returns the live store settings.
4. Admin: open a deep link directly (e.g. `/dashboard/reviews`) — it must
   load, not 404 — and confirm the CSP header is present.
5. Sign in with Google on the storefront; place a COD test order; send a
   chat message and answer it from Admin → Support.

## Updating production

Pushes to `main` auto-deploy the Render services; Vercel deploys the admin
on push as well. Verify web changes by **content markers in the served
chunks**, not by local build hashes (Render's hashes can differ). Render's
free tier sleeps when idle — the first request after inactivity is slow;
that's expected, and a paid instance removes it.
