# Store Settings & Integrations

This system is what makes Aura Interiors **rebrandable and sellable**: almost
everything a buyer would want to change lives in database settings, editable
in Admin → Store Settings, and is served to the storefront from
`GET /api/v1/settings/public`. Defaults live in the server at
`services/settings/defaults.js` — that file is the canonical list of what is
configurable.

## Settings sections

| Section | Controls |
| --- | --- |
| `identity` | Store name, tagline, logo and favicon (logo uploads go through `/api/v1/admin/settings/image`) |
| `theme` | Brand colours (primary/hover/navy), font, button radius style, card radius/shadow, page background, header style (light/navy/black), dark mode |
| `contact` | Email, phone, address, hours, social links — used by the footer, contact page and emails |
| `seo` | Default title/description/OG image and site metadata |
| `homepage` | Section order and visibility (hero, trust banner, categories, featured, testimonials), hero content, promo code strip |
| `pages` | Editable content pages (About, Privacy, Terms, Shipping, Returns, FAQ) |
| `commerce` | Currency/locale behaviour, free-delivery threshold, low-stock threshold, order rules. (Shipping is currently computed as 0 and no VAT is applied — see the notes in `defaults.js` before promising otherwise.) |
| `chat` | Chat on/off, welcome/offline messages, business hours. When disabled, the widget is replaced by the offline notice card |
| `notifications` | Notification defaults and templates' switches |
| `maintenance` | Maintenance mode and related flags |
| `integrations` | Non-secret integration configuration (see vault below for secrets) |

Admins read/write settings via `/api/v1/admin/settings` and
`/api/v1/admin/settings/:section`; `POST /api/v1/admin/settings/reset`
restores defaults, and `POST /api/v1/admin/settings/test-email` verifies the
mail setup end to end.

## Integrations & the encrypted vault

Third-party **secret keys never live in settings documents or in the repo**.
They are stored encrypted in the `integrationSecret` collection through
`services/settings/secretsService.js`, managed in Admin → Integrations:

- `GET /api/v1/admin/integrations` — services and their configured status
  (never the secret values)
- `PUT/DELETE /api/v1/admin/integrations/:service/secret` — set or remove a
  key
- `POST /api/v1/admin/integrations/:service/test` — live connection test

Services with integration slots include: Brevo (email), eSewa and Khalti
(payments), Cloudinary (media), Google (sign-in), SMS and push providers,
and the AI providers used by chat. Where a vault key exists it **overrides**
the corresponding `.env` variable, so an owner can rotate keys without a
redeploy — and a seller can hand over the store without sharing their
personal accounts' passwords.

## Setup wizard & handover

- **Setup Wizard** (`/dashboard/setup-wizard`) walks a new owner through
  identity, contact, payments and integrations in order.
- **Handover** (`services/handover.service.js`, `/api/v1/admin` handover
  routes) is the sale flow: it can purge demo/media data
  (`DELETE /api/v1/admin/media`), reset store content to a clean state and
  re-seed essentials, so the buyer starts fresh while the platform — code,
  settings structure, documentation — stays intact.

## Rules for developers

1. New owner-facing configuration goes in `defaults.js` + a settings tab —
   not in environment variables and never hard-coded in components.
2. Secrets go through the vault service only; never log or return them.
3. The public settings endpoint must only expose the public subset —
   anything sensitive stays behind admin routes.
