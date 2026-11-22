# Installation

The complete local (or self-hosted) installation, step by step. For the short
version see [Quick Start](quick-start.md). Every environment variable is
documented in [Environment Variables](../deployment/environment-variables.md).

## Prerequisites

| Tool / service | Why | Notes |
| --- | --- | --- |
| Node.js 20+ and npm | Both repos | The web Dockerfile pins Node 20 Alpine |
| MongoDB 6+ | Database | Local install or a free MongoDB Atlas cluster |
| Cloudinary account | Product/chat image hosting | Free tier is enough; uploads are signed server-side |
| Brevo account | Transactional email (orders, magic links) | Free tier; can be swapped via Settings → Integrations later |
| Google Cloud project | Google sign-in (optional) | OAuth 2.0 client ID/secret |
| eSewa merchant account | Online payments (optional) | Sandbox credentials work for testing (`ESEWA_ENV=sandbox`) |
| Qdrant + an embeddings endpoint | AI chat knowledge base (optional) | The chat still works without RAG, with less grounding |

## 1. Database

Create a MongoDB database (Atlas: create cluster → Database Access user →
Network Access → connection string). The API connects with `MONGO_URI`; pool
size, retries and the database name are tunable via `MONGO_*` variables.

## 2. API server

```bash
git clone https://github.com/ShahiCrafts/aurainteriors-server.git
cd aurainteriors-server
npm install
cp .env.example .env
```

Minimum viable `.env`:

```ini
PORT=3001
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/aura-interiors
JWT_SECRET=<a long random string>
FRONTEND_URL=http://localhost:5173
ADMIN_URL=http://localhost:5174
BACKEND_URL=http://localhost:3001
```

Add Cloudinary, Brevo, Google and eSewa keys as you enable those features.
Then:

```bash
npm run seed     # demo catalogue (280 products) + admin user from ADMIN_EMAIL/ADMIN_PASSWORD
npm run dev      # watch mode; or npm start for production
```

The server refuses to boot in production with unsafe auth settings (for
example `RETURN_TOKEN_IN_BODY` enabled) — this is deliberate.

`server.js` starts both the HTTP API (with Socket.IO) and, in the same
process, background job processing; `worker.js` holds the job definitions
(email outbox, chat-document ingestion, scheduled broadcasts, retention).

## 3. Web apps

```bash
git clone https://github.com/ShahiCrafts/aurainteriors-web.git
cd aurainteriors-web
npm install
cp .env.example .env   # VITE_API_BASE_URL=http://localhost:3001, VITE_APP_URL=http://localhost:5173
npm run dev            # storefront :5173
npm run dev:admin      # admin :5174 (second terminal)
```

The two apps are Vite *modes* of one codebase (`--mode customer` /
`--mode admin`), with separate entry points (`src/main.jsx` /
`src/main.admin.jsx`) and separate HTML shells (`index.html` /
`index.admin.html`).

## 4. First-run checklist

1. Open the storefront — the seeded catalogue should be visible.
2. Sign in to the admin panel and open **Store Settings** — set the store
   name, logo and colours (the storefront reads them live from
   `/api/v1/settings/public`).
3. Place a test order with Cash on Delivery.
4. Open **Support** in admin and reply to the test chat from the storefront
   widget.
5. If you configured eSewa sandbox, place a second order paying with eSewa.

## Troubleshooting a fresh install

| Symptom | Likely cause |
| --- | --- |
| Storefront loads but no products | API not running, `VITE_API_BASE_URL` wrong, or CORS: the API only allows `FRONTEND_URL` / `ADMIN_URL` origins |
| `401` on every API call | Cookies blocked cross-site locally — use the documented localhost origins, keep `NODE_ENV=development` |
| Images fail to upload | Cloudinary variables missing or wrong in the server `.env` (or in Settings → Integrations, which overrides) |
| Emails never arrive | Brevo key/from address missing; check the email outbox jobs in the server logs |
| Google sign-in error | Redirect URI not registered in Google Cloud, or `GOOGLE_CLIENT_ID/SECRET` mismatch |

More in [Operations & Troubleshooting](../deployment/operations-and-troubleshooting.md).
