import { useState } from "react";
import { CheckCircle, XCircle, HelpCircle, Trash2 } from "lucide-react";
import integrationsApi from "../../../api/integrationsApi";
import { toast } from "../../../lib/toast";
import formatError from "../../../utils/errorHandler";

// Reusable secret-key control for the admin Integrations page.
//
// Security rules:
// - The input is NEVER prefilled; it always starts empty. The current
//   state is communicated only via the status line (source + masked tail).
// - Saving with an empty input is a no-op (no API call).
// - Secret values are never logged.
// `describe` is the server describe object for this service:
//   { service, configured, source: "admin" | "env" | "none",
//     masked, lastTestedAt, lastTestStatus }
// `onDescribeChange(service, describe)` lets the parent refresh state
// after save/remove/test (from the response payload).
export function secretStatusText(describe) {
  if (!describe || !describe.configured) return "Not set";
  const masked = describe.masked ? ` ${describe.masked}` : "";
  if (describe.source === "admin") return `Set in admin${masked}`;
  if (describe.source === "env") return `From server config${masked}`;
  return `Set${masked}`;
}

export default function SecretKeyControl({
  label = "API key",
  service,
  describe,
  onDescribeChange,
  helper,
  placeholder = "Enter new value",
}) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(null); // "save" | "remove" | "test"
  const [testResult, setTestResult] = useState(null);

  const applyDescribe = (next) => {
    if (next && onDescribeChange) onDescribeChange(service, next);
  };

  const handleSave = async () => {
    const trimmed = value.trim();
    if (!trimmed || busy) return; // empty input = no-op, no API call
    setBusy("save");
    try {
      const res = await integrationsApi.saveSecret(service, trimmed);
      applyDescribe(res?.data?.secret);
      setValue("");
      setTestResult(null);
      toast.success(`${label} saved`);
    } catch (err) {
      toast.error(formatError(err, `Failed to save ${label.toLowerCase()}`));
    } finally {
      setBusy(null);
    }
  };

  const handleRemove = async () => {
    if (busy) return;
    setBusy("remove");
    try {
      const res = await integrationsApi.deleteSecret(service);
      applyDescribe(res?.data?.secret);
      setValue("");
      setTestResult(null);
      toast.success(`${label} removed`);
    } catch (err) {
      toast.error(formatError(err, `Failed to remove ${label.toLowerCase()}`));
    } finally {
      setBusy(null);
    }
  };

  const handleTest = async () => {
    if (busy) return;
    setBusy("test");
    try {
      const trimmed = value.trim();
      const res = await integrationsApi.testSecret(
        service,
        trimmed || undefined,
      );
      const test = res?.data?.test || null;
      setTestResult(test);
      if (test?.lastTestedAt !== undefined || res?.data?.secret) {
        applyDescribe(res?.data?.secret);
      }
    } catch (err) {
      setTestResult({
        ok: false,
        message: formatError(err, "Test failed"),
        latencyMs: null,
      });
    } finally {
      setBusy(null);
    }
  };

  const lastTestLabel =
    describe?.lastTestStatus === "ok"
      ? "Last test: passed"
      : describe?.lastTestStatus
        ? `Last test: ${describe.lastTestStatus}`
        : null;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="password"
          autoComplete="new-password"
          aria-label={label}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={!value.trim() || busy !== null}
            className="px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
          >
            {busy === "save" ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={handleTest}
            disabled={busy !== null}
            className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {busy === "test" ? "Testing…" : "Test"}
          </button>
          {describe?.source === "admin" && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={busy !== null}
              className="inline-flex items-center gap-1 px-3 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {busy === "remove" ? "Removing…" : "Remove"}
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-1.5">
        {secretStatusText(describe)}
        {lastTestLabel ? ` · ${lastTestLabel}` : ""}
      </p>
      {helper && <p className="text-xs text-gray-400 mt-1">{helper}</p>}
      {testResult && (
        <p
          role="status"
          className={`flex items-start gap-1.5 text-xs mt-2 ${
            testResult.ok === true
              ? "text-emerald-600"
              : testResult.ok === false
                ? "text-red-600"
                : "text-gray-600"
          }`}
        >
          {testResult.ok === true ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : testResult.ok === false ? (
            <XCircle className="w-4 h-4 shrink-0" />
          ) : (
            <HelpCircle className="w-4 h-4 shrink-0" />
          )}
          <span>
            {testResult.ok === true
              ? "Test passed"
              : testResult.ok === false
                ? "Test failed"
                : "Test result"}
            {testResult.message ? ` — ${testResult.message}` : ""}
            {typeof testResult.latencyMs === "number"
              ? ` (${testResult.latencyMs} ms)`
              : ""}
          </span>
        </p>
      )}
    </div>
  );
}
