import { AlertTriangle } from "lucide-react";
import Button from "./Button";

/**
 * @typedef {Object} ErrorStateProps
 * @property {string} [title="Something went wrong"]
 * @property {string} [message] Detail line under the title.
 * @property {() => void} [onRetry] When given, renders a "Try again" button.
 * @property {string} [retryLabel="Try again"]
 * @property {string} [className]
 */

/**
 * Error state (REUSE-009), the counterpart to EmptyState: icon + title +
 * message + optional retry action. Uses the shared Button for the retry.
 *
 * @param {ErrorStateProps} props
 */
export default function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try again",
  className = "",
}) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center text-center px-6 py-12 ${className}`}
    >
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-rose-50 text-rose-500 mb-4">
        <AlertTriangle size={26} aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-neutral-800">{title}</h3>
      {message && (
        <p className="mt-1.5 max-w-sm text-sm text-neutral-500">{message}</p>
      )}
      {onRetry && (
        <div className="mt-5">
          <Button variant="secondary" size="sm" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
