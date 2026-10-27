import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "../../../lib/toast";
import Dialog from "../../common/Dialog";
import AttributeValueInput from "./AttributeValueInput";
import {
  useAttributeDefinitions,
  useCategoryAssignments,
  useCategoryAttributes,
  useSetCategoryAssignments,
} from "../../../hooks/catalog/useCatalogTan";
import formatError from "../../../utils/errorHandler";
import {
  isEmptyAttributeValue,
  validateAttributeValue,
} from "../../../utils/catalogAttributes";

// Phase 6 (catalog) — per-category attribute assignment editor.
//
// Shows the category's RESOLVED attribute set (GET
// /catalog/categories/:id/attributes — global + product type +
// ancestor chain, each entry labelled with its source) next to the
// category's OWN assignment list (GET /categories/:id/attributes).
// Inherited rows are read-only with Override / Deactivate actions;
// own assignments are editable (required override, default value,
// display group, sort order, active). Saving PUTs the whole own
// list atomically — the server validates keys and default values
// and its errors are shown verbatim.

const inputClass =
  "w-full px-4 h-10 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all bg-white";
const smallLabelClass = "block text-xs font-medium text-gray-500 mb-1";

function toOwnEntry(assignment) {
  return {
    attributeKey: assignment.attributeKey,
    requiredMode:
      assignment.required === undefined || assignment.required === null
        ? "inherit"
        : assignment.required
          ? "required"
          : "optional",
    defaultValue: assignment.defaultValue,
    displayGroup: assignment.displayGroup || "",
    sortOrder: assignment.sortOrder === undefined || assignment.sortOrder === null ? "" : String(assignment.sortOrder),
    active: assignment.active !== false,
  };
}

function newOwnEntry(attributeKey) {
  return {
    attributeKey,
    requiredMode: "inherit",
    defaultValue: undefined,
    displayGroup: "",
    sortOrder: "",
    active: true,
  };
}

function sourceLabel(entry, categoryNameById) {
  if (entry.source === "global") return "Global default";
  if (entry.source === "type") return "From product type";
  if (entry.source === "category") {
    const name = entry.sourceCategoryId ? categoryNameById.get(String(entry.sourceCategoryId)) : null;
    return name ? `Inherited from ${name}` : "Inherited from an ancestor";
  }
  return entry.source || "";
}

function describeValue(definition, value) {
  if (value === undefined || value === null || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") {
    if ("value" in value && "unit" in value) return `${value.value} ${value.unit}`;
    if ("length" in value) return `${value.length}×${value.width}×${value.height} ${value.unit || ""}`.trim();
    return JSON.stringify(value);
  }
  return String(value);
}

export default function CategoryAttributesEditor({ category, categories = [], onClose }) {
  const categoryId = category?._id;
  const { data: definitionsData, isLoading: definitionsLoading } = useAttributeDefinitions();
  const { data: assignmentsData, isLoading: assignmentsLoading } = useCategoryAssignments(categoryId);
  const { data: resolutionData, isLoading: resolutionLoading } = useCategoryAttributes(categoryId);
  const setAssignments = useSetCategoryAssignments();

  const [ownEntries, setOwnEntries] = useState([]);
  const [initializedFor, setInitializedFor] = useState(null);
  const [pickerKey, setPickerKey] = useState("");
  const [saveError, setSaveError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const serverAssignments = useMemo(
    () => assignmentsData?.data?.assignments || [],
    [assignmentsData]
  );

  // Initialize the editable own-list from the server's list once
  // per category (render-phase adjustment — the sanctioned React
  // pattern for deriving state from a changed prop/query result;
  // later refetches must not clobber in-progress edits).
  if (categoryId && assignmentsData && initializedFor !== categoryId) {
    setOwnEntries(serverAssignments.map(toOwnEntry));
    setInitializedFor(categoryId);
    setSaveError("");
    setFieldErrors({});
  }

  const definitions = useMemo(
    () => definitionsData?.data?.attributeDefinitions || [],
    [definitionsData]
  );
  const definitionByKey = useMemo(
    () => new Map(definitions.map((d) => [d.key, d])),
    [definitions]
  );
  const resolved = useMemo(() => resolutionData?.data?.attributes || [], [resolutionData]);
  const categoryNameById = useMemo(
    () => new Map(categories.map((c) => [String(c._id), c.name])),
    [categories]
  );

  const ownByKey = useMemo(
    () => new Map(ownEntries.map((entry) => [entry.attributeKey, entry])),
    [ownEntries]
  );

  // Rows: resolved entries first (in resolution order), then own
  // assignments the resolution does not surface (deactivated here,
  // or pointing at an inactive/unknown definition).
  const rows = useMemo(() => {
    const resolvedKeys = new Set(resolved.map((entry) => entry.key));
    const extraOwn = ownEntries
      .filter((entry) => !resolvedKeys.has(entry.attributeKey))
      .map((entry) => ({ key: entry.attributeKey, ownOnly: true }));
    return [...resolved, ...extraOwn];
  }, [resolved, ownEntries]);

  const addableDefinitions = useMemo(
    () =>
      definitions.filter(
        (d) =>
          (d.storage || "catalogAttributes") === "catalogAttributes" &&
          d.active !== false &&
          !ownByKey.has(d.key)
      ),
    [definitions, ownByKey]
  );

  const isLoading = definitionsLoading || assignmentsLoading || resolutionLoading;

  const updateOwn = (attributeKey, patch) => {
    setOwnEntries((prev) =>
      prev.map((entry) => (entry.attributeKey === attributeKey ? { ...entry, ...patch } : entry))
    );
  };

  const addOwn = (attributeKey, seed = {}) => {
    if (!attributeKey || ownByKey.has(attributeKey)) return;
    setOwnEntries((prev) => [...prev, { ...newOwnEntry(attributeKey), ...seed }]);
  };

  const removeOwn = (attributeKey) => {
    setOwnEntries((prev) => prev.filter((entry) => entry.attributeKey !== attributeKey));
  };

  const handleSave = async () => {
    const assignments = [];
    const errors = {};
    for (const entry of ownEntries) {
      const definition = definitionByKey.get(entry.attributeKey);
      const out = { attributeKey: entry.attributeKey, active: entry.active };
      if (entry.requiredMode === "required") out.required = true;
      if (entry.requiredMode === "optional") out.required = false;
      if (definition && !isEmptyAttributeValue(definition, entry.defaultValue)) {
        const result = validateAttributeValue(definition, entry.defaultValue);
        if (!result.ok) {
          errors[entry.attributeKey] = `Default value: ${result.error}`;
        } else {
          out.defaultValue = result.value;
        }
      }
      if (entry.displayGroup.trim()) out.displayGroup = entry.displayGroup.trim();
      if (entry.sortOrder !== "") {
        const sortOrder = Number(entry.sortOrder);
        if (!Number.isInteger(sortOrder)) {
          errors[entry.attributeKey] = "Sort order must be a whole number";
        } else {
          out.sortOrder = sortOrder;
        }
      }
      assignments.push(out);
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setSaveError("Fix the highlighted assignment errors before saving.");
      return;
    }
    setSaveError("");
    try {
      await setAssignments.mutateAsync({ id: categoryId, assignments });
      toast.success("Attribute assignments saved");
      onClose();
    } catch (err) {
      // The server names the offending key (unknown definition,
      // field-storage key, invalid defaultValue) — show it as-is.
      setSaveError(formatError(err, "Failed to save assignments"));
    }
  };

  if (!category) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl"
      >
        <Dialog
          open
          onClose={onClose}
          label={`Attributes for ${category.name}`}
          className="bg-white rounded-2xl w-full max-h-[90vh] overflow-y-auto relative"
        >
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Attributes — {category.name}</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Inherited attributes apply from global defaults, the product type and ancestor
                categories. Overrides set here win for this category and its subcategories.
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Close">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-5 space-y-3 text-sm">
            {isLoading ? (
              <div className="flex items-center justify-center py-10 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading attributes…
              </div>
            ) : (
              <>
                {rows.length === 0 && (
                  <p className="text-gray-500 py-4 text-center">
                    No attributes apply to this category yet. Add an assignment below.
                  </p>
                )}
                {rows.map((row) => {
                  const key = row.key;
                  const definition = definitionByKey.get(key) || row;
                  const own = ownByKey.get(key);
                  const isOwn = Boolean(own);
                  // An own assignment with active:false deactivates
                  // the attribute for this category (it is the
                  // nearest level), even while the pre-save
                  // resolution still lists it.
                  const deactivatedHere = isOwn && own.active === false;
                  return (
                    <div key={key} className="border border-gray-100 rounded-xl p-4 bg-gray-50/40">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-900">{definition.label || key}</span>
                        <span className="font-mono text-xs text-gray-400">{key}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                          {definition.type}
                        </span>
                        {isOwn && !deactivatedHere ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-100">
                            Set here
                          </span>
                        ) : deactivatedHere ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-100">
                            Deactivated here
                          </span>
                        ) : row.source ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-100">
                            {sourceLabel(row, categoryNameById)}
                          </span>
                        ) : null}
                      </div>

                      {isOwn ? (
                        <div className="mt-3 space-y-3">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div>
                              <label htmlFor={`assign-required-${key}`} className={smallLabelClass}>
                                Required
                              </label>
                              <select
                                id={`assign-required-${key}`}
                                value={own.requiredMode}
                                onChange={(e) => updateOwn(key, { requiredMode: e.target.value })}
                                className={inputClass}
                              >
                                <option value="inherit">Inherit</option>
                                <option value="required">Required</option>
                                <option value="optional">Optional</option>
                              </select>
                            </div>
                            <div>
                              <label htmlFor={`assign-group-${key}`} className={smallLabelClass}>
                                Display group
                              </label>
                              <input
                                id={`assign-group-${key}`}
                                type="text"
                                value={own.displayGroup}
                                onChange={(e) => updateOwn(key, { displayGroup: e.target.value })}
                                className={inputClass}
                                placeholder="Inherit"
                              />
                            </div>
                            <div>
                              <label htmlFor={`assign-sort-${key}`} className={smallLabelClass}>
                                Sort order
                              </label>
                              <input
                                id={`assign-sort-${key}`}
                                type="number"
                                value={own.sortOrder}
                                onChange={(e) => updateOwn(key, { sortOrder: e.target.value })}
                                className={inputClass}
                                placeholder="Inherit"
                              />
                            </div>
                            <div>
                              <span className={smallLabelClass}>Applies here</span>
                              <label className="flex items-center gap-2 h-10 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={own.active}
                                  onChange={(e) => updateOwn(key, { active: e.target.checked })}
                                  className="w-4 h-4 rounded border-gray-300 text-[#025E5D] focus:ring-[#025E5D]"
                                />
                                <span className="text-sm text-gray-700">{own.active ? "Active" : "Deactivated"}</span>
                              </label>
                            </div>
                          </div>
                          <AttributeValueInput
                            definition={definition}
                            value={own.defaultValue}
                            onChange={(value) => updateOwn(key, { defaultValue: value })}
                            error={fieldErrors[key]}
                            id={`assign-default-${key}`}
                            labelText="Default value (blank = no override)"
                          />
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => removeOwn(key)}
                              className="text-xs font-semibold text-red-500 hover:text-red-600"
                            >
                              Remove this category's assignment
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs text-gray-500">
                            Required: {row.required ? "yes" : "no"} · Default: {describeValue(definition, row.defaultValue)} ·
                            Group: {row.displayGroup || "Specifications"}
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => addOwn(key)}
                              className="px-3 py-1.5 text-xs font-semibold bg-white border border-gray-200 rounded-lg hover:border-teal-500 hover:text-teal-700 transition-colors"
                            >
                              Override here
                            </button>
                            <button
                              type="button"
                              onClick={() => addOwn(key, { active: false })}
                              className="px-3 py-1.5 text-xs font-semibold bg-white border border-gray-200 rounded-lg hover:border-red-300 hover:text-red-600 transition-colors"
                            >
                              Deactivate here
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add an assignment for a definition not yet claimed */}
                <div className="flex gap-2 pt-2">
                  <select
                    value={pickerKey}
                    onChange={(e) => setPickerKey(e.target.value)}
                    className={inputClass}
                    aria-label="Attribute to assign"
                  >
                    <option value="">Add an assignment for…</option>
                    {addableDefinitions.map((d) => (
                      <option key={d.key} value={d.key}>
                        {d.label} ({d.key})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!pickerKey}
                    onClick={() => {
                      addOwn(pickerKey);
                      setPickerKey("");
                    }}
                    className="inline-flex items-center gap-1.5 px-4 h-10 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors shrink-0"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>

                {saveError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {saveError}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="flex gap-3 p-5 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading || setAssignments.isPending}
              className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 text-sm"
            >
              {setAssignments.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                "Save assignments"
              )}
            </button>
          </div>
        </Dialog>
      </motion.div>
    </motion.div>
  );
}
