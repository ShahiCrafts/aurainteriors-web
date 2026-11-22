# Known Limitations

The honest list — everything a buyer or a new developer should know is
*not* finished, not verified, or deliberately simplified. Disclosing these
is part of the handover; none of them block operating the store today.

## Commerce

| Limitation | Detail |
| --- | --- |
| Demo catalogue | The 280 products are **seed/demo data** (SKUs prefixed `AUR-DEMO`, seed imagery). There is no real sales history, traffic or review corpus yet — the store is a finished platform, not a trading business |
| Khalti not live | Settings and Integrations contain Khalti fields, but checkout and the order model only support `cod` and `esewa`. Wiring Khalti in is a development task (pattern: the eSewa services) |
| No VAT/tax | Pricing applies no tax anywhere; shipping is computed as 0 server-side today (free-delivery messaging is a settings/display layer) |
| eSewa refunds are manual | Return approval is in the admin; the money movement for eSewa orders happens in the merchant dashboard and is recorded on the order |

## Platform & hosting

| Limitation | Detail |
| --- | --- |
| Free-tier cold starts | Render free services sleep when idle; the first visit after inactivity can take ~30–60s. A paid Render instance removes this |
| SEO snapshot staleness | Prerendered catalog pages refresh only on the next storefront build; live app data is always fresh from the API (see [Routing & SEO](../development/routing-and-seo.md)) |
| Cloudflare edge caching | Static build assets may serve `cf-cache-status: DYNAMIC` due to duplicate origin `Cache-Control` headers; a Cloudflare cache rule is the pending fix if edge caching is wanted |
| Stray asset | `public/logo-aura-interiors-admin.webp` in the web repo actually contains an unrelated (GuchaaDecor) logo. It is unreferenced — the admin uses the settings logo — and can simply be deleted |
| No SSR/hydration | The storefront prerenders static snapshots and mounts React fresh; true SSR is a possible future rebuild, not a bug |
| Test baselines | Both suites carry small pre-existing failure counts (web ≈17 of ~1,450; server ≈10). They are documented in [Testing](../development/testing.md); the bar for changes is "no new failures" |

## Accounts & email

| Limitation | Detail |
| --- | --- |
| Magic-link on a real phone | Google sign-in is verified end-to-end. The magic-link flow is implemented and tested in code, but the full tap-through from a real inbox on the owner's phone has not been re-verified since the auth pages were restyled — worth a 2-minute check after any auth change |
| No customer passwords | By design: customers are passwordless (Google/magic link). There is no password-reset flow to offer customers |

## AR (`reticlexr`)

| Limitation | Detail |
| --- | --- |
| iOS native code unverified on device | The Swift ARKit/RealityKit plugin (v1.2.0) and overlay mode (v1.3.0) are written and pushed in the package repo, but have **not been compiled on a Mac/Xcode or run on a physical iPhone** — do this before promising an iOS app release |
| npm version lag | The storefront bundles `reticlexr@1.1.0` from npm; 1.2.0/1.3.0 exist in the package repo but are not yet published to npm |
| Quick Look USDZ | The generated demo USDZ validates in Pixar's USD tooling and serves correctly, but a tap-through in iPhone Safari Quick Look has not been confirmed on a physical device |
| One demo model | Only the demo sofa ships with a 3D model; other products need GLB (+ USDZ) assets produced |

## AI chat

| Limitation | Detail |
| --- | --- |
| Free-tier AI providers | The Groq → Mistral → OpenRouter chain runs on free tiers with their rate limits; heavy chat volume needs paid keys (buyer's own, via Integrations) |
| Knowledge base scope | The AI only knows what is in Admin → Knowledge plus the catalog; an empty knowledge base means generic answers |

## Documentation

| Limitation | Detail |
| --- | --- |
| Endpoint catalogue is curated | [Endpoints](../api/endpoints.md) and the [OpenAPI spec](../api/openapi.yaml) cover the platform's API surface as extracted from the route files; the route files remain the final authority for rarely used admin internals |
