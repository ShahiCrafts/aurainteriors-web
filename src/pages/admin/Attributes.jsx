import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Edit2, Loader2, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "../../lib/toast";
import Dialog from "../../components/common/Dialog";
import Skeleton from "../../components/common/Skeleton";
import {
  useAttributeDefinitions,
  useCreateAttributeDefinition,
  useDeleteAttributeDefinition,
  useUpdateAttributeDefinition,
} from "../../hooks/catalog/useCatalogTan";
import formatError from "../../utils/errorHandler";

// Phase 6 (catalog) — attribute definition manager.
//
// Definitions drive the dynamic product form, the facet engine and
// the variant axes. The server owns the guards and this page
// surfaces them honestly: the key is immutable, a type/storage
// change is rejected while products carry values (the 400 is shown
// verbatim), delete is a soft deactivate by default and the
// permanent (hard) delete is refused while anything references the
// key — again with the server's message, never a fake success.

const ATTRIBUTE_TYPES = [
  "string",
  "enum",
  "multi-enum",
  "boolean",
  "integer",
  "decimal",
  "measurement",
  "money",
  "color",
  "dimensions",
];

const inputClass =
  "w-full px-4 h-10 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all bg-white";
const labelClass = "block text-sm font-medium text-gray-700 mb-2";

const EMPTY_FORM = {
  key: "",
  label: "",
  type: "string",
  storage: "catalogAttributes",
  fieldPath: "",
  appliesTo: "assigned",
  unit: "",
  allowedValues: [],
  acceptedUnits: [],
  min: "",
  max: "",
  step: "",
  maxLength: "",
  displayGroup: "",
  sortOrder: "",
  required: false,
  filterable: false,
  sortable: false,
  comparable: false,
  active: true,
};

function toForm(definition) {
  return {
    key: definition.key || "",
    label: definition.label || "",
    type: definition.type || "string",
    storage: definition.storage || "catalogAttributes",
    fieldPath: definition.fieldPath || "",
    appliesTo: definition.appliesTo || "assigned",
    unit: definition.unit || "",
    allowedValues: definition.allowedValues || [],
    acceptedUnits: definition.acceptedUnits || [],
    min: definition.min ?? "",
    max: definition.max ?? "",
    step: definition.step ?? "",
    maxLength: definition.maxLength ?? "",
    displayGroup: definition.displayGroup || "",
    sortOrder: definition.sortOrder ?? "",
    required: Boolean(definition.required),
    filterable: Boolean(definition.filterable),
    sortable: Boolean(definition.sortable),
    comparable: Boolean(definition.comparable),
    active: definition.active !== false,
  };
}

function TagEditor({ label, values, onChange, placeholder }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const next = draft.trim();
    if (next && !values.includes(next)) onChange([...values, next]);
    setDraft("");
  };
  return (
    <div>
      <span className={labelClass}>{label}</span>
      <div className="flex flex-wrap gap-2 mb-2">
        {values.map((item) => (
          <span
            key={item}
            className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md text-xs font-semibold"
          >
            {item}
            <button
              type="button"
              aria-label={`Remove ${item}`}
              onClick={() => onChange(values.filter((v) => v !== item))}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {values.length === 0 && <span className="text-xs text-gray-400 py-1.5">None yet</span>}
      </div>
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
        className={inputClass}
        placeholder={placeholder}
        aria-label={label}
      />
    </div>
  );
}

function FlagChip({ children }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
      {children}
    </span>
  );
}

export default function Attributes() {
  const { data, isLoading, error } = useAttributeDefinitions();
  const definitions = useMemo(
    () => data?.data?.attributeDefinitions || [],
    [data]
  );
  const createMutation = useCreateAttributeDefinition();
  const updateMutation = useUpdateAttributeDefinition();
  const deleteMutation = useDeleteAttributeDefinition();

  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  const visible = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return definitions;
    return definitions.filter(
      (d) =>
        d.key.toLowerCase().includes(q) ||
        (d.label || "").toLowerCase().includes(q) ||
        d.type.includes(q)
    );
  }, [definitions, searchQuery]);

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (definition) => {
    setEditing(definition);
    setForm(toForm(definition));
    setFormError("");
    setShowModal(true);
  };

  const buildPayload = () => {
    const payload = {
      label: form.label.trim(),
      type: form.type,
      storage: form.storage,
      appliesTo: form.appliesTo,
      required: form.required,
      filterable: form.filterable,
      sortable: form.sortable,
      comparable: form.comparable,
      active: form.active,
    };
    if (!editing) payload.key = form.key.trim();
    if (form.storage === "field") payload.fieldPath = form.fieldPath.trim();
    if (form.unit.trim()) payload.unit = form.unit.trim();
    if (["enum", "multi-enum", "color"].includes(form.type)) {
      payload.allowedValues = form.allowedValues;
    }
    if (["measurement", "dimensions"].includes(form.type)) {
      payload.acceptedUnits = form.acceptedUnits;
    }
    if (form.min !== "") payload.min = Number(form.min);
    if (form.max !== "") payload.max = Number(form.max);
    if (form.step !== "") payload.step = Number(form.step);
    if (form.maxLength !== "") payload.maxLength = Number(form.maxLength);
    if (form.displayGroup.trim()) payload.displayGroup = form.displayGroup.trim();
    if (form.sortOrder !== "") payload.sortOrder = Number(form.sortOrder);
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Mirror the server's cross-field guard so the admin sees it
    // before the round-trip; the server's own 400 still surfaces.
    if (form.min !== "" && form.max !== "" && Number(form.min) > Number(form.max)) {
      setFormError("Attribute min cannot exceed max");
      return;
    }
    if (form.storage === "field" && !form.fieldPath.trim()) {
      setFormError("fieldPath is required when storage is 'field'");
      return;
    }
    setFormError("");
    try {
      if (editing) {
        await updateMutation.mutateAsync({ key: editing.key, data: buildPayload() });
        toast.success("Attribute updated");
      } else {
        await createMutation.mutateAsync(buildPayload());
        toast.success("Attribute created");
      }
      setShowModal(false);
    } catch (err) {
      setFormError(formatError(err, "Failed to save attribute"));
    }
  };

  const handleDelete = async (hard) => {
    if (!deleteTarget) return;
    setDeleteError("");
    try {
      await deleteMutation.mutateAsync({ key: deleteTarget.key, hard });
      toast.success(hard ? "Attribute deleted permanently" : "Attribute deactivated");
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(formatError(err, "Failed to delete attribute"));
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
        <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Attributes</h2>
        <p className="text-gray-500">{formatError(error)}</p>
      </div>
    );
  }

  const showAllowedValues = ["enum", "multi-enum", "color"].includes(form.type);
  const showUnits = ["measurement", "money", "dimensions"].includes(form.type);
  const showAcceptedUnits = ["measurement", "dimensions"].includes(form.type);
  const showBounds = ["integer", "decimal", "money", "measurement"].includes(form.type);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attributes</h1>
          <p className="text-gray-500 mt-0.5 text-sm">
            The attribute registry behind product forms, filters and variant options.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Attribute
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by key, label or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition-all placeholder:text-gray-400 font-medium text-gray-800"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="divide-y divide-gray-50">
          {visible.map((definition) => (
            <div
              key={definition.key}
              data-testid={`attribute-row-${definition.key}`}
              className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 text-sm">{definition.label}</span>
                  <span className="font-mono text-xs text-gray-400">{definition.key}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                    {definition.type}
                  </span>
                  {definition.storage === "field" ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
                      Field: {definition.fieldPath}
                    </span>
                  ) : null}
                  {definition.appliesTo === "all" ? <FlagChip>Global</FlagChip> : null}
                  {definition.required ? <FlagChip>Required</FlagChip> : null}
                  {definition.filterable ? <FlagChip>Filterable</FlagChip> : null}
                  {definition.sortable ? <FlagChip>Sortable</FlagChip> : null}
                  {definition.comparable ? <FlagChip>Comparable</FlagChip> : null}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {definition.displayGroup || "Specifications"}
                  {definition.allowedValues?.length
                    ? ` · ${definition.allowedValues.length} allowed values`
                    : ""}
                  {definition.unit ? ` · unit ${definition.unit}` : ""}
                </p>
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 ${
                  definition.active !== false
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {definition.active !== false ? "Active" : "Inactive"}
              </span>
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={() => openEdit(definition)}
                  className="p-1.5 hover:bg-slate-100 text-gray-500 rounded-full transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setDeleteTarget(definition);
                    setDeleteError("");
                  }}
                  className="p-1.5 hover:bg-red-50 text-red-500 rounded-full transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {visible.length === 0 && (
            <p className="text-center text-sm text-gray-500 py-10">
              {searchQuery ? "No attributes match your search." : "No attribute definitions yet."}
            </p>
          )}
        </div>
      </div>

      {/* Create / edit modal */}
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
                label={editing ? `Edit attribute ${editing.key}` : "Add attribute"}
                className="bg-white rounded-2xl w-full max-h-[90vh] overflow-y-auto relative"
              >
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {editing ? "Edit Attribute" : "Add New Attribute"}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="attrdef-key" className={labelClass}>
                        Key *
                      </label>
                      <input
                        id="attrdef-key"
                        type="text"
                        value={form.key}
                        disabled={Boolean(editing)}
                        onChange={(e) => set({ key: e.target.value })}
                        className={`${inputClass} font-mono disabled:bg-gray-50 disabled:text-gray-500`}
                        placeholder="e.g. frameMaterial"
                        required={!editing}
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {editing
                          ? "Keys are immutable — they are stored on every product value."
                          : "camelCase, starts with a letter. Cannot be changed later."}
                      </p>
                    </div>
                    <div>
                      <label htmlFor="attrdef-label" className={labelClass}>
                        Label *
                      </label>
                      <input
                        id="attrdef-label"
                        type="text"
                        value={form.label}
                        onChange={(e) => set({ label: e.target.value })}
                        className={inputClass}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="attrdef-type" className={labelClass}>
                        Type *
                      </label>
                      <select
                        id="attrdef-type"
                        value={form.type}
                        onChange={(e) => set({ type: e.target.value })}
                        className={inputClass}
                      >
                        {ATTRIBUTE_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      {editing && (
                        <p className="text-xs text-gray-400 mt-1">
                          The server rejects a type or storage change while products carry
                          values for this attribute — its message will appear here.
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="attrdef-storage" className={labelClass}>
                        Storage
                      </label>
                      <select
                        id="attrdef-storage"
                        value={form.storage}
                        onChange={(e) => set({ storage: e.target.value })}
                        className={inputClass}
                      >
                        <option value="catalogAttributes">Product values (catalogAttributes)</option>
                        <option value="field">First-class product field</option>
                      </select>
                    </div>
                  </div>

                  {form.storage === "field" && (
                    <div>
                      <label htmlFor="attrdef-fieldpath" className={labelClass}>
                        Field path *
                      </label>
                      <input
                        id="attrdef-fieldpath"
                        type="text"
                        value={form.fieldPath}
                        onChange={(e) => set({ fieldPath: e.target.value })}
                        className={`${inputClass} font-mono`}
                        placeholder="e.g. dimensions"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="attrdef-applies" className={labelClass}>
                        Applies to
                      </label>
                      <select
                        id="attrdef-applies"
                        value={form.appliesTo}
                        onChange={(e) => set({ appliesTo: e.target.value })}
                        className={inputClass}
                      >
                        <option value="assigned">Assigned types & categories only</option>
                        <option value="all">All products (global)</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="attrdef-group" className={labelClass}>
                        Display group
                      </label>
                      <input
                        id="attrdef-group"
                        type="text"
                        value={form.displayGroup}
                        onChange={(e) => set({ displayGroup: e.target.value })}
                        className={inputClass}
                        placeholder="Specifications"
                      />
                    </div>
                  </div>

                  {showAllowedValues && (
                    <TagEditor
                      label="Allowed values"
                      values={form.allowedValues}
                      onChange={(allowedValues) => set({ allowedValues })}
                      placeholder="Type a value and press Enter"
                    />
                  )}

                  {showUnits && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="attrdef-unit" className={labelClass}>
                          {form.type === "money" ? "Unit / currency" : "Primary unit"}
                        </label>
                        <input
                          id="attrdef-unit"
                          type="text"
                          value={form.unit}
                          onChange={(e) => set({ unit: e.target.value })}
                          className={inputClass}
                          placeholder={form.type === "money" ? "NPR" : "cm"}
                        />
                      </div>
                      {showAcceptedUnits && (
                        <TagEditor
                          label="Also accepted units"
                          values={form.acceptedUnits}
                          onChange={(acceptedUnits) => set({ acceptedUnits })}
                          placeholder="e.g. in"
                        />
                      )}
                    </div>
                  )}

                  {showBounds && (
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="attrdef-min" className={labelClass}>
                          Min
                        </label>
                        <input
                          id="attrdef-min"
                          type="number"
                          value={form.min}
                          onChange={(e) => set({ min: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label htmlFor="attrdef-max" className={labelClass}>
                          Max
                        </label>
                        <input
                          id="attrdef-max"
                          type="number"
                          value={form.max}
                          onChange={(e) => set({ max: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label htmlFor="attrdef-step" className={labelClass}>
                          Step
                        </label>
                        <input
                          id="attrdef-step"
                          type="number"
                          value={form.step}
                          onChange={(e) => set({ step: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  )}

                  {form.type === "string" && (
                    <div>
                      <label htmlFor="attrdef-maxlength" className={labelClass}>
                        Max length
                      </label>
                      <input
                        id="attrdef-maxlength"
                        type="number"
                        value={form.maxLength}
                        onChange={(e) => set({ maxLength: e.target.value })}
                        className={inputClass}
                        placeholder="500"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="attrdef-sort" className={labelClass}>
                        Sort order
                      </label>
                      <input
                        id="attrdef-sort"
                        type="number"
                        value={form.sortOrder}
                        onChange={(e) => set({ sortOrder: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div className="flex flex-wrap items-end gap-x-4 gap-y-2 pb-1">
                      {[
                        ["required", "Required"],
                        ["filterable", "Filterable"],
                        ["sortable", "Sortable"],
                        ["comparable", "Comparable"],
                        ["active", "Active"],
                      ].map(([field, text]) => (
                        <label key={field} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={form[field]}
                            onChange={(e) => set({ [field]: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-300 text-[#025E5D] focus:ring-[#025E5D]"
                          />
                          {text}
                        </label>
                      ))}
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
                        "Create Attribute"
                      )}
                    </button>
                  </div>
                </form>
              </Dialog>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete dialog — soft deactivate vs permanent delete */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <Dialog
                open
                onClose={() => setDeleteTarget(null)}
                label={`Delete attribute ${deleteTarget.key}`}
                className="bg-white rounded-2xl w-full relative"
              >
                <div className="p-5 space-y-3">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Delete “{deleteTarget.label}”?
                  </h2>
                  <p className="text-sm text-gray-600">
                    Deactivating stops the attribute from resolving and accepting new values;
                    existing product values keep their meaning and it can be reactivated.
                    Permanent deletion is only possible while no product carries a value and
                    no category or product type references it — the server refuses otherwise.
                  </p>
                  {deleteError && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                      {deleteError}
                    </p>
                  )}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(null)}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(false)}
                      disabled={deleteMutation.isPending}
                      className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 text-sm"
                    >
                      Deactivate
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(true)}
                      disabled={deleteMutation.isPending}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 text-sm"
                    >
                      Delete permanently
                    </button>
                  </div>
                </div>
              </Dialog>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
