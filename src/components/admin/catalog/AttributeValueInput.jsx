import { useState } from "react";
import { X } from "lucide-react";

// Phase 6 (catalog) — one input per attribute definition type,
// shared by the dynamic product form, the variant editor's option
// inputs, and the category assignment editor's default-value
// inputs. The value model matches src/utils/catalogAttributes.js:
// text-ish → string, numbers → number | "" (raw input string is
// kept and coerced by the validator), boolean → true|false|null,
// multi-enum → string[], measurement → { value, unit },
// dimensions → { length, width, height, unit }.

const inputClass =
  "w-full px-4 h-10 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all bg-white";
const labelClass = "block text-sm font-medium text-gray-700 mb-2";

function acceptedUnitsFor(definition) {
  const units = [];
  if (definition.unit) units.push(definition.unit);
  for (const unit of definition.acceptedUnits || []) {
    if (!units.includes(unit)) units.push(unit);
  }
  return units;
}

function MultiEnumInput({ definition, value, onChange, id }) {
  const [draft, setDraft] = useState("");
  const values = Array.isArray(value) ? value : [];
  const allowed = definition.allowedValues || [];

  if (allowed.length > 0) {
    return (
      <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1" role="group" aria-label={definition.label}>
        {allowed.map((option) => (
          <label key={option} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
            <input
              type="checkbox"
              checked={values.includes(option)}
              onChange={(e) =>
                onChange(e.target.checked ? [...values, option] : values.filter((v) => v !== option))
              }
              className="w-4 h-4 rounded border-gray-300 text-[#025E5D] focus:ring-[#025E5D]"
            />
            {option}
          </label>
        ))}
      </div>
    );
  }

  const addDraft = () => {
    const next = draft.trim();
    if (next && !values.includes(next)) onChange([...values, next]);
    setDraft("");
  };

  return (
    <div>
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
      </div>
      <input
        id={id}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addDraft();
          }
        }}
        onBlur={addDraft}
        className={inputClass}
        placeholder="Type a value and press Enter"
      />
    </div>
  );
}

export default function AttributeValueInput({
  definition,
  value,
  onChange,
  error,
  id,
  disabled = false,
  // Label override: undefined → the definition's label, null → no
  // label row (the caller renders its own), string → that text.
  labelText,
}) {
  const fieldId = id || `attr-${definition.key}`;
  const allowed = definition.allowedValues || [];
  const units = acceptedUnitsFor(definition);

  let control = null;

  switch (definition.type) {
    case "string":
      control = (
        <input
          id={fieldId}
          type="text"
          value={value ?? ""}
          maxLength={definition.maxLength || undefined}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={inputClass}
        />
      );
      break;

    case "enum":
      control = allowed.length > 0 ? (
        <select
          id={fieldId}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={inputClass}
        >
          <option value="">Select…</option>
          {allowed.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={fieldId}
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={inputClass}
          placeholder="Free-form value"
        />
      );
      break;

    case "multi-enum":
      control = <MultiEnumInput definition={definition} value={value} onChange={onChange} id={fieldId} />;
      break;

    case "boolean":
      control = (
        <select
          id={fieldId}
          value={value === true ? "true" : value === false ? "false" : ""}
          onChange={(e) => onChange(e.target.value === "" ? null : e.target.value === "true")}
          disabled={disabled}
          className={inputClass}
        >
          <option value="">Not set</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      );
      break;

    case "integer":
    case "decimal":
    case "money":
      control = (
        <input
          id={fieldId}
          type="number"
          value={value ?? ""}
          min={definition.min ?? undefined}
          max={definition.max ?? undefined}
          step={definition.step ?? (definition.type === "integer" ? 1 : "any")}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={inputClass}
        />
      );
      break;

    case "measurement": {
      const current = value && typeof value === "object" ? value : { value: "", unit: definition.unit || units[0] || "" };
      control = (
        <div className="flex gap-2">
          <input
            id={fieldId}
            type="number"
            value={current.value ?? ""}
            onChange={(e) => onChange({ ...current, value: e.target.value })}
            disabled={disabled}
            className={inputClass}
            aria-label={`${definition.label} value`}
          />
          {units.length > 0 ? (
            <select
              value={current.unit || units[0]}
              onChange={(e) => onChange({ ...current, unit: e.target.value })}
              disabled={disabled}
              className="w-24 px-3 h-10 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all bg-white"
              aria-label={`${definition.label} unit`}
            >
              {units.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={current.unit || ""}
              onChange={(e) => onChange({ ...current, unit: e.target.value })}
              disabled={disabled}
              className="w-24 px-3 h-10 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all bg-white"
              placeholder="unit"
              aria-label={`${definition.label} unit`}
            />
          )}
        </div>
      );
      break;
    }

    case "color":
      control = allowed.length > 0 ? (
        <select
          id={fieldId}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={inputClass}
        >
          <option value="">Select…</option>
          {allowed.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <div className="flex items-center gap-2">
          <span
            className="w-10 h-10 rounded-lg border border-gray-200 shrink-0"
            style={{ backgroundColor: /^#[0-9a-fA-F]{6}$/.test(value || "") ? value : "transparent" }}
            aria-hidden="true"
          />
          <input
            id={fieldId}
            type="text"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={inputClass}
            placeholder="#RRGGBB"
          />
        </div>
      );
      break;

    case "dimensions": {
      const current =
        value && typeof value === "object"
          ? value
          : { length: "", width: "", height: "", unit: definition.unit || "cm" };
      const unitOptions = units.length > 0 ? units : ["cm", "m", "in"];
      const part = (name, label) => (
        <div key={name}>
          <label htmlFor={`${fieldId}-${name}`} className="block text-xs font-medium text-gray-500 mb-1">
            {label}
          </label>
          <input
            id={`${fieldId}-${name}`}
            type="number"
            value={current[name] ?? ""}
            onChange={(e) => onChange({ ...current, [name]: e.target.value })}
            disabled={disabled}
            className={inputClass}
          />
        </div>
      );
      control = (
        <div className="grid grid-cols-4 gap-2">
          {part("length", "Length")}
          {part("width", "Width")}
          {part("height", "Height")}
          <div>
            <label htmlFor={`${fieldId}-unit`} className="block text-xs font-medium text-gray-500 mb-1">
              Unit
            </label>
            <select
              id={`${fieldId}-unit`}
              value={current.unit || unitOptions[0]}
              onChange={(e) => onChange({ ...current, unit: e.target.value })}
              disabled={disabled}
              className={inputClass}
            >
              {unitOptions.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
        </div>
      );
      break;
    }

    default:
      control = (
        <input
          id={fieldId}
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={inputClass}
        />
      );
  }

  return (
    <div>
      {labelText !== null ? (
        <label htmlFor={fieldId} className={labelClass}>
          {labelText !== undefined ? labelText : definition.label}
          {labelText === undefined && definition.required ? <span className="text-red-500"> *</span> : null}
          {labelText === undefined && definition.unit && definition.type !== "measurement" ? (
            <span className="text-gray-400 font-normal"> ({definition.unit})</span>
          ) : null}
        </label>
      ) : null}
      {control}
      {error ? <p className="text-xs text-red-500 mt-1">{error}</p> : null}
    </div>
  );
}
