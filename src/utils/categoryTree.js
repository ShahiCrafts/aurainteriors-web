// Phase 6 (catalog) — pure helpers behind the admin category tree.
//
// The admin works from the FLAT category list (GET /categories):
// unlike the public tree endpoint it includes inactive categories,
// and every row carries its parent link + direct `productCount`
// virtual, which is everything needed to build the hierarchy and
// roll counts up client-side.

export const categoryParentId = (category) => {
  const parent = category?.parent;
  if (!parent) return null;
  if (typeof parent === "object") return parent._id ? String(parent._id) : null;
  return String(parent);
};

const bySortOrderThenName = (a, b) =>
  (a.sortOrder || 0) - (b.sortOrder || 0) ||
  String(a.name || "").localeCompare(String(b.name || ""));

// Builds root nodes with `children` arrays (arbitrary depth).
// Categories whose parent is missing from the list (orphans — e.g.
// the parent is filtered out) surface at root level rather than
// being dropped: an admin must be able to see and fix them.
export function buildCategoryTree(categories = []) {
  const nodes = new Map(
    categories.map((category) => [
      String(category._id),
      { ...category, children: [] },
    ]),
  );
  const roots = [];
  for (const category of categories) {
    const node = nodes.get(String(category._id));
    const parentId = categoryParentId(category);
    const parent = parentId ? nodes.get(parentId) : null;
    if (parent && parent !== node) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const sortDeep = (list) => {
    list.sort(bySortOrderThenName);
    list.forEach((node) => sortDeep(node.children));
  };
  sortDeep(roots);
  return roots;
}

// Direct productCount + every descendant's, i.e. the subtree total
// the admin tree displays (the storefront tree endpoint reports
// the same rollup server-side).
export function subtreeProductCount(node) {
  if (!node) return 0;
  return (
    (node.productCount || 0) +
    (node.children || []).reduce(
      (sum, child) => sum + subtreeProductCount(child),
      0,
    )
  );
}

// Ids of every category strictly below `id` in the hierarchy —
// the set a parent picker must exclude (together with `id` itself)
// so the UI never offers a cycle. The server rejects cycles too;
// this keeps the invalid choice unrepresentable.
export function descendantIdSet(categories = [], id) {
  const childrenByParent = new Map();
  for (const category of categories) {
    const parentId = categoryParentId(category);
    if (parentId) {
      if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
      childrenByParent.get(parentId).push(String(category._id));
    }
  }
  const out = new Set();
  const queue = [String(id)];
  while (queue.length > 0) {
    const current = queue.shift();
    for (const childId of childrenByParent.get(current) || []) {
      if (!out.has(childId)) {
        out.add(childId);
        queue.push(childId);
      }
    }
  }
  return out;
}

// Flattens a built tree into render rows, skipping the children of
// collapsed nodes. `expandedIds` is a Set of category ids.
export function flattenVisibleTree(roots = [], expandedIds = new Set()) {
  const rows = [];
  const walk = (nodes, depth) => {
    for (const node of nodes) {
      const hasChildren = (node.children || []).length > 0;
      const isExpanded = expandedIds.has(String(node._id));
      rows.push({ category: node, depth, hasChildren, isExpanded });
      if (hasChildren && isExpanded) walk(node.children, depth + 1);
    }
  };
  walk(roots, 0);
  return rows;
}

// Returns a NEW sibling id list with `id` swapped one step in
// `direction` (-1 = up, +1 = down); unchanged at the edges. The
// result is what POST /categories/reorder persists as sortOrder.
export function moveIdWithinSiblings(ids = [], id, direction) {
  const index = ids.indexOf(id);
  if (index === -1) return [...ids];
  const target = index + direction;
  if (target < 0 || target >= ids.length) return [...ids];
  const next = [...ids];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
