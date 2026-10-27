import * as yup from "yup";

/**
 * FE-45 — ONE shared phone rule for every client form.
 *
 * Server evidence (read-only reference, aura-audit server tree):
 *   validators/order.validator.js (address + guest checkout phone):
 *     Joi.string().pattern(/^[0-9+\-\s]{7,15}$/) — digits, '+', '-'
 *     and spaces, 7..15 characters total; hyphens ARE legal.
 *   models/user.model.js (profile phone): /^[0-9]{7,15}$/ digits.
 *
 * The old client regex /^[0-9+ ]+$/ rejected server-legal hyphenated
 * numbers, accepted the profile-canonical "+977 984…" in forms whose
 * server is digits-oriented, and accepted junk like "+++++++".
 * The shared rule below mirrors the server checkout pattern and adds
 * a digit-count guard (7..15 digits — the bound both server rules
 * share) plus a leading-'+'-only rule, so separator-only strings can
 * never pass. Every phone field in this file uses this one validator.
 */
export const PHONE_PATTERN = /^[0-9+\-\s]+$/;

export function isValidPhoneNumber(value) {
    if (typeof value !== "string") return false;
    const trimmed = value.trim();
    if (trimmed.length < 7 || trimmed.length > 15) return false;
    if (!PHONE_PATTERN.test(trimmed)) return false;
    // '+' is only legal as the very first character (country code).
    if (trimmed.slice(1).includes("+")) return false;
    const digitCount = trimmed.replace(/\D/g, "").length;
    return digitCount >= 7 && digitCount <= 15;
}

const phoneField = (requiredMessage = "Phone number is required") =>
    yup
        .string()
        .required(requiredMessage)
        .test("phone", "Phone number is not valid", (value) =>
            isValidPhoneNumber(value)
        );

/**
 * Maximums below mirror the server schemas field-by-field (FE-45):
 *   order.validator address/guest checkout, user.model profile caps,
 *   review.validator, contact.validator (see contactContract.js).
 */

export const shippingSchema = yup.object().shape({
    firstName: yup.string().required("First name is required").min(2, "Minimum 2 characters").max(50, "Maximum 50 characters"),
    lastName: yup.string().required("Last name is required").min(2, "Minimum 2 characters").max(50, "Maximum 50 characters"),
    email: yup.string().email("Invalid email").required("Email is required").max(254, "Maximum 254 characters"),
    phone: phoneField(),
    addressLine1: yup.string().required("Street address is required").min(3, "Too short").max(200, "Maximum 200 characters"),
    city: yup.string().required("City is required").min(2, "Too short").max(100, "Maximum 100 characters"),
    postalCode: yup.string().required("ZIP code is required").min(4, "Too short").max(20, "Maximum 20 characters"),
    country: yup.string().required("Country is required").min(2, "Too short").max(100, "Maximum 100 characters"),
});



export const addressSchema = yup.object().shape({
    fullName: yup.string().required("Full name is required").min(3, "Minimum 3 characters").max(100, "Maximum 100 characters"),
    phone: phoneField(),
    addressLine1: yup.string().required("Street address is required").min(3, "Too short").max(200, "Maximum 200 characters"),
    addressLine2: yup.string().nullable().max(200, "Maximum 200 characters"),
    city: yup.string().required("City is required").min(2, "Too short").max(100, "Maximum 100 characters"),
    state: yup.string().nullable().max(100, "Maximum 100 characters"),
    postalCode: yup.string().required("Postal code is required").min(4, "Too short").max(20, "Maximum 20 characters"),
    country: yup.string().required("Country is required").min(2, "Too short").max(100, "Maximum 100 characters"),
    label: yup.string().required(),
    customLabel: yup.string().when("label", {
        is: "other",
        then: (schema) => schema.required("Custom label is required"),
        otherwise: (schema) => schema.notRequired(),
    }),
    type: yup.string().oneOf(["delivery", "billing"]).required("Address type is required"),
    isDefault: yup.boolean(),
});

/**
 * Phase 6 (REUSE-013) — the guest variant of the address schema.
 * AddEditAddressModal used to build this locally with its own email
 * rule (email + required, no maximum). The shared house email rule
 * won the consolidation: it is the rule shippingSchema and
 * contactSchema already carry — email + required + max 254, the
 * server's cap (FE-45). Behaviour note: a >254-char guest email
 * previously passed client validation and failed only at the
 * server; it now fails client-side with "Maximum 254 characters".
 */
export const guestAddressSchema = addressSchema.shape({
    email: yup.string().email("Invalid email").required("Email is required").max(254, "Maximum 254 characters"),
});

export const personalInfoSchema = yup.object().shape({
    firstName: yup.string().required("First name is required").min(2, "Minimum 2 characters").max(50, "Maximum 50 characters"),
    lastName: yup.string().required("Last name is required").min(2, "Minimum 2 characters").max(50, "Maximum 50 characters"),
    phone: phoneField(),
    // Server user.model gender enum includes "prefer_not_to_say".
    gender: yup.string().oneOf(["male", "female", "other", "prefer_not_to_say"], "Invalid gender").nullable(),
    // FE-45: the old .max(new Date()) froze "today" at module import;
    // the future check is now evaluated on every validation.
    dateOfBirth: yup
        .date()
        .nullable()
        .test("not-in-future", "Date cannot be in the future", (value) =>
            value == null ? true : value.getTime() <= Date.now()
        ),
});

/**
 * FE-44 — bounds aligned to the server submitContactSchema
 * (validators/contact.validator.js:14-22): name 1..100, email max
 * 254, phone max 20 (optional, "" allowed), subject 1..200,
 * message 1..5000, category from the server enum. The form field is
 * `name` — the old schema's `fullName` was not a server field.
 */
export const contactSchema = yup.object().shape({
    name: yup.string().trim().required("Full name is required").min(1, "Name is required").max(100, "Maximum 100 characters"),
    email: yup.string().trim().email("Invalid email").required("Email is required").max(254, "Maximum 254 characters"),
    phone: yup.string().trim().max(20, "Maximum 20 characters").notRequired(),
    subject: yup.string().trim().required("Subject is required").min(1, "Subject is required").max(200, "Maximum 200 characters"),
    message: yup.string().trim().required("Message is required").min(1, "Message is required").max(5000, "Maximum 5000 characters"),
    category: yup
        .string()
        .oneOf(["general", "support", "sales", "partnership", "feedback", "other"], "Invalid category")
        .default("general"),
});

export const reviewSchema = yup.object().shape({
    // Server review.validator: rating integer 1..5 — the old client
    // rule had no maximum and no integer constraint (FE-45).
    rating: yup
        .number()
        .required("Rating is required")
        .integer("Rating must be a whole number")
        .min(1, "Please select at least 1 star")
        .max(5, "Rating cannot exceed 5"),
    title: yup.string().max(100, "Title too long"),
    comment: yup.string().required("Comment is required").min(10, "Comment too short").max(1000, "Comment cannot exceed 1000 characters"),
});



export const trackOrderSchema = yup.object().shape({
    orderId: yup.string().trim().required("Order ID is required"),
    email: yup.string().email("Invalid email").trim().required("Email is required"),
});

export const newsletterSchema = yup.object().shape({
    email: yup.string().email("Invalid email address").required("Email is required"),
});
