import { inputClass } from "../settings/ui";

// One AI provider's config card on the admin Integrations page:
// enabled toggle + model + base URL inputs. The provider's
// SecretKeyControl is rendered by the parent as `children`.
// (Batch 3d: restyled to the Settings design — blue accent,
// rounded-lg inputs.)
export default function ProviderCard({
  displayName,
  provider,
  onChange,
  children,
}) {
  const config = provider || {};

  return (
    <div className="border border-gray-200 rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{displayName}</h3>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            aria-label={`Enable ${displayName}`}
            checked={!!config.enabled}
            onChange={(e) => onChange("enabled", e.target.checked)}
            className="w-4 h-4 accent-brand border-gray-300 rounded"
          />
          Enabled
        </label>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Model
          </label>
          <input
            type="text"
            aria-label={`${displayName} model`}
            value={config.model || ""}
            onChange={(e) => onChange("model", e.target.value)}
            placeholder="Model name"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Base URL
          </label>
          <input
            type="text"
            aria-label={`${displayName} base URL`}
            value={config.baseUrl || ""}
            onChange={(e) => onChange("baseUrl", e.target.value)}
            placeholder="https://…"
            className={inputClass}
          />
        </div>
      </div>
      {children}
    </div>
  );
}
