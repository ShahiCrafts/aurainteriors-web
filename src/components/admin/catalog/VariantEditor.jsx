import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Edit2, Loader2, Lock, Plus, Trash2, X } from "lucide-react";
import { toast } from "react-toastify";
import Dialog from "../../common/Dialog";
import ConfirmationDialog from "../../modals/ConfirmationDialog";
import AttributeValueInput from "./AttributeValueInput";
import {
  useAttributeDefinitions,
  useCreateVariant,
  useDeleteVariant,
  useProductVariants,
  useUpdateVariant,
} from "../../../hooks/catalog/useCatalogTan";
import { useUpdateProduct } from "../../../hooks/product/useProductTan";
import formatError from "../../../utils/errorHandler";
import {
  isEmptyAttributeValue,
  isVariantOptionType,
  optionValueFromStored,
  validateAttributeValue,
} from "../../../utils/catalogAttributes";

// Phase 6 (catalog) — the product form's variant editor.
//
// variantOptionKeys are picked from scalar-typed attribute
// definitions only (the server rejects non-scalar axes; its message
// surfaces if it ever disagrees). Once variants exist the axes are
// locked — the server refuses to change them too — and the reason
// is shown instead of silently disabling the control. Variant
// add/edit is driven by the chosen axes + definitions; SKU is
// editable only on create (immutable server-side); duplicate
// combination and SKU conflicts come back as 409s and are shown
// verbatim in the form, never as a generic failure.

const inputClass =
  "w-full px-4 h-10 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all bg-white";
const labelClass = "block text-sm font-medium text-gray-700 mb-2";

const EMPTY_FORM = {
  sku: "",
  options: {},
  price: "",
  compareAtPrice: "",
  stock: "",
  enabled: true,
  images: [],
  imageDraft: "",
  weightValue: "",
  weightUnit: "kg",
  dimWidth: "",
  dimHeight: "",
  dimDepth: "",
  dimUnit: "cm",
  modelUrl: "",
};

export default function VariantEditor({ product }) {
  const { data: definitionsData } = useAttributeDefinitions();
  const definitions = useMemo(
    () => definitionsData?.data?.attributeDefinitions || [],
    [definitionsData]
  );
  const definitionByKey = useMemo(
    () => new Map(definitions.map((d) => [d.key, d])),
    [definitions]
  );

  const { data: variantsData, isLoading } = useProductVariants(product?._id);
  const variants = variantsData?.data?.variants || [];

  const updateProduct = useUpdateProduct();
  const createVariant = useCreateVariant();
  const updateVariant = useUpdateVariant();
  const deleteVariant = useDeleteVariant();

  const [optionKeysDraft, setOptionKeysDraft] = useState(null);
  const optionKeys = optionKeysDraft ?? product?.variantOptionKeys ?? [];
  const axesLocked = variants.length > 0;

  const [formOpen, setFormOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const axisDefinitions = useMemo(
    () =>
      definitions.filter(
        (d) =>
          (d.storage || "catalogAttributes") === "catalogAttributes" &&
          d.active !== false &&
          isVariantOptionType(d.type)
      ),
    [definitions]
  );

  const productImageUrls = useMemo(
    () =>
      (product?.images || [])
        .map((img) => (typeof img === "string" ? img : img?.url))
        .filter(Boolean),
    [product]
  );

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const toggleOptionKey = (key, checked) => {
    setOptionKeysDraft(
      checked ? [...optionKeys, key] : optionKeys.filter((k) => k !== key)
    );
  };

  const saveOptionKeys = async () => {
    try {
      await updateProduct.mutateAsync({
        id: product._id,
        data: { variantOptionKeys: optionKeys },
      });
      toast.success("Variant options updated");
      setOptionKeysDraft(null);
    } catch (err) {
      // e.g. a non-scalar axis slipped through: the server names it.
      toast.error(formatError(err, "Failed to update variant options"));
    }
  };

  const openCreate = () => {
    setEditingVariant(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = (variant) => {
    const options = {};
    for (const key of optionKeys) {
      const definition = definitionByKey.get(key);
      options[key] = definition
        ? optionValueFromStored(definition, variant.options?.[key])
        : variant.options?.[key] ?? "";
    }
    setEditingVariant(variant);
    setForm({
      sku: variant.sku || "",
      options,
      price: variant.price ?? "",
      compareAtPrice: variant.compareAtPrice ?? "",
      stock: variant.stock ?? "",
      enabled: variant.enabled !== false,
      images: variant.images || [],
      imageDraft: "",
      weightValue: variant.weight?.value ?? "",
      weightUnit: variant.weight?.unit || "kg",
      dimWidth: variant.dimensions?.width ?? "",
      dimHeight: variant.dimensions?.height ?? "",
      dimDepth: variant.dimensions?.depth ?? "",
      dimUnit: variant.dimensions?.unit || "cm",
      modelUrl: variant.modelUrl || "",
    });
    setFormError("");
    setFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const options = {};
    for (const key of optionKeys) {
      const definition = definitionByKey.get(key) || { key, label: key, type: "string" };
      const raw = form.options[key];
      if (isEmptyAttributeValue(definition, raw)) {
        setFormError(`Option "${definition.label}" is required for every variant.`);
        return;
      }
      const result = validateAttributeValue(definition, raw);
      if (!result.ok) {
        setFormError(`${definition.label}: ${result.error}`);
        return;
      }
      options[key] = result.value;
    }
    if (form.price === "" || Number.isNaN(Number(form.price)) || Number(form.price) < 0) {
      setFormError("Variant price must be a number of 0 or more.");
      return;
    }
    const payload = {
      options,
      price: Number(form.price),
      enabled: form.enabled,
      images: form.images,
    };
    if (!editingVariant) payload.sku = form.sku.trim();
    if (form.compareAtPrice !== "") payload.compareAtPrice = Number(form.compareAtPrice);
    if (form.stock !== "") payload.stock = Number(form.stock);
    if (form.weightValue !== "") {
      payload.weight = { value: Number(form.weightValue), unit: form.weightUnit };
    }
    if (form.dimWidth !== "" || form.dimHeight !== "" || form.dimDepth !== "") {
      payload.dimensions = {
        width: Number(form.dimWidth) || 0,
        height: Number(form.dimHeight) || 0,
        depth: Number(form.dimDepth) || 0,
        unit: form.dimUnit,
      };
    }
    if (form.modelUrl.trim()) payload.modelUrl = form.modelUrl.trim();

    setFormError("");
    try {
      if (editingVariant) {
        await updateVariant.mutateAsync({
          productId: product._id,
          variantId: editingVariant._id,
          data: payload,
        });
        toast.success("Variant updated");
      } else {
        await createVariant.mutateAsync({ productId: product._id, data: payload });
        toast.success("Variant added");
      }
      setFormOpen(false);
    } catch (err) {
      // 409 duplicate combination / SKU conflict and 400 validation
      // failures are shown with the server's own wording.
      setFormError(formatError(err, "Failed to save variant"));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteVariant.mutateAsync({
        productId: product._id,
        variantId: deleteTarget._id,
      });
      toast.success("Variant deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(formatError(err, "Failed to delete variant"));
      setDeleteTarget(null);
    }
  };

  const optionSummary = (variant) =>
    Object.entries(variant.options || {})
      .map(([key, value]) => `${definitionByKey.get(key)?.label || key}: ${value}`)
      .join(" · ");

  return (
    <div className="space-y-5">
      {/* Option axes */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Variant options</h3>
        {axesLocked ? (
          <div className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5">
            <Lock className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
            <p>
              Option axes are locked while variants exist (
              {optionKeys.length
                ? optionKeys
                    .map((key) => definitionByKey.get(key)?.label || key)
                    .join(", ")
                : "none"}
              ). Delete all variants to change them — the server rejects the change otherwise.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-2">
              Choose the attributes this product varies by. Only scalar types (text, list,
              yes/no, number, money, color) can be variant options.
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {axisDefinitions.map((definition) => (
                <label
                  key={definition.key}
                  className="flex items-center gap-2 cursor-pointer text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={optionKeys.includes(definition.key)}
                    onChange={(e) => toggleOptionKey(definition.key, e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#025E5D] focus:ring-[#025E5D]"
                  />
                  {definition.label}
                </label>
              ))}
              {axisDefinitions.length === 0 && (
                <p className="text-xs text-gray-400">No scalar attribute definitions exist yet.</p>
              )}
            </div>
            {optionKeysDraft !== null && (
              <button
                type="button"
                onClick={saveOptionKeys}
                disabled={updateProduct.isPending}
                className="mt-3 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
              >
                Save variant options
              </button>
            )}
          </>
        )}
      </div>

      {/* Variant table */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900">
            Variants {variants.length > 0 ? `(${variants.length})` : ""}
          </h3>
          <button
            type="button"
            onClick={openCreate}
            disabled={optionKeys.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Variant
          </button>
        </div>
        {optionKeys.length === 0 && (
          <p className="text-xs text-gray-400">
            Pick at least one variant option above before adding variants.
          </p>
        )}
        {isLoading ? (
          <p className="flex items-center gap-2 text-sm text-gray-400 py-4">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading variants…
          </p>
        ) : variants.length === 0 ? (
          <p className="text-sm text-gray-500 py-2">
            This product has no variants yet — it sells as a single item.
          </p>
        ) : (
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-400">
                  <th className="px-3 py-2 font-semibold">SKU</th>
                  <th className="px-3 py-2 font-semibold">Options</th>
                  <th className="px-3 py-2 font-semibold">Price</th>
                  <th className="px-3 py-2 font-semibold">Stock</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {variants.map((variant) => (
                  <tr key={variant._id}>
                    <td className="px-3 py-2 font-mono text-xs text-gray-700">{variant.sku}</td>
                    <td className="px-3 py-2 text-gray-600">{optionSummary(variant)}</td>
                    <td className="px-3 py-2 text-gray-700">
                      {variant.price}
                      {variant.compareAtPrice ? (
                        <span className="text-gray-400 line-through ml-1.5">
                          {variant.compareAtPrice}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-gray-700">{variant.stock ?? 0}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          variant.enabled !== false
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {variant.enabled !== false ? "Enabled" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-0.5 justify-end">
                        <button
                          type="button"
                          onClick={() => openEdit(variant)}
                          className="p-1.5 hover:bg-slate-100 text-gray-500 rounded-full transition-colors"
                          title="Edit variant"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(variant)}
                          className="p-1.5 hover:bg-red-50 text-red-500 rounded-full transition-colors"
                          title="Delete variant"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / edit variant dialog */}
      <AnimatePresence>
        {formOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
            onClick={() => setFormOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl"
            >
              <Dialog
                open
                onClose={() => setFormOpen(false)}
                label={editingVariant ? `Edit variant ${editingVariant.sku}` : "Add variant"}
                className="bg-white rounded-2xl w-full max-h-[90vh] overflow-y-auto relative"
              >
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {editingVariant ? "Edit Variant" : "Add Variant"}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setFormOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                  <div>
                    <label htmlFor="variant-sku" className={labelClass}>
                      SKU *
                    </label>
                    <input
                      id="variant-sku"
                      type="text"
                      value={form.sku}
                      disabled={Boolean(editingVariant)}
                      onChange={(e) => set({ sku: e.target.value })}
                      className={`${inputClass} font-mono disabled:bg-gray-50 disabled:text-gray-500`}
                      required={!editingVariant}
                    />
                    {editingVariant && (
                      <p className="text-xs text-gray-400 mt-1">
                        SKUs are immutable once a variant exists.
                      </p>
                    )}
                  </div>

                  {optionKeys.map((key) => {
                    const definition = definitionByKey.get(key) || {
                      key,
                      label: key,
                      type: "string",
                    };
                    return (
                      <AttributeValueInput
                        key={key}
                        definition={definition}
                        value={form.options[key]}
                        onChange={(value) =>
                          set({ options: { ...form.options, [key]: value } })
                        }
                        id={`variant-option-${key}`}
                      />
                    );
                  })}

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="variant-price" className={labelClass}>
                        Price *
                      </label>
                      <input
                        id="variant-price"
                        type="number"
                        min="0"
                        value={form.price}
                        onChange={(e) => set({ price: e.target.value })}
                        className={inputClass}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="variant-compare" className={labelClass}>
                        Compare-at
                      </label>
                      <input
                        id="variant-compare"
                        type="number"
                        min="0"
                        value={form.compareAtPrice}
                        onChange={(e) => set({ compareAtPrice: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="variant-stock" className={labelClass}>
                        Stock
                      </label>
                      <input
                        id="variant-stock"
                        type="number"
                        min="0"
                        step="1"
                        value={form.stock}
                        onChange={(e) => set({ stock: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.enabled}
                      onChange={(e) => set({ enabled: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-[#025E5D] focus:ring-[#025E5D]"
                    />
                    Enabled (customers can buy this variant)
                  </label>

                  {/* Images: variant images are URL strings on the
                      server — quick-pick from the product's images
                      or paste a URL. */}
                  <div>
                    <span className={labelClass}>Images</span>
                    {productImageUrls.length > 0 && (
                      <div className="flex flex-wrap gap-x-4 gap-y-2 mb-2">
                        {productImageUrls.map((url) => (
                          <label
                            key={url}
                            className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 max-w-full"
                          >
                            <input
                              type="checkbox"
                              checked={form.images.includes(url)}
                              onChange={(e) =>
                                set({
                                  images: e.target.checked
                                    ? [...form.images, url]
                                    : form.images.filter((i) => i !== url),
                                })
                              }
                              className="w-4 h-4 rounded border-gray-300 text-[#025E5D] focus:ring-[#025E5D]"
                            />
                            <span className="truncate max-w-[220px]">{url}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={form.imageDraft}
                        onChange={(e) => set({ imageDraft: e.target.value })}
                        className={inputClass}
                        placeholder="https://… image URL"
                        aria-label="Variant image URL"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const url = form.imageDraft.trim();
                          if (url && !form.images.includes(url)) {
                            set({ images: [...form.images, url], imageDraft: "" });
                          }
                        }}
                        className="px-3 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium shrink-0"
                      >
                        Add
                      </button>
                    </div>
                    {form.images.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {form.images.map((url) => (
                          <li
                            key={url}
                            className="flex items-center justify-between gap-2 text-xs text-gray-600 bg-gray-50 rounded-md px-2.5 py-1.5"
                          >
                            <span className="truncate">{url}</span>
                            <button
                              type="button"
                              aria-label={`Remove image ${url}`}
                              onClick={() =>
                                set({ images: form.images.filter((i) => i !== url) })
                              }
                              className="text-gray-400 hover:text-red-500 shrink-0"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className={labelClass}>Weight</span>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="0"
                          value={form.weightValue}
                          onChange={(e) => set({ weightValue: e.target.value })}
                          className={inputClass}
                          aria-label="Variant weight value"
                        />
                        <select
                          value={form.weightUnit}
                          onChange={(e) => set({ weightUnit: e.target.value })}
                          className="w-24 px-3 h-10 rounded-lg border border-gray-200 focus:border-teal-500 outline-none text-sm bg-white"
                          aria-label="Variant weight unit"
                        >
                          {["kg", "lb", "g"].map((unit) => (
                            <option key={unit} value={unit}>
                              {unit}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="variant-model-url" className={labelClass}>
                        3D model URL
                      </label>
                      <input
                        id="variant-model-url"
                        type="url"
                        value={form.modelUrl}
                        onChange={(e) => set({ modelUrl: e.target.value })}
                        className={inputClass}
                        placeholder="https://… .glb"
                      />
                    </div>
                  </div>

                  <div>
                    <span className={labelClass}>Dimensions</span>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        ["dimWidth", "Width"],
                        ["dimHeight", "Height"],
                        ["dimDepth", "Depth"],
                      ].map(([field, text]) => (
                        <div key={field}>
                          <label
                            htmlFor={`variant-${field}`}
                            className="block text-xs font-medium text-gray-500 mb-1"
                          >
                            {text}
                          </label>
                          <input
                            id={`variant-${field}`}
                            type="number"
                            min="0"
                            value={form[field]}
                            onChange={(e) => set({ [field]: e.target.value })}
                            className={inputClass}
                          />
                        </div>
                      ))}
                      <div>
                        <label
                          htmlFor="variant-dim-unit"
                          className="block text-xs font-medium text-gray-500 mb-1"
                        >
                          Unit
                        </label>
                        <select
                          id="variant-dim-unit"
                          value={form.dimUnit}
                          onChange={(e) => set({ dimUnit: e.target.value })}
                          className={inputClass}
                        >
                          {["cm", "m", "in"].map((unit) => (
                            <option key={unit} value={unit}>
                              {unit}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {formError && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                      {formError}
                    </p>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setFormOpen(false)}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createVariant.isPending || updateVariant.isPending}
                      className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 text-sm"
                    >
                      {createVariant.isPending || updateVariant.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                      ) : editingVariant ? (
                        "Save Variant"
                      ) : (
                        "Add Variant"
                      )}
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
        title="Delete Variant?"
        message={`Delete variant ${deleteTarget?.sku || ""}? Orders already placed keep their snapshot of it. This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmText="Delete"
        type="danger"
        isLoading={deleteVariant.isPending}
      />
    </div>
  );
}
