import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  Search,
  ShoppingCart,
  ChevronDown,
  ArrowRight,
  X,
  Filter,
} from "lucide-react";
import { WishlistSkeleton } from "../common/Skeleton";
import Pagination from "../common/Pagination";
import ProductCard from "../shop/ProductCard";
import { toast } from "../../lib/toast";
import { useWishlist } from "../../hooks/cart/useWishlistTan";
import { useAddToCart } from "../../hooks/cart/useCartTan";

const ITEMS_PER_PAGE = 8;

export default function Wishlist() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useWishlist();
  const { mutateAsync: addToCartAsync } = useAddToCart();
  const [isAddingAll, setIsAddingAll] = useState(false);

  const wishlistItems = useMemo(
    () => data?.data?.wishlist?.items || [],
    [data],
  );

  const categories = useMemo(
    () => [
      ...new Set(
        wishlistItems
          .map((item) => item.product?.category?.name)
          .filter(Boolean),
      ),
    ],
    [wishlistItems],
  );

  const filteredItems = useMemo(
    () =>
      wishlistItems
        .filter((item) => {
          const product = item.product;
          if (!product) return false;
          const matchesSearch =
            searchQuery === "" ||
            product.name?.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesCategory =
            categoryFilter === "all" ||
            product.category?.name === categoryFilter;
          return matchesSearch && matchesCategory;
        })
        .sort((a, b) => {
          if (sortBy === "recent")
            return new Date(b.addedAt) - new Date(a.addedAt);
          if (sortBy === "price-low")
            return (a.product?.price || 0) - (b.product?.price || 0);
          if (sortBy === "price-high")
            return (b.product?.price || 0) - (a.product?.price || 0);
          if (sortBy === "name")
            return (a.product?.name || "").localeCompare(b.product?.name || "");
          return 0;
        }),
    [wishlistItems, searchQuery, categoryFilter, sortBy],
  );

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedItems = filteredItems.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  const handleAddAllToCart = async () => {
    const targets = filteredItems.filter((item) => item.product);
    if (targets.length === 0 || isAddingAll) return;
    setIsAddingAll(true);
    try {
      const results = await Promise.allSettled(
        targets.map((item) =>
          addToCartAsync({ productId: item.product._id, quantity: 1 }),
        ),
      );
      const added = results.filter((r) => r.status === "fulfilled").length;
      const failed = targets.length - added;
      if (failed === 0) {
        toast.success(
          added === 1 ? "1 item added to cart" : `${added} items added to cart`,
        );
      } else if (added === 0) {
        toast.error("Could not add any items to cart. Please try again.");
      } else {
        toast.warning(
          `${added} of ${targets.length} items added to cart — ${failed} failed. Please retry the rest.`,
        );
      }
    } finally {
      setIsAddingAll(false);
    }
  };

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
          <h3 className="text-[16px] font-bold text-[#1A1714]">
            Unable to Load Wishlist
          </h3>
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
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-[18px] font-semibold text-[#1A1714]">
            Your Wishlist
          </h2>
          <p className="text-[14px] text-neutral-400 mt-1">
            Keep track of items you love and add them to your cart anytime.
          </p>
        </div>
        {!isEmpty && (
          <span className="bg-neutral-100 text-[#1A1714] text-[12px] font-bold px-3 py-1.5 rounded-full">
            {wishlistItems.length}{" "}
            {wishlistItems.length === 1 ? "Item" : "Items"}
          </span>
        )}
      </div>

      {!isEmpty ? (
        <>
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between shrink-0">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-1">
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
                  className="w-full pl-10 pr-9 py-3 border border-neutral-200 rounded-lg focus:border-brand focus:bg-white outline-none text-sm text-[#1A1714] placeholder:text-neutral-400 bg-white transition-all font-medium"
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

              <div className="relative min-w-[150px]">
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-3.5 pr-9 py-3 border border-neutral-200 rounded-lg focus:border-brand focus:bg-white outline-none text-sm text-[#1A1714] bg-white appearance-none cursor-pointer font-medium transition-all"
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

              <div className="relative min-w-[150px]">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-3.5 pr-9 py-3 border border-neutral-200 rounded-lg focus:border-brand focus:bg-white outline-none text-sm text-[#1A1714] bg-white appearance-none cursor-pointer font-medium transition-all"
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

            <button
              onClick={handleAddAllToCart}
              disabled={isAddingAll || filteredItems.length === 0}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-brand hover:bg-[#E6651B] text-white text-[13px] font-medium rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
            >
              <ShoppingCart size={13} />
              {isAddingAll ? "Adding..." : "Add All to Cart"}
            </button>
          </div>

          {filteredItems.length === 0 ? (
            <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center bg-neutral-50 rounded-2xl">
              <Filter size={32} className="text-neutral-300 mb-4" />
              <h3 className="text-[16px] font-semibold text-[#1A1714] mb-1">
                No Matching Items
              </h3>
              <p className="text-[14px] text-neutral-400 max-w-xs">
                We couldn't find any saved items matching your current filters.
                Try resetting search query.
              </p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto space-y-8">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-2 xl:grid-cols-[repeat(auto-fill,calc((min(100vw-64px,1440px)-80px)*0.2))]">
                {paginatedItems.map((item) => {
                  const product = item.product;
                  if (!product) return null;
                  return (
                    <ProductCard
                      key={item._id || product._id}
                      product={product}
                    />
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="py-6 border-t border-neutral-100">
                  <Pagination
                    theme="customer"
                    page={page}
                    totalPages={totalPages}
                    pageSize={ITEMS_PER_PAGE}
                    totalItems={filteredItems.length}
                    onPageChange={setPage}
                  />
                </div>
              )}

              {totalPages > 1 && (
                <p className="text-[11px] text-neutral-400 text-center tracking-wide">
                  Showing page {page} of {totalPages || 1} ·{" "}
                  {filteredItems.length} total items
                </p>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center bg-neutral-50 rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-5 text-brand">
            <Heart size={26} className="fill-[#FFF8F2]" />
          </div>
          <h3 className="text-[18px] font-semibold text-[#1A1714]">
            Your wishlist is empty
          </h3>
          <p className="text-[14px] text-neutral-400 max-w-xs mt-1.5 mb-7 leading-relaxed">
            Start saving items you love to keep track of pricing and checkout
            whenever you are ready.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand hover:bg-[#E6651B] text-white text-[14px] font-medium rounded-lg transition-all"
          >
            Explore Catalog
            <ArrowRight size={13} />
          </Link>
        </div>
      )}
    </div>
  );
}
