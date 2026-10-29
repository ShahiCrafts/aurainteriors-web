import { useState } from "react";
import { Star, Heart, Share2, ShoppingCart } from "lucide-react";
import VariantSelector from "../../../components/shop/VariantSelector";
import QuantitySelector from "../../../components/ui/QuantitySelector";
import { formatNPR } from "../../../utils/formatCurrency";

export default function PurchasePanel({
  product,
  definitions,
  selectedColor,
  setSelectedColor,
  variantSelection,
  setVariantSelection,
  quantity,
  setQuantity,
  isVariantProduct,
  selectedVariant,
  displayStock,
  isOutOfStock,
  displayPrice,
  displayCompareAt,
  discount,
  handleAddToCart,
  handleBuyNow,
  isAddingToCart,
  isInWishlist,
  isWishlistLoading,
  onWishlistToggle: handleWishlistToggle,
  onShare: handleShare,
}) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const colors = product?.colors || [];

  return (
    <div className="flex-1">
      {" "}
      {/* Bestseller badge */}
      {product.isFeatured && (
        <div className="bg-brand text-white text-[11px] font-bold px-3 py-1 rounded uppercase tracking-widest mb-5 w-fit">
          Bestseller
        </div>
      )}
      {/* Title */}
      <h1 className="text-[30px] leading-[1.2] font-bold text-[#1A1714] mb-3">
        {product.name}
      </h1>
      {/* Rating row - single line */}
      <div className="flex flex-wrap items-center gap-2 text-[14px] mb-4">
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={15}
              className={
                i < Math.round(product?.rating?.average || 0)
                  ? "fill-brand text-brand"
                  : "fill-black/10 text-transparent"
              }
            />
          ))}
        </div>
        <span className="font-bold text-[#1A1714]">
          {(product?.rating?.average || 0).toFixed(1)}
        </span>
        <span className="text-black/40 font-medium">
          ({product?.rating?.count || 0} reviews)
        </span>

        {typeof product.soldCount === "number" && (
          <>
            <span className="w-1 h-1 rounded-full bg-black/20"></span>
            <span className="text-black/40 font-medium">
              {product.soldCount} bought in last month
            </span>
          </>
        )}
      </div>
      <div className="flex items-baseline gap-2.5 mb-1.5">
        <span className="text-[30px] font-bold text-[#1A1714]">
          {formatNPR(displayPrice ?? 0)}
        </span>
        {displayCompareAt && displayCompareAt > displayPrice && (
          <>
            <span className="text-[16px] text-black/35 line-through font-medium">
              {formatNPR(displayCompareAt)}
            </span>
            <span className="bg-brand/8 text-brand px-2.5 py-1 rounded text-[13px] font-bold">
              {discount}% OFF
            </span>
          </>
        )}
      </div>
      <p className="text-[14px] text-black/50 mb-4">Inclusive of all taxes</p>
      {/* Phase 7: variant availability line */}
      {isVariantProduct && (
        <p className="text-[14px] font-medium mb-4 -mt-2" aria-live="polite">
          {!selectedVariant ? (
            <span className="text-black/50">
              Select options to see availability
            </span>
          ) : selectedVariant.enabled === false ? (
            <span className="text-red-600">This variant is unavailable</span>
          ) : displayStock > 0 ? (
            <span className="text-emerald-600">
              In stock — {displayStock} available
            </span>
          ) : (
            <span className="text-red-600">Out of stock for this variant</span>
          )}
        </p>
      )}
      {/* Product Description */}
      {product.description && (
        <div className="mb-6">
          {!isDescriptionExpanded ? (
            <p className="text-[14px] text-black/60 leading-relaxed text-justify">
              {product.description.length > 150
                ? `${product.description.substring(0, 150)}... `
                : product.description}
              {product.description.length > 150 && (
                <button
                  onClick={() => setIsDescriptionExpanded(true)}
                  className="text-brand font-semibold hover:underline text-[14px] inline"
                >
                  View More
                </button>
              )}
            </p>
          ) : (
            <p className="text-[14px] text-black/60 leading-relaxed text-justify">
              {product.description}
              <button
                onClick={() => setIsDescriptionExpanded(false)}
                className="text-brand font-semibold hover:underline text-[14px] inline ml-1"
              >
                View Less
              </button>
            </p>
          )}
        </div>
      )}
      {isVariantProduct && (
        <VariantSelector
          product={product}
          definitions={definitions}
          selection={variantSelection}
          onSelectionChange={setVariantSelection}
        />
      )}
      {/* Color Selector */}
      {!isVariantProduct && colors.length > 0 && (
        <div className="mb-5">
          <h3 className="text-[15px] font-semibold text-black/80 mb-3">
            Select Color:{" "}
            <span className="font-bold text-[#1A1714]">
              {selectedColor && typeof selectedColor === "object"
                ? selectedColor.name
                : selectedColor}
            </span>
          </h3>
          <div className="flex flex-wrap gap-3">
            {colors.map((color, index) => {
              const colorValue = typeof color === "object" ? color.hex : color;
              const isSelected =
                (selectedColor?.name || selectedColor) ===
                (color.name || color);
              return (
                <button
                  key={index}
                  onClick={() => setSelectedColor(color)}
                  className={`w-10 h-10 rounded-full border-2 transition-all duration-200 flex items-center justify-center overflow-hidden ${
                    isSelected
                      ? "border-brand"
                      : "border-transparent hover:border-black/10"
                  }`}
                  title={typeof color === "object" ? color.name : color}
                >
                  <div
                    className="w-full h-full rounded-full"
                    style={{ backgroundColor: colorValue }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}
      {/* Quantity + Add to Cart + Buy Now — same row */}
      <div className="flex flex-col sm:flex-row items-stretch gap-3 mb-5">
        <div className="flex items-center h-13 shrink-0 justify-center sm:justify-start">
          <QuantitySelector
            value={quantity}
            onChange={setQuantity}
            min={1}
            max={displayStock}
            disabled={isOutOfStock}
            size="lg"
          />
        </div>

        <button
          id="main-add-to-cart"
          onClick={handleAddToCart}
          disabled={isAddingToCart || isOutOfStock}
          className="flex-2 bg-brand text-white h-13 rounded-lg font-bold text-[16px] hover:bg-brand-hover transition-all duration-300 flex items-center justify-center gap-2.5 disabled:bg-neutral-200"
        >
          <ShoppingCart size={18} />
          {isOutOfStock
            ? "Out of Stock"
            : isAddingToCart
              ? "Adding..."
              : "Add to Cart"}
        </button>

        <button
          onClick={handleBuyNow}
          disabled={isAddingToCart || isOutOfStock}
          className="flex-1 bg-white text-[#1A1714] border border-black/15 h-13 rounded-lg font-bold text-[16px] hover:border-black/30 transition-all duration-300 disabled:opacity-50"
        >
          Buy Now
        </button>
      </div>
      {/* Wishlist / Share — horizontally centered */}
      <div className="flex items-start gap-12 mt-10">
        <button
          onClick={handleWishlistToggle}
          disabled={isWishlistLoading}
          className="flex items-center gap-1.5 text-[14px] font-semibold text-black/60 hover:text-brand transition-all disabled:opacity-50"
        >
          <Heart
            size={16}
            className={isInWishlist ? "fill-red-500 text-red-500" : ""}
          />
          Add to Wishlist
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-[14px] font-semibold text-black/60 hover:text-brand transition-all"
        >
          <Share2 size={16} />
          Share
        </button>
      </div>
    </div>
  );
}
