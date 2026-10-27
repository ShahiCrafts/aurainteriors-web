import React, { useId } from "react";

/**
 * @typedef {Object} FieldProps
 * @property {string} [label] Visible label text.
 * @property {string} [id] Control id; generated with useId when omitted.
 * @property {string} [error] Error message; also marks the control invalid.
 * @property {string} [hint] Helper text shown when there is no error.
 * @property {boolean} [required] Appends a "*" marker to the label.
 * @property {string} [className] Wrapper class.
 * @property {React.ReactElement} children A single form control (input,
 *   select, textarea). Field injects `id`, `aria-invalid` and
 *   `aria-describedby` into it, so react-hook-form `register(...)` spreads
 *   and plain controlled/uncontrolled controls both work unchanged
 *   (REUSE-004 — no form-library migration is forced).
 */

/**
 * Label + control + error/hint wrapper (REUSE-004). Replaces the
 * label/input/error triplet that was repeated for every field in forms
 * such as AddEditAddressModal.
 *
 * @param {FieldProps} props
 */
export default function Field({
  label,
  id,
  error,
  hint,
  required = false,
  className = "",
  children,
}) {
  const generatedId = useId();
  const controlId = id || generatedId;
  const errorId = `${controlId}-error`;
  const hintId = `${controlId}-hint`;
  const describedBy =
    [error ? errorId : null, !error && hint ? hintId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  const control = React.isValidElement(children)
    ? React.cloneElement(children, {
        id: controlId,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
      })
    : children;

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={controlId}
          className="text-[11px] font-bold uppercase tracking-wider text-neutral-500"
        >
          {label}
          {required && (
            <span className="text-red-500" aria-hidden="true">
              {" "}
              *
            </span>
          )}
        </label>
      )}
      <div className={label ? "mt-2" : undefined}>{control}</div>
      {error ? (
        <p id={errorId} role="alert" className="text-[11.5px] text-red-500 font-medium mt-1">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-[11.5px] text-neutral-400 mt-1">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
