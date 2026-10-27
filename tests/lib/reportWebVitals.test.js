import { describe, it, expect, vi, afterEach } from "vitest";
import { isWebVitalsEnabled, reportWebVitals } from "../../src/lib/reportWebVitals";

// Phase 8 (PERF-F-008): the flag-off path must be a strict no-op —
// main.jsx calls reportWebVitals() unconditionally, and the web-vitals
// package must not load in a default build/test environment.
describe("reportWebVitals (flag off)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is disabled when VITE_WEB_VITALS is unset", () => {
    vi.stubEnv("VITE_WEB_VITALS", "");
    expect(isWebVitalsEnabled()).toBe(false);
  });

  it("returns false and registers nothing when disabled", () => {
    vi.stubEnv("VITE_WEB_VITALS", "");
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
    expect(reportWebVitals()).toBe(false);
    expect(debug).not.toHaveBeenCalled();
    debug.mockRestore();
  });

  it("only the exact value '1' enables it", () => {
    vi.stubEnv("VITE_WEB_VITALS", "true");
    expect(isWebVitalsEnabled()).toBe(false);
    vi.stubEnv("VITE_WEB_VITALS", "1");
    expect(isWebVitalsEnabled()).toBe(true);
  });
});
