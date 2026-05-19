import { Link } from "react-router-dom";
import { Star, Heart } from "lucide-react";
import {
  useAddToWishlist,
  useRemoveFromWishlist,
  useCheckWishlist,
} from "../../hooks/cart/useWishlistTan";
import useAuthStore from "../../store/authStore";
import { toast } from "react-toastify";
import { getProductImageUrl } from "../../utils/imageUrl";
import { useAddToCart } from "../../hooks/cart/useCartTan";
import useGuestCartStore from "../../store/guestCartStore";
import { ShoppingBag } from "lucide-react";
import formatError from "../../utils/errorHandler";

export default function ProductCard({ product, viewMode = "grid" }) {
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
  const { data: wishlistCheck } = useCheckWishlist(_id, {
    enabled: isAuthenticated,
  });
  const { mutate: addToWishlist, isPending: isAdding } = useAddToWishlist();
  const { mutate: removeFromWishlist, isPending: isRemoving } =
    useRemoveFromWishlist();

  const isInWishlist = wishlistCheck?.data?.inWishlist || false;
  const isWishlistLoading = isAdding || isRemoving;

  const { mutate: addToCart, isPending: isAddingToCart } = useAddToCart();
  const { addItem: addToGuestCart } = useGuestCartStore();

  const handleAddToCart = (e) => {
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
      },
    );
  };

  const handleWishlistToggle = (e) => {
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
  };

  const imageUrl = getProductImageUrl(product);

  const formattedPrice = `NRs. ${price?.toLocaleString() || 0}`;

  const getRating = () => {
    if (rating?.average > 0) return rating.average;
    const hash = (_id || name || "")
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return 4.0 + (hash % 10) / 10;
  };

  const displayRating = getRating();

  const discountPercentage = product.discountPercentage || 0;

  if (viewMode === "list") {
    return (
      <Link
        to={`/product/${slug || _id}`}
        className="group flex h-48 bg-white rounded-md p-1.5 lg:p-3 shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_10px_35px_rgba(0,0,0,0.12)] transition-all duration-500 relative border-none"
      >
        <div className="relative w-48 sm:w-64 shrink-0 overflow-hidden rounded-md bg-[#F9F8F6]">
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          {arAvailable && (
            <div className="absolute top-2 left-2 bg-[#F27318] text-white text-[9px] font-bold px-2 py-1 rounded uppercase tracking-wider font-dm-sans shadow-sm z-10">
              AR View
            </div>
          )}
        </div>

        <div className="flex-1 px-5 py-1 flex flex-col justify-center relative">
          <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
            <button
              onClick={(e) => {
                e.preventDefault();
                handleWishlistToggle();
              }}
              disabled={isWishlistLoading}
              className={`w-8 h-8 rounded-md shadow-sm flex items-center justify-center transition-all ${
                isInWishlist
                  ? "bg-[#F27318] text-white"
                  : "bg-white/90 backdrop-blur-md text-black/40 hover:text-red-500 hover:bg-white"
              }`}
            >
              <Heart size={14} className={isInWishlist ? "fill-white" : ""} />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                handleAddToCart();
              }}
              disabled={isAddingToCart}
              className="w-8 h-8 rounded-md bg-white/90 backdrop-blur-md shadow-sm flex items-center justify-center text-black/40 hover:text-[#F27318] hover:bg-white transition-all"
            >
              <ShoppingBag size={14} />
            </button>
          </div>

          <h3 className="text-[16px] md:text-[18px] font-bold text-[#1A1714] leading-snug line-clamp-1 mb-1 group-hover:text-[#F27318] transition-colors duration-300">
            {name}
          </h3>

          <p className="text-[12px] text-black/30 line-clamp-2 mb-3 leading-tight max-w-xl">
            {shortDescription ||
              "Minimalist design meeting ultimate comfort for your modern home."}
          </p>

          <div className="flex items-center gap-1 text-[11px] text-black/40 mb-3">
            <div className="flex items-center text-[#F27318]">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={10}
                  className={
                    i < Math.round(displayRating)
                      ? "fill-[#F27318]"
                      : "fill-black/10 text-transparent"
                  }
                />
              ))}
            </div>
            <span className="ml-1 font-medium">
              ({displayRating.toFixed(1)})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[18px] font-black text-black">
              {formattedPrice}
            </span>
            {product.originalPrice && product.originalPrice > price && (
              <>
                <span className="text-[12px] text-black/20 line-through">
                  ₹{product.originalPrice.toLocaleString()}
                </span>
                <span className="text-[12px] text-[#28a745] font-bold">
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
    <div className="group bg-white rounded-md p-1.5 lg:p-3 transition-all duration-500 relative border border-neutral-100 flex flex-col">
      <Link
        to={`/product/${slug || _id}`}
        className="relative aspect-[16/11] rounded-md overflow-hidden bg-[#F9F8F6] mb-4"
      >
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {arAvailable && (
          <div className="absolute top-2 left-2 bg-[#F27318] text-white text-[9px] font-bold px-2 py-1 rounded uppercase tracking-wider font-dm-sans z-10">
            AR View
          </div>
        )}

        <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
          <button
            onClick={(e) => {
              e.preventDefault();
              handleWishlistToggle();
            }}
            disabled={isWishlistLoading}
            className={`w-8 h-8 rounded-md flex items-center justify-center transition-all ${
              isInWishlist
                ? "bg-[#F27318] text-white"
                : "bg-white/90 backdrop-blur-md text-black/40 hover:text-red-500 hover:bg-white"
            }`}
          >
            <Heart size={14} className={isInWishlist ? "fill-white" : ""} />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              handleAddToCart();
            }}
            disabled={isAddingToCart}
            className="w-8 h-8 rounded-md bg-white/90 backdrop-blur-md flex items-center justify-center text-black/40 hover:text-[#F27318] hover:bg-white transition-all"
          >
            <ShoppingBag size={14} />
          </button>
        </div>
      </Link>

      <div className="px-1 pb-1 flex flex-col flex-1">
        <Link to={`/product/${slug || _id}`}>
          <h3 className="text-[14px] font-bold text-[#1A1714] group-hover:text-[#F27318] transition-colors duration-300 leading-snug line-clamp-2 h-10 mb-1">
            {name}
          </h3>

          <div className="hidden lg:block">
            <p className="text-[12px] text-black/30 line-clamp-2 mb-3 h-8 leading-tight">
              {shortDescription}
            </p>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-black/40 mb-3">
            <div className="flex items-center text-[#F27318]">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={10}
                  className={
                    i < Math.round(displayRating)
                      ? "fill-[#F27318]"
                      : "fill-black/10 text-transparent"
                  }
                />
              ))}
            </div>
            <span className="ml-1 font-medium">
              ({displayRating.toFixed(1)})
            </span>
          </div>

          <div className="mt-auto">
            <div className="flex flex-nowrap lg:flex-wrap items-center gap-1 lg:gap-2">
              <span className="text-[14px] lg:text-[16px] font-black text-black">
                {formattedPrice}
              </span>
              {product.originalPrice && product.originalPrice > price && (
                <>
                  <span className="text-[11px] text-black/20 line-through">
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
}
