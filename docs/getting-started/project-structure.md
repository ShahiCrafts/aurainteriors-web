# Project Structure

## `aurainteriors-web` — storefront + admin

```
aurainteriors-web/
├── docs/                  ← this documentation (assets/ holds the diagrams)
├── public/                static assets: logos, splash, lottie player, seed images, models/ (AR)
├── scripts/               build tooling: prerender.mjs (static catalog pages), bundle budget check
├── src/
│   ├── App.jsx            storefront root: routes, providers, global widgets (cart drawer, chat)
│   ├── AdminApp.jsx       admin root: dashboard routes and guards
│   ├── main.jsx           storefront entry (customer mode)
│   ├── main.admin.jsx     admin entry (admin mode)
│   ├── api/               axios clients and per-resource API modules
│   ├── assets/            imported images and media
│   ├── components/
│   │   ├── admin/         admin-only components (settings tabs, chat inbox, dashboard widgets)
│   │   ├── chat/          customer chat widget + window
│   │   ├── common/        shared UI: skeletons, avatars, SEO, promo cards…
│   │   ├── home/…         (see sections/)
│   │   ├── navigation/    CategoryBar and nav building blocks
│   │   ├── profile/       account sections: personal info, orders, addresses, wishlist
│   │   ├── sections/      homepage sections: Hero, TrustBanner, ShopByCategory, FeaturedPieces, Testimonials
│   │   └── shop/          catalog listing, filters, product cards
│   ├── config/            runtime configuration helpers
│   ├── data/              static data used by the UI
│   ├── hooks/             React hooks (auth, cart, profile, queries…)
│   ├── layouts/
│   │   ├── customer/      TopBar, Navbar (+ MobileBottomNav), Footer
│   │   └── admin/         AdminLayout, AdminSidebar
│   ├── lib/               small libraries (e.g. splash dismissal)
│   ├── pages/
│   │   ├── admin/         dashboard pages (products, orders, settings, integrations…)
│   │   ├── customer/      ProfilePage and account pages
│   │   ├── home/…         HomePage lives at src/pages/HomePage.jsx
│   │   └── shop/          ShopPage, ProductDetailsPage, CheckoutPage…
│   ├── seo/               meta/sitemap helpers used by the prerenderer
│   ├── store/             Zustand stores: authStore, buyNowStore, checkoutStore,
│   │                      guestCartStore, siteSettingsStore
│   ├── styles/            index.css — Tailwind v4 theme, brand tokens, global rules
│   └── utils/             helpers (prefetching, formatting, homeSections ordering…)
├── tests/                 Vitest suites mirroring src (components, pages, layouts, chat, routing, security)
├── Dockerfile             multi-stage: build (per APP_MODE) → nginx serving the app
├── nginx.conf             serves prerendered pages first, SPA fallback for app routes
├── render.yaml            Render blueprint for the storefront service
├── vercel.json            admin hosting on Vercel (legacy routes: SPA fallback + security headers)
└── vite.config.js         Vite config for both modes
```

Key entry points:

| File | Role |
| --- | --- |
| `src/App.jsx` | Storefront route table and global providers/widgets |
| `src/AdminApp.jsx` | Admin route table (`/dashboard/*`) and auth guard |
| `scripts/prerender.mjs` | After the customer build, renders catalog/product/category pages to static HTML for SEO |
| `src/store/siteSettingsStore.js` | Loads `/api/v1/settings/public` and exposes branding/theme to the whole app |

## `aurainteriors-server` — API

```
aurainteriors-server/
├── server.js              process entry: HTTP server + Socket.IO + graceful shutdown
├── app.js                 createApp(): middleware stack and all route mounts under /api/v1
├── worker.js              background job definitions/runner wiring
├── config/                appConfig, database (Mongoose), passport (Google), cloudinary,
│                          catalog taxonomy/seed wiring, topology
├── routes/                one file per resource (auth, product, order, chat, adminSettings…)
├── controllers/           request handlers, one per resource
├── services/              business logic: settings (defaults, secrets vault), email + outbox,
│                          esewa verification/capture, chat + chatV2 (AI chain, RAG ingestion),
│                          catalog facets/filters, discounts, handover, audit log, jobs…
├── models/                Mongoose models (34 collections — see Data Models)
├── middleware/            auth (protect/restrictTo), rate limits, validation, uploads,
│                          CSRF origin check, NoSQL sanitising, public cache headers
├── validators/            Joi schemas per resource
├── scripts/               seed.js (demo catalogue + admin), chat benchmark/gate scripts
├── tests/                 node:test suites (incl. tests/fresh, tests/audit, tests/chatV2)
├── utils/                 AppError, email templates helpers, misc
├── Dockerfile             production image
└── .env.example           every supported environment variable, commented
```

Request flow for a typical API call:
`route → rate limiter → auth guard (if any) → Joi validation → controller →
service → Mongoose model`, with a global error handler shaping every error
response. See [API Overview](../api/overview.md).

## Where things live — quick answers

| I want to change… | Go to |
| --- | --- |
| Store name, logo, colours, homepage sections | Admin → Store Settings (no code) — [guide](../features/store-settings-and-integrations.md) |
| Homepage section order | Admin → Store Settings → Homepage (stored in settings; `src/utils/homeSections.js` applies it) |
| A product page layout | `src/pages/shop/product-details/` |
| Prices, discounts logic | server `services/discountResolution.service.js`, `services/commerceTotals.service.js` |
| Chat AI behaviour | server `services/chatV2/` and Settings → Chat |
| Email templates/content | server `services/email.service.js` + email outbox |
| API keys for services | Admin → Integrations (encrypted vault), not `.env` — [guide](../features/store-settings-and-integrations.md) |
