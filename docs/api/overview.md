# API Overview

- **Base URL (production):** `https://api.aurainteriors.live/api/v1`
- **Base URL (local):** `http://localhost:3001/api/v1` (`PORT` in server `.env`)
- **Format:** JSON. Request bodies are capped at 100kb. All routes live in
  the server repo (`aurainteriors-server`), mounted in `app.js`.

## Authentication

Sessions are **JWTs in httpOnly cookies** — send credentials
(`withCredentials` / `credentials: include`) on every request. There is no
public API-key scheme; third parties should not call this API directly.

| Guard | Meaning |
| --- | --- |
| public | No session needed (catalog reads, public settings, feeds) |
| `protectOptional` | Works anonymously; personalised when a session exists |
| `protect` | Valid session required, else `401` |
| `restrictTo('admin')` | Session + `admin` role required, else `403` |

Mutating requests also pass a **CSRF origin check**: the `Origin` header
must match `FRONTEND_URL` or `ADMIN_URL`. Server-to-server scripts must set
an allowed Origin or they will be rejected.

## Responses & errors

Success responses use the resource's natural shape (resource object or
`{ results, data }` list envelopes depending on the controller — check the
route's controller when integrating). Errors are normalised by the global
error handler to:

```json
{ "status": "fail", "message": "Human-readable explanation" }
```

with the matching HTTP status (`400` validation, `401` unauthenticated,
`403` forbidden, `404` not found, `429` rate limited, `5xx` server).

## Validation

Request bodies and queries are validated with **Joi** schemas
(`validators/` in the server repo). A `400` with a field-level message
means the payload didn't match the schema — fix the client, don't retry.

## Rate limits

A global limiter plus per-route read/write limiters
(`middleware/rateLimit.middleware.js`) protect the API; counters are stored
in MongoDB (`rateLimitCounter`). Auth and write endpoints are stricter.
Respect `429` and back off — bursts from one IP during testing are the
usual cause.

## Caching

Anonymous catalog `GET`s return
`Cache-Control: public, max-age=60, stale-while-revalidate=300`
(`middleware/publicCache.middleware.js`), and public settings are similarly
cacheable. Authenticated responses are never publicly cached. When content
looks stale for a minute after an admin edit, this is why.

## Pagination, filtering, sorting

Listing endpoints accept the query conventions implemented by their
controllers/services — typically `page`/`limit` for pagination, facet
parameters on the catalog (category, price range, attributes, availability)
and `sort` where supported. The catalog's facet behaviour is defined in
`services/catalogFacets.service.js` and `services/catalogFilter.service.js`;
the storefront's `src/components/shop/` filters are the reference client.

## Real-time

Chat and notifications use **Socket.IO** on the same origin as the API
(`wss://api.aurainteriors.live`), authenticated with the session cookie.
See [AI Support Chat](../features/ai-support-chat.md).
