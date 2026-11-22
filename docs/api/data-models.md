# Data Models

MongoDB (Mongoose) collections, from `aurainteriors-server/models/`.
Field lists highlight what matters; the model file is the authority.

## Commerce core

| Collection (model) | Stores |
| --- | --- |
| `product` | Name, slug, SKU, description, pricing (NPR + compare-at), images, variants, stock, category/type links, attribute values, featured/new flags, SEO, AR model refs. Demo seed SKUs are prefixed `AUR-DEMO` |
| `category` | Two-level category tree: name, slug, image, parent, order |
| `productType` / `attributeDefinition` | The catalog registry: product types and the attribute definitions (material, colour, dimensions…) that drive filters and forms |
| `collection` / `room` | Merchandising landing pages: slug, hero, product membership |
| `cart` | Signed-in carts: user, line items (product, variant, quantity) |
| `order` | Customer/guest, items with prices at purchase time, totals, address snapshot, `paymentMethod` (`cod` \| `esewa`), `paymentStatus` (`pending` \| `paid` \| `failed` \| `refunded`), fulfilment status, refund state (`none` → `requested` → `approved`/`rejected` → `completed`) |
| `paymentCapture` | Verified eSewa capture records per order |
| `stockReservation` | Short-lived stock holds during checkout |
| `discount` / `promotion` | Codes and campaigns: value, rules, validity, usage (usage recorded per redemption) |
| `review` | Product reviews: rating, text, author, helpful votes, approval flag (moderation) |
| `wishlist` | Saved products per user |

## People & access

| Collection (model) | Stores |
| --- | --- |
| `user` | First/last name, email, password hash (bcrypt), role (`customer` \| `admin`), status, avatar, preferences, Google id |
| `address` | Address book entries per user, with default flag |
| `guestSession` | Anonymous checkout sessions for order tracking |
| `authAttempt` | Login attempt log for abuse detection |
| `revokedToken` | Logged-out JWTs, blocked from reuse |
| `devicePushToken` | Mobile push registrations |

## Platform & settings

| Collection (model) | Stores |
| --- | --- |
| `siteSettings` | The single settings document: identity, theme, contact, seo, homepage, pages, commerce, chat, notifications, maintenance, integrations config (defaults in `services/settings/defaults.js`) |
| `integrationSecret` | Encrypted third-party API keys (the vault) — never exposed by any API response |
| `auditLog` | Admin action trail: actor, action, target, timestamp |
| `job` / `schedulerLease` | Background job queue state and single-runner leases |
| `emailOutbox` | Queued transactional emails (orders, magic links) with retry state |
| `notification` | In-app notifications per user |
| `announcement` | Store announcements with publish/archive lifecycle |
| `newsletter` | Newsletter subscribers with double opt-in state |
| `contact` | Contact-form submissions |
| `rateLimitCounter` | Rate-limit windows per key |

## Chat & AI

| Collection (model) | Stores |
| --- | --- |
| `chat` | Support conversations: customer/guest, assigned agent, status, AI/human mode |
| `chatMessage` | Messages: sender type, text, attachments, read state |
| `chatUpload` | Chat attachment metadata (files on Cloudinary) |
| `document` | Knowledge-base documents for the AI chat; embeddings live in **Qdrant**, not MongoDB |

## Modelling rules

- Money is stored as numbers in **NPR**; totals are always recomputed
  server-side at order time and snapshotted onto the order.
- Slugs are unique and are the public identifiers for products, categories,
  rooms and collections (routes accept slug-or-id on public reads).
- Anything an owner can change belongs in `siteSettings`, not in code or in
  the documents above.
