# Accounts & Authentication

## Sign-in methods

Customers sign in **passwordlessly** — there is no customer password
anywhere in the system:

| Method | How it works |
| --- | --- |
| Google | OAuth 2.0 via Passport (`config/passport.js`); the API completes the flow and hands the session to the storefront at `/auth/success` |
| Magic link | `POST /api/v1/auth/send-magic-link` emails a one-time link (via Brevo); opening it hits `/auth/verify` in the storefront, which exchanges it with the API (`/verify-magic-link`) for a session |

A customer account is created automatically on first sign-in with either
method — there is no separate registration step or form.

Admins sign in separately at the admin app's `/login`, in **two steps**:
email + password (`POST /api/v1/auth/admin/login`, bcrypt-hashed server-side)
followed by a one-time code (`POST /api/v1/auth/admin/verify-otp`). The
account must have the `admin` role.

## Session model

- Sessions are **JWTs in httpOnly cookies** — the token is never exposed to
  JavaScript (in production the API refuses to boot if a
  return-token-in-body mode is enabled).
- `GET /api/v1/auth/me` returns the current user; the web apps call it on
  boot to hydrate `authStore`.
- Logout (`POST /api/v1/auth/logout`) clears the cookie and records the
  token in `revokedToken`, so a stolen cookie can't be replayed after
  logout.
- Login attempts are logged (`authAttempt`) and auth endpoints are rate
  limited; account status and role are managed in Admin → Users
  (`PATCH /api/v1/users/:id/role`, `/:id/status`).

## Customer account (`/profile`)

One page, four tabs (sidebar on desktop, tab bar on mobile):

| Tab | Backed by |
| --- | --- |
| Profile Details | `/api/v1/profile` — name, avatar (upload/delete), preferences |
| My Orders | `/api/v1/orders/my-orders` — history, cancel, return |
| Saved Addresses | `/api/v1/addresses` — CRUD + set default |
| Wishlist | `/api/v1/wishlist` — saved products (`wishlist` collection) |

Deleting the account is `DELETE /api/v1/profile`.

## Guests

Shoppers can browse, cart and check out without an account. Guest carts are
client-side; at checkout the API creates a `guestSession` so the order can
be tracked at `/track-order`. If the guest later signs in with the same
email, past guest activity isn't automatically claimed — orders stay
associated with the account that placed them while signed in.

## Security notes for developers

- All auth mutations pass the CSRF origin check and Joi validation.
- Never store tokens in `localStorage` — the web security test suite audits
  every storage key the apps write (allowlist in
  `tests/security/storage-audit.test.js`).
- Google sign-in requires the redirect URIs registered in Google Cloud to
  match `BACKEND_URL` / `FRONTEND_URL` exactly.
