/**
 * FE-45 — parsers for the admin inline forms that bypassed the yup
 * schemas in validationSchemas.js.
 *
 * Server evidence (read-only reference, aura-audit server tree):
 *   validators/discount.validator.js — discountPercentage: number
 *     1..100 required; minimumOrderAmount: number min 0;
 *     maxUsageLimit: integer min 1, allow(null).
 *   validators/product.validator.js — price: number positive
 *     required; originalPrice: number positive; stock: integer min 0.
 *
 * Before: Discounts.jsx parseInt'd the percentage with no range/NaN
 * guard (a non-numeric entry was sent as NaN) and Products.jsx sent
 * price/stock as raw strings, relying entirely on server validation.
 * These helpers parse + bound-check client-side; the pages refuse to
 * submit when parsing fails. Each returns { ok, values } or
 * { ok: false, error } with a field-specific message.
 */

export function parseDiscountFormValues(form = {}) {
    const discountPercentage = Number(form.discountPercentage);
    if (
        form.discountPercentage === "" ||
        form.discountPercentage == null ||
        !Number.isFinite(discountPercentage) ||
        discountPercentage < 1 ||
        discountPercentage > 100
    ) {
        return {
            ok: false,
            error: "Discount percentage must be a number between 1 and 100",
        };
    }

    const minimumOrderAmount =
        form.minimumOrderAmount === "" || form.minimumOrderAmount == null
            ? 0
            : Number(form.minimumOrderAmount);
    if (!Number.isFinite(minimumOrderAmount) || minimumOrderAmount < 0) {
        return {
            ok: false,
            error: "Minimum order amount cannot be negative",
        };
    }

    let maxUsageLimit = null;
    if (form.maxUsageLimit !== "" && form.maxUsageLimit != null) {
        maxUsageLimit = Number(form.maxUsageLimit);
        if (!Number.isInteger(maxUsageLimit) || maxUsageLimit < 1) {
            return {
                ok: false,
                error: "Usage limit must be a positive whole number",
            };
        }
    }

    return {
        ok: true,
        values: { discountPercentage, minimumOrderAmount, maxUsageLimit },
    };
}

export function parseProductPriceStock(form = {}) {
    const price = Number(form.price);
    if (form.price === "" || form.price == null || !Number.isFinite(price) || price <= 0) {
        return { ok: false, error: "Price must be a positive number" };
    }

    const stock =
        form.stock === "" || form.stock == null ? 0 : Number(form.stock);
    if (!Number.isInteger(stock) || stock < 0) {
        return { ok: false, error: "Stock must be a whole number of 0 or more" };
    }

    const values = { price, stock };
    if (form.originalPrice !== "" && form.originalPrice != null) {
        const originalPrice = Number(form.originalPrice);
        if (!Number.isFinite(originalPrice) || originalPrice <= 0) {
            return { ok: false, error: "Original price must be a positive number" };
        }
        values.originalPrice = originalPrice;
    }

    return { ok: true, values };
}
