import { useState, useEffect, useRef } from "react";
import { 
  FileText, 
  Upload, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Loader, 
  Database,
  CloudLightning,
  AlertTriangle
} from "lucide-react";
import { TableSkeleton } from "../../components/common/Skeleton";
import Pagination from "../../components/common/Pagination";
import {
  listDocuments,
  uploadDocument,
  deleteDocument,
  retryDocument
} from "../../api/documentApi";
import { validateMediaUrl } from "../../utils/safeUrl";

// FE-42: with DOCUMENT_DELETE_HONEST_STATUS=on the server answers a
// document delete whose cleanup partly failed with HTTP 200
// { status:'partial', message, data:{ outcomes } } (server
// controllers/document.controller.js:146-156). Outcomes are per-system:
// 'ok' | 'failed' | 'skipped' — only 'failed' is a cleanup failure.
const CLEANUP_SYSTEM_LABELS = {
  qdrant: "vector index",
  cloudinary: "file storage",
  database: "database",
};

const failedCleanupSystems = (outcomes) =>
  Object.entries(outcomes || {})
    .filter(([, outcome]) => outcome === "failed")
    .map(([system]) => ({
      system,
      label: CLEANUP_SYSTEM_LABELS[system] || system,
    }));

const KnowledgeBase = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  // FE-42: a 'partial' delete outcome stays visible until dismissed:
  // { id, message, failed: [{ system, label }], recordGone, retryError }
  const [partialDelete, setPartialDelete] = useState(null);
  const [retryingCleanup, setRetryingCleanup] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1 });

  // Fetch document list
  const fetchDocs = async (currentPage = 1) => {
    try {
      setLoading(true);
      const res = await listDocuments({ page: currentPage, limit: 10 });
      setDocuments(res.data.documents || []);
      setPagination(res.data.pagination || { totalPages: 1 });
      setError(null);
    } catch (err) {
      setError(err.displayMessage || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs(page);
  }, [page]);

  // Handle file upload
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);
      await uploadDocument(file);
      setSuccessMsg("Document uploaded successfully. Indexing started in background.");
      fetchDocs(page);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      setError(err.displayMessage || "Document upload failed");
    } finally {
      setUploading(false);
    }
  };

  // FE-37: the delete button had no pending guard — a double-click
  // fired duplicate DELETE calls. Track the in-flight delete (guard
  // first, before the confirm prompt) and disable that row's button.
  const [deletingId, setDeletingId] = useState(null);
  const deletingRef = useRef(null);

  // Handle document deletion
  const handleDelete = async (id) => {
    if (deletingRef.current) return;
    if (!window.confirm("Are you sure you want to delete this document? All vector indexes will be removed.")) return;
    deletingRef.current = id;
    setDeletingId(id);
    try {
      // FE-42: use the resolved value — a 'partial' status means the DB
      // record is deleted but some cleanup failed; claiming full success
      // would hide orphaned vectors/files from the admin.
      const result = await deleteDocument(id);
      if (result?.status === "partial") {
        setSuccessMsg(null);
        setPartialDelete({
          id,
          message:
            result.message ||
            "Document deleted from the database, but some cleanup steps failed.",
          failed: failedCleanupSystems(result.data?.outcomes),
          recordGone: false,
          retryError: null,
        });
      } else {
        setPartialDelete(null);
        setSuccessMsg("Document and vectors deleted successfully");
        setTimeout(() => setSuccessMsg(null), 5000);
      }
      // The list refetches either way: the DB row really is gone.
      fetchDocs(page);
    } catch (err) {
      setError(err.displayMessage || "Failed to delete document");
    } finally {
      deletingRef.current = null;
      setDeletingId(null);
    }
  };

  // FE-42: "Retry cleanup" re-calls deleteDocument once per click and
  // reports exactly what the server answers — success upgrades the
  // warning, another partial refreshes the failed systems, and a 404
  // means the record is already deleted (the server has no cleanup-retry
  // endpoint; the failed cleanups are logged for support). A cleanup is
  // never claimed successful unless the server response says so.
  const handleRetryCleanup = async () => {
    if (!partialDelete || retryingCleanup) return;
    const { id } = partialDelete;
    try {
      setRetryingCleanup(true);
      const result = await deleteDocument(id);
      if (result?.status === "partial") {
        setPartialDelete({
          id,
          message:
            result.message ||
            "Document deleted from the database, but some cleanup steps failed.",
          failed: failedCleanupSystems(result.data?.outcomes),
          recordGone: false,
          retryError: null,
        });
      } else {
        setPartialDelete(null);
        setSuccessMsg("Document and vectors deleted successfully");
        setTimeout(() => setSuccessMsg(null), 5000);
      }
      fetchDocs(page);
    } catch (err) {
      if (err?.response?.status === 404 || err?.status === 404) {
        setPartialDelete((prev) =>
          prev ? { ...prev, recordGone: true, retryError: null } : prev
        );
      } else {
        setPartialDelete((prev) =>
          prev
            ? {
                ...prev,
                retryError: err.displayMessage || "Cleanup retry failed",
              }
            : prev
        );
      }
    } finally {
      setRetryingCleanup(false);
    }
  };

  // Handle re-indexing retry
  const handleRetry = async (id) => {
    try {
      await retryDocument(id);
      setSuccessMsg("Re-indexing job queued successfully");
      fetchDocs(page);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      setError(err.displayMessage || "Failed to trigger re-indexing");
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-10">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">AI Knowledge Base</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Upload files (PDF, DOCX, TXT, CSV) to embed and ingest into the RAG chatbot pipeline.
          </p>
        </div>

        {/* Upload Button */}
        <label className={`flex items-center gap-2 px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium shadow-sm transition-all duration-200 cursor-pointer ${uploading ? "opacity-75 cursor-not-allowed" : ""}`}>
          {uploading ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <Upload className="w-5 h-5" />
          )}
          <span>{uploading ? "Uploading..." : "Upload File"}</span>
          <input 
            type="file" 
            accept=".pdf,.docx,.txt,.csv" 
            className="hidden" 
            onChange={handleUpload} 
            disabled={uploading} 
          />
        </label>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl flex items-start gap-3">
          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}

      {/* FE-42: partial-delete warning — stays until dismissed, names the
          failed cleanup systems, and offers one honest retry per click. */}
      {partialDelete && (
        <div
          data-testid="partial-delete-warning"
          className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-2 text-sm">
            <span className="font-semibold">
              Document deleted, but cleanup was incomplete
            </span>
            <span>{partialDelete.message}</span>
            {partialDelete.failed.length > 0 && (
              <span>
                Cleanup failed for:{" "}
                {partialDelete.failed.map((f) => f.label).join(", ")}.
              </span>
            )}
            {partialDelete.recordGone && (
              <span>
                The document record is already deleted, so cleanup cannot be
                retried from here. The failed cleanup
                {partialDelete.failed.length > 0
                  ? ` (${partialDelete.failed.map((f) => f.label).join(", ")})`
                  : ""}{" "}
                has been logged for support to resolve.
              </span>
            )}
            {partialDelete.retryError && (
              <span className="text-rose-700">
                Retry failed: {partialDelete.retryError}
              </span>
            )}
            <span className="flex gap-2 mt-1">
              {!partialDelete.recordGone && (
                <button
                  type="button"
                  onClick={handleRetryCleanup}
                  disabled={retryingCleanup}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white rounded-lg font-medium transition-colors"
                >
                  {retryingCleanup ? "Retrying..." : "Retry cleanup"}
                </button>
              )}
              <button
                type="button"
                onClick={() => setPartialDelete(null)}
                className="px-3 py-1.5 border border-amber-300 hover:bg-amber-100 text-amber-800 rounded-lg font-medium transition-colors"
              >
                Dismiss
              </button>
            </span>
          </div>
        </div>
      )}

      {/* Stats Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Documents</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{documents.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Indexed Active</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {documents.filter(d => d.status === "indexed").length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <CloudLightning className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Processing / Pending</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {documents.filter(d => ["pending", "processing"].includes(d.status)).length}
            </p>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Knowledge Files</h3>
          <button 
            onClick={() => fetchDocs(page)} 
            className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading && documents.length === 0 ? (
          <div className="p-4">
            <TableSkeleton rows={4} cols={5} />
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="font-bold text-gray-900 text-lg">No documents uploaded yet</h4>
            <p className="text-gray-500 text-sm max-w-sm mt-2">
              Upload store policies, FAQs, shipping rates, and refund guides to train your AI support agent.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-6 py-4">Document Details</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Uploaded At</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {documents.map((doc) => (
                  <tr key={doc._id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-teal-50/50 text-teal-600 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <a
                            href={validateMediaUrl(doc.fileUrl, { fallback: "#", allowedHosts: ["res.cloudinary.com"] }) || "#"}
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="font-bold text-gray-900 hover:text-teal-600 truncate block text-sm"
                          >
                            {doc.fileName}
                          </a>
                          {doc.error && (
                            <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span>{doc.error}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold uppercase text-gray-400">
                      {doc.fileType}
                    </td>
                    <td className="px-6 py-4">
                      {doc.status === "indexed" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          Ready
                        </span>
                      )}
                      {doc.status === "processing" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                          <Loader className="w-3 h-3 animate-spin text-blue-600" />
                          Processing
                        </span>
                      )}
                      {doc.status === "pending" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                          Queued
                        </span>
                      )}
                      {doc.status === "failed" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(doc.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {doc.status === "failed" && (
                          <button 
                            onClick={() => handleRetry(doc._id)}
                            title="Retry Indexing"
                            className="p-2 hover:bg-gray-100 text-teal-600 hover:text-teal-700 rounded-lg transition-colors"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(doc._id)}
                          disabled={deletingId === doc._id}
                          title="Delete Document"
                          className="p-2 hover:bg-rose-50 text-rose-500 hover:text-rose-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls — the shared Pagination, simple
          variant (Wave A); it renders nothing at one page. */}
      <div className="mt-2">
        <Pagination
          variant="simple"
          page={page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};

export default KnowledgeBase;
