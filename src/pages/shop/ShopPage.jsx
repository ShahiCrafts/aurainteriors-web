import { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { ChevronRight, ChevronDown, Grid3X3, List, Search } from "lucide-react";

import Navbar from "../../layouts/customer/Navbar";
import Footer from "../../layouts/customer/Footer";
import ProductCard from "../../components/shop/ProductCard";
import FilterSidebar from "../../components/shop/FilterSidebar";
import CategoryBar from "../../components/navigation/CategoryBar";
import Skeleton from "../../components/common/Skeleton";

import {
  useCategory,
  useCategoryProducts,
  useCategoryTree,
} from "../../hooks/product/useCategoryTan";

import { useProducts } from "../../hooks/product/useProductTan";

export default function ShopPage() {
  const { categorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState("grid");

  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );

  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") || "",
  );

  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "featured");

  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const limit = 12;

  // FILTER STATES
  const [selectedCategories, setSelectedCategories] = useState(
    searchParams.get("categories")?.split(",").filter(Boolean) || [],
  );

  const [priceRange, setPriceRange] = useState({
    min: Number(searchParams.get("minPrice")) || 0,
    max: Number(searchParams.get("maxPrice")) || 500000,
  });

  const [selectedColors, setSelectedColors] = useState(
    searchParams.get("colors")?.split(",").filter(Boolean) || [],
  );

  const [selectedMaterials, setSelectedMaterials] = useState(
    searchParams.get("materials")?.split(",").filter(Boolean) || [],
  );

  const [selectedRating, setSelectedRating] = useState(
    Number(searchParams.get("rating")) || 0,
  );

  // SORT OPTIONS
  const sortOptions = [
    { value: "featured", label: "Featured" },
    { value: "newest", label: "Newest" },
    { value: "price_low", label: "Price: Low to High" },
    { value: "price_high", label: "Price: High to Low" },
    { value: "rating", label: "Highest Rated" },
  ];

  // CATEGORY TREE
  const { data: categoryTreeData } = useCategoryTree();

  const categories = categoryTreeData?.data?.categories || [];

  // CURRENT CATEGORY
  const { data: categoryData, isLoading: isCategoryLoading } = useCategory(
    categorySlug,
    {
      enabled: !!categorySlug,
    },
  );

  const currentCategory = categoryData?.data?.category;

  // PRODUCT PARAMS
  const getProductParams = () => {
    const params = {
      page,
      limit,
      status: "active",
    };

    if (searchQuery) {
      params.search = searchQuery;
    }

    switch (sortBy) {
      case "newest":
        params.sort = "-createdAt";
        break;

      case "price_low":
        params.sort = "price";
        break;

      case "price_high":
        params.sort = "-price";
        break;

      case "rating":
        params.sort = "-rating.average";
        break;

      case "featured":
      default:
        params.sort = "-isFeatured,-createdAt";
        break;
    }

    if (selectedCategories.length > 0) {
      params.categories = selectedCategories.join(",");
    }

    if (priceRange.min > 0) {
      params.minPrice = priceRange.min;
    }

    if (priceRange.max < 500000) {
      params.maxPrice = priceRange.max;
    }

    if (selectedColors.length > 0) {
      params.colors = selectedColors.join(",");
    }

    if (selectedMaterials.length > 0) {
      params.materials = selectedMaterials.join(",");
    }

    if (selectedRating > 0) {
      params.minRating = selectedRating;
    }

    return params;
  };

  // PRODUCTS
  const { data: productsData, isLoading: isProductsLoading } = categorySlug
    ? useCategoryProducts(categorySlug, getProductParams())
    : useProducts(getProductParams());

  const products = productsData?.data?.products || [];

  const pagination = productsData?.data?.pagination || {
    page: 1,
    limit: 12,
    total: 0,
    pages: 1,
  };

  // URL SYNC
  useEffect(() => {
    const params = new URLSearchParams();

    if (searchQuery) params.set("search", searchQuery);

    if (sortBy !== "featured") {
      params.set("sort", sortBy);
    }

    if (selectedCategories.length > 0) {
      params.set("categories", selectedCategories.join(","));
    }

    if (priceRange.min > 0) {
      params.set("minPrice", priceRange.min.toString());
    }

    if (priceRange.max < 500000) {
      params.set("maxPrice", priceRange.max.toString());
    }

    if (selectedColors.length > 0) {
      params.set("colors", selectedColors.join(","));
    }

    if (selectedMaterials.length > 0) {
      params.set("materials", selectedMaterials.join(","));
    }

    if (selectedRating > 0) {
      params.set("rating", selectedRating.toString());
    }

    setSearchParams(params, { replace: true });
  }, [
    searchQuery,
    sortBy,
    selectedCategories,
    priceRange,
    selectedColors,
    selectedMaterials,
    selectedRating,
  ]);

  // RESET PAGE
  useEffect(() => {
    setPage(1);
  }, [
    searchQuery,
    sortBy,
    categorySlug,
    selectedCategories,
    priceRange,
    selectedColors,
    selectedMaterials,
    selectedRating,
  ]);

  // SEARCH
  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  // SORT
  const handleSortChange = (value) => {
    setSortBy(value);
    setShowSortDropdown(false);
  };

  // RESET FILTERS
  const handleResetFilters = () => {
    setSelectedCategories([]);
    setPriceRange({ min: 0, max: 500000 });
    setSelectedColors([]);
    setSelectedMaterials([]);
    setSelectedRating(0);
    setSearchQuery("");
    setSearchInput("");
  };

  // BREADCRUMBS
  const buildBreadcrumbs = () => {
    const crumbs = [
      { name: "Home", path: "/" },
      { name: "Shop", path: "/shop" },
    ];

    if (currentCategory) {
      if (currentCategory.parent) {
        crumbs.push({
          name: currentCategory.parent.name,
          path: `/shop/${currentCategory.parent.slug}`,
        });
      }

      crumbs.push({
        name: currentCategory.name,
        path: `/shop/${currentCategory.slug}`,
      });
    }

    return crumbs;
  };

  const breadcrumbs = buildBreadcrumbs();

  // PAGE TITLE
  const pageTitle = currentCategory?.name || "All Products";

  const totalProducts = pagination.total;

  // PAGE CHANGE
  const handlePageChange = (newPage) => {
    setPage(newPage);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const isLoading = isCategoryLoading || isProductsLoading;

  return (
    <>
      <Navbar />
      <CategoryBar />

      <main className="min-h-screen bg-white pt-0 pb-20 font-dm-sans">
        {/* AD BANNER */}
        <div className="w-full mb-12">
          <img
            src="/ad-banner.png"
            alt="Promotion"
            className="w-full h-auto object-cover block shadow-sm"
          />
        </div>

        <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-9">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* LEFT PANEL */}
            <aside className="hidden lg:block lg:w-64 shrink-0">
              {/* BREADCRUMB */}
              <nav className="flex items-center gap-2 text-[14px] font-medium text-black/40 mb-10">
                {breadcrumbs.map((crumb, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {index > 0 && <span className="text-black/10">/</span>}

                    <Link
                      to={crumb.path}
                      className={`hover:text-[#F27318] transition-colors ${
                        index === breadcrumbs.length - 1
                          ? "text-black/60 font-semibold pointer-events-none"
                          : ""
                      }`}
                    >
                      {crumb.name}
                    </Link>
                  </div>
                ))}
              </nav>

              {/* SIDEBAR */}
              <div className="sticky top-28">
                <FilterSidebar
                  categories={categories}
                  selectedCategories={selectedCategories}
                  onCategoryChange={setSelectedCategories}
                  priceRange={{ min: 0, max: 500000 }}
                  selectedPriceRange={priceRange}
                  onPriceChange={setPriceRange}
                  selectedColors={selectedColors}
                  onColorChange={setSelectedColors}
                  selectedMaterials={selectedMaterials}
                  onMaterialChange={setSelectedMaterials}
                  selectedRating={selectedRating}
                  onRatingChange={setSelectedRating}
                  onResetFilters={handleResetFilters}
                />
              </div>
            </aside>

            {/* RIGHT PANEL */}
            <div className="flex-1">
              {/* MOBILE BREADCRUMB */}
              <nav className="flex lg:hidden items-center gap-2 text-[14px] font-medium text-black/40 mb-6">
                {breadcrumbs.map((crumb, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {index > 0 && <span className="text-black/10">/</span>}

                    <Link
                      to={crumb.path}
                      className={`hover:text-[#F27318] transition-colors ${
                        index === breadcrumbs.length - 1
                          ? "text-black/60 font-semibold pointer-events-none"
                          : ""
                      }`}
                    >
                      {crumb.name}
                    </Link>
                  </div>
                ))}
              </nav>

              {/* TOP BAR */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-4">
                  <h2 className="text-[28px] md:text-[32px] font-semibold text-[#1A1714] tracking-tight">
                    {currentCategory ? pageTitle : "Collection"}

                    <span className="ml-5 text-[15px] font-semibold text-black/40 tracking-normal lowercase">
                      ({totalProducts} items)
                    </span>
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  {/* SORT */}
                  <div className="relative">
                    <button
                      onClick={() => setShowSortDropdown(!showSortDropdown)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-md border border-black/[0.08] hover:border-[#F27318] bg-white text-[14px] font-bold text-[#1A1714] transition-all"
                    >
                      <span className="text-black/30 font-medium">
                        Sort by:
                      </span>

                      <span>
                        {sortOptions.find((opt) => opt.value === sortBy)?.label}
                      </span>

                      <ChevronDown
                        size={16}
                        className={`text-black/20 transition-transform duration-300 ${
                          showSortDropdown ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {showSortDropdown && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowSortDropdown(false)}
                        />

                        <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-black/[0.08] rounded-md shadow-[0_10px_30px_rgba(0,0,0,0.08)] z-20 py-1 overflow-hidden">
                          {sortOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => handleSortChange(option.value)}
                              className={`w-full text-left px-5 py-3 text-[14px] font-semibold transition-colors ${
                                sortBy === option.value
                                  ? "text-[#F27318] bg-[#F27318]/5"
                                  : "text-[#1A1714] hover:bg-black/[0.02]"
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* VIEW MODE */}
                  <div className="flex items-center border border-black/[0.08] rounded-md p-1 bg-white">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded-[4px] transition-all ${
                        viewMode === "grid"
                          ? "bg-[#F27318] text-white shadow-sm"
                          : "text-black/30 hover:text-black/60"
                      }`}
                    >
                      <Grid3X3 size={16} />
                    </button>

                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded-[4px] transition-all ${
                        viewMode === "list"
                          ? "bg-[#F27318] text-white shadow-sm"
                          : "text-black/30 hover:text-black/60"
                      }`}
                    >
                      <List size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* PRODUCTS */}
              {isLoading ? (
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
                      : "flex flex-col gap-4"
                  }
                >
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex flex-col gap-3">
                      <Skeleton className="w-full aspect-[16/11] rounded-md" />

                      <div className="space-y-2">
                        <Skeleton className="w-1/3 h-3" />
                        <Skeleton className="w-3/4 h-5" />
                        <Skeleton className="w-1/2 h-6" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-24 bg-[#F9F8F6] rounded-2xl">
                  <Search size={32} className="mx-auto text-black/10 mb-4" />

                  <h3 className="text-[18px] font-bold text-[#1A1714]">
                    No products found
                  </h3>

                  <p className="text-black/40 text-[14px] mt-1">
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
                        ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
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

                  {/* PAGINATION */}
                  {pagination.pages > 1 && (
                    <div className="flex items-center justify-between mt-16 pt-8 border-t border-black/[0.03]">
                      <span className="text-[11px] font-bold text-black/20 uppercase tracking-widest">
                        Page {pagination.page} / {pagination.pages}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePageChange(page - 1)}
                          disabled={page === 1}
                          className="w-10 h-10 flex items-center justify-center rounded-lg bg-black/[0.03] text-black hover:bg-black/[0.06] disabled:opacity-30 transition-all"
                        >
                          <ChevronRight size={18} className="rotate-180" />
                        </button>

                        {[...Array(pagination.pages)].map((_, i) => {
                          const pageNum = i + 1;

                          if (
                            pageNum === 1 ||
                            pageNum === pagination.pages ||
                            (pageNum >= page - 1 && pageNum <= page + 1)
                          ) {
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`w-10 h-10 text-[12px] font-bold rounded-lg transition-all ${
                                  pageNum === page
                                    ? "bg-[#F27318] text-white shadow-lg shadow-[#F27318]/20"
                                    : "bg-black/[0.03] text-black hover:bg-black/[0.06]"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          }

                          if (pageNum === page - 2 || pageNum === page + 2) {
                            return (
                              <span key={pageNum} className="text-black/10">
                                ...
                              </span>
                            );
                          }

                          return null;
                        })}

                        <button
                          onClick={() => handlePageChange(page + 1)}
                          disabled={page === pagination.pages}
                          className="w-10 h-10 flex items-center justify-center rounded-lg bg-black/[0.03] text-black hover:bg-black/[0.06] disabled:opacity-30 transition-all"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>

                      <div className="hidden sm:block w-24" />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
