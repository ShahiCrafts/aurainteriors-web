import Dialog from "../../../components/common/Dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload } from "lucide-react";

// Phase 7 split (from Categories.jsx) — the create/edit category
// form modal. Its shell already wrapped the shared Dialog (via
// components/common/Dialog) before the split; that composition is
// preserved verbatim, backdrop/Escape behaviour included. Form
// state and submit handling stay in the page and arrive as props.
export default function CategoryFormModal({
  showModal,
  setShowModal,
  editingCategory,
  categoryForm,
  setCategoryForm,
  imagePreview,
  setImagePreview,
  fileInputRef,
  handleImageChange,
  handleSubmit,
  parentOptions,
  productTypes,
  rooms,
  createMutation,
  updateMutation,
}) {
  return (
    <>
      {/* Add/Edit Category Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg"
            >
              <Dialog
                open
                onClose={() => setShowModal(false)}
                label="Category"
                className="bg-white rounded-2xl w-full max-h-[90vh] overflow-y-auto relative"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {editingCategory ? "Edit Category" : "Add New Category"}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4 text-sm">
                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Category Image
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-teal-500 transition-colors cursor-pointer bg-gray-50"
                    >
                      {imagePreview ? (
                        <div className="relative inline-block">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="max-w-full max-h-64 object-contain mx-auto"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setImagePreview(null);
                              setCategoryForm({ ...categoryForm, image: null });
                            }}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">
                            Click to upload image
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            PNG, JPG up to 5MB
                          </p>
                        </>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) =>
                        setCategoryForm({
                          ...categoryForm,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 text-sm font-medium text-gray-800"
                      required
                    />
                  </div>

                  {editingCategory && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Slug
                      </label>
                      <input
                        type="text"
                        value={editingCategory.slug || ""}
                        readOnly
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-500"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        The slug is generated when the category is created and
                        does not change on rename.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Description
                    </label>
                    <textarea
                      value={categoryForm.description}
                      onChange={(e) =>
                        setCategoryForm({
                          ...categoryForm,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 text-sm font-medium text-gray-800 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Parent Category (Optional)
                    </label>
                    <select
                      value={categoryForm.parent}
                      onChange={(e) =>
                        setCategoryForm({
                          ...categoryForm,
                          parent: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 text-sm font-medium text-gray-600 cursor-pointer"
                    >
                      <option value="">None (Top Level)</option>
                      {parentOptions.map(({ category, depth }) => (
                        <option key={category._id} value={category._id}>
                          {`${"— ".repeat(depth)}${category.name}`}
                        </option>
                      ))}
                    </select>
                    {editingCategory && (
                      <p className="text-xs text-gray-400 mt-1">
                        This category and its subcategories are not listed — a
                        category cannot sit underneath itself.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Product Type
                    </label>
                    <select
                      value={categoryForm.productType}
                      onChange={(e) =>
                        setCategoryForm({
                          ...categoryForm,
                          productType: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 text-sm font-medium text-gray-600 cursor-pointer"
                    >
                      <option value="">None (inherit from parent)</option>
                      {productTypes.map((type) => (
                        <option key={type.key} value={type.key}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">
                      The type's attributes apply to products in this category.
                    </p>
                  </div>

                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-1.5">
                      Rooms
                    </span>
                    {rooms.length === 0 ? (
                      <p className="text-xs text-gray-400">
                        No rooms defined yet.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-x-4 gap-y-2">
                        {rooms.map((room) => (
                          <label
                            key={room.slug}
                            className="flex items-center gap-2 cursor-pointer text-sm text-gray-700"
                          >
                            <input
                              type="checkbox"
                              checked={categoryForm.roomSlugs.includes(
                                room.slug,
                              )}
                              onChange={(e) =>
                                setCategoryForm({
                                  ...categoryForm,
                                  roomSlugs: e.target.checked
                                    ? [...categoryForm.roomSlugs, room.slug]
                                    : categoryForm.roomSlugs.filter(
                                        (slug) => slug !== room.slug,
                                      ),
                                })
                              }
                              className="w-4 h-4 rounded border-gray-300 text-[#025E5D] focus:ring-[#025E5D]"
                            />
                            {room.label}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Status
                      </label>
                      <select
                        value={categoryForm.status}
                        onChange={(e) =>
                          setCategoryForm({
                            ...categoryForm,
                            status: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 text-sm font-medium text-gray-600 cursor-pointer"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Sort Order
                      </label>
                      <input
                        type="number"
                        value={categoryForm.sortOrder}
                        onChange={(e) =>
                          setCategoryForm({
                            ...categoryForm,
                            sortOrder: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 text-sm font-medium text-gray-800"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={
                        createMutation.isPending || updateMutation.isPending
                      }
                      className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 text-sm cursor-pointer"
                    >
                      {editingCategory ? "Save Changes" : "Add Category"}
                    </button>
                  </div>
                </form>
              </Dialog>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
