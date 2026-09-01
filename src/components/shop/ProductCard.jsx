import { memo, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Star, Heart, ShoppingBag } from "lucide-react";
import {
  useAddToWishlist,
  useRemoveFromWishlist,
  useWishlist,
} from "../../hooks/cart/useWishlistTan";
import useAuthStore from "../../store/authStore";
import { toast } from "react-toastify";
import { getProductImageUrl } from "../../utils/imageUrl";
import { useAddToCart } from "../../hooks/cart/useCartTan";
import useGuestCartStore from "../../store/guestCartStore";
import formatError from "../../utils/errorHandler";

/**
 * Performance notes:
 *
 * 1. React.memo — prevents re-renders when parent filter/sort/pagination state
 *    changes don't affect this specific card's props.
 *
 * 2. N+1 wishlist fix — previously every card called useCheckWishlist(productId),
 *    firing one GET /wishlist/check/{id} per card (12–20 parallel requests on the
 *    shop page). Now we use the shared useWishlist() query (already fetched by
 *    Navbar) and derive inWishlist from the full list. React Query deduplicates
 *    the query so all cards share a single network request.
 *
 * 3. useMemo for displayRating — the character-hash loop was running on every
 *    render. Now computed once and memoized on _id/rating dependencies.
 *
 * 4. useCallback for handlers — stable references are important for memo to
 *    work correctly when these callbacks are passed as props to children.
 *
 * 5. Image lazy loading — loading="lazy" defers off-screen images;
 *    decoding="async" prevents image decoding from blocking the main thread.
 */
const ProductCard = memo(function ProductCard({ product, viewMode = "grid" }) {
  const {
    _id,
    name,
    slug,
    price,
    images,
    category,
    rating,
    arAvailable,
    shortDescription,
  } = product;

  const { isAuthenticated } = useAuthStore();

  // ── Wishlist (N+1 fix) ─────────────────────────────────────────────────
  // Use the shared full-list query instead of one check-per-card.
  // All cards subscribe to the same query key → 1 network request total.
  const { data: wishlistData } = useWishlist({ enabled: isAuthenticated });
  const isInWishlist = useMemo(() => {
    const items = wishlistData?.data?.wishlist?.items || [];
    return items.some(
      (item) => (item.product?._id ?? item.product) === _id
    );
  }, [wishlistData, _id]);

  const { mutate: addToWishlist, isPending: isAdding } = useAddToWishlist();
  const { mutate: removeFromWishlist, isPending: isRemoving } =
    useRemoveFromWishlist();
  const isWishlistLoading = isAdding || isRemoving;

  // ── Cart ───────────────────────────────────────────────────────────────
  const { mutate: addToCart, isPending: isAddingToCart } = useAddToCart();
  const { addItem: addToGuestCart } = useGuestCartStore();

  // ── Stable callbacks (required for memo to be effective) ───────────────
  const handleAddToCart = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isAuthenticated) {
        addToGuestCart(product, 1);
        toast.success("Added to cart");
        return;
      }
      addToCart(
        { productId: _id, quantity: 1 },
        {
          onSuccess: () => toast.success("Added to cart"),
          onError: (err) =>
            toast.error(formatError(err, "Failed to add to cart")),
        }
      );
    },
    [isAuthenticated, addToGuestCart, addToCart, _id, product]
  );

  const handleWishlistToggle = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isAuthenticated) {
        toast.error("Please login to add items to wishlist");
        return;
      }
      if (isInWishlist) {
        removeFromWishlist(_id, {
          onSuccess: () => toast.success("Removed from wishlist"),
          onError: (err) =>
            toast.error(formatError(err, "Failed to remove from wishlist")),
        });
      } else {
        addToWishlist(_id, {
          onSuccess: () => toast.success("Added to wishlist"),
          onError: (err) =>
            toast.error(formatError(err, "Failed to add to wishlist")),
        });
      }
    },
    [isAuthenticated, isInWishlist, _id, addToWishlist, removeFromWishlist]
  );

  // ── Derived values (memoized) ──────────────────────────────────────────
  const imageUrl = useMemo(() => getProductImageUrl(product), [product]);
  const formattedPrice = useMemo(
    () => `NRs. ${price?.toLocaleString() || 0}`,
    [price]
  );

  // Previously a plain function called on every render; memoized now.
  const displayRating = useMemo(() => {
    if (rating?.average > 0) return rating.average;
    const hash = (_id || name || "")
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return 4.0 + (hash % 10) / 10;
  }, [_id, name, rating]);

  const discountPercentage = product.discountPercentage || 0;

  if (viewMode === "list") {
    return (
      <Link
        to={`/product/${slug || _id}`}
        className="group flex flex-col sm:flex-row gap-3 sm:gap-4 bg-white rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] transition-all duration-500"
      >
        {/* Image Container - Separate and fully rounded */}
        <div className="relative w-full sm:w-40 lg:w-52 shrink-0 aspect-video sm:aspect-auto sm:h-32 lg:h-40 rounded-lg overflow-hidden bg-gradient-to-br from-[#FAFAFA] to-[#F5F5F5]">
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />

          {/* AR Badge */}
          {arAvailable && (
            <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 bg-white/95 backdrop-blur-sm text-[#F27318] text-[8px] sm:text-[9px] font-bold px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full z-10 uppercase tracking-wider shadow-md">
              ✦ AR View
            </div>
          )}

          {/* Wishlist Button - Top Right Corner */}
          <button
            onClick={handleWishlistToggle}
            disabled={isWishlistLoading}
            className={`absolute top-2 right-2 sm:top-2.5 sm:right-2.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm backdrop-blur-sm z-10 ${
              isInWishlist
                ? "bg-[#F27318] text-white"
                : "bg-white/90 text-black/40 hover:text-red-500"
            }`}
          >
            <Heart
              size={14}
              className={`sm:w-[16px] sm:h-[16px] ${isInWishlist ? "fill-white" : ""}`}
            />
          </button>
        </div>

        {/* Details Container - Separate section */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Category */}
          <p className="text-[11px] sm:text-[12px] text-black/50 font-medium tracking-wide uppercase mb-2">
            {category?.name || "Furniture"}
          </p>

          {/* Product Name */}
          <h3 className="text-[13px] sm:text-[15px] font-semibold text-[#1A1714] group-hover:text-[#F27318] transition-colors duration-300 truncate mb-2 sm:mb-3">
            {name}
          </h3>

          {/* Short Description */}
          <p className="text-[11px] sm:text-[13px] text-black/40 line-clamp-2 mb-2 sm:mb-3 leading-snug">
            {shortDescription ||
              "Minimalist design meeting ultimate comfort for your modern home."}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  className={`sm:w-[14px] sm:h-[14px] transition-colors ${
                    i < Math.round(displayRating)
                      ? "fill-[#F27318] text-[#F27318]"
                      : "fill-gray-200 text-gray-200"
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] sm:text-[11px] font-semibold text-black">
              {displayRating.toFixed(1)}
            </span>
            <span className="text-[10px] sm:text-[11px] text-black/40">
              ({product.rating?.count || 0})
            </span>
          </div>

          {/* Price Section */}
          <div className="mt-auto">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-[14px] sm:text-[16px] lg:text-[18px] font-bold text-[#1A1714]">
                {formattedPrice}
              </span>
              {product.originalPrice && product.originalPrice > price && (
                <>
                  <span className="text-[10px] sm:text-[11px] text-black/30 line-through">
                    {`NRs. ${product.originalPrice.toLocaleString()}`}
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-[#28a745] font-bold">
                    {discountPercentage}% OFF
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="group flex flex-col gap-3 sm:gap-4">
      {/* Image Container - Separate and fully rounded */}
      <Link
        to={`/product/${slug || _id}`}
        className="relative aspect-[5/3] rounded-lg overflow-hidden bg-gradient-to-br from-[#FAFAFA] to-[#F5F5F5] shadow-sm hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] transition-all duration-500"
      >
        <img
          src={imageUrl}
          alt={name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* AR Badge */}
        {arAvailable && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-white/95 backdrop-blur-sm text-[#F27318] text-[8px] sm:text-[9px] font-bold px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full z-10 uppercase tracking-wider shadow-md">
            ✦ AR View
          </div>
        )}

        {/* Wishlist Button - Top Right Corner */}
        <button
          onClick={handleWishlistToggle}
          disabled={isWishlistLoading}
          className={`absolute top-2 right-2 sm:top-3 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm backdrop-blur-sm z-10 ${
            isInWishlist
              ? "bg-[#F27318] text-white"
              : "bg-white/90 text-black/40 hover:text-red-500"
          }`}
        >
          <Heart
            size={14}
            className={`sm:w-[16px] sm:h-[16px] ${isInWishlist ? "fill-white" : ""}`}
          />
        </button>
      </Link>

      {/* Details Container - Separate section */}
      <div className="flex flex-col flex-1">
        {/* Category */}
        <p className="text-[11px] sm:text-[12px] text-black/50 font-medium tracking-wide uppercase mb-2">
          {category?.name || "Furniture"}
        </p>

        {/* Product Name */}
        <Link to={`/product/${slug || _id}`}>
          <h3 className="text-[13px] sm:text-[15px] font-semibold text-[#1A1714] group-hover:text-[#F27318] transition-colors duration-300 truncate mb-2 sm:mb-3">
            {name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={12}
                className={`sm:w-[14px] sm:h-[14px] transition-colors ${
                  i < Math.round(displayRating)
                    ? "fill-[#F27318] text-[#F27318]"
                    : "fill-gray-200 text-gray-200"
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] sm:text-[11px] font-semibold text-black">
            {displayRating.toFixed(1)}
          </span>
          <span className="text-[10px] sm:text-[11px] text-black/40">
            ({product.rating?.count || 0})
          </span>
        </div>

        {/* Price Section */}
        <div className="mt-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-[14px] sm:text-[16px] lg:text-[18px] font-bold text-[#1A1714]">
              {formattedPrice}
            </span>
            {product.originalPrice && product.originalPrice > price && (
              <span className="text-[11px] sm:text-[12px] text-black/30 line-through">
                {`NRs. ${product.originalPrice.toLocaleString()}`}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default ProductCard;