import Skeleton from "../../common/Skeleton";
import { useEffect, useMemo, useState } from "react";
import AttributeValueInput from "./AttributeValueInput";
import {
  useCategoryAttributes,
  useProductTypeAttributes,
} from "../../../hooks/catalog/useCatalogTan";
import {
  buildAttributesPayload,
  isEmptyAttributeValue,
  mergeResolutions,
  validateAttributeValue,
} from "../../../utils/catalogAttributes";

// Phase 6 (catalog) — the product form's dynamic attribute section.
//
// Fetches the applicable-attributes resolution for the chosen
// category and overlays the explicitly selected product type
// (mirroring the server's resolveForProduct precedence), then
// renders one typed input per catalogAttributes-storage definition,
// grouped by displayGroup. storage:'field' definitions are NOT
// rendered — the product's existing first-class inputs own them
// (their names are listed so the mapping is visible). Stored values
// for keys outside the current resolution pass through untouched
// (a provided map replaces the stored map server-side, so dropping
// them would delete data). The section reports { resolved, values,
// passthrough } up so the page can validate and build the payload
// with the same shared utils the inputs are checked against.

export default function DynamicAttributesSection({
  categoryId,
  productType,
  storedAttributes,
  showErrors,
  onChange,
}) {
  const { data: categoryData, isLoading } = useCategoryAttributes(categoryId || null);
  const { data: typeData } = useProductTypeAttributes(productType || null);

  const resolved = useMemo(() => {
    const categoryAttributes = categoryData?.data?.attributes;
    if (!categoryAttributes) return [];
    const typeAttributes = productType ? typeData?.data?.attributes || null : null;
    return mergeResolutions(categoryAttributes, typeAttributes);
  }, [categoryData, typeData, productType]);

  const [values, setValues] = useState({});
  const [seededKeys, setSeededKeys] = useState(() => new Set());

  // Seed values the first time each key appears in the resolution:
  // the product's stored value wins, then the definition's default
  // (from its nearest assignment). Render-phase adjustment (the
  // sanctioned React pattern) so seeding happens before paint and
  // existing edits are never overwritten by a re-resolution.
  const unseeded = resolved.filter(
    (entry) =>
      (entry.storage || "catalogAttributes") === "catalogAttributes" &&
      !seededKeys.has(entry.key) &&
      values[entry.key] === undefined
  );
  if (unseeded.length > 0) {
    const additions = {};
    for (const entry of unseeded) {
      const stored = storedAttributes ? storedAttributes[entry.key] : undefined;
      additions[entry.key] = stored !== undefined ? stored : entry.defaultValue;
    }
    setValues((prev) => ({ ...prev, ...additions }));
    setSeededKeys((prev) => new Set([...prev, ...unseeded.map((entry) => entry.key)]));
  }

  const passthrough = useMemo(() => {
    const resolvedKeys = new Set(resolved.map((entry) => entry.key));
    const out = {};
    for (const [key, value] of Object.entries(storedAttributes || {})) {
      if (!resolvedKeys.has(key)) out[key] = value;
    }
    return out;
  }, [resolved, storedAttributes]);

  useEffect(() => {
    onChange({ resolved, values, passthrough });
  }, [resolved, values, passthrough, onChange]);

  const renderable = resolved.filter(
    (entry) => (entry.storage || "catalogAttributes") === "catalogAttributes"
  );
  const fieldEntries = resolved.filter((entry) => entry.storage === "field");

  const errors = {};
  for (const entry of renderable) {
    const value = values[entry.key];
    if (isEmptyAttributeValue(entry, value)) {
      if (showErrors && entry.required) errors[entry.key] = `${entry.label} is required`;
    } else {
      const result = validateAttributeValue(entry, value);
      if (!result.ok) errors[entry.key] = result.error;
    }
  }

  const groups = [];
  const groupIndex = new Map();
  for (const entry of renderable) {
    const group = entry.displayGroup || "Specifications";
    if (!groupIndex.has(group)) {
      groupIndex.set(group, groups.length);
      groups.push([group, []]);
    }
    groups[groupIndex.get(group)][1].push(entry);
  }

  const payloadPreview = buildAttributesPayload(resolved, values, passthrough).payload;

  return (
    <div className="space-y-6">
      {!categoryId && (
        <p className="text-sm text-gray-500">
          Choose a category in Basic Info to load the attributes that apply to it.
        </p>
      )}
      {categoryId && isLoading && (
        <div className="space-y-2" aria-busy="true">
          <span role="status" className="sr-only">Loading attributes…</span>
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      )}
      {categoryId && !isLoading && resolved.length === 0 && (
        <p className="text-sm text-gray-500">
          No attributes apply to this category. Assign some from the Categories page, or mark
          definitions as global in the Attributes page.
        </p>
      )}

      {groups.map(([group, entries]) => (
        <div key={group}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
            {group}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {entries.map((entry) => (
              <div key={entry.key} className={entry.type === "dimensions" ? "col-span-2" : ""}>
                <AttributeValueInput
                  definition={entry}
                  value={values[entry.key]}
                  onChange={(value) =>
                    setValues((prev) => ({ ...prev, [entry.key]: value }))
                  }
                  error={errors[entry.key]}
                />
                {entry.source && (
                  <p className="text-[11px] text-gray-400 mt-1">
                    {entry.source === "global"
                      ? "Applies globally"
                      : entry.source === "type"
                        ? "From the product type"
                        : "From the category"}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {fieldEntries.length > 0 && (
        <p className="text-xs text-gray-400">
          Also applicable, edited in the standard product fields:{" "}
          {fieldEntries.map((entry) => entry.label).join(", ")}.
        </p>
      )}

      {Object.keys(passthrough).length > 0 && (
        <p className="text-xs text-gray-400">
          This product also carries stored values for{" "}
          {Object.keys(passthrough).join(", ")}, which do not apply to the current category.
          They are kept unchanged on save.
        </p>
      )}

      {renderable.length > 0 && (
        <details className="text-xs text-gray-400">
          <summary className="cursor-pointer font-medium">Raw values (read-only)</summary>
          <pre className="mt-2 bg-gray-50 border border-gray-100 rounded-lg p-3 overflow-x-auto">
            {JSON.stringify(payloadPreview, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
