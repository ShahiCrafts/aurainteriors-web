// Phase 7 (catalog) — the product page variant selector. Option
// groups come from the product's variantOptionKeys with labels
// from the catalog schema; the per-value states come from
// utils/variantSelection (the same-variant rule in UI form):
//   - a value forming NO enabled combination with the other
//     selected options is disabled ("combination unavailable")
//   - a value whose combinations are all out of stock is
//     disabled with out-of-stock styling
// The parent owns the selection; this component only renders
// and reports changes.
import {
  optionValueStates,
  findVariantBySelection,
} from "../../utils/variantSelection";

export default function VariantSelector({
  product,
  definitions = {},
  selection = {},
  onSelectionChange,
}) {
  const axes = product?.variantOptionKeys || [];
  if (axes.length === 0) return null;
  const states = optionValueStates(product, selection);
  const matched = findVariantBySelection(product, selection);

  return (
    <div className="mb-5 space-y-5">
      {axes.map((key) => {
        const definition = definitions[key];
        const label = definition?.label || key;
        const values = states[key] || [];
        const hasOutOfStock = values.some(
          (entry) => entry.exists && !entry.purchasable,
        );
        const hasUnavailable = values.some((entry) => !entry.exists);
        return (
          <div key={key}>
            <h3 className="text-[15px] font-semibold text-black/80 mb-3">
              {label}:{" "}
              <span className="font-bold text-[#1A1714]">
                {selection[key] ?? ""}
              </span>
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {values.map((entry) => {
                const disabled = !entry.exists || !entry.purchasable;
                const reason = !entry.exists
                  ? "Unavailable in this combination"
                  : !entry.purchasable
                    ? "Out of stock"
                    : undefined;
                return (
                  <button
                    key={entry.value}
                    type="button"
                    disabled={disabled}
                    title={reason}
                    aria-pressed={entry.selected}
                    onClick={() =>
                      onSelectionChange({ ...selection, [key]: entry.value })
                    }
                    className={`px-4 py-2.5 rounded-lg border text-[14px] font-semibold transition-all ${
                      entry.selected
                        ? "border-[#F27318] bg-[#F27318]/[0.08] text-[#1A1714]"
                        : "border-black/10 bg-white text-black/70 hover:border-black/30"
                    } ${
                      disabled
                        ? "opacity-45 cursor-not-allowed line-through decoration-black/40 hover:border-black/10"
                        : ""
                    }`}
                  >
                    {entry.value}
                  </button>
                );
              })}
            </div>
            {(hasOutOfStock || hasUnavailable) && (
              <p className="mt-2 text-[12px] text-black/40">
                {hasOutOfStock && "Some options are out of stock. "}
                {hasUnavailable && "Some combinations are unavailable."}
              </p>
            )}
          </div>
        );
      })}
      {matched && (
        <p className="text-[13px] text-black/40">
          SKU:{" "}
          <span className="font-semibold text-black/60">{matched.sku}</span>
        </p>
      )}
    </div>
  );
}
