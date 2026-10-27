import { memo, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Star, Heart, ShoppingCart, Loader2 } from "lucide-react";
import {
  useAddToWishlist,
  useRemoveFromWishlist,
  useWishlist,
} from "../../hooks/cart/useWishlistTan";
import { useAddToCart } from "../../hooks/cart/useCartTan";
import useGuestCartStore from "../../store/guestCartStore";
import useAuthStore from "../../store/authStore";
import { toast } from "react-toastify";
import { getProductImageUrl, getProductImageSrcSet } from "../../utils/imageUrl";
import formatError from "../../utils/errorHandler";
import { formatNPR } from "../../utils/formatCurrency";
import { productHasPurchasableVariant } from "../../utils/variantSelection";
import { colorSwatchHex } from "../../utils/colorSwatches";

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
 * 3. Honest rating (FE-14) — a product with no reviews renders
 *    "No reviews yet"; a numeric rating is shown only when the product
 *    actually has a real average from at least one review. (Previously a
 *    character-hash of the id invented a 4.0–4.9 rating.)
 *
 * 4. useCallback for handlers — stable references are important for memo to
 *    work correctly when these callbacks are passed as props to children.
 *
 * 5. Image lazy loading — loading="lazy" defers off-screen images;
 *    decoding="async" prevents image decoding from blocking the main thread.
 *
 * Roundedness system (matches Hero):
 *   - Cards:      rounded-sm md:rounded-lg
 *   - Nested img: rounded-sm md:rounded-md (one step smaller, inside padding)
 *   - Buttons:    rounded-md
 *   - Tag pills:  rounded-md
 *   - Wishlist heart stays rounded-full (circular icon button)
 */
const ProductCard = memo(function ProductCard({ product, viewMode = "grid" }) {
  const {
    _id,
    name,
    slug,
    price,
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

  const { mutate: addToCart, isPending: isAddingToCart } = useAddToCart();
  const { addItem: addToGuestCart } = useGuestCartStore();

  // Add to cart (grid card) — owner reversal of FE-62, 2026-10-26:
  // FE-62 removed the card's add handler because the original was
  // defined but never rendered; the owner then asked for the cart
  // button to actually add. Scope: SIMPLE products add quantity 1
  // right here, through the exact paths the product page uses
  // (auth mutation / guest cart, legacy 3-argument guest call —
  // FE-22; no per-call onError — FE-47: the cart hook reports
  // errors). VARIANT products still cannot be added from a card —
  // a variant must be chosen first — so their cart button stays a
  // link to the product page. The list layout is unchanged.

  // ── Stable callbacks (required for memo to be effective) ───────────────
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
  // FE-54: responsive variants where the image host supports them
  // (undefined otherwise — the plain src keeps working).
  const imageSrcSet = useMemo(
    () => getProductImageSrcSet(product, [320, 640, 960]),
    [product]
  );
  // FE-63: one formatter (fixed en-NP locale) replaces the old
  // locale-less grouping behind a hardcoded currency prefix.
  const formattedPrice = useMemo(() => formatNPR(price ?? 0), [price]);

  // Phase 7 (catalog): a variant product never presents a single
  // price as THE price — it shows the priceFrom floor with a
  // "From" prefix, and its availability is any-purchasable-variant
  // (judged only when the payload carries the variants; when it
  // does not, the card claims nothing about stock).
  const isVariantProduct = product.hasVariants === true;
  const formattedFromPrice = useMemo(
    () => formatNPR(product.priceFrom ?? price ?? 0),
    [product.priceFrom, price]
  );
  const variantOutOfStock =
    isVariantProduct &&
    Array.isArray(product.catalogVariants) &&
    product.catalogVariants.length > 0 &&
    !productHasPurchasableVariant(product);

  // Grid-card add (simple products only — variant products render
  // a link instead, so this handler never fires for them). Mirrors
  // the product page: quantity 1, empty variant triple, the legacy
  // 3-argument guest call, success toasted here and errors by the
  // cart hook (FE-47).
  const handleAddToCart = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isAuthenticated) {
        addToGuestCart(product, 1, {});
        toast.success("Added to cart");
        return;
      }
      addToCart(
        { productId: _id, quantity: 1, variant: {} },
        { onSuccess: () => toast.success("Added to cart") }
      );
    },
    [isAuthenticated, product, _id, addToCart, addToGuestCart]
  );

  // FE-14: never invent a rating. A numeric rating exists only when the
  // product has a real average backed by at least one review.
  const ratingAverage = rating?.average || 0;
  const ratingCount = rating?.count || 0;
  const hasRating = ratingAverage > 0 && ratingCount > 0;

  const discountPercentage = product.discountPercentage || 0;

  // Reference-design badge (grid): one pill, real fields only —
  // discount first (never on variant products, whose price is a
  // floor, not a single price), then the stored New Arrival and
  // Featured flags. Nothing is invented: no field, no badge.
  const badge =
    !isVariantProduct && discountPercentage > 0
      ? { label: `${discountPercentage}% OFF`, className: "bg-[#FDE8E8] text-[#D92D20]" }
      : product.isNewArrival
        ? { label: "New Arrival", className: "bg-[#DFF5E5] text-[#157347]" }
        : product.isFeatured
          ? { label: "Featured", className: "bg-[#F27318] text-white" }
          : null;

  // Color dots (grid): the product's stored color names resolved
  // through the shared swatch list; unknown names are skipped
  // rather than painted a wrong color.
  const colorDots = useMemo(() => {
    const seen = new Map();
    for (const name of Array.isArray(product.colors) ? product.colors : []) {
      const hex = colorSwatchHex(name);
      if (hex && !seen.has(name)) seen.set(name, hex);
    }
    return [...seen.entries()].map(([name, hex]) => ({ name, hex }));
  }, [product.colors]);
  const visibleColorDots = colorDots.slice(0, 4);
  const extraColorCount = colorDots.length - visibleColorDots.length;

  const productUrl = `/product/${encodeURIComponent(slug || _id)}`;

  if (viewMode === "list") {
    return (
      <Link
        to={`/product/${encodeURIComponent(slug || _id)}`}
        className="group flex flex-col sm:flex-row gap-3 sm:gap-4 bg-white rounded-sm md:rounded-lg border border-black/[0.06] p-3 sm:p-4"
      >
        {/* Image Container - one radius step smaller than the card (nested inside padding) */}
        <div className="relative w-full sm:w-40 lg:w-52 shrink-0 aspect-video sm:aspect-auto sm:h-32 lg:h-40 rounded-sm md:rounded-md overflow-hidden bg-gradient-to-br from-[#FAFAFA] to-[#F5F5F5]">
          <img
            src={imageUrl}
            srcSet={imageSrcSet}
            sizes="(max-width: 640px) 100vw, 33vw"
            alt={name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />

          {/* AR Badge */}
          {arAvailable && (
            <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 bg-white/95 backdrop-blur-sm text-[#F27318] text-[8px] sm:text-[9px] font-bold px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md z-10 uppercase tracking-wider shadow-md">
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
          {hasRating ? (
            <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className={`sm:w-[14px] sm:h-[14px] transition-colors ${
                      i < Math.round(ratingAverage)
                        ? "fill-[#F27318] text-[#F27318]"
                        : "fill-gray-200 text-gray-200"
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-black">
                {ratingAverage.toFixed(1)}
              </span>
              <span className="text-[10px] sm:text-[11px] text-black/40">
                ({ratingCount})
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
              <span className="text-[10px] sm:text-[11px] text-black/40">
                No reviews yet
              </span>
            </div>
          )}

          {/* Price Section */}
          <div className="mt-auto">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-[14px] sm:text-[16px] lg:text-[18px] font-bold text-[#1A1714]">
                {isVariantProduct ? `From ${formattedFromPrice}` : formattedPrice}
              </span>
              {!isVariantProduct && product.originalPrice && product.originalPrice > price && (
                <>
                  <span className="text-[10px] sm:text-[11px] text-black/30 line-through">
                    {formatNPR(product.originalPrice)}
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-[#28a745] font-bold">
                    {discountPercentage}% OFF
                  </span>
                </>
              )}
            </div>
            {variantOutOfStock && (
              <p className="mt-1 text-[11px] font-semibold text-black/40">
                Out of stock
              </p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Grid card — reference design: one rounded card, image with a
  // badge pill + wishlist circle, then name, short description,
  // single-star rating, then a footer with price + color dots on the
  // left and the orange cart button bottom-right (a real add for
  // simple products; a link to the product page for variant
  // products — see the reversal note at the add handler).
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-sm md:rounded-lg border border-black/[0.06] bg-white">
      {/* Image */}
      <div className="relative aspect-[2/1] overflow-hidden bg-gradient-to-br from-[#FAFAFA] to-[#F5F5F5]">
        <img
          src={imageUrl}
          srcSet={imageSrcSet}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          alt={name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Badge + AR, stacked top-left */}
        <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5">
          {badge && (
            <span
              className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow-sm ${badge.className}`}
            >
              {badge.label}
            </span>
          )}
          {arAvailable && (
            <span className="rounded-md bg-white/95 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#F27318] shadow-md backdrop-blur-sm">
              ✦ AR View
            </span>
          )}
        </div>

        {/* Wishlist Button - Top Right Corner */}
        <button
          onClick={handleWishlistToggle}
          disabled={isWishlistLoading}
          aria-label={isInWishlist ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
          className={`absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full shadow-sm backdrop-blur-sm transition-all duration-300 ${
            isInWishlist
              ? "bg-[#F27318] text-white"
              : "bg-white/95 text-black/50 hover:text-red-500"
          }`}
        >
          <Heart size={16} className={isInWishlist ? "fill-white" : ""} />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        {/* Product Name (stretched link: the whole card navigates) */}
        <Link
          to={productUrl}
          className="after:absolute after:inset-0 after:z-10 after:rounded-sm md:after:rounded-lg focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-[#F27318]"
        >
          <h3 className="truncate text-[15px] font-bold leading-snug text-[#1A1714] transition-colors duration-300 group-hover:text-[#F27318]">
            {name}
          </h3>
        </Link>

        {/* Short Description */}
        {shortDescription && (
          <p className="mt-0.5 truncate text-[13px] leading-snug text-black/45">
            {shortDescription}
          </p>
        )}

        {/* Rating — one star, the real average and count (FE-14) */}
        {hasRating ? (
          <div className="mt-1.5 flex items-center gap-1.5">
            <Star size={15} className="fill-[#F27318] text-[#F27318]" />
            <span className="text-[13px] font-bold text-[#1A1714]">
              {ratingAverage.toFixed(1)}
            </span>
            <span className="text-[13px] text-black/40">({ratingCount})</span>
          </div>
        ) : (
          <p className="mt-1.5 text-[12px] text-black/40">No reviews yet</p>
        )}

        {/* Footer: price + color dots stacked on the left; the cart button
            sits bottom-right, bottom-aligned with the dots and running up
            alongside the price (reference layout). */}
        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div className="min-w-0">
            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="text-[16px] font-bold text-[#1A1714]">
                {isVariantProduct ? `From ${formattedFromPrice}` : formattedPrice}
              </span>
              {!isVariantProduct && product.originalPrice && product.originalPrice > price && (
                <span className="text-[13px] text-black/30 line-through">
                  {formatNPR(product.originalPrice)}
                </span>
              )}
            </div>
            {variantOutOfStock && (
              <p className="mt-1 text-[11px] font-semibold text-black/40">
                Out of stock
              </p>
            )}

            {/* Color dots */}
            {colorDots.length > 0 && (
              <div className="mt-3 flex items-center gap-1.5 pb-1">
                {visibleColorDots.map((dot) => (
                  <span
                    key={dot.name}
                    data-card-color={dot.name}
                    title={dot.name}
                    className="h-[18px] w-[18px] shrink-0 rounded-full border border-black/10"
                    style={{ backgroundColor: dot.hex }}
                  />
                ))}
                {extraColorCount > 0 && (
                  <span className="text-[12px] font-medium text-black/40">
                    +{extraColorCount}
                  </span>
                )}
              </div>
            )}
          </div>

          {isVariantProduct ? (
            // Variant products: a variant must be chosen first, so
            // the cart button goes to the product page for that.
            <Link
              to={productUrl}
              aria-label={`Select options for ${name}`}
              className="relative z-20 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#F27318] text-white shadow-sm transition-all hover:bg-[#D9620E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F27318]"
            >
              <ShoppingCart size={16} />
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              aria-label={`Add ${name} to cart`}
              className="relative z-20 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#F27318] text-white shadow-sm transition-all hover:bg-[#D9620E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F27318] disabled:opacity-60"
            >
              {isAddingToCart ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ShoppingCart size={16} />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export default ProductCard;