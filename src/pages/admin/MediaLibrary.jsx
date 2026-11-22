import { useCallback, useEffect, useState } from "react";
import { Image as ImageIcon, Search } from "lucide-react";
import handoverApi from "../../api/handoverApi";
import useAuthStore from "../../store/authStore";
import { toast } from "../../lib/toast";
import formatError from "../../utils/errorHandler";
import { Card, inputClass, primaryButtonClass, secondaryButtonClass, smallButtonClass } from "../../components/admin/settings/ui";
import { validateMediaUrl } from "../../utils/safeUrl";

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
function baseName(publicId) {
  if (!publicId) return "";
  const parts = String(publicId).split("/");
  return parts[parts.length - 1];
}

function MediaThumb({ resource }) {
  const safeSrc = validateMediaUrl(resource.url);
  if (!safeSrc) return <div className="w-full h-32 bg-gray-50" />;
  return <img src={safeSrc} alt={baseName(resource.publicId)} className="w-full h-32 object-cover bg-gray-50" />;
}

export default function MediaLibrary() {
  const role = useAuthStore((s) => s.user?.role) || "admin";
  const isAdmin = role === "admin";
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [resources, setResources] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const fetchPage = useCallback(async (cursor, term) => {
    const params = {};
    if (cursor) params.cursor = cursor;
    if (term) params.search = term;
    const res = await handoverApi.getMedia(params);
    return res?.data || res;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPage(null, search);
      setResources(data?.resources || []);
      setNextCursor(data?.nextCursor || null);
      setError(null);
    } catch (err) {
      setError(formatError(err, "Could not load media library"));
      setResources([]);
      setNextCursor(null);
    } finally { setLoading(false); }
  }, [fetchPage, search]);

  useEffect(() => { load(); }, [load]);

  const loadMore = async () => {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const data = await fetchPage(nextCursor, search);
      setResources((prev) => [...prev, ...(data?.resources || [])]);
      setNextCursor(data?.nextCursor || null);
    } catch (err) {
      toast.error(formatError(err, "Could not load more media"));
    } finally { setLoadingMore(false); }
  };

  const doDelete = async (publicId) => {
    try {
      await handoverApi.deleteMedia(publicId);
      toast.success("Media deleted");
      setResources((prev) => prev.filter((r) => r.publicId !== publicId));
      setConfirmId(null);
    } catch (err) {
      toast.error(formatError(err, "Failed to delete media"));
    }
  };

  const copyUrl = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("URL copied");
    } catch {
      toast.error("Could not copy URL");
    }
  };

  return (
    <div className="min-h-full">
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-brand/10 text-brand shrink-0"><ImageIcon className="w-6 h-6" /></span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
            <p className="text-sm text-gray-500 mt-0.5">Images stored for this store.</p>
          </div>
        </div>

        <Card>
          <form className="flex gap-3 mb-6" onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); }}>
            <input aria-label="Search media" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search media…" className={inputClass} />
            <button type="submit" className={primaryButtonClass}><Search className="w-4 h-4" /> Search</button>
          </form>

          {loading ? <p className="text-sm text-gray-500">Loading media…</p> : error ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <p className="text-sm text-amber-800">{error}</p>
              <button type="button" onClick={load} className="mt-4 px-4 py-2.5 bg-brand text-white rounded-lg text-sm font-medium">Retry</button>
            </div>
          ) : resources.length === 0 ? <p className="text-sm text-gray-500">No media found.</p> : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {resources.map((r) => (
                  <div key={r.publicId} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                    <MediaThumb resource={r} />
                    <div className="p-3 space-y-1">
                      <p className="text-sm font-medium text-gray-900 truncate" title={r.publicId}>{baseName(r.publicId)}</p>
                      <p className="text-xs text-gray-500">{r.width}×{r.height} · {(r.format || "").toUpperCase()} · {formatSize(r.bytes)}</p>
                      <p className="text-xs text-gray-400">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}</p>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <button type="button" onClick={() => copyUrl(r.url)} className={smallButtonClass}>Copy URL</button>
                        {isAdmin && (confirmId === r.publicId ? (
                          <>
                            <button type="button" onClick={() => doDelete(r.publicId)} className="inline-flex px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium">Confirm delete</button>
                            <button type="button" onClick={() => setConfirmId(null)} className={smallButtonClass}>Cancel</button>
                          </>
                        ) : (
                          <button type="button" onClick={() => setConfirmId(r.publicId)} className={smallButtonClass}>Delete</button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {nextCursor && (
                <div className="mt-6 text-center">
                  <button type="button" onClick={loadMore} disabled={loadingMore} className={secondaryButtonClass}>{loadingMore ? "Loading…" : "Load more"}</button>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
