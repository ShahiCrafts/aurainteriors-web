// Storefront color names → representative swatch hex. One list for
// every place a color is painted: the sidebar Colors filter (which
// offers exactly the first six) and the active-filter chips (which
// resolve whatever name a facet or the Colors filter produced).
// A value that is already a hex paints itself; an unknown name
// resolves to null and callers render no swatch rather than a
// wrong color.
export const COLOR_SWATCHES = [
  { name: "Black", hex: "#1a1a1a" },
  { name: "Brown", hex: "#8b4513" },
  { name: "Beige", hex: "#d2b48c" },
  { name: "Teal", hex: "#0d9488" },
  { name: "Green", hex: "#22c55e" },
  { name: "Navy", hex: "#1e3a5f" },
  { name: "White", hex: "#ffffff" },
  { name: "Grey", hex: "#6b7280" },
  { name: "Gray", hex: "#6b7280" },
  { name: "Charcoal", hex: "#36454f" },
  { name: "Sand", hex: "#d6cfc2" },
  { name: "Cream", hex: "#f3ead8" },
  { name: "Ivory", hex: "#f3ead8" },
  { name: "Sage Green", hex: "#a8b5a0" },
  { name: "Terracotta", hex: "#c96f4a" },
  { name: "Rust", hex: "#b7410e" },
  { name: "Red", hex: "#c0392b" },
  { name: "Blue", hex: "#3b82c4" },
  { name: "Pink", hex: "#e8a2b8" },
  { name: "Yellow", hex: "#eab308" },
  { name: "Orange", hex: "#f97316" },
  { name: "Purple", hex: "#7e57c2" },
  { name: "Gold", hex: "#c9a227" },
  { name: "Silver", hex: "#c0c0c0" },
  { name: "Walnut", hex: "#6f4e37" },
  { name: "Natural Oak", hex: "#c8a876" },
  { name: "Oak", hex: "#c8a876" },
];

const HEX_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function colorSwatchHex(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (HEX_PATTERN.test(trimmed)) return trimmed;
  const hit = COLOR_SWATCHES.find(
    (entry) => entry.name.toLowerCase() === trimmed.toLowerCase(),
  );
  return hit ? hit.hex : null;
}
