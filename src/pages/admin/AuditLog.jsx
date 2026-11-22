import { useCallback, useEffect, useState } from "react";
import { ScrollText } from "lucide-react";
import handoverApi from "../../api/handoverApi";
import formatError from "../../utils/errorHandler";
import { Card, selectClass, secondaryButtonClass } from "../../components/admin/settings/ui";

const ACTIONS = [
  "", "settings.update", "settings.reset", "settings.restore",
  "integrations.secret.set", "integrations.secret.delete",
  "user.role.update", "user.activate", "user.deactivate", "user.delete",
  "handover.demoWipe", "media.delete", "knowledge.reindexAll",
];
const SECRET_KEY = /token|otp|password|secret|hash/i;

function formatDetails(obj) {
  if (!obj || typeof obj !== "object") return "";
  const pairs = [];
  for (const [k, v] of Object.entries(obj)) {
    if (SECRET_KEY.test(k)) continue;
    pairs.push(`${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`);
  }
  const joined = pairs.join("; ");
  return joined.length > 120 ? `${joined.slice(0, 120)}…` : joined;
}

function actorLabel(log) {
  const a = log.actor;
  if (a && typeof a === "object") {
    const name = [a.firstName, a.lastName].filter(Boolean).join(" ");
    return name || a.email || "System";
  }
  return "System";
}

export default function AuditLog() {
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (action) params.action = action;
      const res = await handoverApi.getAuditLogs(params);
      const data = res?.data || res;
      setLogs(data?.logs || []);
      if (data?.pagination) setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(formatError(err, "Could not load audit log"));
    } finally { setLoading(false); }
  }, [page, action]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="bg-slate-50 min-h-full px-6 py-6 lg:px-8">
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 shrink-0"><ScrollText className="w-6 h-6" /></span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
            <p className="text-sm text-gray-500 mt-0.5">Recent admin actions recorded by the server.</p>
          </div>
        </div>

        <Card>
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <label className="text-sm font-medium text-gray-700" htmlFor="audit-action-filter">Action</label>
            <select id="audit-action-filter" aria-label="Filter by action" value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} className={`${selectClass} max-w-xs`}>
              <option value="">All actions</option>
              {ACTIONS.filter(Boolean).map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {loading ? <p className="text-sm text-gray-500">Loading audit log…</p> : error ? (
            <div><p className="text-red-600 text-sm">{error}</p><button type="button" onClick={load} className="mt-4 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium">Retry</button></div>
          ) : logs.length === 0 ? <p className="text-sm text-gray-500">No audit entries found.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="py-3 pr-4">Time</th><th className="py-3 pr-4">Actor</th><th className="py-3 pr-4">Action</th><th className="py-3 pr-4">Target</th><th className="py-3">Details</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {logs.map((log) => {
                    const before = formatDetails(log.before);
                    const after = formatDetails(log.after);
                    const details = [before && `before: ${before}`, after && `after: ${after}`].filter(Boolean).join(" | ");
                    const trimmed = details.length > 120 ? `${details.slice(0, 120)}…` : details;
                    return (
                      <tr key={log._id}>
                        <td className="py-3 pr-4 whitespace-nowrap text-gray-600">{log.at ? new Date(log.at).toLocaleString() : ""}</td>
                        <td className="py-3 pr-4 text-gray-900">{actorLabel(log)}{log.actor?.email ? <span className="block text-xs text-gray-400">{log.actor.email}</span> : null}</td>
                        <td className="py-3 pr-4"><span className="inline-flex px-2 py-1 rounded-md bg-gray-100 font-mono text-xs text-gray-700">{log.action}</span></td>
                        <td className="py-3 pr-4 text-gray-600">{[log.targetType, log.targetId].filter(Boolean).join(" ")}</td>
                        <td className="py-3 text-gray-600">{trimmed}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center gap-3 mt-5">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className={secondaryButtonClass}>Prev</button>
            <span className="text-sm text-gray-600">Page {pagination.page || page} of {pagination.pages || 1}</span>
            <button type="button" disabled={page >= (pagination.pages || 1)} onClick={() => setPage((p) => p + 1)} className={secondaryButtonClass}>Next</button>
          </div>
        </Card>
      </div>
    </div>
  );
}
