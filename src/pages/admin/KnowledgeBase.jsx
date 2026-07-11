import { useState, useEffect } from "react";
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
import { 
  listDocuments, 
  uploadDocument, 
  deleteDocument, 
  retryDocument 
} from "../../api/documentApi";

const KnowledgeBase = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
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

  // Handle document deletion
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this document? All vector indexes will be removed.")) return;
    try {
      await deleteDocument(id);
      setSuccessMsg("Document and vectors deleted successfully");
      fetchDocs(page);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      setError(err.displayMessage || "Failed to delete document");
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
          <div className="flex flex-col items-center justify-center py-20">
            <Loader className="w-10 h-10 text-teal-600 animate-spin" />
            <p className="text-gray-400 text-sm mt-4">Loading knowledge documents...</p>
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
                            href={doc.fileUrl} 
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
                          title="Delete Document"
                          className="p-2 hover:bg-rose-50 text-rose-500 hover:text-rose-600 rounded-lg transition-colors"
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

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-2">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            className="px-4 py-2 border border-gray-200 rounded-xl disabled:opacity-40 font-medium hover:bg-gray-50 text-sm transition-all"
          >
            Previous
          </button>
          <span className="text-sm font-semibold text-gray-600">
            Page {page} of {pagination.totalPages}
          </span>
          <button 
            disabled={page === pagination.totalPages}
            onClick={() => setPage(p => Math.min(p + 1, pagination.totalPages))}
            className="px-4 py-2 border border-gray-200 rounded-xl disabled:opacity-40 font-medium hover:bg-gray-50 text-sm transition-all"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
