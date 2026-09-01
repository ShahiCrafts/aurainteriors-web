import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  Search,
  ShoppingCart,
  ChevronDown,
  Star,
  ArrowRight,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { ProductCardSkeleton, WishlistSkeleton } from "../common/Skeleton";
import { toast } from "react-toastify";
import {
  useWishlist,
  useRemoveFromWishlist,
} from "../../hooks/cart/useWishlistTan";
import { useAddToCart } from "../../hooks/cart/useCartTan";
import { getProductImageUrl } from "../../utils/imageUrl";
import formatError from "../../utils/errorHandler";

const ITEMS_PER_PAGE = 8;

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

  if (isLoading) {
    return <WishlistSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100/60">
          <X size={22} className="text-red-500" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-[16px] font-bold text-[#1A1714]">Unable to Load Wishlist</h3>
          <p className="text-[13px] text-neutral-400 max-w-xs">
            We encountered a network error while retrieving your saved items.
          </p>
        </div>
      </div>
    );
  }

  const isEmpty = wishlistItems.length === 0;

  return (
    <div className="h-full flex flex-col space-y-8">
      {/* Header Info */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-[18px] font-semibold text-[#1A1714]">Your Wishlist</h2>
          <p className="text-[14px] text-neutral-400 mt-1">
            Keep track of items you love and add them to your cart anytime.
          </p>
        </div>
        {!isEmpty && (
          <span className="bg-neutral-100 text-[#1A1714] text-[12px] font-bold px-3 py-1.5 rounded-full">
            {wishlistItems.length} {wishlistItems.length === 1 ? "Item" : "Items"}
          </span>
        )}
      </div>

      {!isEmpty ? (
        <>
          {/* Controls Panel */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-neutral-50 p-4 rounded-xl shrink-0">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-1">
              {/* Search Box */}
              <div className="relative flex-1 max-w-sm">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <input
                  type="text"
                  placeholder="Search saved items..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-9 py-2 border border-neutral-200 rounded-lg focus:border-[#F27318] focus:bg-white outline-none text-sm text-[#1A1714] placeholder:text-neutral-400 bg-white transition-all font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div className="relative min-w-[150px]">
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-3.5 pr-9 py-2 border border-neutral-200 rounded-lg focus:border-[#F27318] focus:bg-white outline-none text-sm text-[#1A1714] bg-white appearance-none cursor-pointer font-medium transition-all"
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

              {/* Sorting Filter */}
              <div className="relative min-w-[150px]">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-3.5 pr-9 py-2 border border-neutral-200 rounded-lg focus:border-[#F27318] focus:bg-white outline-none text-sm text-[#1A1714] bg-white appearance-none cursor-pointer font-medium transition-all"
                >
                  <option value="recent">Recently Added</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Alphabetical</option>
                </select>
                <ChevronDown
                  size={13}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                />
              </div>
            </div>

            {/* Quick Actions */}
            <button
              onClick={handleAddAllToCart}
              disabled={isAddingToCart || filteredItems.length === 0}
              className="flex items-center justify-center gap-2 px-5 py-2 bg-[#F27318] hover:bg-[#E6651B] text-white text-[13px] font-medium rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
            >
              <ShoppingCart size={13} />
              {isAddingToCart ? "Adding..." : "Add All to Cart"}
            </button>
          </div>

          {/* Grid Layout */}
          {filteredItems.length === 0 ? (
            <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center bg-neutral-50 rounded-2xl">
              <Filter size={32} className="text-neutral-300 mb-4" />
              <h3 className="text-[16px] font-semibold text-[#1A1714] mb-1">No Matching Items</h3>
              <p className="text-[14px] text-neutral-400 max-w-xs">
                We couldn't find any saved items matching your current filters. Try resetting search query.
              </p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto space-y-8">
              {/* Product Grid */}
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedItems.map((item) => {
                  const product = item.product;
                  if (!product) return null;
                  const rating = product.rating?.average || 4.5;

                  return (
                    <div
                      key={item._id || product._id}
                      className="group bg-white border border-neutral-200 rounded-xl p-3 flex flex-col transition-all duration-300 hover:border-neutral-300"
                    >
                      {/* Image Area */}
                      <Link
                        to={`/product/${product.slug || product._id}`}
                        className="relative aspect-[16/11] rounded-lg overflow-hidden bg-neutral-50 mb-3.5"
                      >
                        <img
                          src={getImageUrl(product)}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />

                        {/* Top-Right Badges/Buttons */}
                        <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-10">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRemove(product._id);
                            }}
                            disabled={isRemoving}
                            className="w-7 h-7 rounded-md bg-white/90 backdrop-blur-md flex items-center justify-center text-[#F27318] hover:text-red-600 hover:bg-white transition-all"
                            title="Remove from wishlist"
                          >
                            <Heart size={13} className="fill-red-500 text-red-500" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleAddToCart(product);
                            }}
                            disabled={isAddingToCart}
                            className="w-7 h-7 rounded-md bg-white/90 backdrop-blur-md flex items-center justify-center text-neutral-500 hover:text-[#F27318] hover:bg-white transition-all"
                            title="Add to cart"
                          >
                            <ShoppingCart size={13} />
                          </button>
                        </div>
                      </Link>

                      {/* Info Area */}
                      <div className="flex flex-col flex-1">
                        <Link to={`/product/${product.slug || product._id}`} className="space-y-2">
                          <h3 className="text-[14px] font-bold text-[#1A1714] group-hover:text-[#F27318] transition-colors leading-snug line-clamp-2 h-9">
                            {product.name}
                          </h3>

                          {/* Ratings */}
                          <div className="flex items-center gap-1 text-[11px] text-black/40">
                            <div className="flex items-center text-[#F27318] gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={9}
                                  className={
                                    i < Math.round(rating)
                                      ? "fill-[#F27318] text-[#F27318]"
                                      : "fill-black/10 text-transparent"
                                  }
                                />
                              ))}
                            </div>
                            <span className="font-semibold ml-0.5">({rating.toFixed(1)})</span>
                          </div>

                          {/* Price */}
                          <div className="pt-1.5 flex items-baseline gap-2">
                            <span className="text-[15px] font-black text-[#1A1714]">
                              NRs. {product.price?.toLocaleString()}
                            </span>
                            {product.originalPrice && product.originalPrice > product.price && (
                              <span className="text-[11px] text-black/25 line-through">
                                {product.originalPrice.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between py-6 border-t border-neutral-100">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1.5 px-4.5 py-2 text-xs font-bold text-[#1A1714] border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all bg-white"
                  >
                    <ChevronLeft size={13} />
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
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
                            <span key={pageNum} className="w-8 text-center text-xs text-neutral-300">
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
                          className={`w-8.5 h-8.5 rounded-lg text-xs font-bold transition-all ${
                            isActive
                              ? "bg-[#F27318] text-white"
                              : "border border-neutral-200 text-neutral-500 hover:bg-neutral-50 bg-white"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="flex items-center gap-1.5 px-4.5 py-2 text-xs font-bold text-[#1A1714] border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all bg-white"
                  >
                    Next
                    <ChevronRight size={13} />
                  </button>
                </div>
              )}

              {/* Count footer */}
              <p className="text-[11px] text-neutral-400 text-center tracking-wide">
                Showing page {page} of {totalPages || 1} · {filteredItems.length} total items
              </p>
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center bg-neutral-50 rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-5 text-[#F27318]">
            <Heart size={26} className="fill-[#FFF8F2]" />
          </div>
          <h3 className="text-[18px] font-semibold text-[#1A1714]">Your wishlist is empty</h3>
          <p className="text-[14px] text-neutral-400 max-w-xs mt-1.5 mb-7 leading-relaxed">
            Start saving items you love to keep track of pricing and checkout whenever you are ready.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#F27318] hover:bg-[#E6651B] text-white text-[14px] font-medium rounded-lg transition-all"
          >
            Explore Catalog
            <ArrowRight size={13} />
          </Link>
        </div>
      )}
    </div>
  );
}