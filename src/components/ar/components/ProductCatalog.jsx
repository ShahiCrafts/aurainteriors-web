import React from "react";
import { IoFilter } from "react-icons/io5";
import { HiOutlineCube } from "react-icons/hi2";

// REUSE-001 (Phase 5): the per-product tile is the canonical
// ProductCard in its hooks-free "ar-thumb" variant — selection
// semantics (button, not navigation), the selected ring/check and
// the name/price rows are all expressed through ProductSummary +
// `selected` + `onSelect`, so the catalogue keeps only its chrome
// (header, filter button, horizontal snap strip, empty state).
import ProductCard from "../../shop/ProductCard";

const ProductCatalog = ({
  products,
  selectedProduct,
  onProductSelect,
  onFilterClick,
  hasActiveFilters,
}) => {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-40 safe-bottom bg-linear-to-t from-black via-black/90 to-transparent pt-8"
      data-hide-on-capture
    >
      <div className="flex justify-between items-end px-5 pb-3 gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 border border-white/10 bg-white/5 backdrop-blur-xl rounded-2xl flex items-center justify-center">
            <HiOutlineCube size={18} className="text-teal-300" />
          </div>
          <div>
            <h2
              className="text-sm font-semibold text-white"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Collection
            </h2>
            <span className="text-xs text-white/50">
              {products.length} items available
            </span>
          </div>
        </div>
        <button
          onClick={onFilterClick}
          className="relative flex items-center gap-1.5 px-4 py-2 border border-white/20 hover:border-teal-400 hover:bg-white/10 rounded-full text-xs font-medium text-white/80 active:scale-95 transition-all"
        >
          <IoFilter size={14} />
          <span>Filter</span>
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-teal-400 rounded-full border-2 border-black/70" />
          )}
        </button>
      </div>

      <div className="flex gap-3 px-5 pb-[calc(18px+env(safe-area-inset-bottom,0px))] overflow-x-auto hide-scrollbar snap-x snap-mandatory">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center w-full py-6 gap-2">
            <div className="w-12 h-12 border border-white/20 rounded-full flex items-center justify-center">
              <IoFilter size={18} className="text-white/40" />
            </div>
            <span className="text-sm text-white/40">No products found</span>
          </div>
        ) : (
          products.map((product) => {
            const isSelected =
              selectedProduct?._id === product._id ||
              selectedProduct?.id === product.id;

            return (
              <ProductCard
                key={product._id || product.id}
                variant="ar-thumb"
                product={product}
                selected={isSelected}
                onSelect={onProductSelect}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default ProductCatalog;
