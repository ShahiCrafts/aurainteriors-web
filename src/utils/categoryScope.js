// Post-delivery fix (catalog) — department scoping for the
// CATEGORIES filter group. The group used to flatten the WHOLE
// category tree into one checkbox list, whatever page the
// shopper was on. It now offers only the level the shopper is
// browsing:
//
//   no selection            -> the root categories
//   one category selected   -> its children (a leaf offers its
//                              siblings, itself included)
//   siblings selected       -> their shared parent's children
//   anything else (mixed    -> the root categories
//   parents, stale slugs)
//
// Toggle semantics keep drill-in narrowing: selecting a node
// subsumes any selected ancestors AND descendants of it, so
// picking a subcategory replaces the department selection
// instead of unioning with it, and re-selecting a department
// drops the subcategory picks beneath it. Sibling multi-select
// within one department is untouched. Pure functions over the
// tree the panel already receives — no extra fetch.

const childrenOf = (category) =>
  category?.subcategories?.length
    ? category.subcategories
    : category?.children || [];

// slug -> { node, parentSlug, ancestors (root-first, excluding
// self), descendants (every depth, excluding self) }
export function indexCategoryTree(categories) {
  const index = new Map();
  const walk = (nodes, parentSlug, ancestors) => {
    const subtree = [];
    for (const node of Array.isArray(nodes) ? nodes : []) {
      if (!node || typeof node !== "object" || !node.slug) continue;
      const descendants = walk(childrenOf(node), node.slug, [
        ...ancestors,
        node.slug,
      ]);
      if (!index.has(node.slug)) {
        index.set(node.slug, { node, parentSlug, ancestors, descendants });
      }
      subtree.push(node.slug, ...descendants);
    }
    return subtree;
  };
  walk(categories, null, []);
  return index;
}

// The category nodes the CATEGORIES group should offer for the
// current selection (see the rules at the top of this file).
export function categoryScopeOptions(categories, selectedSlugs = []) {
  const roots = Array.isArray(categories) ? categories : [];
  const index = indexCategoryTree(roots);
  const known = [...new Set(selectedSlugs || [])].filter((slug) =>
    index.has(slug)
  );
  if (known.length === 0) return roots;

  if (known.length === 1) {
    const entry = index.get(known[0]);
    const children = childrenOf(entry.node);
    if (children.length > 0) return children;
    // Leaf: stay at its level — the parent's children, itself
    // included; a root leaf's siblings are the roots.
    return entry.parentSlug
      ? childrenOf(index.get(entry.parentSlug).node)
      : roots;
  }

  const parents = new Set(
    known.map((slug) => index.get(slug).parentSlug)
  );
  if (parents.size === 1) {
    const [parentSlug] = parents;
    return parentSlug ? childrenOf(index.get(parentSlug).node) : roots;
  }
  return roots;
}

// The next selection after toggling `slug`: OFF removes just it;
// ON adds it and drops every selected ancestor and descendant of
// it (they are subsumed by the new pick). Unknown slugs (no tree
// knowledge) toggle plainly.
export function categoryToggleSelection(categories, selectedSlugs = [], slug) {
  const selected = [...(selectedSlugs || [])];
  if (selected.includes(slug)) {
    return selected.filter((item) => item !== slug);
  }
  const entry = indexCategoryTree(categories).get(slug);
  if (!entry) return [...selected, slug];
  const subsumed = new Set([...entry.ancestors, ...entry.descendants]);
  return [...selected.filter((item) => !subsumed.has(item)), slug];
}
