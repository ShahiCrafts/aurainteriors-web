// Batch 4 — the central date formatter applies the admin's
// dateFormat + timezone to BARE calls (the ones that used to be
// locale-less toLocaleDateString()). The default pattern
// (M/D/YYYY, Asia/Kathmandu) renders what those calls rendered for
// the store's Nepal audience. Calls with explicit Intl options are
// untouched.
import { afterEach, describe, expect, it } from "vitest";
import { formatDate } from "../../src/utils/formatDate.js";
import {
  setFormatConfigFromSettings,
  __resetFormatConfig,
} from "../../src/utils/formatConfig.js";

const INSTANT = "2026-11-03T10:00:00Z"; // 15:45 in Kathmandu

afterEach(() => {
  __resetFormatConfig();
});

describe("formatDate bare calls", () => {
  it("default pattern renders M/D/YYYY", () => {
    expect(formatDate(INSTANT)).toBe("11/3/2026");
  });

  it("applies an admin-chosen pattern", () => {
    setFormatConfigFromSettings({
      dateFormat: "MMM D, YYYY",
      timezone: "Asia/Kathmandu",
    });
    expect(formatDate(INSTANT)).toBe("Nov 3, 2026");

    setFormatConfigFromSettings({
      dateFormat: "YYYY-MM-DD",
      timezone: "Asia/Kathmandu",
    });
    expect(formatDate(INSTANT)).toBe("2026-11-03");

    setFormatConfigFromSettings({
      dateFormat: "DD/MM/YYYY",
      timezone: "Asia/Kathmandu",
    });
    expect(formatDate(INSTANT)).toBe("03/11/2026");

    setFormatConfigFromSettings({
      dateFormat: "D MMM YYYY",
      timezone: "Asia/Kathmandu",
    });
    expect(formatDate(INSTANT)).toBe("3 Nov 2026");
  });

  it("honours the configured timezone at day boundaries", () => {
    // 19:00 UTC = 00:45 next day in Kathmandu, still Nov 3 in UTC.
    setFormatConfigFromSettings({
      dateFormat: "YYYY-MM-DD",
      timezone: "UTC",
    });
    expect(formatDate("2026-11-03T19:00:00Z")).toBe("2026-11-03");
    setFormatConfigFromSettings({
      dateFormat: "YYYY-MM-DD",
      timezone: "Asia/Kathmandu",
    });
    expect(formatDate("2026-11-03T19:00:00Z")).toBe("2026-11-04");
  });

  it("leaves calls with explicit options on the old path", () => {
    setFormatConfigFromSettings({
      dateFormat: "YYYY-MM-DD",
      timezone: "UTC",
    });
    const out = formatDate(INSTANT, { weekday: "long" });
    expect(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]).toContain(out);
  });

  it("still returns '' for invalid input", () => {
    expect(formatDate("not-a-date")).toBe("");
    expect(formatDate(null)).toBe("");
  });
});
