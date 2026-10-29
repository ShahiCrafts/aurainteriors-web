import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Edit2, Plus, Trash2, X } from "lucide-react";
import { toast } from "../../lib/toast";
import Dialog from "../../components/common/Dialog";
import Skeleton from "../../components/common/Skeleton";
import ConfirmationDialog from "../../components/modals/ConfirmationDialog";
import {
  useAttributeDefinitions,
  useCreateProductType,
  useDeleteProductType,
  useProductTypes,
  useUpdateProductType,
} from "../../hooks/catalog/useCatalogTan";
import formatError from "../../utils/errorHandler";

const inputClass =
  "w-full px-4 h-10 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all bg-white";
const labelClass = "block text-sm font-medium text-gray-700 mb-2";

const EMPTY_FORM = {
  key: "",
  label: "",
  description: "",
  categoryKey: "",
  attributeKeys: [],
  sortOrder: "",
  active: true,
};

export default function ProductTypes() {
  const { data, isLoading, error } = useProductTypes();
  const productTypes = data?.data?.productTypes || [];
  const { data: definitionsData } = useAttributeDefinitions();
  const definitions = definitionsData?.data?.attributeDefinitions || [];
  const createMutation = useCreateProductType();
  const updateMutation = useUpdateProductType();
  const deleteMutation = useDeleteProductType();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (type) => {
    setEditing(type);
    setForm({
      key: type.key || "",
      label: type.label || "",
      description: type.description || "",
      categoryKey: type.categoryKey || "",
      attributeKeys: type.attributeKeys || [],
      sortOrder: type.sortOrder ?? "",
      active: type.active !== false,
    });
    setFormError("");
    setShowModal(true);
  };

  const toggleAttributeKey = (key, checked) => {
    set({
      attributeKeys: checked
        ? [...form.attributeKeys, key]
        : form.attributeKeys.filter((k) => k !== key),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      label: form.label.trim(),
      description: form.description.trim(),
      categoryKey: form.categoryKey.trim(),
      attributeKeys: form.attributeKeys,
      active: form.active,
    };
    if (!editing) payload.key = form.key.trim();
    if (form.sortOrder !== "") payload.sortOrder = Number(form.sortOrder);
    setFormError("");
    try {
      if (editing) {
        await updateMutation.mutateAsync({ key: editing.key, data: payload });
        toast.success("Product type updated");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Product type created");
      }
      setShowModal(false);
    } catch (err) {
      setFormError(formatError(err, "Failed to save product type"));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.key);
      toast.success("Product type deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(formatError(err, "Failed to delete product type"));
      setDeleteTarget(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
        <h2 className="text-xl font-semibold text-red-600 mb-2">
          Error Loading Product Types
        </h2>
        <p className="text-gray-500">{formatError(error)}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Types</h1>
          <p className="text-gray-500 mt-0.5 text-sm">
            Types group the attributes that apply to a category's products.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Product Type
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="divide-y divide-gray-50">
          {productTypes.map((type) => (
            <div
              key={type.key}
              data-testid={`product-type-row-${type.key}`}
              className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 text-sm">
                    {type.label}
                  </span>
                  <span className="font-mono text-xs text-gray-400">
                    {type.key}
                  </span>
                  {type.categoryKey && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                      {type.categoryKey}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {type.attributeKeys?.length || 0} attributes
                  {type.description ? ` · ${type.description}` : ""}
                </p>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 shrink-0">
                Active
              </span>
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={() => openEdit(type)}
                  className="p-1.5 hover:bg-slate-100 text-gray-500 rounded-full transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteTarget(type)}
                  className="p-1.5 hover:bg-red-50 text-red-500 rounded-full transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {productTypes.length === 0 && (
            <p className="text-center text-sm text-gray-500 py-10">
              No product types defined yet.
            </p>
          )}
        </div>
      </div>

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
                label={
                  editing
                    ? `Edit product type ${editing.label}`
                    : "Add product type"
                }
                className="bg-white rounded-2xl w-full max-h-[90vh] overflow-y-auto relative"
              >
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {editing ? "Edit Product Type" : "Add New Product Type"}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="type-key" className={labelClass}>
                        Key {editing ? "" : "*"}
                      </label>
                      <input
                        id="type-key"
                        type="text"
                        value={form.key}
                        disabled={Boolean(editing)}
                        onChange={(e) => set({ key: e.target.value })}
                        className={`${inputClass} font-mono disabled:bg-gray-50 disabled:text-gray-500`}
                        placeholder="e.g. sofa"
                        required={!editing}
                      />
                      {editing && (
                        <p className="text-xs text-gray-400 mt-1">
                          Keys are immutable.
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="type-label" className={labelClass}>
                        Label *
                      </label>
                      <input
                        id="type-label"
                        type="text"
                        value={form.label}
                        onChange={(e) => set({ label: e.target.value })}
                        className={inputClass}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="type-description" className={labelClass}>
                      Description
                    </label>
                    <textarea
                      id="type-description"
                      value={form.description}
                      onChange={(e) => set({ description: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all bg-white resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="type-category-key" className={labelClass}>
                        Category group key
                      </label>
                      <input
                        id="type-category-key"
                        type="text"
                        value={form.categoryKey}
                        onChange={(e) => set({ categoryKey: e.target.value })}
                        className={`${inputClass} font-mono`}
                        placeholder="e.g. furniture"
                      />
                    </div>
                    <div>
                      <label htmlFor="type-sort" className={labelClass}>
                        Sort order
                      </label>
                      <input
                        id="type-sort"
                        type="number"
                        value={form.sortOrder}
                        onChange={(e) => set({ sortOrder: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <span className={labelClass}>Attributes</span>
                    <p className="text-xs text-gray-400 mb-2">
                      These attributes apply to products of this type. Sent to
                      the server exactly as defined — keys are case-sensitive.
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 max-h-48 overflow-y-auto pr-1">
                      {definitions.map((definition) => (
                        <label
                          key={definition.key}
                          className="flex items-center gap-2 cursor-pointer text-sm text-gray-700"
                        >
                          <input
                            type="checkbox"
                            checked={form.attributeKeys.includes(
                              definition.key,
                            )}
                            onChange={(e) =>
                              toggleAttributeKey(
                                definition.key,
                                e.target.checked,
                              )
                            }
                            className="w-4 h-4 rounded border-gray-300 text-[#025E5D] focus:ring-[#025E5D]"
                          />
                          {definition.label}
                          <span className="font-mono text-[11px] text-gray-400">
                            {definition.key}
                          </span>
                        </label>
                      ))}
                      {definitions.length === 0 && (
                        <p className="text-xs text-gray-400">
                          No attribute definitions exist yet.
                        </p>
                      )}
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) => set({ active: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-[#025E5D] focus:ring-[#025E5D]"
                    />
                    Active
                  </label>
                  {editing && !form.active && (
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      Heads up: this list reads the public active-only endpoint,
                      so a deactivated type disappears from this page until an
                      admin list endpoint ships (recorded as a server request).
                      It can be reactivated through the API.
                    </p>
                  )}
                  {formError && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                      {formError}
                    </p>
                  )}
                  <div className="flex gap-3 pt-2">
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
                      className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 text-sm"
                    >
                      {editing ? "Save Changes" : "Create Product Type"}
                    </button>
                  </div>
                </form>
              </Dialog>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmationDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Product Type?"
        message={`Delete the product type "${deleteTarget?.label || ""}"? The server refuses while categories use it and suggests deactivating instead — its message will be shown if it refuses.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmText="Delete"
        type="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
