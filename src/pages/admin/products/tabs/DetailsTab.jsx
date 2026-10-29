import { Plus, X, Ruler, Weight } from "lucide-react";

const colorMap = {
  white: "#FFFFFF",
  black: "#1A1A1A",
  gray: "#71717A",
  brown: "#78350F",
  beige: "#F5F5DC",
  navy: "#1E3A8A",
  green: "#15803D",
  red: "#B91C1C",
  blue: "#1D4ED8",
  natural: "#E5C158",
};

export default function DetailsTab({ form }) {
  const {
    productForm,
    setProductForm,
    materialInput,
    setMaterialInput,
    handleToggle,
    handleAddColor,
    handleEditColor,
  } = form;

  return (
    <div className="space-y-4">
      {/* Dimensions */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Dimensions (Width x Height x Depth cm)
        </label>
        <div className="grid grid-cols-3 gap-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <Ruler className="w-3.5 h-3.5" />
            </span>
            <input
              type="number"
              value={productForm.dimensions.width}
              onChange={(e) =>
                setProductForm({
                  ...productForm,
                  dimensions: {
                    ...productForm.dimensions,
                    width: e.target.value,
                  },
                })
              }
              className="w-full pl-9 pr-14 h-10 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all"
              placeholder="0"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-gray-400 pointer-events-none select-none">
              Width
            </span>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <Ruler className="w-3.5 h-3.5" />
            </span>
            <input
              type="number"
              value={productForm.dimensions.height}
              onChange={(e) =>
                setProductForm({
                  ...productForm,
                  dimensions: {
                    ...productForm.dimensions,
                    height: e.target.value,
                  },
                })
              }
              className="w-full pl-9 pr-16 h-10 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all"
              placeholder="0"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-gray-400 pointer-events-none select-none">
              Height
            </span>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <Ruler className="w-3.5 h-3.5" />
            </span>
            <input
              type="number"
              value={productForm.dimensions.depth}
              onChange={(e) =>
                setProductForm({
                  ...productForm,
                  dimensions: {
                    ...productForm.dimensions,
                    depth: e.target.value,
                  },
                })
              }
              className="w-full pl-9 pr-14 h-10 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all"
              placeholder="0"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-gray-400 pointer-events-none select-none">
              Depth
            </span>
          </div>
        </div>
      </div>

      {/* Weight */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Weight
        </label>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <Weight className="w-3.5 h-3.5" />
            </span>
            <input
              type="number"
              value={productForm.weight.value}
              onChange={(e) =>
                setProductForm({
                  ...productForm,
                  weight: {
                    ...productForm.weight,
                    value: e.target.value,
                  },
                })
              }
              className="w-full pl-9 pr-16 h-10 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all"
              placeholder="0"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-gray-400 pointer-events-none select-none">
              Weight
            </span>
          </div>
          <select
            value={productForm.weight.unit}
            onChange={(e) =>
              setProductForm({
                ...productForm,
                weight: {
                  ...productForm.weight,
                  unit: e.target.value,
                },
              })
            }
            className="w-24 px-4 h-10 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all bg-white"
          >
            <option value="kg">kg</option>
            <option value="lb">lb</option>
          </select>
        </div>
      </div>

      {/* Materials */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Materials
        </label>
        <div className="w-full min-h-12 px-3 py-2.5 rounded-lg border border-gray-200 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/10 bg-white transition-all flex flex-wrap gap-2 items-center">
          {productForm.materials.map((material, idx) => (
            <div
              key={`${material}-${idx}`}
              className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md text-xs font-semibold"
            >
              <span>{material}</span>
              <button
                type="button"
                onClick={() => handleToggle("materials", material)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <input
            type="text"
            value={materialInput}
            onChange={(e) => setMaterialInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && materialInput.trim()) {
                e.preventDefault();
                const newMaterial = materialInput.trim();
                if (!productForm.materials.includes(newMaterial)) {
                  setProductForm((prev) => ({
                    ...prev,
                    materials: [...prev.materials, newMaterial],
                  }));
                }
                setMaterialInput("");
              } else if (
                e.key === "Backspace" &&
                !materialInput &&
                productForm.materials.length > 0
              ) {
                setProductForm((prev) => ({
                  ...prev,
                  materials: prev.materials.slice(0, -1),
                }));
              }
            }}
            placeholder={
              productForm.materials.length === 0
                ? "Type a material and press Enter..."
                : "Add more..."
            }
            className="flex-1 min-w-30 bg-transparent outline-none text-sm text-gray-700"
          />
        </div>
      </div>

      {/* Colors */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Available Colors
        </label>
        <div className="flex flex-wrap gap-2.5 items-center">
          {/* Add color button */}
          <button
            type="button"
            onClick={handleAddColor}
            className="w-38.5 h-10 rounded-lg text-sm font-semibold border border-dashed border-gray-300 bg-gray-50/50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Color
          </button>

          {/* Color Cards */}
          {productForm.colors.map((color) => {
            const hex = color.startsWith("#")
              ? color
              : colorMap[color.toLowerCase()] || "#FFFFFF";

            return (
              <div
                key={color}
                className="w-38.5 h-10 flex items-center transition-all group shrink-0"
              >
                {/* Color square — click to edit */}
                <button
                  type="button"
                  onClick={() => handleEditColor(color, hex)}
                  className="w-10 h-10 shrink-0 cursor-pointer rounded-l-lg transition-opacity hover:opacity-80"
                  style={{ backgroundColor: hex }}
                  title="Click to change color"
                />
                {/* Hex label & Remove wrapper */}
                <div className="flex-1 h-full flex items-center bg-white border border-l-0 border-gray-200 rounded-r-lg">
                  {/* Hex label */}
                  <span className="flex-1 px-2.5 text-xs font-semibold text-gray-600 select-none tracking-wide text-center">
                    {hex.toUpperCase()}
                  </span>
                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => handleToggle("colors", color)}
                    className="w-8 h-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer border-l border-gray-100 rounded-r-lg"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
