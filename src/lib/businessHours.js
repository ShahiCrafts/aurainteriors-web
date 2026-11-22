// Business-hours composition (Batch 3d) — turns the structured
// per-day rows from Settings → Contact & Social
// (contact.businessHours: [{ day, open, hours }], Monday first)
// into the single opening-hours line the storefront already renders
// from contact.hours (Footer / contact page).
//
// Format: consecutive days sharing the same state are grouped —
//   "Mon - Sat: 9:00 AM - 6:00 PM · Sun: Closed"
// A day that is open but has no range typed yet renders as "Open".
// Returns "" when no day is open, so the caller can leave the
// free-text hours field untouched in that case.

export const DAY_ABBR = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

export function composeBusinessHours(rows) {
  if (!Array.isArray(rows)) return "";
  const normalized = rows
    .filter((row) => row && typeof row.day === "string")
    .map((row) => ({
      day: row.day,
      open: row.open === true,
      hours: typeof row.hours === "string" ? row.hours.trim() : "",
    }));
  if (!normalized.some((row) => row.open)) return "";

  const label = (row) => (row.open ? row.hours || "Open" : "Closed");
  const groups = [];
  for (const row of normalized) {
    const key = `${row.open}:${label(row)}`;
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.days.push(row.day);
    } else {
      groups.push({ key, days: [row.day], text: label(row) });
    }
  }
  return groups
    .map((group) => {
      const first = DAY_ABBR[group.days[0]] || group.days[0];
      const lastDay =
        DAY_ABBR[group.days[group.days.length - 1]] ||
        group.days[group.days.length - 1];
      const span =
        group.days.length > 1 ? `${first} - ${lastDay}` : first;
      return `${span}: ${group.text}`;
    })
    .join(" · ");
}
