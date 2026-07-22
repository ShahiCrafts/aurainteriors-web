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
        className="group flex h-36 sm:h-40 lg:h-48 bg-white rounded-md p-1.5 lg:p-3 shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_10px_35px_rgba(0,0,0,0.12)] transition-all duration-500 relative border-none"
      >
        <div className="relative w-28 sm:w-44 lg:w-64 shrink-0 overflow-hidden rounded-md bg-[#FAFAFA]">
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          {arAvailable && (
            <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-[#F27318] text-white text-[8px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-dm-sans z-10 uppercase tracking-wide">
              AR View
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 px-2.5 sm:px-4 lg:px-5 py-1 flex flex-col justify-center relative">
          <div className="absolute top-0 right-0 flex flex-col gap-1.5 sm:gap-2 z-10">
            <button
              onClick={(e) => {
                e.preventDefault();
                handleWishlistToggle(e);
              }}
              disabled={isWishlistLoading}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md shadow-sm flex items-center justify-center transition-all shrink-0 ${
                isInWishlist
                  ? "bg-[#F27318] text-white"
                  : "bg-white/90 backdrop-blur-md text-black/40 hover:text-red-500 hover:bg-white"
              }`}
            >
              <Heart
                size={12}
                className={`sm:w-[14px] sm:h-[14px] ${isInWishlist ? "fill-white" : ""}`}
              />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                handleAddToCart(e);
              }}
              disabled={isAddingToCart}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-white/90 backdrop-blur-md shadow-sm flex items-center justify-center text-black/40 hover:text-[#F27318] hover:bg-white transition-all shrink-0"
            >
              <ShoppingBag size={12} className="sm:w-[14px] sm:h-[14px]" />
            </button>
          </div>

          <h3 className="text-[13px] sm:text-[16px] font-semibold text-[#1A1714] group-hover:text-[#F27318] transition-colors duration-300 leading-snug line-clamp-2 mb-1 pr-8 sm:pr-9">
            {name}
          </h3>

          <p className="text-[11px] sm:text-[14px] text-black/40 line-clamp-2 mb-1.5 sm:mb-3 leading-tight max-w-xl">
            {shortDescription ||
              "Minimalist design meeting ultimate comfort for your modern home."}
          </p>

          <div className="flex items-center gap-1 text-[9px] sm:text-[11px] text-black/40 mb-1.5 sm:mb-3">
            <div className="flex items-center text-[#F27318] gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={8}
                  className={`sm:w-[10px] sm:h-[10px] ${
                    i < Math.round(displayRating)
                      ? "fill-[#F27318]"
                      : "fill-black/10 text-transparent"
                  }`}
                />
              ))}
            </div>
            <span className="ml-1 font-medium">
              ({displayRating.toFixed(1)})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1 lg:gap-2">
            <span className="text-[12px] sm:text-[14px] lg:text-[16px] font-bold text-black">
              {formattedPrice}
            </span>
            {product.originalPrice && product.originalPrice > price && (
              <>
                <span className="text-[9px] sm:text-[11px] text-black/20 line-through">
                  ₹{product.originalPrice.toLocaleString()}
                </span>
                <span className="text-[9px] sm:text-[11px] text-[#28a745] font-bold">
                  {discountPercentage}% OFF
                </span>
              </>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="group bg-white rounded-md transition-all duration-500 relative flex flex-col">
      <Link
        to={`/product/${slug || _id}`}
        className="relative aspect-[16/11] rounded-md overflow-hidden bg-[#FAFAFA] mb-2 sm:mb-3"
      >
        <img
          src={imageUrl}
          alt={name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {arAvailable && (
          <div className="absolute top-1 left-1 sm:top-1.5 sm:left-1.5 bg-[#F27318] text-white text-[8px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-dm-sans z-10 uppercase tracking-wide">
            AR View
          </div>
        )}

        <div className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 flex flex-col gap-1 sm:gap-1.5 z-10">
          <button
            onClick={handleWishlistToggle}
            disabled={isWishlistLoading}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center transition-all ${
              isInWishlist
                ? "bg-[#F27318] text-white"
                : "bg-white/90 backdrop-blur-md text-black/40 hover:text-red-500 hover:bg-white"
            }`}
          >
            <Heart
              size={12}
              className={`sm:w-[14px] sm:h-[14px] ${isInWishlist ? "fill-white" : ""}`}
            />
          </button>
          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-white/90 backdrop-blur-md flex items-center justify-center text-black/40 hover:text-[#F27318] hover:bg-white transition-all"
          >
            <ShoppingBag size={12} className="sm:w-[14px] sm:h-[14px]" />
          </button>
        </div>
      </Link>

      <div className="px-0 sm:px-0.5 pb-1 flex flex-col flex-1">
        <Link to={`/product/${slug || _id}`}>
          <h3 className="text-[13px] sm:text-[16px] font-semibold text-[#1A1714] group-hover:text-[#F27318] transition-colors duration-300 leading-snug line-clamp-2 mb-1.5 sm:mb-2">
            {name}
          </h3>

          <div className="flex items-center gap-1.5 text-[11px] sm:text-[12px] text-black/60 mb-2 sm:mb-3">
            <div className="flex items-center text-[#F27318] gap-0.5">
              <Star
                size={14}
                className="sm:w-[16px] sm:h-[16px] fill-[#F27318]"
              />
            </div>
            <span className="font-semibold text-black">
              {displayRating.toFixed(1)}
            </span>
            <span className="text-black/40">
              ({product.rating?.count || 0})
            </span>
          </div>

          <div className="mt-auto pt-1.5 sm:pt-2">
            <div className="flex flex-wrap items-center gap-1 lg:gap-2">
              <span className="text-[12px] sm:text-[14px] lg:text-[16px] font-bold text-black">
                {formattedPrice}
              </span>
              {product.originalPrice && product.originalPrice > price && (
                <>
                  <span className="text-[9px] sm:text-[11px] text-black/20 line-through">
                    ₹{product.originalPrice.toLocaleString()}
                  </span>
                  <span className="hidden xl:inline text-[12px] text-[#28a745] font-bold">
                    {discountPercentage}% OFF
                  </span>
                </>
              )}
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
});

export default ProductCard;