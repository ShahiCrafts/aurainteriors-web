# Environment Variables

`.env.example` in each repo is the maintained list; this page explains what
matters and where each value lives in production. **Secrets set in Admin →
Integrations (the vault) override the matching env variables** — env is the
bootstrap, the vault is day-to-day.

## Web (`aurainteriors-web`)

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | ✅ | API origin, inlined at build time. Production: `https://api.aurainteriors.live`. Render passes it as a Docker build arg from `render.yaml` |
| `VITE_APP_URL` | ✅ | Public app URL, used for AR share links/QR codes. Production: `https://www.aurainteriors.live` |
| `VITE_WEB_VITALS` / `VITE_WEB_VITALS_ENDPOINT` | — | Optional web-vitals reporting |

> Because Vite inlines env at **build** time, changing `VITE_API_BASE_URL`
> requires a rebuild/redeploy — there is no runtime override.

## Server (`aurainteriors-server`)

### Core

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | ✅ | Listen port (Render injects its own) |
| `NODE_ENV` | ✅ | `production` enables secure cookies, strict boot checks |
| `MONGO_URI` | ✅ | MongoDB connection string |
| `MONGO_DB_NAME`, `MONGO_MAX_POOL_SIZE`, `MONGO_MIN_POOL_SIZE`, `MONGO_CONNECT_RETRIES` | — | Database tuning |
| `JWT_SECRET` | ✅ | Session signing secret — long and random; rotating it logs everyone out |
| `JWT_EXPIRES_IN`, `JWT_COOKIE_EXPIRES_IN` | — | Session lifetime |
| `FRONTEND_URL` | ✅ | Storefront origin — CORS + CSRF allowlist, email links |
| `ADMIN_URL` | ✅ | Admin origin — CORS + CSRF allowlist |
| `BACKEND_URL` | ✅ | API's own public URL — OAuth callbacks, payment returns |
| `TRUST_PROXY` | — | Set behind Cloudflare/Render so client IPs are correct |
| `HEALTH_DETAIL_TOKEN` | — | Gates detailed health/keep-alive output |
| `SHUTDOWN_DRAIN_TIMEOUT_MS` | — | Graceful shutdown window |

### Email (Brevo)

`BREVO_API_KEY`, `BREVO_API_BASE_URL`, `BREVO_TIMEOUT_MS`, `EMAIL_FROM`,
`SUPPORT_EMAIL`, `EMAIL_LOGO_URL`, `EMAIL_MODE`.

### Media (Cloudinary)

`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`,
`CLOUDINARY_TIMEOUT_MS`.

### Auth (Google)

`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — redirect URIs in Google Cloud
must match `BACKEND_URL` exactly.

### Payments (eSewa)

`ESEWA_MERCHANT_ID`, `ESEWA_SECRET_KEY`, `ESEWA_ENV` (`sandbox` |
production).

### AI chat

`GROQ_API_KEY`, `MISTRAL_API_KEY`, `OPENROUTER_API_KEY`, `GEMINI_API_KEY`,
`NVIDIA_API_KEY`, `GROQ_CHAT_MODEL`, `QDRANT_URL`, `QDRANT_API_KEY`,
`EMBEDDING_API_URL`, `EMBEDDING_MODEL_NAME`, `EMBEDDING_VECTOR_SIZE`,
`RAG_EMBEDDING_TIMEOUT_MS`, `RAG_QDRANT_TIMEOUT_MS`.

### Jobs & retention

`JOB_CONCURRENCY`, `JOB_VISIBILITY_MS`, `JOB_BACKOFF_BASE_MS`,
`JOB_BACKOFF_CAP_MS`, `INGEST_CONCURRENCY`, `INGEST_MAX_CHUNKS_PER_JOB`,
`INGEST_STUCK_AFTER_MS`, `INGEST_MAX_RECOVERIES`,
`RETENTION_CHAT_MESSAGE_DAYS`, `RETENTION_NOTIFICATION_DAYS`,
`RETENTION_CONTACT_DAYS`, `KEEP_ALIVE_INTERVAL`.

### Seeding (first run only)

`SEED_DEMO_DATA`, `SEED_CUSTOMER_PASSWORD`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`,
`ALLOW_DESTRUCTIVE_DEMO_SEED`, `SEED_IMAGE_DIR`. Remove/rotate the admin
password after first login.
