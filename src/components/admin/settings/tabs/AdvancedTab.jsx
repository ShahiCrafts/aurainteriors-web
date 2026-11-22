import { useEffect, useRef, useState } from "react";
import { RotateCcw, AlertTriangle, Code2 } from "lucide-react";
import { Card, textareaClass, Toggle, primaryButtonClass, secondaryButtonClass } from "../ui";
import handoverApi from "../../../../api/handoverApi";
import settingsApi from "../../../../api/settingsApi";
import integrationsApi from "../../../../api/integrationsApi";
import { toast } from "../../../../lib/toast";
import formatError from "../../../../utils/errorHandler";

// Advanced tab (Batch 3d, new). Three REAL operations:
//  - Reset to Defaults: POST /admin/settings/reset restores the
//    built-in defaults for one section or all of them (the stored
//    override is deleted; audit-logged server-side). On success the
//    parent reloads the settings so every tab shows the defaults.
//  - Custom CSS: theme.customCss, injected on the storefront by
//    SiteSettingsEffects into <style id="site-custom-css">.
//  - Danger Zone: the seller-handover wipe — DELETEs every
//    admin-saved API key via the integrations endpoints. Keys that
//    come from the server environment are NOT affected (they are
//    not stored in the settings vault), and the UI says so.

const SECTION_LABELS = {
  identity: "Identity",
  theme: "Theme",
  contact: "Contact",
  homepage: "Homepage",
  pages: "Content Pages",
  seo: "SEO",
};

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function MaintenanceCard() {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let cancelled = false;
    settingsApi.getSettings().then((res) => {
      if (cancelled) return;
      const m = res?.data?.settings?.maintenance || res?.data?.maintenance || {};
      setEnabled(!!m.enabled);
      setMessage(m.message || "");
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);
  const save = async () => {
    setSaving(true);
    try {
      await settingsApi.updateSettingsSection("maintenance", { enabled, message });
      toast.success("Maintenance settings saved");
    } catch (err) {
      toast.error(formatError(err, "Failed to save maintenance settings"));
    } finally { setSaving(false); }
  };
  return (
    <Card title="Maintenance Mode" description="When enabled, the storefront shows the maintenance page instead of the shop.">
      <div className="space-y-4">
        <Toggle label="Maintenance mode" ariaLabel="Maintenance mode" checked={enabled} onChange={setEnabled} />
        <p className="text-sm text-gray-500">{enabled ? "On — storefront shows the maintenance page." : "Off — the store is live."}</p>
        <textarea aria-label="Maintenance message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="We're making some improvements to the store. Please check back shortly." className={textareaClass} />
        <button type="button" onClick={save} disabled={saving} className={primaryButtonClass}>{saving ? "Saving…" : "Save maintenance settings"}</button>
      </div>
    </Card>
  );
}

function BackupExportCard() {
  const [busy, setBusy] = useState("");
  const fileRef = useRef(null);
  const doExport = async (kind) => {
    setBusy(kind);
    try {
      const blob = await handoverApi.exportCsv(kind);
      downloadBlob(blob instanceof Blob ? blob : new Blob([blob], { type: "text/csv" }), `${kind}.csv`);
      toast.success(`${kind} export downloaded`);
    } catch (err) { toast.error(formatError(err, "Export failed")); } finally { setBusy(""); }
  };
  const doBackup = async () => {
    setBusy("backup");
    try {
      const res = await handoverApi.getBackup();
      const backup = res?.data?.backup || res?.data || res;
      downloadBlob(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }), "settings-backup.json");
      toast.success("Settings backup downloaded");
    } catch (err) { toast.error(formatError(err, "Backup failed")); } finally { setBusy(""); }
  };
  const onRestoreFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy("restore");
    try {
      const text = await file.text();
      let parsed;
      try { parsed = JSON.parse(text); } catch { toast.error("Invalid backup file: not valid JSON"); return; }
      const backup = parsed?.backup || parsed;
      const res = await handoverApi.restoreBackup(backup);
      const applied = res?.data?.appliedSections || res?.appliedSections || [];
      toast.success(`Backup restored: ${applied.length} section(s) applied`);
    } catch (err) { toast.error(formatError(err, "Restore failed")); } finally { setBusy(""); }
  };
  return (
    <Card title="Backup & Export" description="Download catalogue, order and customer CSVs, back up store settings to a JSON file, or restore from one. Secrets are never included in a backup.">
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={!!busy} onClick={() => doExport("products")} className={secondaryButtonClass}>Products CSV</button>
        <button type="button" disabled={!!busy} onClick={() => doExport("orders")} className={secondaryButtonClass}>Orders CSV</button>
        <button type="button" disabled={!!busy} onClick={() => doExport("customers")} className={secondaryButtonClass}>Customers CSV</button>
        <button type="button" disabled={!!busy} onClick={doBackup} className={secondaryButtonClass}>Download settings backup</button>
        <button type="button" disabled={!!busy} onClick={() => fileRef.current?.click()} className={secondaryButtonClass}>Restore backup</button>
        <input ref={fileRef} type="file" accept=".json,application/json" aria-label="Restore backup file" className="hidden" onChange={onRestoreFile} />
      </div>
    </Card>
  );
}

export default function AdvancedTab({ theme, onTheme, onReset }) {
  const [busy, setBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(null);
  const [savedKeys, setSavedKeys] = useState(null);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [wiping, setWiping] = useState(false);

  useEffect(() => {
    let cancelled = false;
    integrationsApi
      .getIntegrations()
      .then((res) => {
        if (cancelled) return;
        // GET /admin/integrations → data.secrets: describe entries
        // { service, configured, source: "admin" | "env" | "none" }.
        const entries = res?.data?.secrets || [];
        setSavedKeys(entries.filter((k) => k.source === "admin"));
      })
      .catch(() => {
        if (!cancelled) setSavedKeys([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const doReset = async () => {
    setBusy(true);
    try {
      await settingsApi.resetSettings(confirmReset || undefined);
      toast.success(
        confirmReset
          ? `${SECTION_LABELS[confirmReset]} settings reset to defaults`
          : "All settings reset to defaults",
      );
      setConfirmReset(null);
      await onReset();
    } catch (err) {
      toast.error(formatError(err, "Reset failed"));
    } finally {
      setBusy(false);
    }
  };

  const doWipe = async () => {
    setWiping(true);
    try {
      const keys = savedKeys || [];
      for (const key of keys) {
        // eslint-disable-next-line no-await-in-loop
        await integrationsApi.deleteSecret(key.service);
      }
      setSavedKeys([]);
      setConfirmWipe(false);
      toast.success("All saved API keys removed");
    } catch (err) {
      toast.error(formatError(err, "Failed to remove API keys"));
    } finally {
      setWiping(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card
        title="Reset to Defaults"
        description="Restore the built-in defaults for a section. The values saved in the admin panel are removed and the storefront falls back to its defaults."
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(SECTION_LABELS).map(([section, label]) => (
            <button
              key={section}
              type="button"
              onClick={() => setConfirmReset(section)}
              className="inline-flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-brand" />
              Reset {label}
            </button>
          ))}
        </div>
        <div className="border-t border-gray-100 mt-5 pt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setConfirmReset("all")}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset All Settings
          </button>
          {confirmReset && (
            <span className="flex items-center gap-3 text-sm text-gray-700">
              <span>
                Reset{" "}
                {confirmReset === "all"
                  ? "ALL sections"
                  : SECTION_LABELS[confirmReset]}{" "}
                to defaults? This cannot be undone.
              </span>
              <button
                type="button"
                onClick={doReset}
                disabled={busy}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {busy ? "Resetting…" : "Yes, reset"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(null)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            </span>
          )}
        </div>
      </Card>

      <Card
        title="Custom CSS"
        description="Optional CSS injected into every storefront page, after the store's own styles. Use it for small brand tweaks without touching the codebase."
      >
        <div className="flex items-center gap-2 mb-3 text-xs text-gray-400">
          <Code2 className="w-4 h-4" />
          Applied live on the storefront once saved (maximum 20,000
          characters).
        </div>
        <textarea
          aria-label="Custom CSS"
          value={theme.customCss || ""}
          onChange={(e) => onTheme({ customCss: e.target.value })}
          placeholder={".btn-primary { letter-spacing: 0.02em; }"}
          spellCheck={false}
          className={`${textareaClass} !min-h-40 font-mono !text-[13px]`}
        />
      </Card>

      <Card
        title="Danger Zone"
        className="border-red-200"
        description="Seller handover: remove every API key saved in this admin panel so the new owner starts with a clean vault."
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              {savedKeys === null
                ? "Checking for saved API keys…"
                : savedKeys.length === 0
                  ? "No API keys are currently saved in the admin panel."
                  : `${savedKeys.length} saved API key${savedKeys.length === 1 ? "" : "s"} will be permanently deleted.`}
            </p>
            <p>
              Keys provided by the server environment are{" "}
              <strong>not</strong> affected — only keys typed into the
              Integrations page are stored here.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setConfirmWipe(true)}
            disabled={!savedKeys || savedKeys.length === 0}
            className="px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
          >
            Remove all saved API keys
          </button>
          {confirmWipe && (
            <span className="flex items-center gap-3 text-sm text-gray-700">
              <span>Delete all saved API keys now?</span>
              <button
                type="button"
                onClick={doWipe}
                disabled={wiping}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {wiping ? "Removing…" : "Yes, remove all"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmWipe(false)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            </span>
          )}
        </div>
      </Card>

      <MaintenanceCard />

      <BackupExportCard />
    </div>
  );
}
