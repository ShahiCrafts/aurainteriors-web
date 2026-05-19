import { useState } from "react";
import { Star, Check } from "lucide-react";

const colorOptions = [
  { name: "Black", hex: "#1a1a1a" },
  { name: "Brown", hex: "#8B4513" },
  { name: "Beige", hex: "#D2B48C" },
  { name: "Teal", hex: "#0d9488" },
  { name: "Green", hex: "#22c55e" },
  { name: "Navy", hex: "#1e3a5f" },
];

const materialOptions = [
  { name: "Velvet", count: 12 },
  { name: "Leather", count: 19 },
  { name: "Wood", count: 32 },
  { name: "Metal", count: 11 },
  { name: "Fabric", count: 9 },
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
}) {
  const [localMinPrice, setLocalMinPrice] = useState(
    selectedPriceRange.min || 5000
  );
  const [localMaxPrice, setLocalMaxPrice] = useState(
    selectedPriceRange.max || 200000
  );

  const handleCategoryToggle = (categorySlug) => {
    if (selectedCategories.includes(categorySlug)) {
      onCategoryChange(selectedCategories.filter((c) => c !== categorySlug));
    } else {
      onCategoryChange([...selectedCategories, categorySlug]);
    }
  };

  const handlePriceSubmit = () => {
    onPriceChange({ min: localMinPrice, max: localMaxPrice });
  };

  const handlePriceReset = () => {
    setLocalMinPrice(5000);
    setLocalMaxPrice(200000);
    onPriceChange({ min: 0, max: 500000 });
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

  const flattenCategories = (cats, depth = 0) => {
    let result = [];
    cats.forEach((cat) => {
      result.push({ ...cat, depth });
      if (cat.subcategories?.length > 0) {
        result = [
          ...result,
          ...flattenCategories(cat.subcategories, depth + 1),
        ];
      }
    });
    return result;
  };

  const flatCategories = flattenCategories(categories);

  const Checkbox = ({ checked, onChange, label, count }) => (
    <label
      className="flex items-center gap-3 py-1.5 cursor-pointer group"
      onClick={onChange}
    >
      <div
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${checked
          ? "bg-[#F27318] border-[#F27318]"
          : "border-neutral-300 group-hover:border-neutral-400"
          }`}
      >
        {checked && <Check size={14} className="text-white" strokeWidth={3} />}
      </div>
      <span className="text-sm text-neutral-700 font-dm-sans flex-1">
        {label}
      </span>
      {count !== undefined && (
        <span className="text-[11px] font-bold text-black/20 font-dm-sans">{count}</span>
      )}
    </label>
  );

  return (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="text-sm font-bold text-[#1A1714] font-dm-sans mb-4 uppercase tracking-wider">
          Categories
        </h3>
        <div className="space-y-1">
          {flatCategories.map((category) => (
            <Checkbox
              key={category._id || category.slug}
              checked={selectedCategories.includes(category.slug)}
              onChange={() => handleCategoryToggle(category.slug)}
              label={category.name}
              count={category.productCount || 0}
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
            className="text-[11px] text-[#F27318] hover:text-[#D9620E] font-bold font-dm-sans underline underline-offset-4"
          >
            RESET
          </button>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <label className="text-[10px] text-neutral-500 font-dm-sans uppercase tracking-wider mb-1.5 block">
              Min
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-[10px] font-bold">₹</span>
              <input
                type="text"
                value={localMinPrice.toLocaleString()}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  setLocalMinPrice(Number(val) || 0);
                }}
                onBlur={handlePriceSubmit}
                className="w-full pl-7 pr-3 py-2 rounded-lg border border-neutral-200 text-xs font-dm-sans focus:border-[#F27318] focus:ring-1 focus:ring-[#F27318] outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-neutral-500 font-dm-sans uppercase tracking-wider mb-1.5 block">
              Max
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-[10px] font-bold">₹</span>
              <input
                type="text"
                value={localMaxPrice.toLocaleString()}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  setLocalMaxPrice(Number(val) || 0);
                }}
                onBlur={handlePriceSubmit}
                className="w-full pl-7 pr-3 py-2 rounded-lg border border-neutral-200 text-xs font-dm-sans focus:border-[#F27318] focus:ring-1 focus:ring-[#F27318] outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="relative px-1 h-6">
          <div className="absolute top-1/2 left-0 right-0 h-[3px] bg-neutral-100 rounded-full -translate-y-1/2">
            <div
              className="absolute h-full bg-[#F27318] rounded-full"
              style={{
                left: `${((localMinPrice / priceRange.max) * 100)}%`,
                right: `${100 - ((localMaxPrice / priceRange.max) * 100)}%`,
              }}
            />
          </div>
          <input
            type="range"
            min={priceRange.min}
            max={priceRange.max}
            value={localMaxPrice}
            onChange={(e) => setLocalMaxPrice(Number(e.target.value))}
            onMouseUp={handlePriceSubmit}
            onTouchEnd={handlePriceSubmit}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-[#F27318] rounded-full shadow-sm pointer-events-none transition-transform group-hover:scale-110"
            style={{
              left: `${(localMaxPrice / priceRange.max) * 100}%`,
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
                onClick={() => handleColorToggle(color.name)}
                className={`w-6 h-6 rounded-full transition-all ${isSelected ? "ring-2 ring-offset-2 ring-[#F27318] scale-110" : "hover:scale-105"
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
              count={materialCounts[material.name] || material.count}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

