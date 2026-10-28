// REUSE-017 — one date formatter for the storefront (mirrors the
// FE-63 formatCurrency test pattern).
//
// Pre-fix: six local formatDate copies plus ~25 locale-less
// toLocaleDateString() calls, so admin dates followed each viewer's
// browser locale while currency was fixed to en-NP. The fix is a
// single helper, src/utils/formatDate.js, built on
// Intl.DateTimeFormat("en-NP", …).

import { describe, it, expect } from "vitest";
import {
  formatDate,
  formatDateTime,
  formatTime,
  formatRelative,
} from "../../src/utils/formatDate.js";

const D = "2026-10-24T10:30:00.000Z";

describe("formatDate (REUSE-017)", () => {
  it("matches the en-NP formatter for the same options (fixed locale)", () => {
    const options = { month: "short", day: "numeric", year: "numeric" };
    expect(formatDate(D, options)).toBe(
      new Intl.DateTimeFormat("en-NP", options).format(new Date(D)),
    );
  });

  it("passes options through (long month, weekday)", () => {
    expect(
      formatDate(D, { month: "long", day: "numeric", year: "numeric" }),
    ).toContain("October");
    expect(formatDate(D, { weekday: "long" })).toContain("Saturday");
    expect(formatDate(D, { day: "2-digit", month: "short" })).toBe(
      new Intl.DateTimeFormat("en-NP", {
        day: "2-digit",
        month: "short",
      }).format(new Date(D)),
    );
  });

  it("accepts Date objects and date strings", () => {
    expect(formatDate(new Date(D))).toBe(formatDate(D));
  });

  it("returns '' for null / undefined / invalid input", () => {
    expect(formatDate(null)).toBe("");
    expect(formatDate(undefined)).toBe("");
    expect(formatDate("")).toBe("");
    expect(formatDate("not-a-date")).toBe("");
  });
});

describe("formatDateTime / formatTime", () => {
  it("formatDateTime includes date and time parts", () => {
    const out = formatDateTime(D, { hour: "2-digit", minute: "2-digit" });
    expect(out).toContain("2026");
    expect(out).toMatch(/\d{2}:\d{2}/);
  });

  it("formatTime renders time only and honours options", () => {
    expect(formatTime(D)).toBe(
      new Intl.DateTimeFormat("en-NP", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(D)),
    );
    expect(formatTime(null)).toBe("");
    expect(formatDateTime(null)).toBe("");
  });
});

describe("formatRelative", () => {
  const now = new Date("2026-10-24T12:00:00.000Z");
  const ago = (ms) => new Date(now.getTime() - ms);

  it("default style matches the NotificationsPage phrasing", () => {
    expect(formatRelative(ago(30 * 1000), { now })).toBe("Just now");
    expect(formatRelative(ago(5 * 60 * 1000), { now })).toBe("5 minutes ago");
    expect(formatRelative(ago(3 * 3600 * 1000), { now })).toBe("3 hours ago");
    expect(formatRelative(ago(2 * 86400 * 1000), { now })).toBe("2 days ago");
    expect(formatRelative(ago(40 * 86400 * 1000), { now })).toBe(
      "1 months ago",
    );
  });

  it("day style matches the ReviewItem phrasing", () => {
    expect(formatRelative(ago(3600 * 1000), { now, style: "day" })).toBe(
      "Today",
    );
    expect(formatRelative(ago(86400 * 1000), { now, style: "day" })).toBe(
      "Yesterday",
    );
    expect(formatRelative(ago(3 * 86400 * 1000), { now, style: "day" })).toBe(
      "3 days ago",
    );
    expect(formatRelative(ago(14 * 86400 * 1000), { now, style: "day" })).toBe(
      "2 weeks ago",
    );
    expect(formatRelative(ago(90 * 86400 * 1000), { now, style: "day" })).toBe(
      "3 months ago",
    );
    expect(formatRelative(ago(400 * 86400 * 1000), { now, style: "day" })).toBe(
      "1 years ago",
    );
  });

  it("returns '' for invalid input", () => {
    expect(formatRelative(null, { now })).toBe("");
    expect(formatRelative("nope", { now })).toBe("");
  });
});
