# FAQ

## For owners

**How do I change the store name, logo or colours?**
Admin → Store Settings → Identity / Theme. Changes reach the live store
within about a minute; no developer or redeploy needed. See the
[Owner Handbook](../owner/owner-handbook.md).

**Can I sell this store to someone else?**
Yes — it was built for that. The handover flow (Admin → Setup Wizard +
handover tools) clears demo data, and the buyer rebrands everything from
settings. See "Selling or handing over the store" in the Owner Handbook.

**Does the store work without the AI chat?**
Yes. Turn chat off in Settings → Chat and customers see a polite offline
card with your contact details instead.

**Which payment methods work today?**
Cash on Delivery and eSewa. Khalti is prepared in settings but not yet
connected to checkout — a developer must wire it into the order flow before
advertising it.

**Why is the first visit of the day slow?**
The free hosting plan sleeps when idle. Upgrading the Render services to a
paid instance removes the cold start.

**Where is my data stored?**
Products, orders and customers in MongoDB Atlas; photos in Cloudinary;
emails sent via Brevo. Nothing important lives only on the web server.

## For developers

**How do I run everything locally?**
[Quick Start](../getting-started/quick-start.md) — API on :3001, storefront
on :5173, admin on :5174, plus `npm run seed` for demo data.

**Where do I add a new API endpoint?**
Route in `routes/`, handler in `controllers/`, logic in `services/`, Joi
schema in `validators/`, and mount it in `app.js` if it's a new resource.
Follow an existing resource (e.g. `announcement`) as the template.

**How does theming work — why didn't my colour change apply?**
Components must use the brand tokens (`bg-brand`, CSS variables), which
settings override at runtime. A hard-coded hex won't respond to Store
Settings. See [Styling & Theming](../development/styling-and-theming.md).

**Why does the admin 404 on refresh but work when navigating?**
The Vercel project needs the legacy `routes` SPA fallback in
`vercel.json`. `rewrites` is ignored on this project — see
[Deployment Guide](../deployment/deployment-guide.md).

**Why is a product I just edited not updated on the site?**
Two caches: the API caches anonymous catalog reads for ~60s, and the
prerendered SEO snapshot only refreshes on the next storefront build. The
live app data is fresh after the cache window.

**How do I change the chat's AI behaviour?**
Provider order and models: `services/chatV2/config/chatConfig.js`. Grounding
content: Admin → Knowledge (then reindex). Keys: env or the Integrations
vault. Verify with `npm run chat:gate`. See
[AI Support Chat](../features/ai-support-chat.md).

**Can I add a payment method (e.g. Khalti)?**
Yes: add the gateway service (follow `esewaVerification` /
`esewaCapture` as the pattern), extend the order model's `paymentMethod`
enum, add the checkout option, and keep the settings section that already
exists for it. Never mark an order paid from the client redirect alone —
verify server-side like eSewa does.

**Where are the tests and what's the pass bar?**
Web: Vitest (`npm test`); server: node:test (`npm test`). Both suites have
small known pre-existing failure counts — the bar is "no new failures".
See [Testing](../development/testing.md).
