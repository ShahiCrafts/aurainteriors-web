import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  Search,
  ShoppingCart,
  ChevronDown,
  Star,
  Loader2,
  ArrowRight,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  useWishlist,
  useRemoveFromWishlist,
} from "../../hooks/cart/useWishlistTan";
import { useAddToCart } from "../../hooks/cart/useCartTan";
import { getProductImageUrl } from "../../utils/imageUrl";
import formatError from "../../utils/errorHandler";

const ITEMS_PER_PAGE = 12;

export default function Wishlist() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useWishlist();
  const { mutate: removeFromWishlist, isPending: isRemoving } =
    useRemoveFromWishlist();
  const { mutate: addToCart, isPending: isAddingToCart } = useAddToCart();

  const wishlistItems = data?.data?.wishlist?.items || [];

  const categories = [
    ...new Set(
      wishlistItems.map((item) => item.product?.category?.name).filter(Boolean),
    ),
  ];

  const filteredItems = wishlistItems
    .filter((item) => {
      const product = item.product;
      if (!product) return false;
      const matchesSearch =
        searchQuery === "" ||
        product.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || product.category?.name === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "recent") return new Date(b.addedAt) - new Date(a.addedAt);
      if (sortBy === "price-low")
        return (a.product?.price || 0) - (b.product?.price || 0);
      if (sortBy === "price-high")
        return (b.product?.price || 0) - (a.product?.price || 0);
      if (sortBy === "name")
        return (a.product?.name || "").localeCompare(b.product?.name || "");
      return 0;
    });

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredItems.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  const handleRemove = (productId) => {
    removeFromWishlist(productId, {
      onSuccess: () => toast.success("Removed from wishlist"),
      onError: (err) =>
        toast.error(formatError(err, "Failed to remove from wishlist")),
    });
  };

  const handleAddToCart = (product) => {
    addToCart(
      { productId: product._id, quantity: 1 },
      {
        onSuccess: () => toast.success(`${product.name} added to cart`),
        onError: (err) =>
          toast.error(formatError(err, "Failed to add to cart")),
      },
    );
  };

  const handleAddAllToCart = () => {
    filteredItems.forEach((item) => {
      if (item.product) {
        addToCart(
          { productId: item.product._id, quantity: 1 },
          {
            onError: (err) =>
              toast.error(
                formatError(err, `Failed to add ${item.product.name} to cart`),
              ),
          },
        );
      }
    });
    toast.success("Adding all items to cart");
  };

  const getImageUrl = (product) => getProductImageUrl(product);

  const getDiscountPercentage = (product) => {
    if (product?.originalPrice && product.originalPrice > product.price) {
      return Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100,
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-72 gap-3">
        <Loader2 size={28} className="text-[#F27318] animate-spin" />
        <p className="text-sm text-neutral-400 font-dm-sans tracking-wide">
          Loading your wishlist…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center border border-red-100">
          <X size={20} className="text-red-500" />
        </div>
        <p className="text-sm text-neutral-500 font-dm-sans">
          Failed to load wishlist.{" "}
          <button className="text-[#F27318] underline underline-offset-2">
            Try again
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {wishlistItems.length > 0 && (
        <>
          {/* ── Controls ── */}
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-end">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full lg:w-auto flex-1 lg:justify-end">
              {/* Search */}
              <div className="relative w-full sm:w-72">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-300"
                />
                <input
                  type="text"
                  placeholder="Search products…"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-9 py-2.5 border border-neutral-200 rounded-lg focus:border-[#F27318] focus:ring-0 outline-none text-sm text-[#1A1714] placeholder:text-neutral-300 bg-white font-dm-sans font-medium transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-neutral-500"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div className="relative w-full sm:w-44">
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-3.5 pr-9 py-2.5 border border-neutral-200 rounded-lg focus:border-[#F27318] focus:ring-0 outline-none text-sm text-[#1A1714] bg-white appearance-none cursor-pointer font-dm-sans transition-colors font-medium"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={13}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                />
              </div>

              {/* Add all to cart */}
              <button
                onClick={handleAddAllToCart}
                disabled={isAddingToCart || filteredItems.length === 0}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#F27318] hover:bg-[#E6651B] text-white text-sm font-semibold font-dm-sans rounded-lg transition-colors duration-200 whitespace-nowrap disabled:opacity-50 w-full sm:w-auto"
              >
                <ShoppingCart size={15} />
                {isAddingToCart ? "Adding…" : "Add all to cart"}
              </button>
            </div>
          </div>

          {/* ── No Results ── */}
          {filteredItems.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-neutral-200 rounded-xl">
              <Search size={32} className="text-neutral-200 mx-auto mb-4" />
              <p className="text-sm font-semibold text-neutral-700 font-dm-sans mb-1">
                No items match
              </p>
              <p className="text-xs text-neutral-400 font-dm-sans">
                Try a different search or filter
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {/* ── Product Grid ── */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {paginatedItems.map((item) => {
                    const product = item.product;
                    if (!product) return null;
                    const rating = product.rating?.average || 4.5;

                    return (
                      <div
                        key={item._id || product._id}
                        className="group bg-white border border-neutral-100 rounded-md p-1.5 lg:p-3 flex flex-col transition-all duration-500 hover:shadow-lg hover:border-neutral-200"
                      >
                        {/* Image */}
                        <Link
                          to={`/product/${product.slug || product._id}`}
                          className="relative aspect-[16/11] rounded-md overflow-hidden bg-[#F9F8F6] mb-4"
                        >
                          <img
                            src={getImageUrl(product)}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />

                          {/* Remove button */}
                          <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleRemove(product._id);
                              }}
                              disabled={isRemoving}
                              className="w-8 h-8 rounded-md bg-white/90 backdrop-blur-md flex items-center justify-center text-black/40 hover:text-red-500 hover:bg-white transition-all shadow-sm"
                              title="Remove from wishlist"
                            >
                              <Heart
                                size={14}
                                className="fill-red-500 text-red-500"
                              />
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleAddToCart(product);
                              }}
                              disabled={isAddingToCart}
                              className="w-8 h-8 rounded-md bg-white/90 backdrop-blur-md flex items-center justify-center text-black/40 hover:text-[#F27318] hover:bg-white transition-all shadow-sm"
                            >
                              <ShoppingCart size={14} />
                            </button>
                          </div>
                        </Link>

                        {/* Info */}
                        <div className="px-1 pb-1 flex flex-col flex-1">
                          <Link to={`/product/${product.slug || product._id}`}>
                            <h3 className="text-[14px] font-bold text-[#1A1714] group-hover:text-[#F27318] transition-colors duration-300 leading-snug line-clamp-2 h-10 mb-1 font-dm-sans">
                              {product.name}
                            </h3>

                            <div className="flex items-center gap-1 text-[11px] text-black/40 mb-3 font-dm-sans">
                              <div className="flex items-center text-[#F27318]">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    size={10}
                                    className={
                                      i < Math.round(rating)
                                        ? "fill-[#F27318]"
                                        : "fill-black/10 text-transparent"
                                    }
                                  />
                                ))}
                              </div>
                              <span className="ml-1 font-medium">
                                ({rating.toFixed(1)})
                              </span>
                            </div>

                            <div className="mt-auto">
                              <div className="flex items-baseline gap-1 lg:gap-2">
                                <span className="text-[14px] lg:text-[16px] font-black text-black font-dm-sans">
                                  NRs.{" "}
                                  <span className="text-[#F27318]">
                                    {product.price?.toLocaleString()}
                                  </span>
                                </span>
                                {product.originalPrice &&
                                  product.originalPrice > product.price && (
                                    <span className="text-[11px] text-black/20 line-through font-dm-sans">
                                      {product.originalPrice.toLocaleString()}
                                    </span>
                                  )}
                              </div>
                            </div>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>

              {/* ── Pagination ── */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between py-6 border-t border-neutral-100">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-[#1A1714] border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-dm-sans bg-white"
                  >
                    <ChevronLeft size={14} />
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (pageNum) => {
                        const isActive = pageNum === page;
                        const isNear =
                          Math.abs(pageNum - page) <= 1 ||
                          pageNum === 1 ||
                          pageNum === totalPages;

                        if (!isNear) {
                          if (
                            (pageNum === 2 && page > 3) ||
                            (pageNum === totalPages - 1 && page < totalPages - 2)
                          ) {
                            return (
                              <span
                                key={pageNum}
                                className="w-8 text-center text-xs text-neutral-300 font-dm-sans"
                              >
                                …
                              </span>
                            );
                          }
                          return null;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`w-9 h-9 rounded-lg text-sm font-semibold font-dm-sans transition-colors ${isActive
                                ? "bg-[#F27318] text-white"
                                : "border border-neutral-200 text-neutral-500 hover:bg-neutral-50 bg-white"
                              }`}
                          >
                            {pageNum}
                          </button>
                        );
                      },
                    )}
                  </div>

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || totalPages === 0}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-[#1A1714] border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-dm-sans bg-white"
                  >
                    Next
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}

              {/* Count footer */}
              <div className="py-4 border-t border-neutral-100/50">
                <p className="text-xs text-neutral-300 font-dm-sans text-center tracking-wide">
                  Showing page {page} of {totalPages || 1} ·{" "}
                  {filteredItems.length} total items
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {wishlistItems.length === 0 && (
        <div className="py-28 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl border border-neutral-100 bg-neutral-50 flex items-center justify-center mb-5">
            <Heart size={28} className="text-neutral-200" />
          </div>
          <h2 className="text-lg font-bold text-[#1A1714] font-dm-sans mb-3">
            Nothing saved yet
          </h2>
          <p className="text-sm text-neutral-400 font-dm-sans max-w-xs mb-8 leading-relaxed">
            Browse the catalog and tap the heart icon on any product to save it
            here.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#F27318] hover:bg-[#E6651B] text-white text-sm font-semibold font-dm-sans rounded-lg transition-colors duration-200"
          >
            Explore catalog
            <ArrowRight size={15} />
          </Link>
        </div>
      )}
    </div>
  );
}
