import { Link } from "react-router-dom";
import {
  Store,
  Palette,
  Share2,
  Home,
  Search,
  FileText,
  Plug,
  SlidersHorizontal,
  Settings2,
  Settings as SettingsIcon,
  Save,
} from "lucide-react";

// Shared design kit for the unified Settings experience (Batch 3d).
// Both the Store Settings page and the Integrations page render the
// same header + pill tab bar through SettingsShell, styled after the
// owner's reference designs: light background, white rounded-2xl
// cards, rounded-lg inputs, Aura brand primaries (bg-brand #F27318,
// hover bg-brand-hover #D9620E — the @theme brand tokens).

export const SETTINGS_TABS = [
  { key: "identity", label: "Store Identity", icon: Store },
  { key: "theme", label: "Theme & Branding", icon: Palette },
  { key: "contact", label: "Contact & Social", icon: Share2 },
  { key: "homepage", label: "Homepage", icon: Home },
  { key: "seo", label: "SEO", icon: Search },
  { key: "operations", label: "Store Operations", icon: Settings2 },
  { key: "pages", label: "Content Pages", icon: FileText },
  { key: "integrations", label: "Integrations", icon: Plug },
  { key: "advanced", label: "Advanced", icon: SlidersHorizontal },
];

export const inputClass =
  "w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand disabled:bg-gray-50";
export const selectClass = `${inputClass} bg-white`;
export const textareaClass = `${inputClass} min-h-28`;
export const primaryButtonClass =
  "inline-flex items-center gap-2 px-4 py-2.5 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-hover transition-colors disabled:opacity-50";
export const secondaryButtonClass =
  "inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 bg-white rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50";
export const smallButtonClass =
  "inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-700 bg-white rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50";
export const iconButtonClass =
  "p-1.5 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40";

export function Card({ title, description, children, className = "" }) {
  return (
    <section
      className={`bg-white rounded-2xl border border-gray-200 p-6 ${className}`}
    >
      {(title || description) && (
        <div className="mb-5">
          {title && (
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          )}
          {description && (
            <p className="text-sm text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

export function Field({ label, children, helper, required = false }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {helper && <p className="text-xs text-gray-400 mt-1">{helper}</p>}
    </div>
  );
}

// Switch-style toggle (button semantics so it works in tests and
// with keyboards). Blue when on, matching the reference designs.
export function Toggle({ label, checked, onChange, ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!!checked}
      aria-label={ariaLabel || label}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2.5 group"
    >
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-brand" : "bg-gray-200"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? "left-[1.375rem]" : "left-0.5"
          }`}
        />
      </span>
      {label && (
        <span className="text-sm text-gray-700 group-hover:text-gray-900">
          {label}
        </span>
      )}
    </button>
  );
}

// Page header + pill tab bar shared by Store Settings and
// Integrations. Internal Store Settings tabs are buttons (or links
// when `tabHref` is provided, e.g. from the Integrations page);
// the Integrations tab is always a route link.
export function SettingsShell({ activeTab, onTabChange, children, tabs = SETTINGS_TABS }) {
  const renderTab = ({ key, label, icon: Icon }) => {
    const active = activeTab === key;
    const className = active
      ? "inline-flex items-center gap-2 px-4 py-2.5 bg-brand text-white rounded-full text-sm font-medium transition-colors whitespace-nowrap"
      : "inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors whitespace-nowrap";
    if (key === "integrations") {
      return (
        <Link
          key={key}
          to="/dashboard/integrations"
          role="tab"
          aria-selected={active}
          className={className}
        >
          <Icon className="w-4 h-4" />
          {label}
        </Link>
      );
    }
    if (onTabChange) {
      return (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => onTabChange(key)}
          className={className}
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      );
    }
    return (
      <Link
        key={key}
        to={`/dashboard/store-settings?tab=${encodeURIComponent(key)}`}
        role="tab"
        aria-selected={active}
        className={className}
      >
        <Icon className="w-4 h-4" />
        {label}
      </Link>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-brand/10 text-brand shrink-0">
          <SettingsIcon className="w-6 h-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your store's appearance, operations and integrations.
            These settings apply across your admin and storefront.
          </p>
        </div>
      </div>
      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="Settings sections"
      >
        {tabs.map(renderTab)}
      </div>
      {children}
    </div>
  );
}

// Sticky bottom action bar (reference design): Cancel restores the
// tab's last loaded/saved values; Save Changes persists the tab.
// The negative margins stretch it across the page padding the
// Settings pages wrap themselves in (px-6 lg:px-8).
export function SaveBar({ onCancel, onSave, saving, saveLabel = "Save Changes" }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-6 lg:-mx-8 px-6 lg:px-8 py-4 bg-white/90 backdrop-blur border-t border-gray-200 flex items-center justify-between gap-4">
      <button type="button" onClick={onCancel} className={secondaryButtonClass}>
        Cancel
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className={primaryButtonClass}
      >
        <Save className="w-4 h-4" />
        {saving ? "Saving…" : saveLabel}
      </button>
    </div>
  );
}

// Page wrapper both Settings pages share. The canvas itself —
// slate-50 background and px-6 py-6 lg:px-8 padding — now comes from
// AdminLayout's <main>, which every admin page shares; this wrapper
// only stretches to fill it (the SaveBar's negative margins stretch
// across the layout padding exactly as they did across this one).
export function SettingsPage({ children }) {
  return <div className="min-h-full">{children}</div>;
}
