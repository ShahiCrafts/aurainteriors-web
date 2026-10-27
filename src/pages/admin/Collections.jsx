import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Edit2, Loader2, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "react-toastify";
import Dialog from "../../components/common/Dialog";
import Skeleton from "../../components/common/Skeleton";
import ConfirmationDialog from "../../components/modals/ConfirmationDialog";
import {
  useAttributeDefinitions,
  useCollection,
  useCollections,
  useCreateCollection,
  useDeleteCollection,
  useUpdateCollection,
} from "../../hooks/catalog/useCatalogTan";
import { useProducts } from "../../hooks/product/useProductTan";
import formatError from "../../utils/errorHandler";

// Phase 6 (catalog) — collections admin.
//
// Manual collections hold an explicit ordered product list (the
// picker below searches the product catalog; the server verifies
// every id exists and dedupes). Rule collections are evaluated at
// read time from their rule type + params — new-arrivals takes a
// window in days, best-sellers a limit, attribute-match an
// attribute key + scalar value taken from the definition registry.
// The slug is immutable on edit. Same recorded API gap as rooms
// and product types: the list is the public active-only one.

const inputClass =
  "w-full px-4 h-10 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all bg-white";
const labelClass = "block text-sm font-medium text-gray-700 mb-2";

const RULE_TYPES = ["new-arrivals", "best-sellers", "featured", "on-sale", "attribute-match"];
const SCALAR_TYPES = ["string", "enum", "boolean", "integer", "decimal", "money", "color"];

const EMPTY_FORM = {
  slug: "",
  label: "",
  description: "",
  image: "",
  kind: "manual",
  sortOrder: "",
  active: true,
  productIds: [],
  ruleType: "new-arrivals",
  windowDays: 30,
  limit: 20,
  attrKey: "",
  attrValue: "",
};

function ManualProductPicker({ selectedIds, onChange, seedNames }) {
  const [query, setQuery] = useState("");
  const [names, setNames] = useState({});
  const [appliedSeed, setAppliedSeed] = useState(null);

  // Names for already-selected products arrive from the collection
  // detail (resolved products); names of products added here are
  // learned from the search results. Unknown ids show the raw id.
  // (Render-phase adjustment: merge each new seed once, never
  // clobbering names learned in this session.)
  if (seedNames && seedNames !== appliedSeed) {
    setNames((prev) => ({ ...seedNames, ...prev }));
    setAppliedSeed(seedNames);
  }

  const { data } = useProducts({ search: query, limit: 10, page: 1, status: "all" });
  const results = (data?.data?.products || []).filter((p) => !selectedIds.includes(p._id));

  const add = (product) => {
    setNames((prev) => ({ ...prev, [product._id]: product.name }));
    onChange([...selectedIds, product._id]);
  };

  return (
    <div className="space-y-3">
      <div>
        <span className={labelClass}>Selected products ({selectedIds.length})</span>
        {selectedIds.length === 0 ? (
          <p className="text-xs text-gray-400">No products selected yet — search below to add.</p>
        ) : (
          <ul className="space-y-1.5">
            {selectedIds.map((id) => (
              <li
                key={id}
                className="flex items-center justify-between gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2"
              >
                <span className="text-sm text-gray-700 truncate">
                  {names[id] || <span className="font-mono text-xs">{id}</span>}
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${names[id] || id}`}
                  onClick={() => onChange(selectedIds.filter((x) => x !== id))}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <label htmlFor="collection-product-search" className={labelClass}>
          Search products
        </label>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="collection-product-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`${inputClass} pl-10`}
            placeholder="Search by name or SKU…"
          />
        </div>
        {query.trim() && (
          <ul className="mt-2 space-y-1.5">
            {results.map((product) => (
              <li
                key={product._id}
                className="flex items-center justify-between gap-2 border border-gray-100 rounded-lg px-3 py-2"
              >
                <span className="text-sm text-gray-700 truncate">
                  {product.name}
                  {product.price !== undefined && (
                    <span className="text-gray-400 text-xs ml-2">{product.price}</span>
                  )}
                </span>
                <button
                  type="button"
                  aria-label={`Add ${product.name}`}
                  onClick={() => add(product)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-semibold shrink-0"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </li>
            ))}
            {results.length === 0 && (
              <li className="text-xs text-gray-400 px-1 py-1">
                No matching products that are not already selected.
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function Collections() {
  const { data, isLoading, error } = useCollections();
  const collections = data?.data?.collections || [];
  const { data: definitionsData } = useAttributeDefinitions();
  const definitions = useMemo(
    () => definitionsData?.data?.attributeDefinitions || [],
    [definitionsData]
  );
  const createMutation = useCreateCollection();
  const updateMutation = useUpdateCollection();
  const deleteMutation = useDeleteCollection();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Resolved products of the collection being edited — the source
  // of display names for its stored productIds.
  const { data: detailData } = useCollection(editing?.slug || null, { limit: 100 });
  const seedNames = useMemo(() => {
    const out = {};
    for (const product of detailData?.data?.products || []) {
      out[product._id] = product.name;
    }
    return out;
  }, [detailData]);

  const scalarDefinitions = useMemo(
    () =>
      definitions.filter(
        (d) =>
          (d.storage || "catalogAttributes") === "catalogAttributes" &&
          d.active !== false &&
          SCALAR_TYPES.includes(d.type)
      ),
    [definitions]
  );
  const attrDefinition = scalarDefinitions.find((d) => d.key === form.attrKey);

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (collection) => {
    setEditing(collection);
    setForm({
      slug: collection.slug || "",
      label: collection.label || "",
      description: collection.description || "",
      image: collection.image || "",
      kind: collection.kind || "manual",
      sortOrder: collection.sortOrder ?? "",
      active: collection.active !== false,
      productIds: collection.productIds || [],
      ruleType: collection.rule?.type || "new-arrivals",
      windowDays: collection.rule?.params?.windowDays ?? 30,
      limit: collection.rule?.params?.limit ?? 20,
      attrKey: collection.rule?.params?.key || "",
      attrValue:
        collection.rule?.params?.value !== undefined && collection.rule?.params?.value !== null
          ? String(collection.rule.params.value)
          : "",
    });
    setFormError("");
    setShowModal(true);
  };

  const buildRule = () => {
    const params = {};
    if (form.ruleType === "new-arrivals") {
      params.windowDays = Number(form.windowDays) || 30;
    } else if (form.ruleType === "best-sellers") {
      params.limit = Number(form.limit) || 20;
    } else if (form.ruleType === "attribute-match") {
      let value = form.attrValue;
      if (attrDefinition?.type === "boolean") value = form.attrValue === "true";
      else if (attrDefinition && ["integer", "decimal", "money"].includes(attrDefinition.type)) {
        value = Number(form.attrValue);
      }
      params.key = form.attrKey;
      params.value = value;
    }
    return { type: form.ruleType, params };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.kind === "rule" && form.ruleType === "attribute-match" && !form.attrKey) {
      setFormError("Choose the attribute an attribute-match rule matches on.");
      return;
    }
    const payload = {
      label: form.label.trim(),
      description: form.description.trim(),
      image: form.image.trim(),
      kind: form.kind,
      active: form.active,
    };
    if (!editing) payload.slug = form.slug.trim();
    if (form.sortOrder !== "") payload.sortOrder = Number(form.sortOrder);
    if (form.kind === "manual") payload.productIds = form.productIds;
    if (form.kind === "rule") payload.rule = buildRule();
    setFormError("");
    try {
      if (editing) {
        await updateMutation.mutateAsync({ slug: editing.slug, data: payload });
        toast.success("Collection updated");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Collection created");
      }
      setShowModal(false);
    } catch (err) {
      setFormError(formatError(err, "Failed to save collection"));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.slug);
      toast.success("Collection deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(formatError(err, "Failed to delete collection"));
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
        <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Collections</h2>
        <p className="text-gray-500">{formatError(error)}</p>
      </div>
    );
  }

  const ruleSummary = (collection) => {
    if (collection.kind !== "rule") return `${collection.productIds?.length || 0} products`;
    const { type, params } = collection.rule || {};
    if (type === "new-arrivals") return `New in the last ${params?.windowDays ?? 30} days`;
    if (type === "best-sellers") return `Top ${params?.limit ?? 20} by units sold`;
    if (type === "attribute-match") return `Matches ${params?.key} = ${params?.value}`;
    return type || "rule";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Collections</h1>
          <p className="text-gray-500 mt-0.5 text-sm">
            Curated product lists — picked by hand, or computed by a rule at read time.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Collection
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="divide-y divide-gray-50">
          {collections.map((collection) => (
            <div
              key={collection.slug}
              data-testid={`collection-row-${collection.slug}`}
              className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 text-sm">{collection.label}</span>
                  <span className="font-mono text-xs text-gray-400">{collection.slug}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      collection.kind === "rule"
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {collection.kind === "rule" ? "Rule" : "Manual"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{ruleSummary(collection)}</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 shrink-0">
                Active
              </span>
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={() => openEdit(collection)}
                  className="p-1.5 hover:bg-slate-100 text-gray-500 rounded-full transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteTarget(collection)}
                  className="p-1.5 hover:bg-red-50 text-red-500 rounded-full transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {collections.length === 0 && (
            <p className="text-center text-sm text-gray-500 py-10">No collections defined yet.</p>
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
              className="w-full max-w-2xl"
            >
              <Dialog
                open
                onClose={() => setShowModal(false)}
                label={editing ? `Edit collection ${editing.label}` : "Add collection"}
                className="bg-white rounded-2xl w-full max-h-[90vh] overflow-y-auto relative"
              >
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {editing ? "Edit Collection" : "Add New Collection"}
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
                      <label htmlFor="collection-label" className={labelClass}>
                        Label *
                      </label>
                      <input
                        id="collection-label"
                        type="text"
                        value={form.label}
                        onChange={(e) => set({ label: e.target.value })}
                        className={inputClass}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="collection-slug" className={labelClass}>
                        Slug {editing ? "" : "*"}
                      </label>
                      <input
                        id="collection-slug"
                        type="text"
                        value={form.slug}
                        disabled={Boolean(editing)}
                        onChange={(e) => set({ slug: e.target.value })}
                        className={`${inputClass} font-mono disabled:bg-gray-50 disabled:text-gray-500`}
                        placeholder="editors-picks"
                        required={!editing}
                      />
                      {editing && (
                        <p className="text-xs text-gray-400 mt-1">Slugs are immutable.</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="collection-description" className={labelClass}>
                      Description
                    </label>
                    <textarea
                      id="collection-description"
                      value={form.description}
                      onChange={(e) => set({ description: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all bg-white resize-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="collection-image" className={labelClass}>
                      Image URL
                    </label>
                    <input
                      id="collection-image"
                      type="url"
                      value={form.image}
                      onChange={(e) => set({ image: e.target.value })}
                      className={inputClass}
                      placeholder="https://…"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4 items-end">
                    <div>
                      <label htmlFor="collection-kind" className={labelClass}>
                        Kind
                      </label>
                      <select
                        id="collection-kind"
                        value={form.kind}
                        onChange={(e) => set({ kind: e.target.value })}
                        className={inputClass}
                      >
                        <option value="manual">Manual list</option>
                        <option value="rule">Rule-based</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="collection-sort" className={labelClass}>
                        Sort order
                      </label>
                      <input
                        id="collection-sort"
                        type="number"
                        value={form.sortOrder}
                        onChange={(e) => set({ sortOrder: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 pb-2.5">
                      <input
                        type="checkbox"
                        checked={form.active}
                        onChange={(e) => set({ active: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-[#025E5D] focus:ring-[#025E5D]"
                      />
                      Active
                    </label>
                  </div>
                  {editing && !form.active && (
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      Heads up: this list reads the public active-only endpoint, so a
                      deactivated collection disappears from this page until an admin list
                      endpoint ships (recorded as a server request). It can be reactivated
                      through the API.
                    </p>
                  )}

                  {form.kind === "manual" ? (
                    <ManualProductPicker
                      selectedIds={form.productIds}
                      onChange={(productIds) => set({ productIds })}
                      seedNames={seedNames}
                    />
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="collection-rule-type" className={labelClass}>
                          Rule type
                        </label>
                        <select
                          id="collection-rule-type"
                          value={form.ruleType}
                          onChange={(e) => set({ ruleType: e.target.value })}
                          className={inputClass}
                        >
                          {RULE_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>
                      {form.ruleType === "new-arrivals" && (
                        <div>
                          <label htmlFor="collection-window" className={labelClass}>
                            Window (days)
                          </label>
                          <input
                            id="collection-window"
                            type="number"
                            min="1"
                            max="365"
                            value={form.windowDays}
                            onChange={(e) => set({ windowDays: e.target.value })}
                            className={inputClass}
                          />
                        </div>
                      )}
                      {form.ruleType === "best-sellers" && (
                        <div>
                          <label htmlFor="collection-limit" className={labelClass}>
                            Limit
                          </label>
                          <input
                            id="collection-limit"
                            type="number"
                            min="1"
                            max="100"
                            value={form.limit}
                            onChange={(e) => set({ limit: e.target.value })}
                            className={inputClass}
                          />
                        </div>
                      )}
                      {form.ruleType === "attribute-match" && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="collection-attr-key" className={labelClass}>
                              Attribute
                            </label>
                            <select
                              id="collection-attr-key"
                              value={form.attrKey}
                              onChange={(e) => set({ attrKey: e.target.value, attrValue: "" })}
                              className={inputClass}
                            >
                              <option value="">Choose an attribute…</option>
                              {scalarDefinitions.map((d) => (
                                <option key={d.key} value={d.key}>
                                  {d.label} ({d.key})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label htmlFor="collection-attr-value" className={labelClass}>
                              Value
                            </label>
                            {attrDefinition && (attrDefinition.allowedValues || []).length > 0 ? (
                              <select
                                id="collection-attr-value"
                                value={form.attrValue}
                                onChange={(e) => set({ attrValue: e.target.value })}
                                className={inputClass}
                              >
                                <option value="">Choose…</option>
                                {attrDefinition.allowedValues.map((value) => (
                                  <option key={value} value={value}>
                                    {value}
                                  </option>
                                ))}
                              </select>
                            ) : attrDefinition?.type === "boolean" ? (
                              <select
                                id="collection-attr-value"
                                value={form.attrValue}
                                onChange={(e) => set({ attrValue: e.target.value })}
                                className={inputClass}
                              >
                                <option value="">Choose…</option>
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                              </select>
                            ) : (
                              <input
                                id="collection-attr-value"
                                type="text"
                                value={form.attrValue}
                                onChange={(e) => set({ attrValue: e.target.value })}
                                className={inputClass}
                              />
                            )}
                          </div>
                        </div>
                      )}
                      {(form.ruleType === "featured" || form.ruleType === "on-sale") && (
                        <p className="text-xs text-gray-400">
                          This rule needs no parameters — it is evaluated from product flags
                          and prices at read time.
                        </p>
                      )}
                    </div>
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
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 text-sm"
                    >
                      {createMutation.isPending || updateMutation.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                      ) : editing ? (
                        "Save Changes"
                      ) : (
                        "Create Collection"
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
        title="Delete Collection?"
        message={`Delete the collection "${deleteTarget?.label || ""}"? Products themselves are not affected. This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmText="Delete"
        type="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
