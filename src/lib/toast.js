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
export const ToastContainer = () => null;

export default toast;
