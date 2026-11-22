# Frontend Architecture

One codebase, **two applications**:

| | Storefront | Admin |
| --- | --- | --- |
| Vite mode | `customer` | `admin` |
| Entry | `src/main.jsx` → `src/App.jsx` | `src/main.admin.jsx` → `src/AdminApp.jsx` |
| HTML shell | `index.html` | `index.admin.html` |
| Dev command | `npm run dev` (:5173) | `npm run dev:admin` (:5174) |
| Build | `npm run build` → `dist/customer` + prerender | `npm run build:admin` → `dist/admin` |
| Deployed to | Render (Docker/nginx) | Vercel |

Shared code (components, hooks, API modules, stores) is used by both, but each
build only bundles its own routes — admin code never ships to customers.

## Component organisation

- `src/components/sections/` — homepage sections. Their **order and visibility
  come from settings** (`homepage.sectionsOrder` / section flags), applied by
  `src/utils/homeSections.js`; `HomePage` maps keys → components.
- `src/components/shop/` — catalog listing, facet filters, product cards.
- `src/pages/shop/product-details/` — the product page is split into
  `Gallery`, `PurchasePanel`, `FeatureHighlights`, `KeySpecifications`,
  `Recommendations`, `ReviewSection` under one page component.
- `src/components/profile/` — the four account sections used by `ProfilePage`.
- `src/components/chat/` — the customer chat widget (`ChatWidget.jsx`) and
  window; admin chat lives in `src/components/admin/chat/`.
- `src/components/common/` — skeletons (every data-driven view ships a
  matching skeleton), avatars, `Seo`, promo cards.
- `src/layouts/` — customer chrome (`TopBar`, `Navbar` incl. the mobile
  bottom nav, `Footer`) and admin chrome (`AdminLayout`, `AdminSidebar`).

## State management

| Layer | Tool | Examples |
| --- | --- | --- |
| Server state | TanStack Query | catalog, orders, settings, chat history |
| Client state | Zustand (`src/store/`) | `authStore` (session user), `guestCartStore` (anonymous cart), `checkoutStore`, `buyNowStore`, `siteSettingsStore` (branding/theme) |
| Forms | React Hook Form + Yup resolvers | checkout, profile, admin editors |
| Local UI state | React state + framer-motion | drawers, modals, toasts, animations |

Carts exist in two forms: a **guest cart** kept client-side for anonymous
shoppers and a **server cart** (`/api/v1/cart`) for signed-in users; the guest
cart merges into the account at sign-in.

## Data fetching conventions

- All HTTP goes through `src/api/` modules (axios instances with the API base
  from `VITE_API_BASE_URL`, credentials included for the session cookie).
- Lists use the API's pagination/facet conventions — see
  [API Overview](../api/overview.md).
- Every async view renders a skeleton from `src/components/common/Skeleton.jsx`
  while loading; keep new views consistent with this pattern.
- Home data is prefetched (`src/utils/prefetchHome.js`) so section queries hit
  a warm cache.

## The settings-driven UI

`siteSettingsStore` loads `/api/v1/settings/public` once and:

- sets CSS variables (`--brand-primary`, `--brand-primary-hover`,
  `--brand-navy`, `--brand-font`, `--brand-radius`, `--brand-bg`,
  `--brand-card-radius`, `--brand-card-shadow`) and `data-header-style` /
  `data-theme-mode` attributes on `<html>`, which `src/styles/index.css`
  consumes — this is how admin theme changes restyle the store live;
- provides identity (store name, logo), contact, SEO defaults, homepage
  section configuration and commerce rules to components.

Anything visual that an owner should control belongs in settings, not in
hard-coded JSX. See [Store Settings & Integrations](../features/store-settings-and-integrations.md).
