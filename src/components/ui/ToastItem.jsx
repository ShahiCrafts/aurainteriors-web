import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, XCircle, AlertTriangle, ShoppingBag, Heart, X } from "lucide-react";

/**
 * Type tokens — tuned to sit naturally on this app's white background.
 *
 * Icon colours follow UX conventions (green=success, red=error, amber=warning)
 * but the icon itself is rendered inline (no background badge) to keep the
 * card light and consistent with the app's minimal component style.
 */
const TYPE = {
  success: {
    Icon: CheckCircle2,
    iconColor: "#16a34a",   // green-600
    barColor: "#22c55e",    // green-500
  },
  error: {
    Icon: XCircle,
    iconColor: "#dc2626",   // red-600
    barColor: "#ef4444",
  },
  warning: {
    Icon: AlertTriangle,
    iconColor: "#b45309",   // amber-700
    barColor: "#f59e0b",
  },
  info: {
    Icon: ShoppingBag,
    iconColor: "#F27318",   // app primary orange
    barColor: "#F27318",
  },
};

/**
 * ToastItem
 *
 * Design mirrors the app's ProductCard / TrustBanner card style exactly:
 *  - White background
 *  - rounded-xl  (12px — same as action buttons and modal cards)
 *  - 1px border rgba(0,0,0,0.08)  — same as neutral-200 cards
 *  - Shadow: 0 4px 20px rgba(0,0,0,0.08)  — identical to ProductCard
 *  - Inline coloured icon — no background badge
 *  - 2.5px progress bar at bottom (scaleX, GPU composited)
 *  - Slides up 12px on enter, fades+slides down on exit
 *
 *  ╭──────────────────────────────────────╮
 *  │  ✓   Added to cart              ✕   │
 *  │▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
 *  ╰──────────────────────────────────────╯
 */
export default function ToastItem({
  id,
  type = "info",
  message,
  autoClose = 3000,
  onDismiss,
}) {
  const [entered, setEntered] = useState(false);
  const [exiting, setExiting] = useState(false);
  const cfg = TYPE[type] || TYPE.info;
  const { Icon } = cfg;

  // Delay one rAF so the "from" state is painted before transition starts.
  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(id), 280);
  }, [id, onDismiss]);

  useEffect(() => {
    const t = setTimeout(dismiss, autoClose);
    return () => clearTimeout(t);
  }, [dismiss, autoClose]);

  const show = entered && !exiting;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="pointer-events-auto w-[calc(100vw-2rem)] max-w-[300px] bg-white rounded-xl overflow-hidden font-dm-sans"
      style={{
        border: "1px solid rgba(0,0,0,0.08)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.09), 0 1px 4px rgba(0,0,0,0.05)",
        transition: exiting
          ? "transform 280ms ease-in, opacity 280ms ease-in"
          : "transform 360ms cubic-bezier(0.22, 1, 0.36, 1), opacity 280ms ease-out",
        transform: show ? "translateY(0)" : "translateY(12px)",
        opacity: show ? 1 : 0,
      }}
    >
      {/* ── Content ── */}
      <div className="flex items-center gap-2.5 px-3.5 py-3">
        {/* Inline icon — no badge, just the coloured stroke icon */}
        <Icon
          size={17}
          strokeWidth={2.25}
          style={{ color: cfg.iconColor, flexShrink: 0 }}
        />

        {/* Message */}
        <p
          className="flex-1 text-[13px] leading-snug break-words"
          style={{ color: "#1A1714", fontWeight: 500 }}
        >
          {message}
        </p>

        {/* Dismiss */}
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 flex items-center justify-center w-5 h-5 rounded-md transition-colors duration-150 hover:bg-neutral-100"
          style={{ color: "rgba(0,0,0,0.3)" }}
        >
          <X size={12} strokeWidth={2.5} />
        </button>
      </div>

      {/* ── Progress bar ──
          scaleX is GPU-composited so it costs nothing.
          @keyframes toast-shrink is in index.css.          */}
      <div
        className="h-[2.5px] w-full origin-left"
        style={{
          background: cfg.barColor,
          opacity: 0.6,
          animation: `toast-shrink ${autoClose}ms linear forwards`,
        }}
      />
    </div>
  );
}
