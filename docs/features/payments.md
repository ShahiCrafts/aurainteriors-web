# Payments

The store supports exactly two live payment methods today — the order model
restricts `paymentMethod` to these values:

| Method | Value | How it settles |
| --- | --- | --- |
| Cash on Delivery | `cod` | No online payment; `paymentStatus` stays `pending` until the store marks it paid on delivery |
| eSewa | `esewa` | Online redirect flow with server-side verification and capture (below) |

> **Khalti:** settings contain a `khalti` section (public key) and the admin
> Integrations page lists it, but Khalti is **not** wired into checkout or
> the order model yet. Treat it as "prepared, not live".

## eSewa flow

1. At checkout the customer picks eSewa; the API creates the order in a
   pending-payment state and returns the signed eSewa form payload
   (merchant id + secret come from env `ESEWA_MERCHANT_ID` /
   `ESEWA_SECRET_KEY`, or from the Integrations vault; `ESEWA_ENV` selects
   `sandbox` or production).
2. The customer's browser posts to eSewa (`form-action` is allow-listed in
   the storefront CSP for `https://*.esewa.com.np`).
3. eSewa redirects back to the API. **The API never trusts the redirect
   alone:** `services/esewaVerification.service.js` verifies the response
   signature and `services/esewaCapture.service.js` confirms the transaction
   with eSewa, writing a `paymentCapture` record.
4. Only then is the order's `paymentStatus` set to `paid`. Failures route
   the customer to `/checkout/payment-failed`
   (`GET /api/v1/orders/esewa/failure` handles the gateway's failure
   callback) and the order remains payable/retryable.

## Refunds

Returns approved in the order flow move the refund state machine
(`none → requested → approved → completed`) and `paymentStatus` to
`refunded` once the money is returned. For eSewa orders the refund itself is
executed from the merchant dashboard; the admin records the outcome on the
order. COD orders have nothing to refund online.

## Money rules enforced server-side

- Totals (items, discount, shipping) are recomputed by
  `services/commerceTotals.service.js` on every order — client-sent totals
  are ignored.
- Discount usage is recorded (`discountUsage`) so one-time codes can't be
  replayed.
- No VAT/tax is applied in pricing today (documented in the settings
  defaults); if the business registers for VAT, pricing logic — not just a
  settings flag — must change.
- All amounts are NPR (`en-NP` formatting on the storefront).

## Testing payments

Use `ESEWA_ENV=sandbox` with eSewa's sandbox merchant credentials and test
wallet. Never point a sandbox storefront build at production credentials:
the environment is chosen server-side, and the storefront build only knows
the API origin.
