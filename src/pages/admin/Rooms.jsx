import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Edit2, Plus, Trash2, X } from "lucide-react";
import { toast } from "../../lib/toast";
import Dialog from "../../components/common/Dialog";
import Skeleton from "../../components/common/Skeleton";
import ConfirmationDialog from "../../components/modals/ConfirmationDialog";
import ImageWithFallback from "../../components/fallbacks/ImageWithFallback";
import { getImageUrl } from "../../utils/imageUrl";
import {
  useCreateRoom,
  useDeleteRoom,
  useRooms,
  useUpdateRoom,
} from "../../hooks/catalog/useCatalogTan";
import formatError from "../../utils/errorHandler";

// Phase 6 (catalog) — rooms admin.
//
// Rooms are assigned to categories and products by slug, so the
// slug is immutable (the server 400s a change) and delete is
// guarded by the products still assigned to the room — both
// surface with the server's wording. Known API gap (recorded in
// docs/catalog/PHASE6_NOTES.md): the only rooms list endpoint is
// the public active-only one, so a deactivated room disappears
// from this page until an admin list endpoint ships; the form
// warns about that next to the Active toggle.

const inputClass =
  "w-full px-4 h-10 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all bg-white";
const labelClass = "block text-sm font-medium text-gray-700 mb-2";

const EMPTY_FORM = {
  slug: "",
  label: "",
  description: "",
  image: "",
  sortOrder: "",
  active: true,
};

export default function Rooms() {
  const { data, isLoading, error } = useRooms();
  const rooms = data?.data?.rooms || [];
  const createMutation = useCreateRoom();
  const updateMutation = useUpdateRoom();
  const deleteMutation = useDeleteRoom();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (room) => {
    setEditing(room);
    setForm({
      slug: room.slug || "",
      label: room.label || "",
      description: room.description || "",
      image: room.image || "",
      sortOrder: room.sortOrder ?? "",
      active: room.active !== false,
    });
    setFormError("");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      label: form.label.trim(),
      description: form.description.trim(),
      image: form.image.trim(),
      active: form.active,
    };
    if (!editing) payload.slug = form.slug.trim();
    if (form.sortOrder !== "") payload.sortOrder = Number(form.sortOrder);
    setFormError("");
    try {
      if (editing) {
        await updateMutation.mutateAsync({ slug: editing.slug, data: payload });
        toast.success("Room updated");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Room created");
      }
      setShowModal(false);
    } catch (err) {
      setFormError(formatError(err, "Failed to save room"));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.slug);
      toast.success("Room deleted");
      setDeleteTarget(null);
    } catch (err) {
      // e.g. "Cannot delete room assigned to N products…" — shown
      // verbatim, never masked as success.
      toast.error(formatError(err, "Failed to delete room"));
      setDeleteTarget(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
        <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Rooms</h2>
        <p className="text-gray-500">{formatError(error)}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rooms</h1>
          <p className="text-gray-500 mt-0.5 text-sm">
            The room registry categories and products are assigned to.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Room
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="divide-y divide-gray-50">
          {rooms.map((room) => (
            <div
              key={room.slug}
              data-testid={`room-row-${room.slug}`}
              className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                {room.image ? (
                  <ImageWithFallback src={getImageUrl(room.image, "categories")} alt={room.label} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-300">
                    {room.label?.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 text-sm">{room.label}</span>
                  <span className="font-mono text-xs text-gray-400">{room.slug}</span>
                </div>
                {room.description && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{room.description}</p>
                )}
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 shrink-0">
                Active
              </span>
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={() => openEdit(room)}
                  className="p-1.5 hover:bg-slate-100 text-gray-500 rounded-full transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteTarget(room)}
                  className="p-1.5 hover:bg-red-50 text-red-500 rounded-full transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {rooms.length === 0 && (
            <p className="text-center text-sm text-gray-500 py-10">No rooms defined yet.</p>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg"
            >
              <Dialog
                open
                onClose={() => setShowModal(false)}
                label={editing ? `Edit room ${editing.label}` : "Add room"}
                className="bg-white rounded-2xl w-full max-h-[90vh] overflow-y-auto relative"
              >
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {editing ? "Edit Room" : "Add New Room"}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                  <div>
                    <label htmlFor="room-label" className={labelClass}>
                      Label *
                    </label>
                    <input
                      id="room-label"
                      type="text"
                      value={form.label}
                      onChange={(e) => set({ label: e.target.value })}
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="room-slug" className={labelClass}>
                      Slug {editing ? "" : "*"}
                    </label>
                    <input
                      id="room-slug"
                      type="text"
                      value={form.slug}
                      disabled={Boolean(editing)}
                      onChange={(e) => set({ slug: e.target.value })}
                      className={`${inputClass} font-mono disabled:bg-gray-50 disabled:text-gray-500`}
                      placeholder="living-room"
                      required={!editing}
                    />
                    {editing && (
                      <p className="text-xs text-gray-400 mt-1">
                        Slugs are immutable — categories and products reference rooms by slug.
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="room-description" className={labelClass}>
                      Description
                    </label>
                    <textarea
                      id="room-description"
                      value={form.description}
                      onChange={(e) => set({ description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all bg-white resize-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="room-image" className={labelClass}>
                      Image URL
                    </label>
                    <input
                      id="room-image"
                      type="url"
                      value={form.image}
                      onChange={(e) => set({ image: e.target.value })}
                      className={inputClass}
                      placeholder="https://…"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 items-end">
                    <div>
                      <label htmlFor="room-sort" className={labelClass}>
                        Sort order
                      </label>
                      <input
                        id="room-sort"
                        type="number"
                        value={form.sortOrder}
                        onChange={(e) => set({ sortOrder: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 pb-2.5">
                      <input
                        type="checkbox"
                        checked={form.active}
                        onChange={(e) => set({ active: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-[#025E5D] focus:ring-[#025E5D]"
                      />
                      Active
                    </label>
                  </div>
                  {editing && !form.active && (
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      Heads up: this list reads the public active-only endpoint, so a
                      deactivated room disappears from this page until an admin list endpoint
                      ships (recorded as a server request). The room still exists and can be
                      reactivated through the API.
                    </p>
                  )}
                  {formError && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                      {formError}
                    </p>
                  )}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 text-sm"
                    >
                      {editing ? "Save Changes" : "Create Room"}
                    </button>
                  </div>
                </form>
              </Dialog>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmationDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Room?"
        message={`Delete the room "${deleteTarget?.label || ""}"? The server refuses while products are still assigned to it — its message will be shown if it refuses. This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmText="Delete"
        type="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
