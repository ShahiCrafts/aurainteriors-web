/**
 * Phase 6 — the ui/ home of the shared Dialog primitive.
 *
 * The implementation lives in components/common/Dialog.jsx (FE-64)
 * and is re-exported here so the ui/ primitive kit is complete in
 * one place; there is deliberately NO second implementation. New
 * code should import Dialog from here; existing common/ imports
 * resolve to the same component.
 *
 * Behaviour contract (from the implementation):
 *  - role="dialog" (or "alertdialog" via the `role` prop),
 *    aria-modal="true", accessible name via `labelledBy` or `label`.
 *  - Focus moves inside on open, Tab/Shift+Tab cycle within
 *    (focus trap), focus returns to the previously focused element
 *    on close.
 *  - Escape calls `onClose` — only for the topmost open dialog.
 *  - Body scroll is locked while open (nesting-safe counter).
 *  - The BACKDROP is consumer-rendered, per the established FE-64
 *    pattern (ConfirmationDialog, AddEditAddressModal, the admin
 *    Modal helpers): a sibling element whose onClick calls the same
 *    onClose. Dialog itself renders only the panel.
 *  - Always-mounted drawers that cannot unmount/remount without
 *    losing their slide animation (CartSlider, ShippingStep's
 *    address drawer) use the companion useDialogBehaviour hook on
 *    their panel instead — also re-exported here.
 */
export { useDialogBehaviour } from "../common/useDialogBehaviour";
export { default } from "../common/Dialog";
