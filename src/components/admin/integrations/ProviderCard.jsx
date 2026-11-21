// One AI provider's config card on the admin Integrations page:
// enabled toggle + model + base URL inputs. The provider's
// SecretKeyControl is rendered by the parent as `children`.
export default function ProviderCard({
  displayName,
  provider,
  onChange,
  children,
}) {
  const config = provider || {};
  const inputClass =
    "w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500";

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
            className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
          />
          Enabled
        </label>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
