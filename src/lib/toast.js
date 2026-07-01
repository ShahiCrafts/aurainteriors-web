/**
 * Custom toast singleton — drop-in API replacement for react-toastify.
 *
 * Usage (unchanged from before):
 *   import { toast } from "react-toastify";  // still works via Vite alias
 *   toast.success("Added to cart");
 *   toast.error("Something went wrong");
 *   toast.info("Just so you know");
 *   toast.warning("Be careful");
 *
 * The ToastProvider in src/components/ui/ToastProvider.jsx calls
 * _registerDispatch() on mount and stores the setter reference here.
 * All toast() calls push into that setter.
 */

let _dispatch = null;

/** Called once by ToastProvider on mount. */
export const _registerDispatch = (fn) => {
  _dispatch = fn;
};

let _idCounter = 0;

const push = (type, message, options = {}) => {
  if (!_dispatch) {
    // Fallback: log to console if provider isn't mounted yet
    console.warn(`[toast] Provider not mounted. ${type}: ${message}`);
    return;
  }
  _dispatch({
    id: ++_idCounter,
    type,
    message,
    autoClose: options.autoClose ?? 3000,
  });
};

/**
 * toast — callable function + namespaced methods.
 *
 * Matches the subset of react-toastify's API actually used in this codebase:
 *   toast(msg)            → info
 *   toast.success(msg)
 *   toast.error(msg)
 *   toast.info(msg)
 *   toast.warning(msg)
 */
const toastFn = (message, options) => push("info", message, options);
toastFn.success = (message, options) => push("success", message, options);
toastFn.error = (message, options) => push("error", message, options);
toastFn.info = (message, options) => push("info", message, options);
toastFn.warning = (message, options) => push("warning", message, options);

export const toast = toastFn;

/**
 * ToastContainer — exported as a no-op so that any leftover
 * `import { ToastContainer } from "react-toastify"` compiles without error.
 * The real container is in ToastProvider.jsx.
 */
export const ToastContainer = () => null;

export default toast;
