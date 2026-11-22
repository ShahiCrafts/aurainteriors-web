# Screenshots & Responsiveness

A visual tour of the platform as customers and the owner see it, and the
rules behind its responsive behaviour. Screenshots are of the live store
(https://www.aurainteriors.live) with the seeded demo catalogue.

## Storefront — desktop

### Home page

![Storefront home page on desktop](https://docs.aurainteriors.live/assets/screenshots/storefront-home-desktop.jpg)

The desktop home: top bar with the delivery offer and promo code, navbar
with search/wishlist/cart, the sticky category bar, then the hero bento
grid and the sections below — their order is owner-controlled from Store
Settings.

### Shop / catalog

![Shop listing on desktop](https://docs.aurainteriors.live/assets/screenshots/storefront-shop-desktop.jpg)

The catalog listing with facet filters, sorting and the product grid.

### Product page

![Product page on desktop](https://docs.aurainteriors.live/assets/screenshots/storefront-product-desktop.jpg)

Gallery with vertical thumbnails beside the purchase panel — price,
variants, quantity, Add to Cart / Buy Now, and the AR entry point.

## Storefront — mobile & tablet behaviour

The mobile store is an app-style experience: the **same design language as
desktop** (same roundedness, backgrounds and strokes), plus a fixed bottom
navigation — Home / Categories / Wishlist / Profile — and layouts that
stack and reflow per the rules in
[Styling & Theming](../development/styling-and-theming.md):

- **Home:** a single static hero card and a "Shop by collection" pair
  replace the desktop bento grid; section type drops to the app scale
  (20px bold headings, 11px uppercase eyebrows, 13px body).
- **Product page:** gallery thumbnails move to a horizontal row under the
  main image; quantity and Add to Cart share one row, with Buy Now
  full-width beneath.
- **Profile:** the desktop pinned sidebar becomes an identity header plus
  a tab bar (Profile Details / My Orders / Saved Addresses / Wishlist /
  Logout), and the page scrolls naturally.
- **Tablet widths** follow the `md`/`lg` breakpoints: sections gain wider
  padding and multi-column grids before the full desktop composition
  arrives at `lg`.

## Admin panel — desktop

### Dashboard

![Admin dashboard](https://docs.aurainteriors.live/assets/screenshots/admin-dashboard-desktop.jpg)

Sales analytics at a glance: headline stats, revenue, categories and top
products.

### Products

![Admin products](https://docs.aurainteriors.live/assets/screenshots/admin-products-desktop.jpg)

### Store Settings

![Admin store settings](https://docs.aurainteriors.live/assets/screenshots/admin-settings-desktop.jpg)

Where the owner rebrands and reconfigures the store — see
[Store Settings & Integrations](store-settings-and-integrations.md).

## Responsive rules (summary)

| Rule | Detail |
| --- | --- |
| Breakpoints | Tailwind defaults — `sm` 640, `md` 768, `lg` 1024, `xl` 1280 |
| Mobile mirrors desktop | Same components, radius, backgrounds and strokes; mobile-only tweaks are `max-md:` overrides so desktop never changes by accident |
| Bottom navigation | Customer app only, below `md`, hidden on `/checkout`; the page reserves `66px + safe-area` at the bottom, and floating elements (chat) offset above it |
| Fixed shells become flows | Desktop app-style fixed-height layouts (e.g. Profile) switch to natural page scroll on mobile |
| Type scale (mobile) | Section headings 20px bold, eyebrows 11px uppercase, body 13px/1.55 — the app-style scale described in the styling guide |
