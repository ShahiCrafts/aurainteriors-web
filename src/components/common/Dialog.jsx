import { useRef } from "react";
import { useDialogBehaviour } from "./useDialogBehaviour";

// FE-64 — one shared dialog primitive.
//
// Before this component every modal/drawer in the app re-implemented
// (badly) the same shell: a fixed-position div with a backdrop click,
// no role="dialog", no aria-modal, no Escape handling, no focus trap,
// no focus return, and ad-hoc body-scroll handling. This primitive
// supplies the behaviour + semantics; consumers keep their own markup
// and classes inside it.
//
// Behaviour:
//  - role="dialog" (or "alertdialog" via the `role` prop),
//    aria-modal="true", accessible name via `labelledBy` or `label`.
//  - Focus moves inside on open (first focusable element, an explicit
//    `initialFocusRef`, or the dialog container itself).
//  - Tab / Shift+Tab cycle within the dialog (focus trap).
//  - Escape calls `onClose` — only for the topmost open dialog, so a
//    nested dialog's Escape never closes its parent.
//  - Focus returns to the element focused before opening, on close.
//  - Body scroll is locked while open and restored when the LAST open
//    dialog closes (module-level counter + dialog stack keep nested
//    dialogs and unmount-while-open from leaking or dropping the lock).
//
// The companion hook lives in ./useDialogBehaviour.js for the
// always-mounted drawers (CartSlider, MobileMenu, ShippingStep
// address drawer, AdminLayout sidebar): they cannot unmount/remount
// around this component without losing their slide animation, so
// they apply the hook to their panel element instead.

export default function Dialog({
  open = true,
  onClose,
  label,
  labelledBy,
  role = "dialog",
  className,
  initialFocusRef,
  children,
  ...rest
}) {
  const containerRef = useRef(null);
  useDialogBehaviour({ open, onClose, containerRef, initialFocusRef });

  if (!open) return null;

  return (
    <div
      ref={containerRef}
      role={role}
      aria-modal="true"
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      tabIndex={-1}
      className={className}
      {...rest}
    >
      {children}
    </div>
  );
}
