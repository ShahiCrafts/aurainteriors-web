// Canonical category navigation uses the public products listing and its filters.
export function selectedCategorySlugs(params) {
  return [...new Set(params.getAll("categories").flatMap((value) => value.split(",")).map((value) => value.trim()).filter(Boolean))];
}

export function shopCategoryUrl(slug, search = "", hash = "") {
  const params = new URLSearchParams(search);
  if (slug) params.set("categories", slug);
  else params.delete("categories");
  const query = params.toString();
  return `/shop${query ? `?${query}` : ""}${hash}`;
}

export function findShopCategory(categories, slug, parent = null) {
  for (const category of Array.isArray(categories) ? categories : []) {
    if (!category || typeof category !== "object") continue;
    if (category.slug === slug) return { ...category, parent: category.parent && typeof category.parent === "object" && category.parent.slug ? category.parent : parent };
    const children = category.subcategories?.length ? category.subcategories : category.children;
    const match = findShopCategory(children, slug, category);
    if (match) return match;
  }
  return null;
}

// Phase 7 (catalog) — the full ancestor chain for a slug,
// root-first and including the category itself, for breadcrumbs
// and listing headers. Empty when the slug is unknown.
export function findCategoryChain(categories, slug) {
  for (const category of Array.isArray(categories) ? categories : []) {
    if (!category || typeof category !== "object") continue;
    if (category.slug === slug) return [category];
    const children = category.subcategories?.length ? category.subcategories : category.children;
    const rest = findCategoryChain(children, slug);
    if (rest.length > 0) return [category, ...rest];
  }
  return [];
}
