# Quick Start

Run the full platform locally — API, storefront and admin — in a few minutes.
You need **Node.js 20+**, **npm**, and a **MongoDB** connection string (a free
[MongoDB Atlas](https://www.mongodb.com/atlas) cluster is fine).

## 1. Start the API (`aurainteriors-server`)

```bash
git clone https://github.com/ShahiCrafts/aurainteriors-server.git
cd aurainteriors-server
npm install
cp .env.example .env        # then edit .env — at minimum set MONGO_URI and JWT_SECRET
npm run dev                 # API on http://localhost:3001 (PORT in .env)
```

Seed the demo catalogue and the admin account (optional, recommended for a
first look):

```bash
npm run seed                # respects SEED_DEMO_DATA and ADMIN_EMAIL / ADMIN_PASSWORD in .env
```

## 2. Start the web apps (`aurainteriors-web`)

```bash
git clone https://github.com/ShahiCrafts/aurainteriors-web.git
cd aurainteriors-web
npm install
cp .env.example .env        # VITE_API_BASE_URL=http://localhost:3001 by default
```

Storefront (customer app):

```bash
npm run dev                 # http://localhost:5173
```

Admin panel (separate terminal):

```bash
npm run dev:admin           # http://localhost:5174
```

## 3. Sign in

- **Storefront:** sign in with Google or a magic link — customers are
  passwordless and accounts are created on first sign-in (see
  [Accounts & Authentication](../features/accounts-and-auth.md)).
- **Admin:** use the `ADMIN_EMAIL` / `ADMIN_PASSWORD` you seeded, then the
  one-time code step.

## Production builds

```bash
# in aurainteriors-web
npm run build               # storefront → dist/customer (+ prerendered catalog pages)
npm run build:admin         # admin → dist/admin

# in aurainteriors-server
npm start                   # node server.js (also starts the background worker)
```

> **Important:** production web builds need `VITE_API_BASE_URL` set to the real
> API origin (e.g. `https://api.aurainteriors.live`). Vite inlines it at build
> time; a build without it points at localhost and will not work live.

## Run the tests

```bash
# web (Vitest)
npm test

# server (node:test)
npm test
```

Next: [Installation](installation.md) for the complete environment reference, or
[Project Structure](project-structure.md) for a tour of the code.
