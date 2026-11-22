# Operations & Troubleshooting

## Health & monitoring

| Check | Where |
| --- | --- |
| API liveness | `GET https://api.aurainteriors.live/health` (Render health check points here) |
| Storefront liveness | Render health check on `/` |
| Keep-alive status | `GET /api/v1/system/keep-alive-status` (detail requires `HEALTH_DETAIL_TOKEN`) |
| Admin actions | Admin → Audit Log |
| Chat quality | Server: `npm run chat:gate` before/after chat changes |

There is no paid monitoring stack; Render's event log + the audit log +
health endpoints are the operational picture. Check them first when
something is reported.

## Known quirks (read before "fixing")

1. **Render free tier sleeps.** First visit after inactivity can take
   ~30–60s. Not a bug. A paid instance or the keep-alive settings remove it.
2. **Vercel ignores `rewrites` on the admin project.** `vercel.json` must
   keep the legacy `routes` format or admin deep links 404.
3. **Admin builds must not inherit customer build settings.** The admin
   project builds with `build:admin` only; forcing the customer build +
   prerender onto it breaks the deploy.
4. **Prerendered pages are snapshots.** Catalog content is baked at build
   time for SEO; the live app re-fetches everything from the API on mount.
   A product edited in admin appears in the app immediately but in the
   static snapshot only after the next build.
5. **Settings are read at runtime.** The live storefront reflects Store
   Settings changes without redeploy — if the store shows a test name or
   colour, fix it in Store Settings, not in code.
6. **Catalog cache is 60s.** Anonymous catalog/settings responses carry
   `max-age=60, stale-while-revalidate=300`; give admin edits a minute.
7. **Build hashes differ.** Render's output hashes may not match a local
   build of the same commit — verify deploys by content, not hashes.
8. **A stray `logo-aura-interiors-admin.webp`** in the web repo's `public/`
   contains an unrelated logo; it is unreferenced (the admin uses the
   settings logo) and can be deleted from the repo directly.

## Troubleshooting table

| Symptom | Likely cause & fix |
| --- | --- |
| Site shows wrong store name / black buttons | Live settings still hold test values → Admin → Store Settings → Identity/Theme, set the real name and `#F27318` |
| Admin page 404s on refresh | `vercel.json` was changed to `rewrites` → restore legacy `routes` |
| Storefront loads, no products | API asleep (wait/retry), down (check `/health`), or `VITE_API_BASE_URL` wrong in the build |
| Google sign-in loops or errors | Redirect URI mismatch in Google Cloud vs `BACKEND_URL`; or cookies blocked (check CSP/`connect-src`) |
| Magic-link email never arrives | Brevo key/from not set (env or vault) — use Store Settings → test email; check the email outbox in server logs |
| eSewa payment stuck pending | Capture verification failed — check `paymentCapture` records and server logs for the order; confirm `ESEWA_ENV` matches the merchant account |
| Chat widget shows the offline card | Chat disabled in Settings → Chat, or outside business hours configured there |
| Chat answers are generic | Knowledge base empty/stale → Admin → Knowledge, upload docs and reindex; check Qdrant env |
| Images fail to upload | Cloudinary credentials wrong in env/vault; test in Admin → Integrations |
| Everything is slow at first hit | Render free-tier cold start (see quirks) |

## Backups & data safety

- MongoDB Atlas is the data of record — enable Atlas backups/snapshots on
  any paid tier; on the free tier, export collections before destructive
  admin operations (handover purge is irreversible).
- Media lives in Cloudinary; the database stores URLs, not files.
- Secrets: env values live in Render/Vercel dashboards; vault secrets live
  encrypted in MongoDB. Neither is in git — a repo leak does not leak keys,
  and a key rotation never needs a code change.
