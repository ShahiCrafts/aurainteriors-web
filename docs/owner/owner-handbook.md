# Owner Handbook

*For the store owner — no technical knowledge needed. Developer detail lives
in the rest of this documentation.*

## What you own

A complete online furniture store:

- **Your shop window** — https://www.aurainteriors.live, where customers
  browse, buy, track orders, chat with support and preview furniture in
  their room with AR.
- **Your control room** — https://admin.aurainteriors.live, where you run
  everything: products, prices, orders, offers, reviews, customer messages,
  and the look of the store itself.
- **The engine** — an API and database that hold your products, orders and
  customers. You never need to open it; the admin panel is its remote
  control.

## Your weekly routine

| Task | Where |
| --- | --- |
| Check new orders and move them along (confirm → ship → deliver) | Admin → Orders |
| Reply to customer chats the AI couldn't finish | Admin → Support |
| Approve new product reviews | Admin → Reviews |
| Add or restock products, fix prices | Admin → Products |
| Read contact-form messages | Admin → Contacts |
| Glance at sales | Admin → Dashboard |

## Changing the store — no developer needed

In **Admin → Store Settings** you control: the store **name, logo and
colours**, contact details, the **home page layout and banners**, the text
of pages like About / Shipping / Returns, free-delivery rules, and whether
the support chat is on. Changes go live within about a minute.

In **Admin → Integrations** you paste in your own service keys (email,
payments) — they are stored encrypted, and you can change them any time
without calling a developer.

## The services behind your store (accounts to keep)

| Service | What it does | Plan today |
| --- | --- | --- |
| Render | Runs the shop and the engine | Free (the shop "sleeps" when idle — first visit can be slow; a small paid plan removes this) |
| Vercel | Runs the admin panel | Free |
| Cloudflare | Your domain's traffic, security and SSL | Free |
| MongoDB Atlas | Your database (products, orders, customers) | Free |
| Cloudinary | Stores product photos | Free |
| Brevo | Sends order/sign-in emails | Free |
| eSewa | Online payments | Your merchant account |
| Name.com | Your domain name registration | Paid yearly — **never let this lapse** |

Keep the login details for all of these in one safe place (a password
manager). Whoever holds these accounts holds the business.

## Money in, money out

- **Cash on Delivery:** you collect cash; mark orders paid in Admin →
  Orders.
- **eSewa:** money lands in your eSewa merchant account; the store verifies
  every payment automatically before marking an order paid.
- **Refunds:** approve the return in the order, send the money back from
  your eSewa dashboard (for online payments), and the store records it.

## Selling or handing over the store

The full transfer inventory and checklist live in
[Asset Inventory & Transfer](../handover/asset-inventory-and-transfer.md),
and the honest list of what's unfinished is in
[Known Limitations](../handover/known-limitations.md). In short, the store
was built to be handed over:

1. The buyer gets their own accounts for the services above (or you
   transfer yours).
2. In Admin, run the **Setup Wizard**, then use the **handover** tools to
   clear out demo/test data and media.
3. The buyer sets their store name, logo, colours and their own payment /
   email keys in Store Settings and Integrations.
4. Change the admin password and the database password, and hand over this
   documentation.

Nothing about your products, prices or branding is locked in code — a new
owner can rebrand the entire store from the admin panel in an afternoon.

## When something looks wrong

- **First visit is slow** — normal on the free hosting plan (it sleeps).
- **Store shows a wrong name or colour** — it's a setting: Admin → Store
  Settings.
- **A customer says payment failed but money left their account** — check
  the order in Admin → Orders; payments are verified automatically, and
  anything unresolved shows there.
- **Emails not arriving** — Admin → Store Settings has a "send test email"
  button; if it fails, your email service key needs attention in
  Integrations.
- Anything else: hand your developer the
  [Operations & Troubleshooting](../deployment/operations-and-troubleshooting.md)
  page — it covers every known issue.
