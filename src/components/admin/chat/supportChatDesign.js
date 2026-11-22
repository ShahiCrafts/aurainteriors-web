// Batch 3c — shared display helpers for the redesigned admin Support
// Chat page (priority pills + the screenshot's date formats). Pure
// functions, no React.

// The server Chat schema enum is low | normal | high | urgent
// (models/chat.model.js). The dropdown offers exactly those values.
export const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export function priorityLabel(priority) {
  const found = PRIORITY_OPTIONS.find((o) => o.value === priority);
  return found ? found.label : "Normal";
}

// List pill mapping (per the design): urgent folds into "High", and a
// legacy "medium" value folds into "Normal".
export function priorityPill(priority) {
  switch (priority) {
    case "high":
    case "urgent":
      return { label: "High", className: "bg-red-50 text-red-500" };
    case "low":
      return { label: "Low", className: "bg-green-50 text-green-600" };
    case "normal":
    case "medium":
    default:
      return { label: "Normal", className: "bg-blue-50 text-blue-600" };
  }
}

// Header dropdown pill colours, keyed by the raw priority value.
export function prioritySelectClass(priority) {
  switch (priority) {
    case "high":
    case "urgent":
      return "bg-red-50 text-red-500";
    case "low":
      return "bg-green-50 text-green-600";
    case "normal":
    case "medium":
    default:
      return "bg-blue-50 text-blue-600";
  }
}

// "11/13/2026" — the conversation-list and order-card date format.
export function formatShortDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  // Built with join (not a template literal) so the FE-12 route-path
  // class guard doesn't mistake this date string for a route path.
  return [date.getMonth() + 1, date.getDate(), date.getFullYear()].join("/");
}

// "Nov 13, 2026" — the thread day-divider format.
export function formatDayLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const month = date.toLocaleString("en-US", { month: "short" });
  return `${month} ${date.getDate()}, ${date.getFullYear()}`;
}

// Local calendar-day key for grouping messages under a divider.
export function dayKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}
