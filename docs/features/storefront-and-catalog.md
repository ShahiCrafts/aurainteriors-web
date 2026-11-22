# Storefront & Catalog

## Home page

The home page is a stack of sections whose **order and visibility are
owner-controlled** (Store Settings → Homepage):

| Section | Component | Content |
| --- | --- | --- |
| Hero | `sections/Hero.jsx` | Bento grid on desktop (main offer card + two collection cards); a single static card + "Shop by collection" pair on mobile |
| Trust banner | `sections/TrustBanner.jsx` | Sale countdown, trust points (homes served, delivery, quality), app badges |
| Shop by Category | `sections/ShopByCategory.jsx` | Category grid + a promo card |
| Featured Pieces | `sections/FeaturedPieces.jsx` | Featured products rail/grid |
| Testimonials | `sections/Testimonials.jsx` | Customer reviews carousel |

Above the sections sit the `TopBar` (delivery offer + promo code strip), the
`Navbar` (logo, search, wishlist, cart; on mobile a search/wishlist/cart
cluster plus a bottom navigation bar: Home / Categories / Wishlist / Profile)
and the sticky `CategoryBar` (category links with subcategory dropdowns).

## Catalog model

- **Categories** — two-level hierarchy (parent + subcategories), each with an
  image, slug and product count. Managed in Admin → Categories.
- **Product types & attributes** — a registry of product types and attribute
  definitions (material, colour, dimensions, room…) drives filters and the
  product form. Managed in Admin → Product Types / Attributes
  (`/api/v1/catalog/attributes`).
- **Rooms & collections** — merchandising groupings with their own landing
  pages (`/rooms/:slug`, `/collections/:slug`).
- **Products** — name, slug, SKU, pricing (NPR, with compare-at price),
  images (Cloudinary), variants (price/stock per variant), stock quantity,
  featured/new flags, SEO fields, and an optional 3D model for AR.
  The seeded demo catalogue contains 280 products (SKUs prefixed `AUR-DEMO`).

## Browsing & search

- The listing page (`/shop`, `/shop/:categorySlug`) supports facet filters
  (category, price, attributes, availability), sorting and pagination —
  facets are computed server-side (`services/catalogFacets.service.js`,
  `catalogFilter.service.js`).
- Search opens a modal with recent searches (stored locally under the
  audited key `aura.recentSearches`) and live product results.
- Anonymous catalog reads are cached at the API
  (`Cache-Control: public, max-age=60, stale-while-revalidate=300`).

## Product page

`/product/:productSlug` is composed of:

- **Gallery** — image carousel with thumbnails (vertical on desktop,
  horizontal under the main image on mobile) and zoom.
- **Purchase panel** — price, variant picker, quantity selector, Add to Cart
  and Buy Now (Buy Now skips the cart via `buyNowStore`), delivery/stock
  notes, and the AR entry point.
- **Feature highlights & key specifications**, **recommendations**
  (related products), and the **review section**.

## Reviews & ratings

- Signed-in customers who purchased a product can review it
  (`/api/v1/reviews`: `can-review`, `my-review`); reviews support helpful
  votes.
- Reviews are **moderated**: an admin approves/hides them in Admin → Reviews
  before they appear publicly.
- Ratings aggregate onto product cards and the hero's social-proof line.

## Announcements & promotions

- **Announcements** (Admin → Announcements) publish store notices to
  `/announcements` and the notification centre.
- **Promotions** (Admin → Promotions) are broadcast campaigns (e.g. email /
  in-app) with per-campaign analytics; **discount codes** (Admin →
  Discounts) apply at checkout — the storefront validates a code against
  `/api/v1/discounts/validate/:code` before applying it.
