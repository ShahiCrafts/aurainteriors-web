# Endpoints

All paths are relative to `/api/v1`. This catalogue is extracted from the
server's route files (`aurainteriors-server/routes/`) — the route file is
always the final authority. **Auth** key: 🌐 public · 🔓 optional session ·
🔒 session required · 🛡 admin only.

A machine-readable version of the core surface is available as an
[OpenAPI 3.0 spec](openapi.yaml) — import it into Postman or a code
generator.

## Auth — `/auth`

| Method & path | Auth | Purpose |
| --- | --- | --- |
| `POST /auth/admin/login` | 🌐 | Admin sign-in step 1: email + password (requires `admin` role) |
| `POST /auth/admin/verify-otp` | 🌐 | Admin sign-in step 2: one-time code |
| `POST /auth/send-magic-link` | 🌐 | Email a one-time sign-in link |
| `POST /auth/verify-magic-link` | 🌐 | Exchange a magic-link token for a session |
| `GET /auth/google` (+ callback) | 🌐 | Google OAuth start/callback (Passport) |
| `GET /auth/me` | 🔒 | Current session user |
| `POST /auth/logout` | 🔒 | End session; token is revoked server-side |

## Users (admin) — `/users` 🛡

`GET /users` · `GET /users/:id` · `PATCH /users/:id/role` ·
`PATCH /users/:id/status` · `DELETE /users/:id`

## Profile & addresses

| Method & path | Auth | Purpose |
| --- | --- | --- |
| `GET /profile` · `PATCH /profile` · `DELETE /profile` | 🔒 | Own profile / update / delete account |
| `DELETE /profile/avatar` | 🔒 | Remove avatar |
| `PATCH /profile/preferences` | 🔒 | Update preferences |
| `GET /addresses` · `POST /addresses` | 🔒 | List / add address |
| `GET /addresses/:id` · `PATCH /addresses/:id` · `DELETE /addresses/:id` | 🔒 | Read / update / delete address |
| `PATCH /addresses/:id/set-default` | 🔒 | Make default address |

## Catalog & products

| Method & path | Auth | Purpose |
| --- | --- | --- |
| `GET /catalog/schema` | 🌐 | Catalog registry (types, attributes) |
| `GET /catalog/navigation` | 🌐 | Navigation tree for the storefront |
| `GET /catalog/rooms` · `GET /catalog/rooms/:slug` | 🌐 | Rooms list / room landing data |
| `POST /catalog/rooms` · `DELETE /catalog/rooms/:slug` | 🛡 | Manage rooms |
| `GET /catalog/collections/:slug` | 🌐 | Collection landing data |
| `DELETE /catalog/collections/:slug` | 🛡 | Delete collection |
| `GET /catalog/attributes` · `GET /catalog/attributes/:key` | 🌐 | Attribute definitions |
| `DELETE /catalog/attributes/:key` · `DELETE /catalog/product-types/:key` | 🛡 | Remove definitions |
| `GET /products` | 🔓 | Product listing with facets/filters/sort/pagination |
| `GET /products/featured` · `GET /products/new-arrivals` | 🌐 | Curated lists |
| `GET /products/:id` | 🔓 | Product by slug or id |
| `GET /products/:id/variants` | 🌐 | Product variants |
| `POST /products` · `PATCH /products/:id` | 🛡 | Create / update product (multipart for images) |
| `DELETE /products/:id` · `DELETE /products/:id/permanent` | 🛡 | Soft / permanent delete |
| `GET /categories` · `GET /categories/:id` · `GET /categories/:id/products` | 🌐 | Category reads and their products |
| `POST /categories` · `PATCH /categories/:id` · `DELETE /categories/:id` | 🛡 | Category management |
| `GET /feeds/google.xml` | 🌐 | Google Merchant product feed |

## Cart, wishlist, discounts

| Method & path | Auth | Purpose |
| --- | --- | --- |
| `GET /cart` · `POST /cart` · `DELETE /cart` | 🔒 | Read / add-or-set / clear account cart |
| `PATCH /cart/items/:itemId` · `DELETE /cart/items/:itemId` | 🔒 | Update / remove a line item |
| `GET /wishlist` · `POST /wishlist` · `DELETE /wishlist` | 🔒 | Wishlist list / add / clear |
| `GET /wishlist/check/:productId` | 🔒 | Is a product wishlisted? |
| `DELETE /wishlist/:productId` | 🔒 | Remove from wishlist |
| `GET /discounts/validate/:code` | 🔓 | Validate a code against a cart |
| `GET /discounts/:id` · `DELETE /discounts/:id` (+ list/create/update) | 🛡 | Discount administration |

## Orders

| Method & path | Auth | Purpose |
| --- | --- | --- |
| `POST /orders/checkout` | 🔒 | Place an order (signed-in) |
| `POST /orders/guest-checkout` | 🌐 | Place an order as a guest (rate-limited) |
| `POST /orders/track` | 🌐 | Guest order tracking (rate-limited) |
| `GET /orders/my-orders` | 🔒 | Own order history |
| `GET /orders/:id` | 🔒 | Order detail (owner) |
| `PATCH /orders/:id/cancel` | 🔒 | Cancel an unshipped order |
| `POST /orders/:id/return` | 🔒 | Request a return |
| `GET /orders/esewa/success` · `GET /orders/esewa/failure` | 🌐 | eSewa return callbacks |
| `GET /orders` · `GET /orders/admin/:id` | 🛡 | Admin order list / detail |
| `PATCH /orders/:id/refund/reconcile` | 🛡 | Reconcile a refund |

## Reviews

| Method & path | Auth | Purpose |
| --- | --- | --- |
| `GET /products/:productId/reviews` | 🌐 | Public (approved) reviews for a product |
| `POST /products/:productId/reviews` | 🔒 | Create a review (purchase-gated) |
| `GET …/reviews/my-review` · `GET …/reviews/can-review` | 🔒 | Own review / eligibility |
| `POST …/reviews/:reviewId/helpful` | 🔓 | Mark helpful |
| `DELETE …/reviews/:reviewId` | 🔒/🛡 | Delete own/admin |
| `GET /reviews/:reviewId` · `PATCH /reviews/:reviewId/toggle-approval` · `DELETE /reviews/:reviewId` | 🛡 | Moderation (mounted at `/reviews`) |

## Chat, documents, jobs

| Method & path | Auth | Purpose |
| --- | --- | --- |
| `/chats` (conversation + message routes) | 🔒 | Customer conversations and messages |
| `GET /chats/:id` · `PATCH /chats/:id/read` | 🔒 | Read a conversation / mark read |
| `/documents` + `PATCH /documents/:id/visibility` | 🛡 | Knowledge-base documents |
| `POST /admin/knowledge/reindex` | 🛡 | Rebuild the Qdrant index |
| `GET /jobs/:id` | 🛡 | Background job status |
| Socket.IO on `/` | 🔒 | Live chat, presence, notifications |

## Engagement

| Method & path | Auth | Purpose |
| --- | --- | --- |
| `GET /notifications` · `GET /notifications/unread-count` | 🔒 | Notification list / badge count |
| `PUT /notifications/:id/read` · `PUT /notifications/:id/archive` | 🔒 | Update a notification |
| `GET /notifications/:id` | 🔒 | Notification detail |
| `GET/PUT /notifications/preferences` | 🔒 | Notification preferences |
| `GET /notifications/push-tokens/devices` | 🔒 | Registered push devices |
| `POST /newsletter/subscribe` · `GET /newsletter/confirm` · `GET /newsletter/unsubscribe` | 🌐 | Double opt-in newsletter |
| `GET /newsletter/subscribers` · `GET /newsletter/stats` · `POST /newsletter/send-trend` | 🛡 | Newsletter administration |
| `GET /announcements` (+ `/:id`) | 🌐 | Published announcements |
| `GET /announcements/stats` · `POST /announcements/:id/publish` · `POST /announcements/:id/archive` · `DELETE /announcements/:id` | 🛡 | Announcement lifecycle |
| `GET /promotions/:id` · `POST /promotions/:id/send` · `POST /promotions/:id/cancel` · `GET /promotions/:id/analytics` · `DELETE /promotions/:id` (+ list/create) | 🛡 | Promotion campaigns |
| `POST /contacts` | 🌐 | Submit the contact form |
| `GET /contacts` · `GET /contacts/stats` · `GET /contacts/:id` · `DELETE /contacts/:id` | 🛡 | Contact inbox |

## Analytics (admin) — `/analytics` 🛡

`GET /analytics/stats` · `GET /analytics/revenue` ·
`GET /analytics/categories` · `GET /analytics/top-products`

## Settings & admin — `/settings`, `/admin`

| Method & path | Auth | Purpose |
| --- | --- | --- |
| `GET /settings/public` | 🌐 | Public store settings (identity, theme, homepage, commerce…) |
| `GET /admin/settings` · `GET/PATCH /admin/settings/:section` | 🛡 | Read/update settings sections |
| `POST /admin/settings/reset` | 🛡 | Reset settings to defaults |
| `POST /admin/settings/test-email` | 🛡 | Send a test email through Brevo |
| `POST /admin/settings/image` | 🛡 | Upload a settings image (logo etc.) |
| `GET /admin/integrations` | 🛡 | Integration status (no secret values) |
| `PUT/DELETE /admin/integrations/:service/secret` | 🛡 | Set/remove a vault secret |
| `POST /admin/integrations/:service/test` | 🛡 | Test a service connection |
| `DELETE /admin/media` (+ handover routes) | 🛡 | Handover: purge media / reset store for a new owner |

## System — `/system`

| Method & path | Auth | Purpose |
| --- | --- | --- |
| `GET /health` (root, outside `/api/v1`) | 🌐 | Liveness probe used by Render health checks |
| `GET /system/keep-alive-status` | 🌐 | Keep-alive/uptime status (detail gated by `HEALTH_DETAIL_TOKEN`) |
