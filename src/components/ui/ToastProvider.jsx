import { useState, useCallback, useEffect } from "react";
import { _registerDispatch } from "../../lib/toast";
import ToastItem from "./ToastItem";

const MAX_TOASTS = 4;

/**
 * ToastProvider — wraps the app and manages the toast stack.
 *
 * Position: bottom-right (16px from each edge).
 * Stack direction: newest toast appears at the bottom of the stack,
 * closest to the corner — existing toasts slide upward as new ones arrive.
 * This is the standard convention for bottom-positioned toast stacks.
 */
export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    _registerDispatch((toast) => {
      setToasts((prev) => {
        const trimmed = prev.length >= MAX_TOASTS ? prev.slice(1) : prev;
        return [...trimmed, toast];
      });
    });
    return () => _registerDispatch(null);
  }, []);

  return (
    <>
      {children}

      {/*
        Stack container — bottom-right on all viewports.
        On mobile the toasts are slightly smaller (max-w applied inside ToastItem)
        but stay right-aligned.

        flex-col: oldest toast at top, newest at bottom (nearest the corner).
        pointer-events-none on the wrapper; ToastItem re-enables for itself.
      */}
      <div
        aria-label="Notifications"
        className="fixed bottom-4 right-4 z-[99999] flex flex-col gap-2 items-end pointer-events-none"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} {...t} onDismiss={dismiss} />
        ))}
      </div>
    </>
  );
}
