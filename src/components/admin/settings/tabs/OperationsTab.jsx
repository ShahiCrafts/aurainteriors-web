import { useState } from "react";
import {
  Globe,
  Mail,
  Send,
  ShoppingCart,
  X,
  Plus,
  Trash2,
  Pencil,
} from "lucide-react";
import {
  Card,
  Field,
  Toggle,
  inputClass,
  selectClass,
  textareaClass,
  smallButtonClass,
  primaryButtonClass,
} from "../ui";
import settingsApi from "../../../../api/settingsApi";
import useAuthStore from "../../../../store/authStore";
import { toast } from "../../../../lib/toast";
import formatError from "../../../../utils/errorHandler";
import { formatNPR } from "../../../../utils/formatCurrency";

// Store Operations tab (Batch 4, reference Settings image 6).
// Every control here is wired to a real consumer:
//   Currency & Locale → the storefront's ONE formatter
//     (utils/formatCurrency + utils/formatDate via formatConfig).
//   Shipping zones / free-shipping threshold → the server's order
//     totals (delivery fee by zone) and the checkout summary mirror.
//   Tax & Orders → server order totals (VAT), orderId prefix (order
//     model), minimum-order rejection, and the admin product list's
//     low-stock cut-off.
//   Email Templates → services/email.service.js composes the
//     transactional emails from these at send time; the test-email
//     card sends through the same Brevo path.
//   Chat Settings → the customer chat widget (gate, greeting,
//     offline panel, window subtitle).
// Defaults reproduce the store's previous behaviour exactly (free
// shipping, no VAT, no minimum, no prefix, threshold 10).

export const CURRENCY_OPTIONS = [
  { value: "NPR", label: "NPR (रू) - Nepalese Rupee" },
  { value: "USD", label: "USD ($) - US Dollar" },
  { value: "INR", label: "INR (₹) - Indian Rupee" },
  { value: "EUR", label: "EUR (€) - Euro" },
  { value: "GBP", label: "GBP (£) - British Pound" },
  { value: "AUD", label: "AUD ($) - Australian Dollar" },
  { value: "JPY", label: "JPY (¥) - Japanese Yen" },
  { value: "CNY", label: "CNY (¥) - Chinese Yuan" },
];

export const NUMBER_FORMAT_OPTIONS = [
  { value: "en-NP", label: "1,234,567.89 — International" },
  { value: "en-US", label: "1,234,567.89 — US" },
  { value: "en-IN", label: "12,34,567.89 — South Asian (lakh)" },
  { value: "de-DE", label: "1.234.567,89 — European" },
];

export const DATE_FORMAT_OPTIONS = [
  { value: "M/D/YYYY", label: "M/D/YYYY — 11/3/2026 (current)" },
  { value: "MMM D, YYYY", label: "MMM D, YYYY — Nov 3, 2026" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY — 03/11/2026" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD — 2026-11-03" },
  { value: "D MMM YYYY", label: "D MMM YYYY — 3 Nov 2026" },
];

export const TIMEZONE_OPTIONS = [
  "Asia/Kathmandu",
  "Asia/Kolkata",
  "Asia/Dhaka",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Colombo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Sao_Paulo",
  "Australia/Sydney",
  "Australia/Perth",
  "Pacific/Auckland",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "UTC",
];

export const TEMPLATE_ROWS = [
  ["orderConfirmation", "Order Confirmation"],
  ["shippingNotification", "Shipping Notification"],
  ["accountWelcome", "Account Welcome"],
  ["magicLink", "Login / Magic Link"],
  ["lowStockAlert", "Low Stock Alert"],
];

const PLACEHOLDERS = [
  "{store_name}",
  "{customer_name}",
  "{order_id}",
  "{total}",
  "{tracking_info}",
];

const SAMPLE_DATE = new Date("2026-11-03T10:00:00Z");

export function previewDate(pattern, timezone) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: timezone || "Asia/Kathmandu",
    }).formatToParts(SAMPLE_DATE);
    const byType = {};
    for (const p of parts) byType[p.type] = p.value;
    const monthShort = new Intl.DateTimeFormat("en-US", {
      month: "short",
      timeZone: timezone || "Asia/Kathmandu",
    }).format(SAMPLE_DATE);
    switch (pattern) {
      case "MMM D, YYYY":
        return `${monthShort} ${Number(byType.day)}, ${byType.year}`;
      case "DD/MM/YYYY":
        return [byType.day, byType.month, byType.year].join("/");
      case "YYYY-MM-DD":
        return `${byType.year}-${byType.month}-${byType.day}`;
      case "D MMM YYYY":
        return `${Number(byType.day)} ${monthShort} ${byType.year}`;
      case "M/D/YYYY":
      default:
        return [Number(byType.month), Number(byType.day), byType.year].join("/");
    }
  } catch {
    return "";
  }
}

function TemplateEditor({ label, template, onSave, onClose }) {
  const [draft, setDraft] = useState(template);
  const set = (key) => (e) => setDraft({ ...draft, [key]: e.target.value });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              {label}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Placeholders you can use: {PLACEHOLDERS.join(", ")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close editor"
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-4">
          <Field label="Subject">
            <input
              type="text"
              aria-label="Template subject"
              value={draft.subject}
              onChange={set("subject")}
              className={inputClass}
            />
          </Field>
          <Field label="Heading">
            <input
              type="text"
              aria-label="Template heading"
              value={draft.heading}
              onChange={set("heading")}
              className={inputClass}
            />
          </Field>
          <Field label="Body">
            <textarea
              aria-label="Template body"
              value={draft.body}
              onChange={set("body")}
              className={textareaClass}
              rows={7}
            />
          </Field>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button type="button" onClick={onClose} className={smallButtonClass}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(draft)}
            className={primaryButtonClass}
          >
            Save Template
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OperationsTab({
  commerce,
  chat,
  notifications,
  onCommerce,
  onChat,
  onNotifications,
}) {
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [managingZones, setManagingZones] = useState(false);
  const [testTemplate, setTestTemplate] = useState("orderConfirmation");
  const [testTo, setTestTo] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const adminEmail = useAuthStore((state) => state.user?.email) || "";

  const shipping = commerce.shipping;
  const patchShipping = (value) => onCommerce({ shipping: { ...shipping, ...value } });
  const patchZone = (index, zone) => {
    const zones = shipping.zones.map((z, i) => (i === index ? zone : z));
    patchShipping({ zones });
  };

  const previewNumber = (() => {
    try {
      return new Intl.NumberFormat(commerce.numberFormat, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(1234.56);
    } catch {
      return "1,234.56";
    }
  })();

  const handleSendTest = async () => {
    setSendingTest(true);
    try {
      await settingsApi.sendTestEmail(testTemplate, testTo || adminEmail);
      toast.success("Test email sent");
    } catch (err) {
      toast.error(formatError(err, "Test email could not be sent"));
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Currency & Locale */}
        <Card
          title="Currency & Locale"
          description="Set your store's currency, date and number formats."
        >
          <div className="flex gap-5">
            <div className="flex-1 grid grid-cols-2 gap-4">
              <Field label="Currency" required>
                <select
                  aria-label="Currency"
                  value={commerce.currency}
                  onChange={(e) => onCommerce({ currency: e.target.value })}
                  className={selectClass}
                >
                  {CURRENCY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Currency Symbol">
                <input
                  type="text"
                  aria-label="Currency symbol"
                  value={commerce.currencySymbol}
                  onChange={(e) =>
                    onCommerce({ currencySymbol: e.target.value })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Currency Symbol Position">
                <select
                  aria-label="Currency symbol position"
                  value={commerce.symbolPosition}
                  onChange={(e) =>
                    onCommerce({ symbolPosition: e.target.value })
                  }
                  className={selectClass}
                >
                  <option value="before">Before Amount ({commerce.currencySymbol || "NPR"}100)</option>
                  <option value="after">After Amount (100{commerce.currencySymbol || "NPR"})</option>
                </select>
              </Field>
              <Field label="Number Format">
                <select
                  aria-label="Number format"
                  value={commerce.numberFormat}
                  onChange={(e) =>
                    onCommerce({ numberFormat: e.target.value })
                  }
                  className={selectClass}
                >
                  {NUMBER_FORMAT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Date Format">
                <select
                  aria-label="Date format"
                  value={commerce.dateFormat}
                  onChange={(e) => onCommerce({ dateFormat: e.target.value })}
                  className={selectClass}
                >
                  {DATE_FORMAT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Timezone">
                <select
                  aria-label="Timezone"
                  value={commerce.timezone}
                  onChange={(e) => onCommerce({ timezone: e.target.value })}
                  className={selectClass}
                >
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz === "Asia/Kathmandu"
                        ? "Asia/Kathmandu (UTC+05:45)"
                        : tz}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="w-44 shrink-0 bg-brand/10 border border-brand/20 rounded-xl p-4 self-start">
              <div className="flex items-center gap-2 text-brand mb-3">
                <Globe className="w-5 h-5" />
                <span className="text-sm font-semibold text-gray-900">
                  Current Locale Preview
                </span>
              </div>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-gray-500 inline">Currency: </dt>
                  <dd className="inline font-medium text-gray-900">
                    {commerce.currencySymbol || commerce.currency}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 inline">Number: </dt>
                  <dd className="inline font-medium text-gray-900">
                    {previewNumber}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 inline">Date: </dt>
                  <dd className="inline font-medium text-gray-900">
                    {previewDate(commerce.dateFormat, commerce.timezone)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </Card>

        {/* Shipping */}
        <Card
          title="Shipping"
          description="Configure shipping zones, rates and delivery estimates."
        >
          <div className="flex gap-5">
            <div className="flex-1 space-y-4">
              <Toggle
                label="Enable Shipping"
                checked={shipping.enabled}
                onChange={(v) => patchShipping({ enabled: v })}
              />
              <Field label="Default Shipping Zone">
                <select
                  aria-label="Default shipping zone"
                  value={shipping.defaultZone}
                  onChange={(e) =>
                    patchShipping({ defaultZone: e.target.value })
                  }
                  className={selectClass}
                >
                  {shipping.zones.map((z) => (
                    <option key={z.name} value={z.name}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Free Shipping Threshold">
                <input
                  type="number"
                  min="0"
                  aria-label="Free shipping threshold"
                  value={commerce.freeShippingThreshold}
                  onChange={(e) =>
                    onCommerce({
                      freeShippingThreshold: Number(e.target.value) || 0,
                    })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Delivery Estimate Text">
                <input
                  type="text"
                  aria-label="Delivery estimate text"
                  value={shipping.deliveryEstimateText}
                  onChange={(e) =>
                    patchShipping({ deliveryEstimateText: e.target.value })
                  }
                  placeholder="Usually delivered in 2-5 business days."
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="w-64 shrink-0 bg-slate-50 border border-gray-100 rounded-xl p-4 self-start">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-900">
                  Shipping Zones
                </span>
                <button
                  type="button"
                  onClick={() => setManagingZones((v) => !v)}
                  className="text-sm font-medium text-brand hover:text-brand-hover"
                >
                  {managingZones ? "Done" : "Manage Zones →"}
                </button>
              </div>
              {!managingZones ? (
                <ul className="space-y-3">
                  {shipping.zones.map((zone, i) => (
                    <li
                      key={zone.name + i}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="text-sm text-gray-700">{zone.name}</span>
                      <span className="text-sm text-gray-500">
                        {zone.rate > 0 ? formatNPR(zone.rate) : "Free"}
                      </span>
                      <Toggle
                        ariaLabel={`${zone.name} enabled`}
                        checked={zone.enabled}
                        onChange={(v) => patchZone(i, { ...zone, enabled: v })}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="space-y-3">
                  {shipping.zones.map((zone, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        aria-label={`Zone ${i + 1} name`}
                        value={zone.name}
                        onChange={(e) =>
                          patchZone(i, { ...zone, name: e.target.value })
                        }
                        className={inputClass}
                      />
                      <input
                        type="number"
                        min="0"
                        aria-label={`Zone ${i + 1} rate`}
                        value={zone.rate}
                        onChange={(e) =>
                          patchZone(i, {
                            ...zone,
                            rate: Number(e.target.value) || 0,
                          })
                        }
                        className={`${inputClass} w-24`}
                      />
                      <button
                        type="button"
                        aria-label={`Remove zone ${zone.name || i + 1}`}
                        onClick={() =>
                          patchShipping({
                            zones: shipping.zones.filter((_, j) => j !== i),
                          })
                        }
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      patchShipping({
                        zones: [
                          ...shipping.zones,
                          { name: "", rate: 0, enabled: true },
                        ],
                      })
                    }
                    className={smallButtonClass}
                  >
                    <Plus className="w-4 h-4" /> Add Zone
                  </button>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Tax & Orders */}
        <Card
          title="Tax & Orders"
          description="Configure taxes, order settings and business rules."
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-1.5">
                VAT / Tax
              </span>
              <Toggle
                label="Enable VAT"
                checked={commerce.tax.vatEnabled}
                onChange={(v) =>
                  onCommerce({ tax: { ...commerce.tax, vatEnabled: v } })
                }
              />
            </div>
            <Field label="VAT Rate (%)">
              <input
                type="number"
                min="0"
                max="100"
                aria-label="VAT rate"
                value={commerce.tax.vatRate}
                onChange={(e) =>
                  onCommerce({
                    tax: { ...commerce.tax, vatRate: Number(e.target.value) || 0 },
                  })
                }
                className={inputClass}
              />
            </Field>
            <Field label="Order Number Prefix">
              <input
                type="text"
                aria-label="Order number prefix"
                value={commerce.orders.orderPrefix}
                onChange={(e) =>
                  onCommerce({
                    orders: { ...commerce.orders, orderPrefix: e.target.value },
                  })
                }
                placeholder="(none)"
                className={inputClass}
              />
            </Field>
            <div className="bg-brand/10 border border-brand/20 rounded-xl p-3.5 self-end">
              <div className="flex items-center gap-2 text-brand">
                <ShoppingCart className="w-4 h-4" />
                <span className="text-xs font-semibold">Order Number Format</span>
              </div>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {commerce.orders.orderPrefix || ""}AUX7K2P9QD
              </p>
            </div>
            <Field label="Low Stock Threshold">
              <input
                type="number"
                min="0"
                aria-label="Low stock threshold"
                value={commerce.orders.lowStockThreshold}
                onChange={(e) =>
                  onCommerce({
                    orders: {
                      ...commerce.orders,
                      lowStockThreshold: Number(e.target.value) || 0,
                    },
                  })
                }
                className={inputClass}
              />
            </Field>
            <Field label="Minimum Order Amount">
              <input
                type="number"
                min="0"
                aria-label="Minimum order amount"
                value={commerce.orders.minimumOrderAmount}
                onChange={(e) =>
                  onCommerce({
                    orders: {
                      ...commerce.orders,
                      minimumOrderAmount: Number(e.target.value) || 0,
                    },
                  })
                }
                className={inputClass}
              />
            </Field>
          </div>
        </Card>

        {/* Email Templates */}
        <Card
          title="Email Templates"
          description="Customize your transactional emails."
        >
          <div className="flex gap-5">
            <ul className="flex-1 divide-y divide-gray-100">
              {TEMPLATE_ROWS.map(([key, label]) => (
                <li
                  key={key}
                  className="flex items-center justify-between py-2.5"
                >
                  <span className="inline-flex items-center gap-2.5 text-sm text-gray-700">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {label}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingTemplate(key)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-sm font-medium text-brand hover:bg-brand/10 rounded-lg transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                </li>
              ))}
            </ul>
            <div className="w-52 shrink-0 bg-brand/10 border border-brand/20 rounded-xl p-4 self-start text-center">
              <Send className="w-7 h-7 text-brand mx-auto" />
              <p className="text-sm font-semibold text-gray-900 mt-2">
                Send a Test Email
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Make sure your email templates are working correctly.
              </p>
              <div className="space-y-2 mt-3 text-left">
                <select
                  aria-label="Test email template"
                  value={testTemplate}
                  onChange={(e) => setTestTemplate(e.target.value)}
                  className={selectClass}
                >
                  {TEMPLATE_ROWS.map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <input
                  type="email"
                  aria-label="Test email recipient"
                  value={testTo}
                  onChange={(e) => setTestTo(e.target.value)}
                  placeholder={adminEmail || "you@example.com"}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={handleSendTest}
                  disabled={sendingTest}
                  className={`${primaryButtonClass} w-full justify-center`}
                >
                  {sendingTest ? "Sending…" : "Send Test Email →"}
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Chat Settings */}
      <Card
        title="Chat Settings"
        description="Configure live chat and customer support options."
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
          <div>
            <span className="block text-sm font-medium text-gray-700 mb-1.5">
              Live Chat
            </span>
            <Toggle
              label="Enable Live Chat"
              checked={chat.enabled}
              onChange={(v) => onChat({ enabled: v })}
            />
          </div>
          <Field
            label="Welcome Message"
            helper="This message will be shown when customers start a chat."
          >
            <input
              type="text"
              aria-label="Chat welcome message"
              value={chat.welcomeMessage}
              onChange={(e) => onChat({ welcomeMessage: e.target.value })}
              placeholder="Hello! How can we help you today?"
              className={inputClass}
            />
          </Field>
          <Field
            label="Offline Message"
            helper="Shown when live chat is disabled."
          >
            <input
              type="text"
              aria-label="Chat offline message"
              value={chat.offlineMessage}
              onChange={(e) => onChat({ offlineMessage: e.target.value })}
              placeholder="We're offline. Please leave a message."
              className={inputClass}
            />
          </Field>
          <Field label="Business Hours">
            <input
              type="text"
              aria-label="Chat business hours"
              value={chat.businessHours}
              onChange={(e) => onChat({ businessHours: e.target.value })}
              placeholder="Mon – Fri: 9:00 AM – 6:00 PM"
              className={inputClass}
            />
          </Field>
        </div>
      </Card>

      {editingTemplate ? (
        <TemplateEditor
          label={TEMPLATE_ROWS.find(([k]) => k === editingTemplate)?.[1] || ""}
          template={notifications.templates[editingTemplate]}
          onClose={() => setEditingTemplate(null)}
          onSave={(draft) => {
            onNotifications({
              templates: {
                ...notifications.templates,
                [editingTemplate]: draft,
              },
            });
            setEditingTemplate(null);
          }}
        />
      ) : null}
    </div>
  );
}
