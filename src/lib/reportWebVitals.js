let started = false;

export function isWebVitalsEnabled() {
  return import.meta.env.VITE_WEB_VITALS === "1";
}

function sendMetric(metric) {
  const payload = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
    navigationType: metric.navigationType,
  };
  const endpoint = import.meta.env.VITE_WEB_VITALS_ENDPOINT;
  if (endpoint && typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon(endpoint, JSON.stringify(payload));
  } else {
    console.debug("[web-vitals]", payload);
  }
}

/**
 * Start collecting. Returns `false` synchronously when the feature flag
 * is off (the no-op path), otherwise a Promise that resolves once the
 * handlers are registered. Safe to call more than once.
 */
export function reportWebVitals() {
  if (!isWebVitalsEnabled() || started) return false;
  started = true;
  return import("web-vitals").then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
    onCLS(sendMetric);
    onINP(sendMetric);
    onLCP(sendMetric);
    onFCP(sendMetric);
    onTTFB(sendMetric);
    return true;
  });
}

export default reportWebVitals;
