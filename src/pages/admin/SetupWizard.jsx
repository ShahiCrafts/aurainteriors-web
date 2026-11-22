import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Circle, Rocket, Trash2 } from "lucide-react";
import handoverApi from "../../api/handoverApi";
import settingsApi from "../../api/settingsApi";
import useAuthStore from "../../store/authStore";
import { toast } from "../../lib/toast";
import formatError from "../../utils/errorHandler";
import {
  Card,
  secondaryButtonClass,
  Toggle,
} from "../../components/admin/settings/ui";

export default function SetupWizard() {
  const currentUser = useAuthStore((s) => s.user);
  const role = currentUser?.role || "admin";
  const isAdmin = role === "admin";
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [wiping, setWiping] = useState(false);
  const [toggling, setToggling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await handoverApi.getStatus();
      setStatus(res?.data || res);
      setError(null);
    } catch (err) {
      setError(formatError(err, "Could not load setup status"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const doWipe = async () => {
    setWiping(true);
    try {
      const res = await handoverApi.wipeDemo("WIPE");
      const deleted = res?.data?.deleted ?? res?.deleted;
      toast.success(deleted != null ? `Deleted ${deleted} demo products` : "Demo products deleted");
      setConfirmWipe(false);
      await load();
    } catch (err) {
      toast.error(formatError(err, "Failed to delete demo products"));
    } finally { setWiping(false); }
  };

  const toggleMaintenance = async () => {
    if (!status) return;
    setToggling(true);
    try {
      await settingsApi.updateSettingsSection("maintenance", { enabled: !status.maintenanceEnabled });
      await load();
    } catch (err) {
      toast.error(formatError(err, "Failed to update maintenance mode"));
    } finally { setToggling(false); }
  };

  if (loading && !status) {
    return <div className="min-h-full"><div className="bg-white border border-gray-200 rounded-2xl p-10 text-sm text-gray-500">Loading setup status…</div></div>;
  }
  if (error && !status) {
    return (
      <div className="min-h-full">
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <p className="text-red-600 text-sm">{error}</p>
          <button type="button" onClick={load} className="mt-4 px-4 py-2.5 bg-brand text-white rounded-lg text-sm font-medium">Retry</button>
        </div>
      </div>
    );
  }
  if (!status) return null;

  const keys = status.keys || { adminSet: 0, envOnly: 0, missing: 0 };
  const identity = status.identity || {};
  const contact = status.contact || {};
  const payments = status.payments || {};

  const steps = [
    {
      id: "remove-keys", title: "Remove the seller's API keys",
      done: keys.adminSet === 0,
      detail: keys.adminSet === 0 ? "No seller keys remain in the admin panel." : `${keys.adminSet} key(s) still saved in the admin panel`,
      action: <Link to="/dashboard/store-settings?tab=advanced" className={secondaryButtonClass}>Open Advanced settings</Link>,
    },
    {
      id: "add-keys", title: "Add your own API keys",
      done: keys.missing === 0,
      detail: keys.missing === 0 ? "Every service has a key configured." : `${keys.missing} service(s) have no key yet`,
      action: <Link to="/dashboard/integrations" className={secondaryButtonClass}>Open Integrations</Link>,
    },
    {
      id: "demo", title: "Delete the demo products",
      done: status.demoProducts === 0,
      detail: status.demoProducts === 0 ? "No demo products remain." : `${status.demoProducts} demo of ${status.totalProducts} products`,
      action: (
        <span className="flex items-center gap-2">
          {!confirmWipe ? (
            <button type="button" disabled={status.demoProducts === 0 || !isAdmin} onClick={() => setConfirmWipe(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
              <Trash2 className="w-4 h-4" /> Wipe demo products
            </button>
          ) : (
            <>
              <span className="text-sm text-gray-700">Yes, wipe {status.demoProducts} demo products?</span>
              <button type="button" onClick={doWipe} disabled={wiping} className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">{wiping ? "Wiping…" : "Yes, wipe"}</button>
              <button type="button" onClick={() => setConfirmWipe(false)} className={secondaryButtonClass}>Cancel</button>
            </>
          )}
        </span>
      ),
    },
    {
      id: "brand", title: "Brand the store",
      done: !!(identity.storeNameSet || identity.logoSet),
      detail: identity.storeNameSet || identity.logoSet ? "Store name or logo is set." : "Set your store name and logo.",
      action: <Link to="/dashboard/store-settings?tab=identity" className={secondaryButtonClass}>Open Store Identity</Link>,
    },
    {
      id: "contact", title: "Add contact details & socials",
      done: !!(contact.phone && contact.email && contact.address),
      detail: contact.phone && contact.email && contact.address ? "Phone, email and address are set." : "Phone, email and address are needed.",
      action: <Link to="/dashboard/store-settings?tab=contact" className={secondaryButtonClass}>Open Contact & Social</Link>,
    },
    {
      id: "payments", title: "Configure payments (eSewa)",
      done: !!payments.esewaConfigured,
      detail: payments.esewaConfigured ? "eSewa is configured." : "eSewa is not configured yet.",
      action: <Link to="/dashboard/integrations" className={secondaryButtonClass}>Open Integrations</Link>,
    },
    {
      id: "shipping", title: "Set up shipping zones",
      done: (status.shippingZonesEnabled || 0) > 0,
      detail: (status.shippingZonesEnabled || 0) > 0 ? `${status.shippingZonesEnabled} shipping zone(s) enabled.` : "No shipping zones enabled yet.",
      action: <Link to="/dashboard/store-settings?tab=operations" className={secondaryButtonClass}>Open Store Operations</Link>,
    },
    {
      id: "go-live", title: "Go live",
      done: !status.maintenanceEnabled,
      detail: status.maintenanceEnabled ? "Maintenance mode is ON — the storefront shows the maintenance page." : "The store is live.",
      action: (
        <span className="flex items-center gap-3">
          <span className="text-sm text-gray-700">Maintenance mode</span>
          <Toggle ariaLabel="Maintenance mode" checked={!!status.maintenanceEnabled} onChange={() => { if (!toggling) toggleMaintenance(); }} />
          <span className="text-sm text-gray-500">{status.maintenanceEnabled ? "On" : "Off"}</span>
        </span>
      ),
    },
  ];

  const complete = steps.filter((s) => s.done).length;

  return (
    <div className="min-h-full">
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-brand/10 text-brand shrink-0"><Rocket className="w-6 h-6" /></span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Setup Wizard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Hand over or take over this store: work through the checklist against live store data.</p>
          </div>
        </div>

        <Card title="Progress">
          <p className="text-sm text-gray-700 mb-3">{complete} of 8 complete</p>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={complete} aria-valuemin={0} aria-valuemax={8}>
            <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${(complete / 8) * 100}%` }} />
          </div>
        </Card>

        <Card>
          <div className="divide-y divide-gray-100">
            {steps.map((step) => (
              <div key={step.id} className="flex flex-wrap items-center gap-4 py-4 first:pt-0 last:pb-0">
                {step.done ? <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" /> : <Circle className="w-6 h-6 text-gray-300 shrink-0" />}
                <div className="flex-1 min-w-52">
                  <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{step.detail}</p>
                </div>
                <div>{step.action}</div>
              </div>
            ))}
          </div>
        </Card>
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>
    </div>
  );
}
