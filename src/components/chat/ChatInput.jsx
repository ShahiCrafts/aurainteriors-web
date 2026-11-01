import {
  validateChatFiles,
  validateChatFilesSniffed,
  ATTACHMENT_MIME_TYPES,
} from "../../utils/chatAttachmentPolicy";
import { useState, useRef, useEffect, useCallback } from "react";
import { FileText, LucideSendHorizontal, Paperclip, X } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import {
  useSendMessage,
  useSyncMessageAttachments,
} from "../../hooks/chat/useChatTan";
import { uploadChatAttachment } from "../../api/chatApi";
import { queryClient } from "../../lib/queryClient";
import { ATTACHMENT_RETRY_EVENT } from "./ChatMessage";
import AuthRequiredModal from "./AuthRequiredModal";
import RateLimitModal from "./RateLimitModal";
import { RATE_LIMIT_EVENT } from "../../api/index";
import { toast } from "../../lib/toast";

// Circular upload progress, drawn over the chip thumbnail.
// progress is 0-100; null (no progress event yet) renders a
// spinning quarter arc so the control never looks stuck.
const UploadRing = ({ progress }) => {
  const radius = 8.5;
  const circumference = 2 * Math.PI * radius;
  const indeterminate = progress == null;
  const pct = indeterminate
    ? 25
    : Math.max(0, Math.min(100, progress));
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-5 w-5 -rotate-90 ${
        indeterminate ? "motion-safe:animate-spin" : ""
      }`}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="2.5"
      />
      <circle
        cx="12"
        cy="12"
        r={radius}
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference - (circumference * pct) / 100}
      />
    </svg>
  );
};

const ChatInput = ({ chatId, onTyping, draftReply }) => {
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showRateLimitModal, setShowRateLimitModal] = useState(false);
  const [rateLimitRetry, setRateLimitRetry] = useState(900);
  const [authError, setAuthError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const typingActiveRef = useRef(false);
  const textareaRef = useRef(null);
  const sendMessageMutation = useSendMessage();
  const syncAttachmentsMutation = useSyncMessageAttachments();
  const sendingRef = useRef(false);
  const sendAttemptRef = useRef(null);
  const [isSending, setIsSending] = useState(false);

  // Upload registry (Messenger pattern): every selected file starts
  // uploading IMMEDIATELY, in the background, so by the time the user
  // presses send the transfer is usually done. An entry tracks the
  // whole lifecycle — select-time upload, instant send with a local
  // preview still syncing, background PATCH sync, failure + retry.
  //   status: "uploading" | "done" | "error" | "cancelled"
  const uploadsRef = useRef(new Map()); // File -> entry
  const entriesByKeyRef = useRef(new Map()); // localKey -> entry
  const syncChainsRef = useRef(new Map()); // messageId -> Promise chain

  // FE-25: an external draft (the admin AI panel's "Send to Input" /
  // edit actions, wired through SupportChats -> ChatConversation)
  // lands in the composer as editable text. Keyed by nonce so the
  // same reply text can be inserted twice; absent for the customer
  // widget, which never passes the prop.
  const lastDraftNonceRef = useRef(null);
  useEffect(() => {
    if (draftReply?.text && draftReply.nonce !== lastDraftNonceRef.current) {
      lastDraftNonceRef.current = draftReply.nonce;
      setMessage(draftReply.text);
      textareaRef.current?.focus();
    }
  }, [draftReply]);

  const refreshUploading = useCallback(() => {
    const any = [...uploadsRef.current.values()].some(
      (entry) => entry.status === "uploading",
    );
    setIsUploading(any);
  }, []);

  const runUpload = useCallback(
    (entry) => {
      const controller = new AbortController();
      entry.controller = controller;
      entry.status = "uploading";
      entry.error = null;
      entry.promise = uploadChatAttachment(entry.chatId, entry.file, {
        signal: controller.signal,
        onProgress: (pct) =>
          setUploadProgress((prev) => ({ ...prev, [entry.localKey]: pct })),
      })
        .then((data) => {
          entry.status = "done";
          entry.result = data;
          setUploadProgress((prev) => ({ ...prev, [entry.localKey]: 100 }));
          refreshUploading();
          return data;
        })
        .catch((error) => {
          entry.status = controller.signal.aborted ? "cancelled" : "error";
          entry.error = error;
          refreshUploading();
          throw error;
        });
      // Select-time uploads may have no awaiter yet; keep the
      // rejection handled here — awaiters of entry.promise still
      // observe it through their own branch.
      entry.promise.catch(() => {});
      refreshUploading();
      return entry;
    },
    [refreshUploading],
  );

  const getOrCreateEntry = useCallback((file) => {
    let entry = uploadsRef.current.get(file);
    if (!entry) {
      entry = {
        file,
        localKey: crypto.randomUUID(),
        blobUrl: URL.createObjectURL(file),
        status: "idle",
        result: null,
        error: null,
        messageId: null,
      };
      uploadsRef.current.set(file, entry);
      entriesByKeyRef.current.set(entry.localKey, entry);
    }
    return entry;
  }, []);

  const startUpload = useCallback(
    (file) => {
      const entry = getOrCreateEntry(file);
      if (
        entry.chatId === chatId &&
        entry.status !== "error" &&
        entry.status !== "cancelled" &&
        entry.status !== "idle"
      ) {
        return entry;
      }
      entry.chatId = chatId;
      return runUpload(entry);
    },
    [chatId, getOrCreateEntry, runUpload],
  );

  // Patch one local attachment entry inside the cached message
  // (e.g. flip it to its failed state, or back to syncing on retry).
  const patchLocalAttachment = useCallback(
    (messageId, localKey, patch) => {
      queryClient.setQueryData(["chats", chatId, "messages"], (old) => {
        if (!old?.pages?.length) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: {
              ...page.data,
              messages: (page.data?.messages || []).map((msg) =>
                msg._id === messageId
                  ? {
                      ...msg,
                      attachments: (msg.attachments || []).map((att) =>
                        att._localKey === localKey ? { ...att, ...patch } : att,
                      ),
                    }
                  : msg,
              ),
            },
          })),
        };
      });
    },
    [chatId, queryClient],
  );

  // Serialised per message: PATCHes replace the whole attachment
  // list, so completions are applied one at a time. The session
  // record (created at send) is the source of truth for what has
  // synced — not the query cache, which other writers also touch.
  // Each PATCH carries the cumulative real list plus the local
  // previews still pending / failed, so the merge on the other side
  // never drops a photo.
  const enqueueSync = useCallback(
    (entry) => {
      const session = entry.session;
      if (!session) return;
      const messageId = session.messageId;
      const previous = syncChainsRef.current.get(messageId) || Promise.resolve();
      const next = previous.then(async () => {
        if (entry.localState !== "done") return;
        if (!session.base.some((a) => a.fileUrl === entry.result.attachment.fileUrl))
          session.base.push(entry.result.attachment);
        const pendingLocals = session.entries
          .filter((e) => e.localState === "pending")
          .map((e) => e.toLocal());
        const failedLocals = session.entries
          .filter((e) => e.localState === "failed")
          .map((e) => ({ ...e.toLocal(), _pendingSync: false, _syncFailed: true }));
        await syncAttachmentsMutation.mutateAsync({
          chatId,
          messageId,
          attachments: [...session.base],
          pendingLocals,
          failedLocals,
        });
      });
      syncChainsRef.current.set(
        messageId,
        next.catch(() => {}),
      );
    },
    [chatId, syncAttachmentsMutation],
  );

  const watchEntryForSync = useCallback(
    (entry) => {
      entry.promise.then(
        () => {
          if (entry.status === "done") {
            entry.localState = "done";
            enqueueSync(entry);
          }
        },
        () => {
          if (entry.status === "error" && entry.messageId) {
            entry.localState = "failed";
            patchLocalAttachment(entry.messageId, entry.localKey, {
              _pendingSync: false,
              _syncFailed: true,
            });
            toast.error(
              `"${entry.file.name}" couldn't be uploaded. Tap the photo in your message to retry.`,
            );
          }
        },
      );
    },
    [enqueueSync, patchLocalAttachment],
  );

  // Retry affordance on a failed bubble photo (ChatMessage dispatches
  // the event; the composer owns the file and the upload machinery).
  useEffect(() => {
    const onRetry = (event) => {
      const { messageId, localKey } = event.detail || {};
      const entry = entriesByKeyRef.current.get(localKey);
      if (!entry || entry.messageId !== messageId) return;
      if (entry.status === "uploading" || entry.status === "done") return;
      entry.localState = "pending";
      patchLocalAttachment(messageId, localKey, {
        _pendingSync: true,
        _syncFailed: false,
      });
      runUpload(entry);
      watchEntryForSync(entry);
    };
    window.addEventListener(ATTACHMENT_RETRY_EVENT, onRetry);
    return () => window.removeEventListener(ATTACHMENT_RETRY_EVENT, onRetry);
  }, [patchLocalAttachment, runUpload, watchEntryForSync]);

  useEffect(
    () => () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      for (const entry of uploadsRef.current.values()) {
        entry.controller?.abort();
        URL.revokeObjectURL(entry.blobUrl);
      }
    },
    [],
  );

  // FE-20: the shared axios interceptor broadcasts every 429 with the
  // server's effective retryAfter (Retry-After header first). Feed it
  // to the rate-limit modal so the countdown shows the server's value
  // even when the 429 came from a request other than this composer's
  // own send (whose catch path sets the same state).
  useEffect(() => {
    const onRateLimit = (event) => {
      const retry = Number(event.detail?.retryAfter);
      if (Number.isFinite(retry) && retry > 0) {
        setRateLimitRetry(retry);
        setShowRateLimitModal(true);
      }
    };
    window.addEventListener(RATE_LIMIT_EVENT, onRateLimit);
    return () => window.removeEventListener(RATE_LIMIT_EVENT, onRateLimit);
  }, []);

  // FE-31: typing=true is throttled to the leading edge of a typing
  // episode — the old handler emitted one socket event per keystroke.
  // While an episode is active (no debounced off yet) further
  // keystrokes emit nothing; the existing 300ms debounced off ends
  // the episode, after which the next keystroke may emit again.
  // Continuous typing therefore costs ~1 emit per episode instead of
  // dozens per second against the rate-limited socket channel.
  const handleTypingChange = (value) => {
    setMessage(value);
    if (!typingActiveRef.current) {
      typingActiveRef.current = true;
      onTyping(true);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      typingActiveRef.current = false;
      onTyping(false);
    }, 300);
  };

  const handleFileSelect = (files) => {
    if (sendingRef.current) return;
    const incoming = Array.from(files || []);
    const combined = [...selectedFiles, ...incoming];
    const error = validateChatFiles(combined);
    if (error) toast.error(error);
    else {
      setSelectedFiles(combined);
      // Start uploading right away, in the background — the transfer
      // overlaps the user's reading/typing time instead of starting
      // only when they press send. FE-11: content-sniff each file
      // first; a spoofed file is marked blocked and never uploads
      // (the send-time sniff then rejects the send with the policy
      // toast, exactly as before). If send is pressed before the
      // sniff resolves, the send path's own gate still runs first,
      // and the upload itself re-sniffs before any network call.
      for (const file of incoming) {
        validateChatFilesSniffed([file]).then((sniffError) => {
          if (sniffError) {
            const entry = getOrCreateEntry(file);
            entry.status = "blocked";
            entry.error = new Error(sniffError);
          } else {
            startUpload(file);
          }
        });
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toLocalAttachment = (entry) => ({
    fileName: entry.file.name,
    fileUrl: entry.blobUrl,
    _localBlobUrl: entry.blobUrl,
    fileType: entry.file.type === "application/pdf" ? "document" : "image",
    fileSize: entry.file.size,
    _localKey: entry.localKey,
    _pendingSync: true,
  });

  const handleSend = async () => {
    if (sendingRef.current) return;
    const text = message.trim();
    const files = [...selectedFiles];
    if (!text && files.length === 0) return;
    // FE-11: sniff the selected files' content at send time (the
    // selection-time check above is the synchronous declared-type
    // pass); a spoofed file never reaches the upload. The upload path
    // in chatApi re-validates the original and the post-compression
    // substitute as well.
    const validationError = await validateChatFilesSniffed(files);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    sendingRef.current = true;
    setIsSending(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingActiveRef.current = false;
    onTyping(false);
    try {
      const entries = files.map((file) => startUpload(file));
      const doneEntries = () => entries.filter((e) => e.status === "done");
      let wireEntries = doneEntries();
      if (!text && wireEntries.length === 0) {
        // Photo-only message: the server requires content or at
        // least one real attachment, so wait just for the FIRST
        // upload to land (uploads started at select time and go
        // direct to Cloudinary — this is normally already done).
        const pending = entries.filter((e) => e.status === "uploading");
        if (pending.length > 0) {
          await Promise.any(pending.map((e) => e.promise)).catch(() => {});
          wireEntries = doneEntries();
        }
        if (wireEntries.length === 0) {
          const failed = entries.find((e) => e.status === "error");
          if (failed) throw failed.error;
          return; // everything was cancelled — composer stays as-is
        }
      }
      const pendingEntries = entries.filter((e) => e.status === "uploading");
      const wireAttachments = wireEntries.map((e) => e.result.attachment);
      const localAttachments = pendingEntries.map(toLocalAttachment);
      const fingerprint = JSON.stringify({
        chatId,
        content: text,
        attachments: wireAttachments,
      });
      if (sendAttemptRef.current?.fingerprint !== fingerprint) {
        sendAttemptRef.current = {
          fingerprint,
          clientMessageId: crypto.randomUUID(),
        };
      }
      // The message goes out NOW with whatever is ready; photos
      // still uploading appear in the bubble as local previews and
      // sync in the background as each transfer lands.
      const response = await sendMessageMutation.mutateAsync({
        chatId,
        content: text,
        attachments: wireAttachments,
        clientMessageId: sendAttemptRef.current.clientMessageId,
        localAttachments,
      });
      const confirmedMessageId = response?.data?.message?._id;
      if (pendingEntries.length > 0 && confirmedMessageId) {
        const session = {
          messageId: confirmedMessageId,
          base: [...wireAttachments],
          entries: pendingEntries,
        };
        for (const entry of pendingEntries) {
          entry.messageId = confirmedMessageId;
          entry.session = session;
          entry.localState = "pending";
          entry.toLocal = () => toLocalAttachment(entry);
          watchEntryForSync(entry);
        }
      }
      sendAttemptRef.current = null;
      setMessage("");
      // Files that failed BEFORE the send stay in the composer so
      // the user can retry them with another press of send.
      setSelectedFiles(
        entries
          .filter((e) => e.status === "error" || e.status === "cancelled")
          .map((e) => e.file),
      );
      if (textareaRef.current) textareaRef.current.style.height = "24px";
    } catch (error) {
      // FE-31: a user-cancelled upload is not an error — nothing was
      // sent, and the draft + files stay put for a retry.
      if (
        error?.code === "ERR_CANCELED" ||
        error?.name === "AbortError" ||
        error?.name === "CanceledError"
      ) {
        toast.info("Upload cancelled. Your message and files are still here.");
        return;
      }
      // The composer stays intact until the server accepts the message.
      // FE-19: map on HTTP status as well as the body code — a 429/401
      // whose body omits (or renames) the code must still open the
      // right modal instead of falling through to a generic toast.
      // FE-20: prefer error.retryAfter (set by the shared axios
      // interceptor from the Retry-After header) over the body value.
      const response = error.response?.data;
      const status = error.response?.status;
      if (response?.code === "AUTH_REQUIRED" || status === 401) {
        setAuthError({
          message: response?.message,
          suggestion: response?.suggestion,
        });
        setShowAuthModal(true);
      } else if (response?.code === "RATE_LIMIT_EXCEEDED" || status === 429) {
        const retry = Number(error.retryAfter ?? response?.retryAfter);
        setRateLimitRetry(Number.isFinite(retry) && retry > 0 ? retry : 900);
        setShowRateLimitModal(true);
      } else
        toast.error(
          error.displayMessage ||
            "Could not send. Your message and files are ready to retry.",
        );
    } finally {
      sendingRef.current = false;
      setIsSending(false);
      refreshUploading();
    }
  };

  const canSend = (message.trim() || selectedFiles.length > 0) && !isSending;

  return (
    <>
      <div className="bg-white px-4 py-3 border-t border-gray-100/35">
        <AnimatePresence>
          {selectedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-3">
              {selectedFiles.map((file, index) => {
                const entry = uploadsRef.current.get(file);
                const progress = entry
                  ? uploadProgress[entry.localKey]
                  : undefined;
                const isImage = file.type?.startsWith("image/");
                const removeFile = () => {
                  if (entry) {
                    entry.controller?.abort();
                    URL.revokeObjectURL(entry.blobUrl);
                    uploadsRef.current.delete(file);
                    entriesByKeyRef.current.delete(entry.localKey);
                    refreshUploading();
                  }
                  setSelectedFiles((prev) =>
                    prev.filter((_, i) => i !== index),
                  );
                };
                return (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg py-1.5 pl-1.5 pr-2.5 text-xs font-medium"
                  >
                    {/* Thumbnail preview: the actual photo (rounded
                        rectangle) for images, a file tile for PDFs.
                        While uploading, a circular progress ring sits
                        over it (tap = cancel this file's upload);
                        once settled, a small ✕ on the corner removes
                        the file. */}
                    <div className="relative h-9 w-11 shrink-0">
                      {isImage && entry?.blobUrl ? (
                        <img
                          src={entry.blobUrl}
                          alt=""
                          draggable={false}
                          className="h-full w-full rounded-md object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center rounded-md bg-gray-100 text-gray-500">
                          <FileText size={16} />
                        </span>
                      )}
                      {entry?.status === "uploading" ? (
                        <button
                          type="button"
                          disabled={isSending}
                          onClick={() => entry.controller?.abort()}
                          aria-label={
                            progress != null
                              ? `Cancel upload, ${progress}% uploaded`
                              : "Cancel upload"
                          }
                          title="Cancel upload"
                          className="absolute inset-0 flex items-center justify-center rounded-md bg-black/45"
                        >
                          <UploadRing progress={progress} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isSending}
                          onClick={removeFile}
                          aria-label={`Remove ${file.name}`}
                          className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-700/90 text-white transition-colors hover:bg-red-500"
                        >
                          <X size={10} />
                        </button>
                      )}
                    </div>
                    <span className="max-w-[140px] truncate">{file.name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3 w-full">
          {/* Left Actions */}
          <div className="flex items-center gap-1 text-gray-400 shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ATTACHMENT_MIME_TYPES.join(",")}
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isSending}
              className="p-2 rounded-lg hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <div className="h-6 w-px bg-gray-200 mx-1 shrink-0" />
          </div>

          {/* Text Input */}
          <div className="flex flex-1 items-center min-h-[46px] rounded-full bg-gray-100 pl-4 pr-2">
            <textarea
              ref={textareaRef}
              value={message}
              rows={1}
              onChange={(e) => {
                handleTypingChange(e.target.value);
                e.target.style.height = "24px";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              placeholder="Type your message..."
              className="flex-1 bg-transparent text-[14px] leading-5 text-gray-800 placeholder:text-gray-400 resize-none focus:outline-none overflow-y-auto max-h-[120px] py-3"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !isSending) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />

            {/* FE-38: an emoji button rendered here with no onClick and
                no emoji picker anywhere in the app — removed rather
                than left as a dead control. */}
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={`p-2 transition-colors ${
              canSend
                ? "text-[#F27318] hover:text-[#D9620E]"
                : "text-gray-300 cursor-not-allowed"
            }`}
          >
            {isUploading ? (
              <div className="h-4 w-4 rounded-full bg-[#F27318]/60 motion-safe:animate-pulse" />
            ) : (
              <LucideSendHorizontal className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Error Modals */}
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        message={authError?.message}
        suggestion={authError?.suggestion}
      />
      <RateLimitModal
        isOpen={showRateLimitModal}
        onClose={() => setShowRateLimitModal(false)}
        retryAfter={rateLimitRetry}
      />
    </>
  );
};

export default ChatInput;
