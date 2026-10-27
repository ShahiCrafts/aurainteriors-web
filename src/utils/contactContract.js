/**
 * FE-44 — the contact form's wire contract, settled from the server.
 *
 * Server evidence (read-only reference, aura-audit server tree):
 *   validators/contact.validator.js:14-22 — submitContactSchema =
 *     { name (1..100, required), email (email, max 254, required),
 *       phone (max 20, allow ""), subject (1..200, required),
 *       message (1..5000, required),
 *       category (enum general|support|sales|partnership|feedback|other,
 *                 default "general") }
 *   middleware/validate.middleware.js:5-9 — validation runs with
 *     { abortEarly: false, stripUnknown: true }, so unknown keys are
 *     STRIPPED, not rejected. The old client's duplicate `fullName`
 *     key was therefore dead weight, not a live 400; the live defects
 *     were the never-sent category and the misaligned client bounds
 *     (both fixed alongside this module — see validationSchemas.js).
 *
 * The payload built here contains EXACTLY the schema's fields, no
 * more, no less, so nothing depends on the server's stripping.
 */
export const CONTACT_FIELDS = [
  "name",
  "email",
  "phone",
  "subject",
  "message",
  "category",
];

export const CONTACT_CATEGORIES = [
  "general",
  "support",
  "sales",
  "partnership",
  "feedback",
  "other",
];

export const DEFAULT_CONTACT_CATEGORY = "general";

/**
 * Build the POST /contacts payload from the contact form's values.
 * Only the schema fields are copied; any other key on the input
 * (legacy `fullName`, stray form state, injected junk) is dropped.
 * An absent/unknown category becomes the schema default explicitly,
 * so what the server files is what the client intended.
 */
export function buildContactPayload(data = {}) {
  return {
    name: data.name ?? "",
    email: data.email ?? "",
    phone: data.phone ?? "",
    subject: data.subject ?? "",
    message: data.message ?? "",
    category: CONTACT_CATEGORIES.includes(data.category)
      ? data.category
      : DEFAULT_CONTACT_CATEGORY,
  };
}

export default buildContactPayload;
