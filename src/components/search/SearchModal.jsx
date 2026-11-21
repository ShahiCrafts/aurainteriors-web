import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  X,
  Clock,
  Sparkles,
  ArrowRight,
  LayoutGrid,
  Armchair,
  BedDouble,
  Lamp,
  UtensilsCrossed,
  ChefHat,
  Sofa,
  Leaf,
  Monitor,
} from "lucide-react";
import useDebounce from "../../hooks/useDebounce";
import { useProducts } from "../../hooks/product/useProductTan";
import { useCategoryTree } from "../../hooks/product/useCategoryTan";
import { getProductImageUrl } from "../../utils/imageUrl";
import { formatNPR } from "../../utils/formatCurrency";
import { shopCategoryUrl } from "../../utils/shopFilters";
import Rating from "../ui/Rating";
import BrandLoader from "../common/BrandLoader";

const RECENTS_KEY = "aura.recentSearches";
const MAX_RECENTS = 6;

const readRecents = () => {
  try {
    const raw = window.localStorage.getItem(RECENTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((item) => typeof item === "string")
      : [];
  } catch {
    return [];
  }
};

const categoryIconMap = {
  sofa: <Armchair size={19} />,
  bed: <BedDouble size={19} />,
  dining: <UtensilsCrossed size={19} />,
  living: <Sofa size={19} />,
  bedroom: <BedDouble size={19} />,
  kitchen: <ChefHat size={19} />,
  desk: <Monitor size={19} />,
  outdoor: <Leaf size={19} />,
  lighting: <Lamp size={19} />,
};

const getCategoryIcon = (categoryName) => {
  if (typeof categoryName !== "string") return <LayoutGrid size={19} />;
  const name = categoryName.toLowerCase();
  for (const [key, icon] of Object.entries(categoryIconMap)) {
    if (name.includes(key)) return icon;
  }
  return <LayoutGrid size={19} />;
};

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating-desc", label: "Top Rated" },
];

export default function SearchModal({ onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("products");
  const [sort, setSort] = useState("relevance");
  const [recents, setRecents] = useState(readRecents);

  const debouncedQuery = useDebounce(query, 300);
  const searching = debouncedQuery.trim().length >= 2;

  const { data: resultsData, isLoading: isResultsLoading } = useProducts(
    { search: debouncedQuery, limit: 20, status: "active" },
    { enabled: searching },
  );
  const { data: featuredData } = useProducts(
    { limit: 6, status: "active" },
    { enabled: !searching },
  );
  const { data: categoryTreeData } = useCategoryTree();
  const topCategories = useMemo(() => {
    const list = categoryTreeData?.data?.categories;
    return Array.isArray(list) ? list : [];
  }, [categoryTreeData]);

  const products = useMemo(
    () => resultsData?.data?.products || [],
    [resultsData],
  );
  const featuredProducts = useMemo(
    () => featuredData?.data?.products || [],
    [featuredData],
  );

  const allCategories = useMemo(() => {
    const flat = [];
    topCategories.forEach((category) => {
      flat.push(category);
      if (Array.isArray(category.subcategories)) {
        category.subcategories.forEach((sub) => flat.push(sub));
      }
    });
    return flat;
  }, [topCategories]);

  const matchedCategories = useMemo(() => {
    if (!searching) return topCategories;
    const q = debouncedQuery.trim().toLowerCase();
    return allCategories.filter((category) =>
      category.name?.toLowerCase().includes(q),
    );
  }, [searching, debouncedQuery, allCategories, topCategories]);

  const suggestions = useMemo(() => {
    if (!searching) {
      const fromFeatured = featuredProducts
        .map((product) => product.category?.name)
        .filter(Boolean);
      const popular = [...new Set(fromFeatured)];
      return popular.length > 0
        ? popular.slice(0, 5)
        : topCategories.slice(0, 5).map((category) => category.name);
    }
    const q = debouncedQuery.trim().toLowerCase();
    const found = new Set();
    matchedCategories.forEach((category) => found.add(category.name));
    products.forEach((product) => {
      const words = (product.name || "").split(/\s+/);
      words.forEach((word, index) => {
        if (word.toLowerCase().includes(q)) {
          const phrase = words
            .slice(Math.max(0, index - 1), index + 2)
            .join(" ")
            .trim();
          if (phrase.length > 2) found.add(phrase);
        }
      });
    });
    return [...found].slice(0, 5);
  }, [
    searching,
    debouncedQuery,
    matchedCategories,
    products,
    topCategories,
    featuredProducts,
  ]);

  const sortedProducts = useMemo(() => {
    const list = [...products];
    if (sort === "price-asc") list.sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sort === "price-desc") list.sort((a, b) => (b.price || 0) - (a.price || 0));
    if (sort === "rating-desc") {
      list.sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0));
    }
    return list;
  }, [products, sort]);

  // The popup is anchored to the navbar search bar — same left edge and
  // same width — so it exactly covers the bar behind it, whatever the
  // viewport size. Measured from the live element and re-measured on
  // resize. On mobile the bar is hidden, so there is no anchor and the
  // popup falls back to the centered layout.
  const [anchor, setAnchor] = useState(null);
  useEffect(() => {
    const measure = () => {
      const el = document.getElementById("navbar-search-anchor");
      const rect = el?.getBoundingClientRect();
      setAnchor(
        rect && rect.width > 0
          ? { left: rect.left, width: rect.width, top: rect.top }
          : null,
      );
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const saveRecent = (term) => {
    const value = term.trim();
    if (value.length < 2) return;
    const next = [
      value,
      ...recents.filter((item) => item.toLowerCase() !== value.toLowerCase()),
    ].slice(0, MAX_RECENTS);
    setRecents(next);
    try {
      window.localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
    } catch {
      // Storage unavailable (private mode) — recents just won't persist.
    }
  };

  const clearRecents = () => {
    setRecents([]);
    try {
      window.localStorage.removeItem(RECENTS_KEY);
    } catch {
      // Nothing to clear if storage is unavailable.
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    saveRecent(value);
    navigate(`/shop?search=${encodeURIComponent(value)}`);
    onClose();
  };

  const goToProduct = (product) => {
    saveRecent(debouncedQuery);
    navigate(`/product/${encodeURIComponent(product.slug)}`);
    onClose();
  };

  const goToCategory = (category) => {
    saveRecent(debouncedQuery);
    navigate(shopCategoryUrl(category.slug));
    onClose();
  };

  const runSuggestion = (term) => {
    setQuery(term);
    setActiveTab("products");
    inputRef.current?.focus();
  };

  const renderProductRow = (product) => {
    const ratingAverage = product.rating?.average || 0;
    const ratingCount = product.rating?.count || 0;
    return (
      <button
        key={product._id}
        type="button"
        onClick={() => goToProduct(product)}
        className="w-full flex items-center gap-4 px-3 py-3 rounded-[10px] hover:bg-[#F9F8F6] transition-colors bg-transparent border-none cursor-pointer text-left group"
      >
        <div className="w-14 h-14 rounded-[10px] overflow-hidden bg-[#F6F6F6] shrink-0 border border-[#F0EFED]">
          <img
            src={getProductImageUrl(product)}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[14.5px] font-bold text-[#1A1714] truncate">
            {product.name}
          </h4>
          <p className="text-[12px] text-[#8C8782] truncate mt-0.5">
            {product.category?.name}
          </p>
          {ratingAverage > 0 && ratingCount > 0 && (
            <div className="mt-1">
              <Rating value={ratingAverage} count={ratingCount} size="sm" />
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className="text-[15px] font-bold text-brand whitespace-nowrap">
            {formatNPR(product.price)}
          </span>
          <span className="text-[12px] font-semibold text-[#6A6058] border border-[#F0EFED] rounded-full px-3 py-1 group-hover:border-brand group-hover:text-brand transition-colors whitespace-nowrap">
            View Details →
          </span>
        </div>
      </button>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center px-3 md:px-6 pt-[4vh] md:pt-[7vh] font-dm-sans"
      role="dialog"
      aria-modal="true"
      aria-label="Search products"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        style={
          anchor
            ? {
                position: "fixed",
                left: anchor.left,
                width: anchor.width,
                top: Math.max(8, anchor.top - 18),
              }
            : undefined
        }
        className={`bg-white rounded-2xl shadow-[0_24px_70px_rgba(0,0,0,0.28)] animate-in fade-in zoom-in-95 duration-200 max-h-[90dvh] flex flex-col ${
          anchor ? "" : "relative w-full max-w-[560px]"
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close search"
          className="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.18)] border border-[#F0EFED] flex items-center justify-center text-[#1A1714] hover:text-brand cursor-pointer transition-colors"
        >
          <X size={17} />
        </button>

        <div className="p-4 md:p-5 pb-0">
          <form onSubmit={handleSubmit} className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search furniture, décor, colours…"
              aria-label="Search products"
              className="w-full py-3.5 pr-32 pl-11.5 border-[1.5px] border-neutral-300 rounded-[10px] bg-[#FAFAFA] font-sans text-[15px] text-[#1A1714] focus:outline-none transition-all duration-200 focus:border-brand focus:bg-white placeholder:text-[#B8B4AE]"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="p-1.5 text-[#B8B4AE] hover:text-[#1A1714] transition-colors bg-transparent border-none cursor-pointer"
                >
                  <X size={16} />
                </button>
              )}
              <button
                type="submit"
                className="bg-brand hover:bg-brand-hover text-white border-none rounded-lg px-5 py-2.25 font-sans text-[14px] font-semibold cursor-pointer transition-colors duration-200"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 px-4 md:px-5 py-4 space-y-5">
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Sparkles size={15} className="text-brand" />
              <h3 className="text-[14px] font-bold text-[#1A1714]">
                Suggestions
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.length > 0 ? (
                suggestions.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => runSuggestion(term)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAFAFA] border border-[#F0EFED] text-[13px] font-medium text-[#6A6058] hover:border-brand hover:text-brand cursor-pointer transition-colors"
                  >
                    <Search size={12} />
                    {term}
                  </button>
                ))
              ) : (
                <p className="text-[13px] text-[#8C8782]">
                  Start typing to see suggestions.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between mb-2 mt-5">
              <h3 className="text-[14px] font-bold text-[#1A1714]">
                Categories
              </h3>
              <Link
                to="/shop"
                onClick={onClose}
                className="text-[13px] font-semibold text-brand hover:text-brand-hover no-underline transition-colors"
              >
                View all →
              </Link>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {(searching ? matchedCategories : topCategories)
                .slice(0, 8)
                .map((category) => (
                  <button
                    key={category._id || category.slug}
                    type="button"
                    onClick={() => goToCategory(category)}
                    className="flex items-center gap-2.5 pl-1.5 pr-3.5 py-1.5 rounded-full border border-[#F0EFED] bg-white hover:border-brand transition-colors cursor-pointer shrink-0 group"
                  >
                    <span className="w-8 h-8 rounded-full bg-[#F9F8F6] flex items-center justify-center text-[#6A6058] group-hover:text-brand transition-colors shrink-0">
                      {getCategoryIcon(category.name)}
                    </span>
                    <span className="text-[13.5px] font-medium text-[#1A1714] whitespace-nowrap">
                      {category.name}
                    </span>
                    {typeof category.productCount === "number" && (
                      <span className="text-[12px] text-[#8C8782]">
                        {category.productCount}
                      </span>
                    )}
                  </button>
                ))}
              {searching && matchedCategories.length === 0 && (
                <p className="text-[13px] text-[#8C8782] px-1 py-2">
                  No categories match “{debouncedQuery.trim()}”.
                </p>
              )}
            </div>

          </div>

          <div>
            {searching ? (
              <>
                <div className="flex items-center justify-between gap-3 border-b border-[#F0EFED]">
                  <div className="flex items-center gap-5">
                    <button
                      type="button"
                      onClick={() => setActiveTab("products")}
                      className={`pb-2.5 text-[14px] font-semibold bg-transparent border-none cursor-pointer transition-colors ${
                        activeTab === "products"
                          ? "text-brand shadow-[inset_0_-2px_0_0_#F27318]"
                          : "text-[#6A6058] hover:text-[#1A1714]"
                      }`}
                    >
                      Products ({products.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("categories")}
                      className={`pb-2.5 text-[14px] font-semibold bg-transparent border-none cursor-pointer transition-colors ${
                        activeTab === "categories"
                          ? "text-brand shadow-[inset_0_-2px_0_0_#F27318]"
                          : "text-[#6A6058] hover:text-[#1A1714]"
                      }`}
                    >
                      Categories ({matchedCategories.length})
                    </button>
                  </div>
                  {activeTab === "products" && (
                    <label className="hidden sm:flex items-center gap-2 pb-2 text-[13px] text-[#6A6058]">
                      Sort by:
                      <select
                        value={sort}
                        onChange={(event) => setSort(event.target.value)}
                        aria-label="Sort search results"
                        className="border border-[#F0EFED] rounded-lg px-2 py-1.5 text-[13px] font-medium text-[#1A1714] bg-white focus:outline-none focus:border-brand cursor-pointer"
                      >
                        {SORT_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>

                {activeTab === "products" && (
                  <div className="pt-2">
                    {isResultsLoading ? (
                      <div className="flex justify-center py-12">
                        <BrandLoader size={72} />
                      </div>
                    ) : sortedProducts.length > 0 ? (
                      <>
                        {sortedProducts.map(renderProductRow)}
                        <button
                          type="button"
                          onClick={handleSubmit}
                          className="w-full mt-2 py-3 rounded-[10px] bg-[#FAFAFA] border border-[#F0EFED] text-[13.5px] font-bold text-[#1A1714] hover:text-brand cursor-pointer transition-colors"
                        >
                          See all results for “{debouncedQuery.trim()}”
                        </button>
                      </>
                    ) : (
                      <div className="py-12 text-center">
                        <div className="w-12 h-12 bg-[#F9F8F6] rounded-full flex items-center justify-center mx-auto mb-3">
                          <Search size={20} className="text-[#B8B4AE]" />
                        </div>
                        <p className="text-[14px] font-medium text-[#1A1714]">
                          No products found for “{debouncedQuery.trim()}”
                        </p>
                        <p className="text-[12.5px] text-[#8C8782] mt-1">
                          Try a different spelling or a more general word.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "categories" && (
                  <div className="pt-3 grid sm:grid-cols-2 gap-2">
                    {matchedCategories.length > 0 ? (
                      matchedCategories.map((category) => (
                        <button
                          key={category._id || category.slug}
                          type="button"
                          onClick={() => goToCategory(category)}
                          className="flex items-center gap-3 p-3 rounded-[10px] border border-[#F0EFED] hover:border-brand bg-white cursor-pointer text-left transition-colors group"
                        >
                          <span className="w-10 h-10 rounded-lg bg-[#F9F8F6] flex items-center justify-center text-[#6A6058] group-hover:text-brand transition-colors shrink-0">
                            {getCategoryIcon(category.name)}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-[14px] font-semibold text-[#1A1714] truncate">
                              {category.name}
                            </span>
                            {typeof category.productCount === "number" && (
                              <span className="block text-[12px] text-[#8C8782]">
                                {category.productCount} products
                              </span>
                            )}
                          </span>
                          <ArrowRight
                            size={16}
                            className="text-[#B8B4AE] group-hover:text-brand transition-colors shrink-0"
                          />
                        </button>
                      ))
                    ) : (
                      <p className="text-[13.5px] text-[#8C8782] py-8 text-center sm:col-span-2">
                        No categories match “{debouncedQuery.trim()}”.
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <h3 className="text-[14px] font-bold text-[#1A1714] pb-2.5 border-b border-[#F0EFED]">
                  Featured Products
                </h3>
                <div className="pt-2">
                  {featuredProducts.length > 0 ? (
                    featuredProducts.map(renderProductRow)
                  ) : (
                    <div className="flex justify-center py-12">
                      <BrandLoader size={72} />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 px-4 md:px-5 py-3 border-t border-[#F0EFED]">
          <div className="flex items-center gap-2 min-w-0 text-[13px] text-[#6A6058]">
            <Clock size={14} className="shrink-0 text-[#B8B4AE]" />
            <span className="font-semibold text-[#1A1714] shrink-0">
              Recent Searches
            </span>
            {recents.length > 0 ? (
              <span className="truncate">
                <span className="text-[#B8B4AE]">|</span>{" "}
                {recents.slice(0, 3).map((term, index) => (
                  <span key={term}>
                    {index > 0 && ", "}
                    <button
                      type="button"
                      onClick={() => runSuggestion(term)}
                      className="bg-transparent border-none p-0 font-sans text-[13px] text-[#6A6058] hover:text-brand cursor-pointer transition-colors"
                    >
                      {term}
                    </button>
                  </span>
                ))}
              </span>
            ) : (
              <span className="text-[#B8B4AE]">No recent searches yet</span>
            )}
          </div>
          {recents.length > 0 && (
            <button
              type="button"
              onClick={clearRecents}
              className="shrink-0 bg-transparent border-none p-0 font-sans text-[13px] font-semibold text-brand hover:text-brand-hover cursor-pointer transition-colors"
            >
              Clear History
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
