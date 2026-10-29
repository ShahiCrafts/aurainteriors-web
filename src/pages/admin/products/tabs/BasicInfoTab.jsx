import CatalogProductFields from "../../../../components/admin/catalog/CatalogProductFields";
import ProductImageUploader from "../ProductImageUploader";

const styleOptions = [
  "Modern",
  "Contemporary",
  "Traditional",
  "Minimalist",
  "Industrial",
  "Scandinavian",
  "Bohemian",
  "Rustic",
];

export default function BasicInfoTab({ form, categories }) {
  const {
    productForm,
    setProductForm,
    imagePreviews,
    uploadProgress,
    showAllImages,
    setShowAllImages,
    fileInputRef,
    handleImageChange,
    removeImage,
  } = form;

  return (
    <div className="space-y-4">
      <ProductImageUploader
        imagePreviews={imagePreviews}
        uploadProgress={uploadProgress}
        showAllImages={showAllImages}
        setShowAllImages={setShowAllImages}
        fileInputRef={fileInputRef}
        handleImageChange={handleImageChange}
        removeImage={removeImage}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Name *
        </label>
        <input
          type="text"
          value={productForm.name}
          onChange={(e) =>
            setProductForm({
              ...productForm,
              name: e.target.value,
            })
          }
          className="w-full px-4 h-10 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all"
          placeholder="Enter product name"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            value={productForm.category}
            onChange={(e) =>
              setProductForm({
                ...productForm,
                category: e.target.value,
              })
            }
            className="w-full px-4 h-10 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all bg-white"
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={productForm.status}
            onChange={(e) =>
              setProductForm({
                ...productForm,
                status: e.target.value,
              })
            }
            className="w-full px-4 h-10 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all bg-white"
          >
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
      </div>

      <CatalogProductFields
        productType={productForm.productType}
        onProductTypeChange={(value) =>
          setProductForm({ ...productForm, productType: value })
        }
        roomSlugs={productForm.roomSlugs}
        onRoomSlugsChange={(value) =>
          setProductForm({ ...productForm, roomSlugs: value })
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price *
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
              NPR
            </span>
            <input
              type="number"
              value={productForm.price}
              onChange={(e) =>
                setProductForm({
                  ...productForm,
                  price: e.target.value,
                })
              }
              className="w-full pl-12 pr-4 h-10 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all"
              placeholder="0"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Original Price
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
              NPR
            </span>
            <input
              type="number"
              value={productForm.originalPrice}
              onChange={(e) =>
                setProductForm({
                  ...productForm,
                  originalPrice: e.target.value,
                })
              }
              className="w-full pl-12 pr-4 h-10 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all"
              placeholder="0"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stock
          </label>
          <input
            type="number"
            value={productForm.stock}
            onChange={(e) =>
              setProductForm({
                ...productForm,
                stock: e.target.value,
              })
            }
            className="w-full px-4 h-10 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all"
            placeholder="0"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SKU
          </label>
          <input
            type="text"
            value={productForm.sku}
            onChange={(e) =>
              setProductForm({
                ...productForm,
                sku: e.target.value,
              })
            }
            className="w-full px-4 h-10 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all"
            placeholder="SKU-001"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Style
          </label>
          <select
            value={productForm.style}
            onChange={(e) =>
              setProductForm({
                ...productForm,
                style: e.target.value,
              })
            }
            className="w-full px-4 h-10 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all bg-white"
          >
            <option value="">Select Style</option>
            {styleOptions.map((style) => (
              <option key={style} value={style.toLowerCase()}>
                {style}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Short Description
        </label>
        <input
          type="text"
          value={productForm.shortDescription}
          onChange={(e) =>
            setProductForm({
              ...productForm,
              shortDescription: e.target.value,
            })
          }
          className="w-full px-4 h-10 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all"
          placeholder="Brief description for listings"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={productForm.description}
          onChange={(e) =>
            setProductForm({
              ...productForm,
              description: e.target.value,
            })
          }
          rows={3}
          className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all resize-none"
          placeholder="Enter product description"
        />
      </div>

      {/* Featured & New Arrival toggles */}
      <div className="flex gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={productForm.isFeatured}
            onChange={(e) =>
              setProductForm({
                ...productForm,
                isFeatured: e.target.checked,
              })
            }
            className="w-4 h-4 rounded border-gray-300 text-[#025E5D] focus:ring-[#025E5D]"
          />
          <span className="text-sm text-gray-700">Featured Product</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={productForm.isNewArrival}
            onChange={(e) =>
              setProductForm({
                ...productForm,
                isNewArrival: e.target.checked,
              })
            }
            className="w-4 h-4 rounded border-gray-300 text-[#025E5D] focus:ring-[#025E5D]"
          />
          <span className="text-sm text-gray-700">New Arrival</span>
        </label>
      </div>
    </div>
  );
}
