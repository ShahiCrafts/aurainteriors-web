// Phase 7 (catalog) — cart-line projections shared by the cart
// drawer, checkout and review step. A line that names a catalog
// variant carries its identity either as the server's
// variantDetails (authenticated cart) or as the guest line's own
// stored fields (variantId/sku/unitPrice/variantOptions, written
// by the product page at add time). Legacy lines have neither.

// { sku, options } for the summary, or null for legacy lines.
export function variantSummaryProps(item) {
  if (!item) return null;
  if (item.variantDetails) {
    return {
      sku: item.variantDetails.sku,
      options: item.variantDetails.options,
    };
  }
  if (item.variantId) {
    return { sku: item.sku, options: item.variantOptions };
  }
  return null;
}

// The unit price a line displays at: the variant's price is the
// Phase 4 price authority; legacy lines use the product price
// exactly as before.
export function lineUnitPrice(item) {
  return (
    item?.variantDetails?.price ??
    item?.unitPrice ??
    item?.product?.salePrice ??
    item?.product?.price ??
    0
  );
}
