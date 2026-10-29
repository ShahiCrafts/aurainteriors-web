import { useState } from "react";
import { Star, Check } from "lucide-react";
import { formatNPRNumber } from "../../utils/formatCurrency";
import FacetSections from "./FacetFilters";
import { hasFacetSections } from "../../utils/catalogListing";
import {
  categoryScopeOptions,
  categoryToggleSelection,
} from "../../utils/categoryScope";
import { COLOR_SWATCHES } from "../../utils/colorSwatches";

function Checkbox({ checked, onChange, label, count }) {
  return (
    <label className="flex items-center gap-3 py-1.5 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <div
        aria-hidden="true"
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-brand peer-focus-visible:ring-offset-2 ${checked
          ? "bg-brand border-brand"
          : "border-neutral-300 group-hover:border-neutral-400"
          }`}
      >
        {checked && <Check size={14} className="text-white" strokeWidth={3} />}
      </div>
      <span className="text-sm text-neutral-700 font-dm-sans flex-1">
        {label}
      </span>
      {count !== undefined && (
        <span className="text-[11px] font-bold text-black/20 font-dm-sans">
          {count}
        </span>
      )}
    </label>
  );
}

export { Checkbox as FilterCheckbox };

const colorOptions = COLOR_SWATCHES.slice(0, 6);

const materialOptions = [
  { name: "Velvet" },
  { name: "Leather" },
  { name: "Wood" },
  { name: "Metal" },
  { name: "Fabric" },
];

export default function FilterSidebar({
  categories = [],
  selectedCategories = [],
  onCategoryChange,
  priceRange = { min: 0, max: 500000 },
  selectedPriceRange = { min: 0, max: 500000 },
  onPriceChange,
  selectedColors = [],
  onColorChange,
  selectedMaterials = [],
  onMaterialChange,
  selectedRating = 0,
  onRatingChange,
  onResetFilters,
  materialCounts = {},
  facets = null,
  facetSelection = {},
  selectedRooms = [],
  inStockOnly = false,
  hideRoomFacet = false,
  onAttrToggle,
  onAttrRange,
  onRoomToggle,
  onInStockToggle,
}) {
  const facetCategoryCounts = new Map(
    (facets?.category?.options || []).map((option) => [
      String(option.value),
      option.count,
    ]),
  );
  const facetRatingCounts = new Map(
    (facets?.rating?.options || []).map((option) => [
      Number(option.value),
      option.count,
    ]),
  );
  const showFacets = hasFacetSections(facets, {
    hideRoom: hideRoomFacet,
    selection: facetSelection,
  });
  const [localMinPrice, setLocalMinPrice] = useState(
    selectedPriceRange?.min ?? priceRange.min,
  );
  const [localMaxPrice, setLocalMaxPrice] = useState(
    selectedPriceRange?.max ?? priceRange.max,
  );

  const appliedMin = selectedPriceRange?.min ?? priceRange.min;
  const appliedMax = selectedPriceRange?.max ?? priceRange.max;
  const [prevApplied, setPrevApplied] = useState({
    min: appliedMin,
    max: appliedMax,
  });
  if (prevApplied.min !== appliedMin || prevApplied.max !== appliedMax) {
    setPrevApplied({ min: appliedMin, max: appliedMax });
    setLocalMinPrice(appliedMin);
    setLocalMaxPrice(appliedMax);
  }

  const handleCategoryToggle = (categorySlug) => {
    onCategoryChange(
      categoryToggleSelection(categories, selectedCategories, categorySlug),
    );
  };

  const normalizePriceRange = (min, max) => {
    const clamp = (v) =>
      Math.min(priceRange.max, Math.max(priceRange.min, Number(v) || 0));
    const a = clamp(min);
    const b = clamp(max);
    return { min: Math.min(a, b), max: Math.max(a, b) };
  };

  const handlePriceSubmit = () => {
    const next = normalizePriceRange(localMinPrice, localMaxPrice);
    setLocalMinPrice(next.min);
    setLocalMaxPrice(next.max);
    if (
      next.min === (selectedPriceRange?.min ?? priceRange.min) &&
      next.max === (selectedPriceRange?.max ?? priceRange.max)
    ) {
      return;
    }
    onPriceChange(next);
  };

  const handlePriceReset = () => {
    setLocalMinPrice(priceRange.min);
    setLocalMaxPrice(priceRange.max);
    onPriceChange({ min: priceRange.min, max: priceRange.max });
  };

  const handleColorToggle = (colorName) => {
    if (selectedColors.includes(colorName)) {
      onColorChange(selectedColors.filter((c) => c !== colorName));
    } else {
      onColorChange([...selectedColors, colorName]);
    }
  };

  const handleMaterialToggle = (material) => {
    if (selectedMaterials.includes(material)) {
      onMaterialChange(selectedMaterials.filter((m) => m !== material));
    } else {
      onMaterialChange([...selectedMaterials, material]);
    }
  };

  const scopedCategories = categoryScopeOptions(categories, selectedCategories);

  const pctOf = (value) => {
    if (!priceRange.max) return 0;
    return Math.min(100, Math.max(0, (value / priceRange.max) * 100));
  };

  return (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="text-sm font-bold text-[#1A1714] font-dm-sans mb-4 uppercase tracking-wider">
          Categories
        </h3>
        <div className="space-y-1">
          {scopedCategories.map((category) => (
            <Checkbox
              key={category._id || category.slug}
              checked={selectedCategories.includes(category.slug)}
              onChange={() => handleCategoryToggle(category.slug)}
              label={category.name}
              count={
                facetCategoryCounts.has(category.slug)
                  ? facetCategoryCounts.get(category.slug)
                  : typeof category.productCount === "number"
                    ? category.productCount
                    : undefined
              }
            />
          ))}
        </div>
      </div>

      <div className="w-full h-px bg-neutral-100" />

      {/* Price Range */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[#1A1714] font-dm-sans uppercase tracking-wider">
            Price Range
          </h3>
          <button
            onClick={handlePriceReset}
            className="text-[11px] text-brand hover:text-brand-hover font-bold font-dm-sans underline underline-offset-4"
          >
            RESET
          </button>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <label
              htmlFor="filter-price-min"
              className="text-[10px] text-neutral-500 font-dm-sans uppercase tracking-wider mb-1.5 block"
            >
              Min
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-[10px] font-bold">
                NPR
              </span>
              <input
                id="filter-price-min"
                type="text"
                value={formatNPRNumber(localMinPrice)}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  setLocalMinPrice(Number(val) || 0);
                }}
                onBlur={handlePriceSubmit}
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-neutral-200 text-xs font-dm-sans focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex-1">
            <label
              htmlFor="filter-price-max"
              className="text-[10px] text-neutral-500 font-dm-sans uppercase tracking-wider mb-1.5 block"
            >
              Max
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-[10px] font-bold">
                NPR
              </span>
              <input
                id="filter-price-max"
                type="text"
                value={formatNPRNumber(localMaxPrice)}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  setLocalMaxPrice(Number(val) || 0);
                }}
                onBlur={handlePriceSubmit}
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-neutral-200 text-xs font-dm-sans focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="relative px-1 h-6">
          <div className="absolute top-1/2 left-0 right-0 h-0.75 bg-neutral-100 rounded-full -translate-y-1/2">
            <div
              className="absolute h-full bg-brand rounded-full"
              style={{
                left: `${pctOf(localMinPrice)}%`,
                right: `${100 - pctOf(localMaxPrice)}%`,
              }}
            />
          </div>
          <input
            type="range"
            aria-label="Maximum price"
            min={priceRange.min}
            max={priceRange.max}
            value={localMaxPrice}
            onChange={(e) => setLocalMaxPrice(Number(e.target.value))}
            onMouseUp={handlePriceSubmit}
            onTouchEnd={handlePriceSubmit}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-brand rounded-full shadow-sm pointer-events-none transition-transform group-hover:scale-110"
            style={{
              left: `${pctOf(localMaxPrice)}%`,
              marginLeft: "-8px",
            }}
          />
        </div>
      </div>

      <div className="w-full h-px bg-neutral-100" />

      {/* Colors */}
      <div>
        <h3 className="text-sm font-bold text-[#1A1714] font-dm-sans mb-4 uppercase tracking-wider">
          Colors
        </h3>
        <div className="flex flex-wrap gap-2.5">
          {colorOptions.map((color) => {
            const isSelected = selectedColors.includes(color.name);
            const isWhite = color.hex === "#ffffff";
            return (
              <button
                key={color.name}
                type="button"
                onClick={() => handleColorToggle(color.name)}
                aria-label={`Filter by color ${color.name}`}
                aria-pressed={isSelected}
                className={`w-6 h-6 rounded-full transition-all focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 ${isSelected
                  ? "ring-2 ring-offset-2 ring-brand scale-110"
                  : "hover:scale-105"
                  } ${isWhite ? "border border-neutral-200" : ""}`}
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            );
          })}
        </div>
      </div>

      <div className="w-full h-px bg-neutral-100" />

      {/* Materials */}
      <div>
        <h3 className="text-sm font-bold text-[#1A1714] font-dm-sans mb-4 uppercase tracking-wider">
          Materials
        </h3>
        <div className="space-y-1">
          {materialOptions.map((material) => (
            <Checkbox
              key={material.name}
              checked={selectedMaterials.includes(material.name)}
              onChange={() => handleMaterialToggle(material.name)}
              label={material.name}
              count={materialCounts[material.name]}
            />
          ))}
        </div>
      </div>

      <div className="w-full h-px bg-neutral-100" />

      <div>
        <h3 className="text-sm font-bold text-[#1A1714] font-dm-sans mb-4 uppercase tracking-wider">
          Rating
        </h3>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onRatingChange?.(0)}
            aria-label="Any rating"
            aria-pressed={!selectedRating}
            className={`block w-full text-left px-2 py-1.5 rounded-lg text-sm font-dm-sans transition-colors ${!selectedRating
              ? "bg-brand/10 text-[#1A1714] font-bold"
              : "text-neutral-700 hover:bg-neutral-50"
              }`}
          >
            Any rating
          </button>
          {[4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => onRatingChange?.(rating)}
              aria-label={`${rating} stars & up`}
              aria-pressed={selectedRating === rating}
              className={`flex w-full items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${selectedRating === rating
                ? "bg-brand/10"
                : "hover:bg-neutral-50"
                }`}
            >
              <span className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={13}
                    className={
                      i < rating
                        ? "fill-brand text-brand"
                        : "fill-black/10 text-transparent"
                    }
                  />
                ))}
              </span>
              <span className="text-sm text-neutral-700 font-dm-sans">
                & up
              </span>
              {facetRatingCounts.has(rating) && (
                <span className="text-[11px] font-bold text-black/20 font-dm-sans">
                  {facetRatingCounts.get(rating)}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {showFacets && (
        <>
          <div className="w-full h-px bg-neutral-100" />
          <FacetSections
            facets={facets}
            selection={facetSelection}
            selectedRooms={selectedRooms}
            inStockOnly={inStockOnly}
            hideRoom={hideRoomFacet}
            onAttrToggle={onAttrToggle}
            onAttrRange={onAttrRange}
            onRoomToggle={onRoomToggle}
            onInStockToggle={onInStockToggle}
          />
        </>
      )}
    </div>
  );
}
