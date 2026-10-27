import Dialog from "../../../components/common/Dialog";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Box,
  FileText,
  Layers,
  SlidersHorizontal,
  Boxes,
} from "lucide-react";
import BasicInfoTab from "./tabs/BasicInfoTab";
import AttributesTab from "./tabs/AttributesTab";
import ModelTab from "./tabs/ModelTab";
import DetailsTab from "./tabs/DetailsTab";
import VariantsTab from "./tabs/VariantsTab";

// Phase 7 split (from Products.jsx) — the create/edit product
// drawer shell: Dialog + tab navigation + footer, orchestrating
// the tab components. Shell markup moved verbatim; all form state
// arrives via the useProductFormState return (`form`).
export default function ProductFormDrawer({ form, categories }) {
  const {
    modalOpen,
    setModalOpen,
    editingProduct,
    activeTab,
    setActiveTab,
    productForm,
    handleSaveProduct,
    createMutation,
    updateMutation,
  } = form;

  return (
    <>
    {/* Add/Edit Product Modal */}
    <AnimatePresence>
      {modalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-xl"
            onClick={(e) => e.stopPropagation()}
          >
           <Dialog open onClose={() => setModalOpen(false)} label="Product" className="bg-white rounded-2xl shadow-2xl w-full max-h-[80vh] overflow-hidden flex flex-col relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-6">
              {[
                { id: "basic", label: "Basic Info", icon: FileText },
                { id: "attributes", label: "Attributes", icon: SlidersHorizontal },
                { id: "3dmodel", label: "3D Model", icon: Box },
                { id: "details", label: "Details", icon: Layers },
                ...(editingProduct
                  ? [{ id: "variants", label: "Variants", icon: Boxes }]
                  : []),
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${activeTab === tab.id
                    ? "border-teal-600 text-teal-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                >
                  <tab.icon className="w-4.5 h-4.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
                {activeTab === "basic" && (
                  <BasicInfoTab form={form} categories={categories} />
                )}

                {activeTab === "3dmodel" && <ModelTab form={form} />}

                {activeTab === "details" && <DetailsTab form={form} />}

              {/* Attributes Tab — kept mounted (hidden) so the
                  resolution loads and required-attribute validation
                  works even if the tab was never opened. */}
              <div className={activeTab === "attributes" ? "" : "hidden"}>
                <AttributesTab form={form} />
              </div>

              {/* Variants Tab — edit mode only, also mounted-but-
                  hidden so the variant list is ready. */}
              {editingProduct && (
                <div className={activeTab === "variants" ? "" : "hidden"}>
                  <VariantsTab editingProduct={editingProduct} />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-100">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={
                  !productForm.name ||
                  !productForm.price ||
                  !productForm.category ||
                  createMutation.isPending ||
                  updateMutation.isPending
                }
                className="flex-1 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {editingProduct ? "Update Product" : "Add Product"}
              </button>
            </div>
           </Dialog>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
