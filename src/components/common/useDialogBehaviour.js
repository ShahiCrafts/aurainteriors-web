import { useEffect, useRef } from "react";

// FE-64 — dialog behaviour shared by the Dialog component and the
// always-mounted drawers (CartSlider, MobileMenu, ShippingStep address
// drawer, AdminLayout sidebar) that cannot unmount/remount around the
// Dialog component without losing their slide animation. See
// Dialog.jsx for the full behaviour contract.

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabIndex]:not([tabIndex="-1"])';

// Module-level registry of open dialogs, in open order. The last entry
// is the topmost dialog and the only one that answers keyboard events.
const dialogStack = [];
let scrollLockCount = 0;
let previousOverflow = "";

function lockScroll() {
  if (scrollLockCount === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  scrollLockCount += 1;
}

function unlockScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) {
    document.body.style.overflow = previousOverflow;
    previousOverflow = "";
  }
}

function getFocusable(container) {
  if (!container) return [];
  // The selector already excludes disabled controls. Elements hidden
  // with `type="hidden"` are the one focusable-selector false positive
  // worth filtering; CSS-hidden subtrees inside an open dialog are not
  // used by any consumer of this primitive.
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (el) => el.getAttribute("type") !== "hidden"
  );
}

export function useDialogBehaviour({ open, onClose, containerRef, initialFocusRef }) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const container = containerRef.current;
    const entry = { container };
    // React runs child effects before parent effects, so a nested
    // dialog registers BEFORE its parent. Order the stack by DOM
    // depth instead of registration order: an entry whose container
    // contains another entry's container is the ancestor (lower in
    // the stack); unrelated entries keep registration order.
    const ancestorIdx = dialogStack.findIndex(
      (e) => container && e.container && container.contains(e.container)
    );
    if (ancestorIdx === -1) dialogStack.push(entry);
    else dialogStack.splice(ancestorIdx, 0, entry);
    lockScroll();
    const previouslyFocused = document.activeElement;

    // Move focus inside: explicit target, else first focusable, else
    // the container itself (containers render tabIndex={-1}).
    const focusTarget =
      initialFocusRef?.current || getFocusable(container)[0] || container;
    focusTarget?.focus?.();

    const handleKeyDown = (event) => {
      if (dialogStack[dialogStack.length - 1] !== entry) return;
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = getFocusable(container);
      if (focusable.length === 0) {
        event.preventDefault();
        container?.focus?.();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey) {
        if (active === first || !container.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !container.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      const idx = dialogStack.indexOf(entry);
      if (idx !== -1) dialogStack.splice(idx, 1);
      unlockScroll();
      if (
        previouslyFocused &&
        document.contains(previouslyFocused) &&
        typeof previouslyFocused.focus === "function"
      ) {
        previouslyFocused.focus();
      }
    };
    // containerRef / initialFocusRef are stable refs by contract.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open ]);
}

