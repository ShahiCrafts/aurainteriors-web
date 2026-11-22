// Homepage section ordering (Batch 3b). The canonical section keys
// in their original render order; HomePage maps keys to components.
export const HOME_SECTION_KEYS = [
  "hero",
  "trustBanner",
  "shopByCategory",
  "featuredPieces",
  "testimonials",
];

// Ordered, enabled section keys for a homepage settings object:
// the admin's sectionsOrder first (unknown/duplicate keys dropped),
// any known section the order forgot appended in canonical order,
// and sections whose flag is false removed. Defaults in → the
// canonical order out, which is the composition HomePage has always
// rendered.
export function orderedHomeSections(homepage) {
  const flags = homepage?.sections || {};
  const requested = Array.isArray(homepage?.sectionsOrder)
    ? homepage.sectionsOrder
    : [];
  const seen = new Set();
  const order = [];
  for (const key of [...requested, ...HOME_SECTION_KEYS]) {
    if (!HOME_SECTION_KEYS.includes(key) || seen.has(key)) continue;
    seen.add(key);
    if (flags[key] === false) continue;
    order.push(key);
  }
  return order;
}
