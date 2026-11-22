# Cart, Checkout & Orders

## Cart

| | Guest cart | Account cart |
| --- | --- | --- |
| Storage | Client-side (`guestCartStore`, persisted locally) | Server (`/api/v1/cart`, `cart` collection) |
| Who | Anonymous shoppers | Signed-in customers |
| Behaviour | Works fully offline of an account; **merges into the account cart at sign-in** | Synced across devices |

- The cart opens as a right-side drawer from anywhere (the navbar cart button
  with a live count badge).
- Line items support variant selection, quantity changes and removal;
  stock is checked against live inventory, and checkout reserves stock
  (`stockReservation`) so two customers can't buy the last unit.
- **Buy Now** on a product page bypasses the shared cart (`buyNowStore`) and
  goes straight to checkout with just that item.

## Checkout

`/checkout` collects:

1. **Contact + delivery address** — signed-in customers pick from their
   address book (`/api/v1/addresses`, with a default address) or add a new
   one; guests enter details inline (a guest session is created server-side).
2. **Discount code** — validated live (`/api/v1/discounts/validate/:code`);
   totals are always recomputed server-side
   (`services/commerceTotals.service.js`) — the client's numbers are never
   trusted. Shipping is currently free (the storefront advertises free
   delivery above NPR 5,000; `shippingCost` is computed server-side).
3. **Payment method** — Cash on Delivery or eSewa (see
   [Payments](payments.md)).

Placing the order creates the `order` record, decrements/reserves stock,
clears the cart, queues a confirmation email (email outbox — the customer
gets mail even if the mail provider is briefly down), and lands on
`/order-confirmation/:orderId`. A failed eSewa payment lands on
`/checkout/payment-failed` with the order preserved for retry.

## Order lifecycle

Order `status` moves through fulfilment states (pending → confirmed →
shipped → delivered, or cancelled); `paymentStatus` is tracked separately
(`pending`, `paid`, `failed`, `refunded`). Customers can:

- see orders in **Profile → My Orders** (`/api/v1/orders/my-orders`),
- **cancel** an order that hasn't shipped (`PATCH /api/v1/orders/:id/cancel`),
- request a **return** (`POST /api/v1/orders/:id/return`), which moves the
  order's refund state (`none → requested → approved/rejected → completed`),
- **track a guest order** at `/track-order` with the order id + contact
  detail — no account needed.

Admins manage fulfilment in Admin → Orders (status changes, customer and
item detail); every change is written to the audit log.

## Notifications

Order events create in-app notifications (`/api/v1/notifications`, with
unread counts and per-user preferences) and device push tokens can be
registered for mobile push. Email notifications ride the outbox queue.
