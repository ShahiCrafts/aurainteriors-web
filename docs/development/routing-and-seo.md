# Routing & SEO

## Storefront routes (`src/App.jsx`)

| Route | Page |
| --- | --- |
| `/` | Home (sections ordered by settings) |
| `/shop`, `/shop/:categorySlug` | Catalog listing with facets/filters |
| `/rooms/:slug` | Room landing pages |
| `/collections/:slug` | Collection landing pages |
| `/product/:productSlug` | Product details (gallery, variants, reviews, AR) |
| `/ar/:productSlug` | Full-screen AR view |
| `/native-ar` | Native (Capacitor) AR entry |
| `/checkout`, `/checkout/payment-failed` | Checkout and payment failure landing |
| `/order-confirmation/:orderId` | Post-order confirmation |
| `/track-order` | Guest order tracking |
| `/profile` | Account (details, orders, addresses, wishlist tabs) |
| `/notifications`, `/announcements` | Customer notifications and announcements |
| `/contact`, `/faq`, `/about`, `/privacy`, `/terms`, `/shipping`, `/returns` | Content pages (several are settings-editable) |
| `/auth/verify`, `/auth/success` | Magic-link verification and OAuth success handoff |
| `/newsletter/confirm`, `/newsletter/unsubscribe` | Newsletter double opt-in flows |

## Admin routes (`src/AdminApp.jsx`, under `/dashboard`)

`categories`, `attributes`, `product-types`, `rooms`, `collections`,
`products`, `orders`, `discounts`, `promotions`, `announcements`, `reviews`,
`support` (chat inbox), `knowledge` (chat knowledge base), `contacts`,
`users`, `integrations`, `store-settings`, `media-library`, `audit-log`,
`setup-wizard`. `/login` is the only public admin route; everything else is
behind the admin auth guard.

## Prerendering & static serving

- `npm run build` (customer) runs `scripts/prerender.mjs` after Vite: it
  snapshots the home page, listing pages and every product page to static
  HTML with per-page `<title>`, meta description, canonical (always the
  `www` host) and Open Graph tags. The prerenderer replaces the template's
  default head block — each page ships exactly one canonical.
- nginx (`nginx.conf`) serves a prerendered file when one exists and falls
  back to the SPA shell otherwise, so app routes never 404.
- The admin on Vercel achieves the same with legacy `routes` in
  `vercel.json` (filesystem first, catch-all → `index.html`).

## SEO surfaces

| Surface | Where |
| --- | --- |
| Sitemap | Generated with the prerender; canonicals use `https://www.aurainteriors.live` |
| Meta/OG per page | `src/components/common/Seo.jsx` + `src/seo/` helpers; defaults come from settings (`seo` section) |
| Structured data | Product/offer markup on product pages |
| Google Merchant feed | `GET /api/v1/feeds/google.xml` from the API |
| `llms.txt` | Served from the storefront root for AI answer engines |
| Splash/brand | `theme-color` and splash use the brand navy `#1E2C4A` |

## Canonical host rule

The canonical storefront host is **`www`** (`https://www.aurainteriors.live`);
the apex redirects to it, and the API's canonical host is
`https://api.aurainteriors.live`. Keep `SITE_URL`, sitemap and canonical
generation pointed at `www` — pointing them at the apex splits SEO signals.
