# Aura Interiors — Technical Documentation

![Aura Interiors](assets/banner.svg)

**Aura Interiors** is a complete furniture e-commerce platform for the Nepali market:
a customer storefront, an admin panel, and a REST API — with product catalog, cart and
checkout, eSewa payments, customer accounts, an AI support chat with a knowledge base,
in-home AR product preview, and a fully settings-driven store that a non-technical
owner can rebrand and operate without touching code.

| Surface | URL | Served from |
| --- | --- | --- |
| Storefront | https://www.aurainteriors.live | Render (Docker + nginx) |
| Admin panel | https://admin.aurainteriors.live | Vercel |
| API | https://api.aurainteriors.live | Render |
| CDN / DNS / SSL | — | Cloudflare (free plan) |

This documentation is the single source of truth for the platform. It is written for
two audiences:

- **Developers** — architecture, code organisation, API reference, deployment.
- **The store owner** — what the platform does, how to run it day to day, what
  services it depends on, and how to hand it over. Start with the
  [Owner Handbook](owner/owner-handbook.md).

---

## Getting Started

| Guide | What it covers |
| --- | --- |
| [Introduction](getting-started/introduction.md) | What Aura Interiors is, the moving parts, and the technology stack |
| [Quick Start](getting-started/quick-start.md) | Run the whole platform locally in a few minutes |
| [Installation](getting-started/installation.md) | Full setup: prerequisites, environment variables, database, seed data |
| [Project Structure](getting-started/project-structure.md) | Every important folder and file in both repositories |

## Development

| Guide | What it covers |
| --- | --- |
| [Architecture](development/architecture.md) | System design, request/data flow, rendering model, real-time layer |
| [Frontend Architecture](development/frontend-architecture.md) | The two web apps (storefront + admin), components, stores, data fetching |
| [Styling & Theming](development/styling-and-theming.md) | Tailwind v4, brand tokens, settings-driven theme, responsive conventions |
| [Routing & SEO](development/routing-and-seo.md) | Route map, build-time prerendering, sitemap, meta, `llms.txt` |
| [Testing](development/testing.md) | Test suites in both repos, how to run them, known baselines |

## Features

| Guide | What it covers |
| --- | --- |
| [Storefront & Catalog](features/storefront-and-catalog.md) | Home page, categories, rooms, collections, product pages, search, reviews |
| [Screenshots & Responsiveness](features/screenshots-and-responsiveness.md) | Visual tour of the storefront and admin, and the responsive design rules |
| [Cart, Checkout & Orders](features/cart-checkout-and-orders.md) | Guest and account carts, checkout, order lifecycle, tracking, returns |
| [Payments](features/payments.md) | Cash on Delivery and eSewa: flow, verification, refunds |
| [Accounts & Authentication](features/accounts-and-auth.md) | Email/password, Google sign-in, magic links, sessions, profile |
| [Admin Panel](features/admin-panel.md) | Every dashboard module, what it manages, and who can use it |
| [Store Settings & Integrations](features/store-settings-and-integrations.md) | The settings system, encrypted key vault, integrations, handover wizard |
| [AI Support Chat](features/ai-support-chat.md) | Customer chat widget, AI provider chain, knowledge base (RAG), support inbox |
| [AR Experience](features/ar-experience.md) | "View in your room" AR on Android and iOS, the `reticlexr` package |

## API Reference

| Guide | What it covers |
| --- | --- |
| [API Overview](api/overview.md) | Base URL, authentication, errors, rate limits, caching, conventions |
| [Endpoints](api/endpoints.md) | Endpoint catalogue grouped by resource |
| [Data Models](api/data-models.md) | The MongoDB collections and what they store |
| [OpenAPI spec](api/openapi.yaml) | Machine-readable API definition (OpenAPI 3.0) for Postman/codegen |

## Deployment

| Guide | What it covers |
| --- | --- |
| [Environment Variables](deployment/environment-variables.md) | Every variable in both repos, what it does, and where it lives |
| [Deployment Guide](deployment/deployment-guide.md) | Render, Vercel, Cloudflare and domain setup, step by step |
| [Operations & Troubleshooting](deployment/operations-and-troubleshooting.md) | Health checks, monitoring, known quirks, and fixes |
| [Backup & Restore](deployment/backup-and-restore.md) | What to back up, how, and how to restore it (incl. the pre-handover backup) |

## Handover (selling the store)

| Guide | What it covers |
| --- | --- |
| [Asset Inventory & Transfer](handover/asset-inventory-and-transfer.md) | Every account, asset and credential that changes hands, with the transfer checklist |
| [Known Limitations](handover/known-limitations.md) | The honest list: what is unfinished, unverified, or deliberately simplified |
| [Licenses & Third-Party Software](handover/licenses.md) | Open-source dependencies and their licenses, from the lockfiles |

## Owner & Support

| Guide | What it covers |
| --- | --- |
| [Owner Handbook](owner/owner-handbook.md) | Running the store day to day, service inventory, costs, handover checklist |
| [FAQ](support/faq.md) | Frequently asked questions from owners and developers |

---

## Repositories

| Repo | Contents |
| --- | --- |
| `ShahiCrafts/aurainteriors-web` | Storefront + admin panel (React, Vite, Tailwind CSS v4). **This documentation lives here, in `/docs`.** |
| `ShahiCrafts/aurainteriors-server` | REST API + background worker (Node.js, Express, MongoDB/Mongoose, Socket.IO) |

## Conventions used in these docs

- `www` = the storefront app, `admin` = the admin app, `api` = the server.
- Code names, file paths and commands are shown in `code style` and are copied from
  the actual repositories — if a doc and the code ever disagree, the code wins and
  the doc should be fixed.
- Amounts are in Nepalese Rupees (NPR). The storefront locale is `en-NP`.
