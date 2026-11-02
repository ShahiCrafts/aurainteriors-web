import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ChevronDown,
  Grid3X3,
  List,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import ProductCard from "./ProductCard";
import Dialog from "../ui/Dialog";
import { FilterSidebarSkeleton, ListingGridSkeleton } from "../common/Skeleton";
import FilterSidebar from "./FilterSidebar";
import { FilterChips } from "./FacetFilters";

import { useCategoryTree } from "../../hooks/product/useCategoryTan";
import {
  selectedCategorySlugs,
  shopCategoryUrl,
  findShopCategory,
  findCategoryChain,
} from "../../utils/shopFilters";
import {
  parseAttrSelection,
  attrValuePatch,
  attrRangePatch,
  selectedRooms,
  roomTogglePatch,
  buildListingParams,
  clearAllFiltersPatch,
  buildFilterChips,
} from "../../utils/catalogListing";
import { getCategoryImageUrl } from "../../utils/imageUrl";
import { useProductPages } from "../../hooks/product/useProductTan";

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "effective_price_low", label: "Effective Price: Low to High" },
  { value: "effective_price_high", label: "Effective Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
];

const DEFAULT_PRICE_BOUNDS = { min: 0, max: 500000 };

export default function CatalogListing({
  pinned = {},
  crumbPrefix = [],
  header = null,
  title = null,
  showCategoryIntro = true,
}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const [viewMode, setViewMode] = useState("grid");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const limit = 12;

  const searchQuery = searchParams.get("search") || "";
  const sortBy = searchParams.get("sort") || "featured";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const selectedCategories = selectedCategorySlugs(searchParams);
  const selectedPrice = {
    min: Number(searchParams.get("minPrice")) || 0,
    max: Number(searchParams.get("maxPrice")) || DEFAULT_PRICE_BOUNDS.max,
  };
  const selectedColors =
    searchParams.get("colors")?.split(",").filter(Boolean) || [];
  const selectedMaterials =
    searchParams.get("materials")?.split(",").filter(Boolean) || [];
  const selectedRating = Number(searchParams.get("rating")) || 0;
  const attrSelection = parseAttrSelection(searchParams);
  const rooms = selectedRooms(searchParams);
  const inStockOnly = searchParams.get("inStock") === "true";

  const updateFilters = (patch, replace = false) => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (!Object.prototype.hasOwnProperty.call(patch, "page")) {
          next.delete("page");
        }
        Object.entries(patch).forEach(([key, value]) => {
          next.delete(key);
          if (value !== "" && value !== null && value !== undefined) {
            next.set(key, String(value));
          }
        });
        return next;
      },
      { replace },
    );
  };

  const setSortBy = (value) =>
    updateFilters({ sort: value === "featured" ? null : value });
  const setSelectedCategories = (values) =>
    updateFilters({ categories: values.join(",") });
  const setSelectedColors = (values) =>
    updateFilters({ colors: values.join(",") });
  const setSelectedMaterials = (values) =>
    updateFilters({ materials: values.join(",") });
  const setSelectedRating = (value) =>
    updateFilters({ rating: value > 0 ? value : null });
  const handleAttrToggle = (key, value) =>
    updateFilters(attrValuePatch(attrSelection, key, value));
  const handleAttrRange = (key, min, max) =>
    updateFilters(attrRangePatch(key, min, max));
  const handleRoomToggle = (slug) =>
    updateFilters(roomTogglePatch(rooms, slug));
  const handleInStockToggle = () =>
    updateFilters({ inStock: inStockOnly ? null : "true" });

  const { data: categoryTreeData, isLoading: isCategoryTreeLoading } =
    useCategoryTree();
  const categories = categoryTreeData?.data?.categories || [];
  const currentCategory =
    selectedCategories.length === 1
      ? findShopCategory(categories, selectedCategories[0])
      : null;
  const categoryChain =
    selectedCategories.length === 1
      ? findCategoryChain(categories, selectedCategories[0])
      : [];

  // Load More: the `page` URL param now means "how many batches are
  // loaded". Each batch is fetched (and cached) as its own server
  // page, then flattened in order and deduped — the server caps a
  // single request at 100 items, so one growing-limit request would
  // silently stall. Filter changes delete `page` (see updateFilters),
  // which resets the listing to the first batch.
  const baseParams = buildListingParams({
    searchParams,
    page: 1,
    limit,
    pinned,
  });
  const pageResults = useProductPages(baseParams, Math.min(page, 25));
  const seenIds = new Set();
  const products = [];
  for (const result of pageResults) {
    for (const item of result.data?.data?.products || []) {
      if (!seenIds.has(item._id)) {
        seenIds.add(item._id);
        products.push(item);
      }
    }
  }
  const listingData = pageResults.find((result) => result.data)?.data?.data;
  const facets = listingData?.facets || null;
  const pagination = listingData?.pagination || {
    page: 1,
    limit: 12,
    total: 0,
    pages: 1,
  };
  const totalProducts = pagination.total;
  const isProductsLoading = pageResults[0]?.isLoading ?? true;
  const isFetchingAny = pageResults.some((result) => result.isFetching);
  const hasMore = products.length < totalProducts;

  const priceBounds = facets?.price
    ? {
      min: facets.price.min ?? DEFAULT_PRICE_BOUNDS.min,
      max: facets.price.max ?? DEFAULT_PRICE_BOUNDS.max,
    }
    : DEFAULT_PRICE_BOUNDS;
  const setPriceRange = (value) =>
    updateFilters(
      {
        minPrice: value.min > priceBounds.min ? value.min : null,
        maxPrice: value.max < priceBounds.max ? value.max : null,
      },
      true,
    );

  useEffect(() => {
    document.body.style.overflow = showMobileFilters ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showMobileFilters]);

  const handleClearSearch = () => updateFilters({ search: null });

  const handleSortChange = (value) => {
    setSortBy(value);
    setShowSortDropdown(false);
  };

  const handleResetFilters = () =>
    updateFilters({
      ...clearAllFiltersPatch(searchParams),
      sort: null,
      search: null,
    });

  const handleClearFilters = () =>
    updateFilters(clearAllFiltersPatch(searchParams));

  const breadcrumbs = [
    { name: "Home", path: "/" },
    ...crumbPrefix,
    ...categoryChain.map((category) => ({
      name: category.name,
      path: shopCategoryUrl(category.slug),
    })),
  ];

  const pageTitle = title || currentCategory?.name || "All Products";
  const headingTitle = title || (currentCategory ? pageTitle : "Collection");

  const chipLabels = {
    categories: new Map(
      (function flatten(list) {
        return list.flatMap((category) => [
          [category.slug, category.name],
          ...flatten(category.subcategories || category.children || []),
        ]);
      })(categories),
    ),
    rooms: new Map(
      (facets?.room?.options || []).map((option) => [
        String(option.value),
        option.label || String(option.value),
      ]),
    ),
    attributes: new Map(
      (facets?.attributes || []).map((facet) => [
        facet.key,
        { label: facet.label, type: facet.type, unit: facet.unit },
      ]),
    ),
  };
  const chips = buildFilterChips(searchParams, chipLabels);
  const activeFilterCount = chips.length;

  const handleLoadMore = () => updateFilters({ page: page + 1 }, true);

  // Burst loader shared by the sentinel observer and the near-end
  // scroll check: three batches per trigger, fetched in parallel by
  // useProductPages, clamped to the last batch. Guarded so it never
  // fires while a fetch is in flight or past the end of the list.
  const loadNextBurst = () => {
    if (!hasMore || isFetchingAny || isProductsLoading) return;
    const lastBatch = Math.min(Math.ceil(totalProducts / limit), 25);
    updateFilters({ page: Math.min(page + 3, lastBatch) }, true);
  };

  // Infinite scroll: a sentinel just past the grid is watched by an
  // IntersectionObserver with a generous rootMargin, so the next
  // batch is fetched *before* the shopper reaches the bottom. The
  // effect re-subscribes whenever a batch settles — a fresh observe()
  // reports the sentinel's position immediately, which is what keeps
  // filling the page when the content is still shorter than the
  // prefetch zone. Guards: never fetch while a batch is in flight,
  // while the first batch is loading, or past the end of the list.
  const loadMoreRef = useRef(null);
  const supportsObserver = typeof IntersectionObserver !== "undefined";
  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !supportsObserver) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadNextBurst();
      },
      { rootMargin: "1600px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isFetchingAny, isProductsLoading, page, supportsObserver, totalProducts, limit]);

  useEffect(() => {
    let ticking = false;
    const checkNearEnd = () => {
      const remainingPx =
        document.documentElement.scrollHeight -
        (window.scrollY + window.innerHeight);
      if (remainingPx < 2400) loadNextBurst();
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        checkNearEnd();
      });
    };
    checkNearEnd();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [page, totalProducts, limit, hasMore, isFetchingAny, isProductsLoading]);

  const isLoading = isProductsLoading;

  const sidebar = (
    <FilterSidebar
      categories={categories}
      selectedCategories={selectedCategories}
      onCategoryChange={setSelectedCategories}
      priceRange={priceBounds}
      selectedPriceRange={selectedPrice}
      onPriceChange={setPriceRange}
      selectedColors={selectedColors}
      onColorChange={setSelectedColors}
      selectedMaterials={selectedMaterials}
      onMaterialChange={setSelectedMaterials}
      selectedRating={selectedRating}
      onRatingChange={setSelectedRating}
      onResetFilters={handleResetFilters}
      facets={facets}
      facetSelection={attrSelection}
      selectedRooms={rooms}
      inStockOnly={inStockOnly}
      hideRoomFacet={Boolean(pinned.room)}
      onAttrToggle={handleAttrToggle}
      onAttrRange={handleAttrRange}
      onRoomToggle={handleRoomToggle}
      onInStockToggle={handleInStockToggle}
    />
  );

  const breadcrumbNav = (className) => (
    <nav className={className}>
      {breadcrumbs.map((crumb, index) => (
        <div key={`${crumb.name}-${index}`} className="flex items-center gap-2">
          {index > 0 && <span className="text-black/10">/</span>}
          <Link
            to={crumb.path}
            className={`hover:text-brand transition-colors ${index === breadcrumbs.length - 1
              ? "text-black/60 font-semibold pointer-events-none"
              : ""
              }`}
          >
            {crumb.name}
          </Link>
        </div>
      ))}
    </nav>
  );

  const showIntro =
    showCategoryIntro &&
    currentCategory &&
    (currentCategory.description || currentCategory.image);

  return (
    <>
      {header}
      <div className="max-w-360 mx-auto px-4 sm:px-5 md:px-6 lg:px-4">
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8 lg:gap-12">
          <aside className="hidden lg:block lg:w-64 shrink-0">
            {breadcrumbNav(
              "flex items-center gap-2 text-[14px] font-medium text-black/40 mb-10 flex-wrap",
            )}
            <div className="sticky top-42">
              <div className="max-h-[calc(100vh-11.5rem)] overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:hidden">
                {isCategoryTreeLoading || isLoading ? (
                  <FilterSidebarSkeleton />
                ) : (
                  sidebar
                )}
              </div>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            {breadcrumbNav(
              "flex lg:hidden items-center gap-2 text-[13px] sm:text-[14px] font-medium text-black/40 mb-5 flex-wrap",
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-4">
                <h1 className="text-[20px] sm:text-[24px] md:text-[28px] font-semibold text-[#1A1714]">
                  {headingTitle}
                  <span className="ml-2 sm:ml-3 text-[13px] sm:text-[15px] font-semibold text-black/40 tracking-normal lowercase">
                    {isLoading ? (
                      <span
                        role="status"
                        aria-label="Loading product count"
                        className="inline-block align-middle h-lh w-20 sm:w-24 rounded bg-[#F0EFED] motion-safe:animate-pulse"
                      />
                    ) : (
                      `(${totalProducts} items)`
                    )}
                  </span>
                </h1>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="lg:hidden relative flex items-center gap-2 px-4 py-2.5 rounded-md border border-black/8 hover:border-brand bg-white text-[13px] sm:text-[14px] font-semibold text-[#1A1714] transition-all"
                >
                  <SlidersHorizontal size={16} className="text-black/40" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand text-white text-[10px] font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                    className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 rounded-md border border-black/8 hover:border-brand bg-white text-[13px] sm:text-[14px] font-semibold text-[#1A1714] transition-all"
                  >
                    <span className="hidden sm:inline text-black/40 font-medium">
                      Sort by:
                    </span>
                    <span className="truncate max-w-30 sm:max-w-none">
                      {SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-black/20 transition-transform duration-300 shrink-0 ${showSortDropdown ? "rotate-180" : ""
                        }`}
                    />
                  </button>

                  {showSortDropdown && (
                    <>
                      <button
                        type="button"
                        aria-label="Close sort menu"
                        className="fixed inset-0 z-40 cursor-default"
                        onClick={() => setShowSortDropdown(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-black/8 rounded-md shadow-[0_10px_30px_rgba(0,0,0,0.08)] z-50 py-1 overflow-hidden">
                        {SORT_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleSortChange(option.value)}
                            className={`w-full text-left px-5 py-3 text-[14px] font-medium transition-colors ${sortBy === option.value
                              ? "text-brand bg-brand/5"
                              : "text-[#1A1714] hover:bg-black/2"
                              }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center border border-black/8 rounded-md p-1 bg-white">
                  <button
                    onClick={() => setViewMode("grid")}
                    aria-label="Grid view"
                    className={`p-2 rounded-sm transition-all ${viewMode === "grid"
                      ? "bg-brand text-white shadow-sm"
                      : "text-black/30 hover:text-black/60"
                      }`}
                  >
                    <Grid3X3 size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    aria-label="List view"
                    className={`p-2 rounded-sm transition-all ${viewMode === "list"
                      ? "bg-brand text-white shadow-sm"
                      : "text-black/30 hover:text-black/60"
                      }`}
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>

            {searchQuery && (
              <div className="mb-5 flex items-center gap-2 text-sm text-[#7A7068]">
                <span>
                  Results for{" "}
                  <strong className="text-[#1A1714]">“{searchQuery}”</strong>
                </span>
                <button
                  type="button"
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                  className="inline-flex items-center gap-1 rounded-full border border-[#F0EFED] px-2.5 py-1 hover:text-brand"
                >
                  <X size={13} aria-hidden="true" /> Clear
                </button>
              </div>
            )}

            {showIntro && (
              <div className="mb-8">
                {(currentCategory.image || currentCategory.description) && (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    {currentCategory.image && (
                      <img
                        src={getCategoryImageUrl(currentCategory.image)}
                        alt={currentCategory.name}
                        className="h-24 w-full rounded-xl object-cover sm:w-40"
                        loading="lazy"
                      />
                    )}
                    {currentCategory.description && (
                      <p className="max-w-2xl text-[14px] leading-relaxed text-black/50">
                        {currentCategory.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {chips.length > 0 && (
              <div className="mb-5">
                <FilterChips
                  chips={chips}
                  onRemove={(chip) => updateFilters(chip.patch)}
                  onClearAll={handleClearFilters}
                />
              </div>
            )}

            {isLoading ? (
              <ListingGridSkeleton viewMode={viewMode} count={limit} />
            ) : products.length === 0 ? (
              <div className="text-center py-16 sm:py-24 bg-[#F9F8F6] rounded-2xl px-4">
                <Search size={32} className="mx-auto text-black/10 mb-4" />
                <h3 className="text-[16px] sm:text-[18px] font-bold text-[#1A1714]">
                  No products found
                </h3>
                <p className="text-black/40 text-[13px] sm:text-[14px] mt-1">
                  Try adjusting your filters.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-6 px-6 py-2 bg-[#1A1714] text-white rounded-lg text-[12px] font-bold"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <>
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6 md:gap-x-5 md:gap-y-8"
                      : "flex flex-col gap-4"
                  }
                >
                  {products.map((product) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      viewMode={viewMode}
                    />
                  ))}
                </div>

                {hasMore && (
                  <div ref={loadMoreRef} aria-hidden="true" className="h-px" />
                )}

                {hasMore && (
                  <div className="mt-6 md:mt-8">
                    <ListingGridSkeleton
                      viewMode={viewMode}
                      count={viewMode === "grid" ? Math.min(totalProducts - products.length, 48) : Math.min(totalProducts - products.length, 16)}
                    />
                  </div>
                )}

                {totalProducts > limit && hasMore && !supportsObserver && (
                  <div className="mt-12 sm:mt-16 pt-8 border-t border-black/3 flex justify-center">
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      disabled={isFetchingAny}
                      className="px-8 py-3 bg-[#1A1714] text-white rounded-lg text-[13px] font-bold transition-opacity disabled:opacity-50"
                    >
                      {isFetchingAny ? "Loading..." : "Load more"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 bg-black/40 cursor-default"
            onClick={() => setShowMobileFilters(false)}
          />
          <Dialog
            open
            onClose={() => setShowMobileFilters(false)}
            label="Filters"
            className="absolute right-0 top-0 h-full w-[88%] max-w-sm bg-white shadow-xl overflow-y-auto"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/6 sticky top-0 bg-white z-10">
              <h3 className="text-[16px] font-bold text-[#1A1714]">Filters</h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                aria-label="Close filters"
                className="p-2 rounded-full hover:bg-black/4 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              {isCategoryTreeLoading || isLoading ? (
                <FilterSidebarSkeleton />
              ) : (
                sidebar
              )}
            </div>
            <div className="sticky bottom-0 bg-white border-t border-black/6 p-4">
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-full py-3 bg-[#1A1714] text-white rounded-lg text-[13px] font-bold"
              >
                Show {totalProducts} results
              </button>
            </div>
          </Dialog>
        </div>
      )}
    </>
  );
}
