/**
 * Web-vitals reporting (remediation Phase 8, PERF-F-008).
 *
 * OFF by default. Nothing in this module — including the `web-vitals`
 * package itself — is loaded unless the build sets:
 *
 *   VITE_WEB_VITALS=1
 *
 * When enabled, CLS / INP / LCP / FCP / TTFB are collected via a dynamic
 * import (so the library ships as its own lazy chunk, never in the entry
 * graph) and each metric is handed to a minimal sink:
 *
 *   - if VITE_WEB_VITALS_ENDPOINT is set and navigator.sendBeacon is
 *     available, the metric is beaconed there as JSON;
 *   - otherwise it is logged with console.debug (dev inspection only).
 *
 * There is deliberately no backend work here: choosing/hosting an
 * ingestion endpoint is an operations decision. With the flag off this
 * module is a strict no-op and safe to call unconditionally from
 * main.jsx.
 */

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
