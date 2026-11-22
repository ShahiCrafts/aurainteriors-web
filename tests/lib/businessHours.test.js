// composeBusinessHours (Batch 3d): groups consecutive days with
// identical open state/hours into the single opening-hours line the
// storefront footer and contact page render.
import { describe, expect, it } from "vitest";
import { composeBusinessHours } from "../../src/lib/businessHours.js";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const rows = (overrides = {}) =>
  DAYS.map((day) => ({
    day,
    open: false,
    hours: "",
    ...(overrides[day] || {}),
  }));

describe("composeBusinessHours", () => {
  it("returns empty string when every day is closed", () => {
    expect(composeBusinessHours(rows())).toBe("");
    expect(composeBusinessHours([])).toBe("");
    expect(composeBusinessHours(null)).toBe("");
  });

  it("groups Mon–Sat with identical hours and marks Sunday closed", () => {
    const open = { open: true, hours: "9:00 AM - 6:00 PM" };
    expect(
      composeBusinessHours(
        rows({
          Monday: open,
          Tuesday: open,
          Wednesday: open,
          Thursday: open,
          Friday: open,
          Saturday: open,
        }),
      ),
    ).toBe("Mon - Sat: 9:00 AM - 6:00 PM · Sun: Closed");
  });

  it("a single open day renders with the closed run after it", () => {
    expect(
      composeBusinessHours(
        rows({ Monday: { open: true, hours: "9:00 AM - 6:00 PM" } }),
      ),
    ).toBe("Mon: 9:00 AM - 6:00 PM · Tue - Sun: Closed");
  });

  it("different hours break the group", () => {
    expect(
      composeBusinessHours(
        rows({
          Monday: { open: true, hours: "9:00 AM - 5:00 PM" },
          Tuesday: { open: true, hours: "10:00 AM - 5:00 PM" },
        }),
      ),
    ).toBe(
      "Mon: 9:00 AM - 5:00 PM · Tue: 10:00 AM - 5:00 PM · Wed - Sun: Closed",
    );
  });

  it("an open day without hours still counts as open", () => {
    expect(
      composeBusinessHours(rows({ Friday: { open: true, hours: "" } })),
    ).toBe("Mon - Thu: Closed · Fri: Open · Sat - Sun: Closed");
  });
});
