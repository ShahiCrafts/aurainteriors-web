// Phase 7 (catalog) — URL <-> listing-state plumbing for the
// storefront listing engine. The URL is the single source of truth
// for every filter (the ShopPage architecture since the owner's
// storefront-fix pass); this module owns the Phase 5 facet grammar
// on top of it:
//
//   attr.<key>=v1,v2          OR within the attribute
//   attr.<key>.min / .max     range bounds (numeric definitions)
//   room=a,b                  room dimension (comma list)
//   collection=<slug>         collection dimension
//   inStock=true              availability
//   categories=a,b            category slugs (shopFilters.js)
//   minPrice / maxPrice       effective-price range
//   rating                    minRating threshold (client spelling)
//   sort                      client sort token (apiSortFor maps it)
//   page                      1-based page
//
// Everything here is pure: parse a URLSearchParams, build patch
// objects for the pages' updateFilters(patch) setter, and build the
// GET /products parameter object the API layer sends.

import { formatNPR } from "./formatCurrency";
import { colorSwatchHex } from "./colorSwatches";

export const ATTR_PARAM_PATTERN = /^attr\.([A-Za-z0-9_]+)(?:\.(min|max))?$/;

// Client sort token -> server `sort` allowlist value. The Phase 5
// effective-price tokens sort variant products by priceFrom ?? price
// instead of the stored Product.price.
export function apiSortFor(sortToken) {
  switch (sortToken) {
    case "newest":
      return "-createdAt";
    case "price_low":
      return "price";
    case "price_high":
      return "-price";
    case "effective_price_low":
      return "effectivePriceAsc";
    case "effective_price_high":
      return "effectivePriceDesc";
    case "rating":
      return "-rating.average";
    case "featured":
    default:
      return "-isFeatured,-createdAt";
  }
}

const splitList = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

// attr.* selection parsed from the URL:
// { [key]: { values: string[], min: string|null, max: string|null } }
export function parseAttrSelection(searchParams) {
  const selection = {};
  if (!searchParams) return selection;
  for (const [rawKey, rawValue] of searchParams.entries()) {
    const match = ATTR_PARAM_PATTERN.exec(rawKey);
    if (!match) continue;
    const [, key, bound] = match;
    if (!selection[key]) selection[key] = { values: [], min: null, max: null };
    if (bound === "min" || bound === "max") {
      selection[key][bound] = rawValue === "" ? null : rawValue;
    } else {
      selection[key].values = splitList(rawValue);
    }
  }
  return selection;
}

// Every attr.* key present in the URL (for clear-all / reset).
export function attrParamKeys(searchParams) {
  const keys = [];
  if (!searchParams) return keys;
  for (const rawKey of searchParams.keys()) {
    if (ATTR_PARAM_PATTERN.test(rawKey)) keys.push(rawKey);
  }
  return [...new Set(keys)];
}

export function selectedRooms(searchParams) {
  if (!searchParams) return [];
  return [...new Set(splitList(searchParams.get("room")))];
}

// Patch (for updateFilters) toggling ONE value of an attr facet.
export function attrValuePatch(selection, key, value) {
  const current = selection?.[key]?.values || [];
  const next = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
  return { [`attr.${key}`]: next.length > 0 ? next.join(",") : null };
}

// Patch setting/clearing ONE value without toggling (chip removal).
export function attrValueRemovePatch(selection, key, value) {
  const current = selection?.[key]?.values || [];
  const next = current.filter((item) => item !== value);
  return { [`attr.${key}`]: next.length > 0 ? next.join(",") : null };
}

// Patch setting an attr range; empty bounds clear that side.
export function attrRangePatch(key, min, max) {
  return {
    [`attr.${key}.min`]: min === "" || min === null || min === undefined ? null : String(min),
    [`attr.${key}.max`]: max === "" || max === null || max === undefined ? null : String(max),
  };
}

export function roomTogglePatch(rooms, slug) {
  const next = rooms.includes(slug)
    ? rooms.filter((item) => item !== slug)
    : [...rooms, slug];
  return { room: next.length > 0 ? next.join(",") : null };
}

// Builds the GET /products params for one listing request. `pinned`
// carries route-pinned dimensions for the room/collection pages
// ({ room: slug } / { collection: slug }) which never live in the
// URL; a URL value wins when both exist so shared links stay honest.
export function buildListingParams({ searchParams, page = 1, limit = 12, pinned = {} }) {
  const params = { page, limit, status: "active", facets: "1" };

  const search = searchParams.get("search");
  if (search) params.search = search;

  params.sort = apiSortFor(searchParams.get("sort") || "featured");

  const categories = searchParams.get("categories");
  if (categories) params.categories = categories;

  const minPrice = Number(searchParams.get("minPrice"));
  if (minPrice > 0) params.minPrice = minPrice;
  const maxPrice = Number(searchParams.get("maxPrice"));
  if (maxPrice > 0) params.maxPrice = maxPrice;

  const colors = searchParams.get("colors");
  if (colors) params.colors = colors;
  const materials = searchParams.get("materials");
  if (materials) params.materials = materials;

  const rating = Number(searchParams.get("rating"));
  if (rating > 0) params.minRating = rating;

  if (searchParams.get("inStock") === "true") params.inStock = "true";

  const room = searchParams.get("room") || pinned.room;
  if (room) params.room = room;

  const collection = searchParams.get("collection") || pinned.collection;
  if (collection) params.collection = collection;

  // Facet grammar passes through verbatim — the server owns
  // validation and names bad keys in its 400s.
  for (const rawKey of attrParamKeys(searchParams)) {
    params[rawKey] = searchParams.get(rawKey);
  }

  return params;
}

// A patch that clears EVERY user-facing filter (pinned route
// dimensions are not in the URL and are never touched).
export function clearAllFiltersPatch(searchParams) {
  const patch = {
    categories: null,
    minPrice: null,
    maxPrice: null,
    colors: null,
    materials: null,
    rating: null,
    room: null,
    inStock: null,
    collection: null,
    page: null,
  };
  for (const rawKey of attrParamKeys(searchParams)) patch[rawKey] = null;
  return patch;
}

// Selected-filter chips for the listing toolbar. `labels` resolves
// slugs/keys to human names from the data the page already has:
// { categories: Map(slug->name), rooms: Map(slug->label),
//   attributes: Map(key->{label}) , collections: Map(slug->label) }.
// Each chip carries the updateFilters patch that removes ONLY it.
export function buildFilterChips(searchParams, labels = {}) {
  const chips = [];
  const categoryNames = labels.categories || new Map();
  const roomNames = labels.rooms || new Map();
  const attributeLabels = labels.attributes || new Map();
  const collectionNames = labels.collections || new Map();

  const categories = [...new Set(splitList(searchParams.get("categories")))];
  for (const slug of categories) {
    chips.push({
      id: `category:${slug}`,
      label: categoryNames.get(slug) || slug,
      patch: {
        categories:
          categories.filter((item) => item !== slug).join(",") || null,
      },
    });
  }

  const rooms = selectedRooms(searchParams);
  for (const slug of rooms) {
    chips.push({
      id: `room:${slug}`,
      label: roomNames.get(slug) || slug,
      patch: {
        room: rooms.filter((item) => item !== slug).join(",") || null,
      },
    });
  }

  const collection = searchParams.get("collection");
  if (collection) {
    chips.push({
      id: `collection:${collection}`,
      label: collectionNames.get(collection) || collection,
      patch: { collection: null },
    });
  }

  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  if (minPrice || maxPrice) {
    const min = minPrice ? Number(minPrice) : null;
    const max = maxPrice ? Number(maxPrice) : null;
    chips.push({
      id: "price",
      kind: "price",
      label:
        min !== null && max !== null
          ? `Price ${formatNPR(min)} – ${formatNPR(max)}`
          : min !== null
            ? `Price from ${formatNPR(min)}`
            : `Price up to ${formatNPR(max)}`,
      patch: { minPrice: null, maxPrice: null },
    });
  }

  if (searchParams.get("inStock") === "true") {
    chips.push({
      id: "inStock",
      label: "In stock",
      patch: { inStock: null },
    });
  }

  const rating = Number(searchParams.get("rating"));
  if (rating > 0) {
    // The star itself is an icon in the chip UI; the label is text.
    chips.push({ id: "rating", kind: "rating", label: `${rating} & up`, patch: { rating: null } });
  }

  for (const name of splitList(searchParams.get("colors"))) {
    const all = splitList(searchParams.get("colors"));
    chips.push({
      id: `colors:${name}`,
      kind: "color",
      swatch: colorSwatchHex(name),
      label: name,
      patch: { colors: all.filter((item) => item !== name).join(",") || null },
    });
  }
  for (const name of splitList(searchParams.get("materials"))) {
    const all = splitList(searchParams.get("materials"));
    chips.push({
      id: `materials:${name}`,
      label: name,
      patch: { materials: all.filter((item) => item !== name).join(",") || null },
    });
  }

  const selection = parseAttrSelection(searchParams);
  for (const [key, entry] of Object.entries(selection)) {
    const meta = attributeLabels.get(key) || {};
    const label = meta.label || key;
    for (const value of entry.values) {
      const chip = {
        id: `attr:${key}:${value}`,
        label: `${label}: ${value}`,
        patch: attrValueRemovePatch(selection, key, value),
      };
      if (meta.type === "color") {
        chip.kind = "color";
        chip.swatch = colorSwatchHex(value);
      }
      chips.push(chip);
    }
    if (entry.min !== null || entry.max !== null) {
      const formatBound = (value) => {
        if (value === null || value === undefined) return null;
        if (meta.type === "money") return formatNPR(Number(value));
        return meta.unit ? `${value} ${meta.unit}` : `${value}`;
      };
      const lo = formatBound(entry.min);
      const hi = formatBound(entry.max);
      chips.push({
        id: `attr-range:${key}`,
        kind: "range",
        label:
          lo !== null && hi !== null
            ? `${label}: ${lo} – ${hi}`
            : lo !== null
              ? `${label}: from ${lo}`
              : `${label}: up to ${hi}`,
        patch: attrRangePatch(key, null, null),
      });
    }
  }

  return chips;
}

// Count of active user-facing filters (mobile filter-button badge).
export function countActiveFilters(searchParams, { pinned = {} } = {}) {
  let count = buildFilterChips(searchParams).length;
  // A chip's patch is the unit the badge has always counted by
  // (one per selected value); pinned dimensions are context, not
  // filters, so they never inflate the badge.
  void pinned;
  return count;
}

// The colors/materials attribute facets are NOT rendered as facet
// sections — the legacy Colors/Materials sections in
// FilterSidebar drive those same fields (the server treats both
// spellings as one facet).
export const LEGACY_FACET_KEYS = new Set(["colors", "materials"]);

// Post-delivery fix (catalog) — an attribute facet group renders
// ONLY when it offers at least one selectable option in the
// current payload, or when its filter is active in the URL (the
// shopper must be able to see and clear an applied filter even
// when the disjunctive payload comes back empty for it). Value-
// list facets (enum / multi-enum / string / color / boolean)
// need a non-empty options list; range facets (integer / decimal
// / measurement / money) need a usable bound — a finite numeric
// option value, mirroring how RangeFacet derives its bounds, or
// numeric min/max fields on the facet itself.
const RANGE_FACET_TYPES = new Set(["integer", "decimal", "measurement", "money"]);

function facetEntryActive(entry) {
  return Boolean(
    entry &&
      ((entry.values || []).length > 0 ||
        entry.min !== null && entry.min !== undefined ||
        entry.max !== null && entry.max !== undefined)
  );
}

function facetHasOptions(facet) {
  if (RANGE_FACET_TYPES.has(facet.type)) {
    const hasNumericOption = (facet.options || []).some(
      (option) =>
        option.value !== null &&
        option.value !== undefined &&
        option.value !== "" &&
        Number.isFinite(Number(option.value))
    );
    if (hasNumericOption) return true;
    return [facet.min, facet.max].some(
      (bound) => typeof bound === "number" && Number.isFinite(bound)
    );
  }
  return (facet.options || []).length > 0;
}

export function facetGroupVisible(facet, entry) {
  if (!facet) return false;
  return facetHasOptions(facet) || facetEntryActive(entry);
}

// Whether the facets payload carries any facet section worth
// rendering (room unless hidden, availability, or a non-legacy
// attribute facet that passes facetGroupVisible for the current
// selection).
export function hasFacetSections(facets, { hideRoom = false, selection = {} } = {}) {
  if (!facets) return false;
  if (!hideRoom && (facets.room?.options || []).length > 0) return true;
  if ((facets.availability?.options || []).length > 0) return true;
  return (facets.attributes || []).some(
    (facet) =>
      !LEGACY_FACET_KEYS.has(facet.key) &&
      facetGroupVisible(facet, selection[facet.key])
  );
}
