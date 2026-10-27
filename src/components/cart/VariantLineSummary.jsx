// Phase 7 (catalog) — SKU + option summary for a cart/order line
// that names a catalog variant (see utils/cartLine.js for where
// the identity comes from). Legacy lines render nothing.

const labelFor = (key) => key.charAt(0).toUpperCase() + key.slice(1);

export default function VariantLineSummary({ sku, options, className = "" }) {
  const entries = Object.entries(options || {}).filter(
    ([, value]) => value !== undefined && value !== null && value !== ""
  );
  if (!sku && entries.length === 0) return null;
  return (
    <div className={className}>
      {sku && <p>SKU {sku}</p>}
      {entries.length > 0 && (
        <p>
          {entries.map(([key, value]) => `${labelFor(key)}: ${value}`).join(" • ")}
        </p>
      )}
    </div>
  );
}
