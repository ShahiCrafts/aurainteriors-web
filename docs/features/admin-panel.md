# Admin Panel

The admin panel (`https://admin.aurainteriors.live`, `src/AdminApp.jsx`) is
the store's control room. Only users with the `admin` role can sign in.
Every significant admin action is written to the **audit log**
(`auditLog` collection, Admin → Audit Log).

## Dashboard

The home dashboard (`/dashboard`) shows store analytics from
`/api/v1/analytics`: headline stats, revenue over time, sales by category
and top products (charts via `recharts`).

## Modules

| Route | Module | What it manages |
| --- | --- | --- |
| `/dashboard/products` | Products | Create/edit products: images (Cloudinary upload), variants, stock, pricing, SEO, AR model. Bulk-friendly list with search |
| `/dashboard/categories` | Categories | Two-level category tree, images, slugs |
| `/dashboard/product-types` | Product Types | The catalog's product-type registry |
| `/dashboard/attributes` | Attributes | Attribute definitions used by filters and product forms |
| `/dashboard/rooms` | Rooms | Room landing pages (`/rooms/:slug` on the storefront) |
| `/dashboard/collections` | Collections | Merchandising collections (`/collections/:slug`) |
| `/dashboard/orders` | Orders | Order list and detail: fulfilment status, payment state, customer, items; cancellations and returns |
| `/dashboard/discounts` | Discounts | Discount codes: value, validity, usage limits and recorded usage |
| `/dashboard/promotions` | Promotions | Broadcast campaigns with send/cancel and per-campaign analytics |
| `/dashboard/announcements` | Announcements | Store notices: draft → publish → archive, with stats |
| `/dashboard/reviews` | Reviews | Moderation queue: approve/hide or delete customer reviews |
| `/dashboard/support` | Support | Live-chat inbox: conversation list, reply as agent, AI/human handoff, customer context |
| `/dashboard/knowledge` | Knowledge | Documents that ground the AI chat (upload, visibility, reindex into Qdrant) |
| `/dashboard/contacts` | Contacts | Messages from the storefront contact form, with stats |
| `/dashboard/users` | Users | Customer accounts: role and status management |
| `/dashboard/media-library` | Media Library | Uploaded media (Cloudinary-backed) for reuse across the store |
| `/dashboard/integrations` | Integrations | Third-party service keys in the encrypted vault + connection tests — see [Store Settings](store-settings-and-integrations.md) |
| `/dashboard/store-settings` | Store Settings | Identity, theme, contact, SEO, homepage, pages, commerce, chat, notifications, maintenance — see [Store Settings](store-settings-and-integrations.md) |
| `/dashboard/setup-wizard` | Setup Wizard | Guided first-run / rebrand checklist |
| `/dashboard/audit-log` | Audit Log | Who changed what, and when |

## Access & safety

- Admin routes are guarded twice: the app checks the session client-side,
  and the API enforces `restrictTo('admin')` server-side on every admin
  endpoint — the UI guard is convenience, not security.
- Destructive actions (product delete, media delete in handover) are
  explicit and logged.
- The customer chat widget never renders for admin users, so staff browsing
  the storefront aren't mistaken for customers.
