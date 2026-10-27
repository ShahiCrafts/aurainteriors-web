import { memo, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Check, Box } from "lucide-react";
import {
  useAddToWishlist,
  useRemoveFromWishlist,
  useWishlist,
} from "../../hooks/cart/useWishlistTan";
import { useAddToCart } from "../../hooks/cart/useCartTan";
import useGuestCartStore from "../../store/guestCartStore";
import { useShallow } from "zustand/react/shallow";
import useAuthStore from "../../store/authStore";
import { toast } from "../../lib/toast";
import { getProductImageUrl, getProductImageSrcSet } from "../../utils/imageUrl";
import formatError from "../../utils/errorHandler";
import { formatNPR } from "../../utils/formatCurrency";
import { productHasPurchasableVariant } from "../../utils/variantSelection";
import { colorSwatchHex } from "../../utils/colorSwatches";
import Rating from "../ui/Rating";
import Price from "../ui/Price";
import ImageWithFallback from "../fallbacks/ImageWithFallback";

function ArPill({ className = "" }) {
  return (
    <span
      className={`rounded-md bg-white/95 font-bold uppercase tracking-wider text-brand shadow-md backdrop-blur-sm ${className}`}
    >
      ✦ AR View
    </span>
  );
}

function ProductCardThumb({ product, selected = false, onSelect }) {
  const imageUrl = getProductImageUrl(product);
  return (
    <button
      type="button"
      onClick={() => onSelect && onSelect(product)}
      aria-pressed={selected}
      className="group shrink-0 w-20 snap-start flex flex-col items-center p-2 rounded-2xl transition-all hover:bg-white/10"
    >
      <div
        className={`relative w-16 h-16 rounded-xl overflow-hidden transition-all ${selected
            ? "ring-2 ring-teal-400 ring-offset-2 ring-offset-black/70"
            : "border border-white/20 group-hover:border-teal-400/50"
          }`}
      >
        {imageUrl ? (
          <ImageWithFallback
            src={imageUrl}
            alt={product.name}
            loading="lazy"
            width={128}
            height={128}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-white/10 flex items-center justify-center">
            <Box size={20} className="text-white/40" />
          </div>
        )}
        {selected && (
          <div className="absolute inset-0 bg-teal-500/20 flex items-center justify-center">
            <div className="w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center">
              <Check size={14} className="text-white" />
            </div>
          </div>
        )}
      </div>
      <span className="mt-2 text-[10px] font-medium text-white/80 text-center max-w-16 truncate">
        {product.name}
      </span>
      <span
        className={`text-[10px] font-semibold ${selected ? "text-teal-400" : "text-white/50"
          }`}
      >
        {formatNPR(product.price)}
      </span>
    </button>
  );
}

function AddToCartAction({
  isVariantProduct,
  productUrl,
  name,
  isAddingToCart,
  onAdd,
}) {
  if (isVariantProduct) {
    return (
      <Link
        to={productUrl}
        aria-label={`Select options for ${name}`}
        className="relative z-20 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand text-white shadow-sm transition-all hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <ShoppingCart size={16} />
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={isAddingToCart}
      aria-label={`Add ${name} to cart`}
      className="relative z-20 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand text-white shadow-sm transition-all hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-60"
    >
      <ShoppingCart size={16} />
    </button>
  );
}

const ProductCard = memo(function ProductCard({
  product,
  variant,
  viewMode = "grid",
  showWishlist = true,
  showAddToCart = true,
  showRatingCount = true,
  onSelect,
  selected = false,
}) {
  const resolvedVariant = variant || (viewMode === "list" ? "list" : "grid");
  if (resolvedVariant === "ar-thumb") {
    return (
      <ProductCardThumb
        product={product}
        selected={selected}
        onSelect={onSelect}
      />
    );
  }
  return (
    <ProductCardMain
      product={product}
      variant={resolvedVariant}
      showWishlist={showWishlist}
      showAddToCart={showAddToCart}
      showRatingCount={showRatingCount}
      onSelect={onSelect}
    />
  );
});

function ProductCardMain({
  product,
  variant = "grid",
  showWishlist = true,
  showAddToCart = true,
  showRatingCount = true,
  onSelect,
}) {
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

  const { isAuthenticated } = useAuthStore(useShallow((state) => ({ isAuthenticated: state.isAuthenticated })));

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
  const { addItem: addToGuestCart } = useGuestCartStore(useShallow((state) => ({ addItem: state.addItem })));

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

  const imageUrl = useMemo(() => getProductImageUrl(product), [product]);
  const imageSrcSet = useMemo(
    () => getProductImageSrcSet(product, [600, 1200, 1920]),
    [product]
  );
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

  const ratingAverage = rating?.average || 0;
  const ratingCount = rating?.count || 0;
  const hasRating = ratingAverage > 0 && ratingCount > 0;

  const discountPercentage = product.discountPercentage || 0;

  const badge =
    !isVariantProduct && discountPercentage > 0
      ? { label: `${discountPercentage}% OFF`, className: "bg-[#FDE8E8] text-[#D92D20]" }
      : product.isNewArrival
        ? { label: "New Arrival", className: "bg-[#DFF5E5] text-[#157347]" }
        : product.isFeatured
          ? { label: "Featured", className: "bg-brand text-white" }
          : null;

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

  if (variant === "compact") {
    const rowContent = (
      <>
        <span className="block h-11 w-11 shrink-0 overflow-hidden rounded-md bg-neutral-100">
          <ImageWithFallback
            src={imageUrl}
            alt={name}
            loading="lazy"
            decoding="async"
            width={88}
            height={88}
            className="h-full w-full object-cover"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-[#1A1714]">
            {name}
          </span>
          {category?.name && (
            <span className="block truncate text-xs text-black/45">
              {category.name}
            </span>
          )}
        </span>
        {isVariantProduct ? (
          <span className="shrink-0 text-sm font-bold text-[#1A1714]">
            From {formattedFromPrice}
          </span>
        ) : (
          <Price
            amount={price ?? 0}
            compareAt={product.originalPrice}
            size="sm"
            className="shrink-0"
          />
        )}
      </>
    );
    const rowClassName =
      "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-neutral-50";
    if (onSelect) {
      return (
        <button
          type="button"
          onClick={() => onSelect(product)}
          className={rowClassName}
        >
          {rowContent}
        </button>
      );
    }
    return (
      <Link to={productUrl} className={rowClassName}>
        {rowContent}
      </Link>
    );
  }

  if (variant === "list") {
    return (
      <Link
        to={`/product/${encodeURIComponent(slug || _id)}`}
        className="group flex flex-col sm:flex-row gap-3 sm:gap-4 bg-white rounded-sm md:rounded-lg border border-black/6 p-3 sm:p-4"
      >
        <div className="relative w-full sm:w-40 lg:w-52 shrink-0 aspect-video sm:aspect-auto sm:h-32 lg:h-40 rounded-sm md:rounded-md overflow-hidden bg-linear-to-br from-[#FAFAFA] to-[#F5F5F5]">
          <img
            src={imageUrl}
            srcSet={imageSrcSet}
            sizes="(max-width: 640px) 100vw, 33vw"
            alt={name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />

          {arAvailable && (
            <ArPill className="absolute left-2 top-2 sm:left-2.5 sm:top-2.5 z-10 px-2 py-1 sm:px-2.5 sm:py-1.5 text-[8px] sm:text-[9px]" />
          )}

          {showWishlist && (
            <button
              onClick={handleWishlistToggle}
              disabled={isWishlistLoading}
              className={`absolute top-2 right-2 sm:top-2.5 sm:right-2.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm backdrop-blur-sm z-10 ${isInWishlist
                  ? "bg-brand text-white"
                  : "bg-white/90 text-black/40 hover:text-red-500"
                }`}
            >
              <Heart
                size={14}
                className={`sm:w-4 sm:h-4 ${isInWishlist ? "fill-white" : ""}`}
              />
            </button>
          )}
        </div>

        <div className="flex flex-col flex-1 min-w-0">
          <p className="text-[11px] sm:text-[12px] text-black/50 font-medium tracking-wide uppercase mb-2">
            {category?.name || "Furniture"}
          </p>

          <h3 className="text-[13px] sm:text-[15px] font-semibold text-[#1A1714] group-hover:text-brand transition-colors duration-300 truncate mb-2 sm:mb-3">
            {name}
          </h3>

          <p className="text-[11px] sm:text-[13px] text-black/40 line-clamp-2 mb-2 sm:mb-3 leading-snug">
            {shortDescription ||
              "Minimalist design meeting ultimate comfort for your modern home."}
          </p>

          {hasRating ? (
            <div className="mb-3 sm:mb-4">
              <Rating
                value={ratingAverage}
                count={showRatingCount ? ratingCount : undefined}
                size="sm"
              />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
              <span className="text-[10px] sm:text-[11px] text-black/40">
                No reviews yet
              </span>
            </div>
          )}

          <div className="mt-auto">
            <div className="flex items-center gap-2 sm:gap-3">
              {isVariantProduct ? (
                <span className="text-[14px] sm:text-[16px] lg:text-[18px] font-bold text-[#1A1714]">
                  From {formattedFromPrice}
                </span>
              ) : (
                <>
                  <Price
                    amount={price ?? 0}
                    compareAt={product.originalPrice}
                    size="md"
                  />
                  {product.originalPrice && product.originalPrice > price && (
                    <span className="text-[10px] sm:text-[11px] text-[#28a745] font-bold">
                      {discountPercentage}% OFF
                    </span>
                  )}
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

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-sm md:rounded-lg border border-black/6 bg-white">
      <div className="p-2 pb-0 sm:p-2.5 sm:pb-0">
        <div className="relative aspect-2/1 overflow-hidden rounded-md bg-linear-to-br from-[#FAFAFA] to-[#F5F5F5]">
          <img
            src={imageUrl}
            srcSet={imageSrcSet}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            alt={name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />

          <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5">
            {badge && (
              <span
                className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow-sm ${badge.className}`}
              >
                {badge.label}
              </span>
            )}
            {arAvailable && <ArPill className="px-2.5 py-1 text-[9px]" />}
          </div>

          {showWishlist && (
            <button
              onClick={handleWishlistToggle}
              disabled={isWishlistLoading}
              aria-label={isInWishlist ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
              className={`absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full shadow-sm backdrop-blur-sm transition-all duration-300 ${isInWishlist
                  ? "bg-brand text-white"
                  : "bg-white/95 text-black/50 hover:text-red-500"
                }`}
            >
              <Heart size={16} className={isInWishlist ? "fill-white" : ""} />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <Link
          to={productUrl}
          className="after:absolute after:inset-0 after:z-10 after:rounded-sm md:after:rounded-lg focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-brand"
        >
          <h3 className="truncate text-[15px] font-bold leading-snug text-[#1A1714] transition-colors duration-300 group-hover:text-brand">
            {name}
          </h3>
        </Link>

        {shortDescription && (
          <p className="mt-0.5 truncate text-[13px] leading-snug text-black/45">
            {shortDescription}
          </p>
        )}

        {hasRating ? (
          <div className="mt-1.5">
            <Rating
              value={ratingAverage}
              count={showRatingCount ? ratingCount : undefined}
              size="md"
            />
          </div>
        ) : (
          <p className="mt-1.5 text-[12px] text-black/40">No reviews yet</p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div className="min-w-0">
            {isVariantProduct ? (
              <span className="text-[16px] font-bold text-[#1A1714]">
                From {formattedFromPrice}
              </span>
            ) : (
              <Price
                amount={price ?? 0}
                compareAt={product.originalPrice}
                size="md"
              />
            )}
            {variantOutOfStock && (
              <p className="mt-1 text-[11px] font-semibold text-black/40">
                Out of stock
              </p>
            )}

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

          {showAddToCart && (
            <AddToCartAction
              isVariantProduct={isVariantProduct}
              productUrl={productUrl}
              name={name}
              isAddingToCart={isAddingToCart}
              onAdd={handleAddToCart}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;