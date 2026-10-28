import {
  validateChatFiles,
  validateChatFilesSniffed,
  ATTACHMENT_MIME_TYPES,
} from "../../utils/chatAttachmentPolicy";
import { useState, useRef, useEffect } from "react";
import { LucideSendHorizontal, Paperclip, X } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useSendMessage } from "../../hooks/chat/useChatTan";
import { uploadChatAttachment } from "../../api/chatApi";
import AuthRequiredModal from "./AuthRequiredModal";
import RateLimitModal from "./RateLimitModal";
import { RATE_LIMIT_EVENT } from "../../api/index";
import { toast } from "../../lib/toast";

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
  const uploadAbortRef = useRef(null);
  const textareaRef = useRef(null);
  const sendMessageMutation = useSendMessage();
  const uploadCacheRef = useRef(new Map());
  const sendingRef = useRef(false);
  const sendAttemptRef = useRef(null);
  const [isSending, setIsSending] = useState(false);

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

  useEffect(
    () => () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      uploadAbortRef.current?.abort();
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

  const handleCancelUpload = () => {
    uploadAbortRef.current?.abort();
  };

  const handleFileSelect = (files) => {
    if (sendingRef.current) return;
    const combined = [...selectedFiles, ...Array.from(files || [])];
    const error = validateChatFiles(combined);
    if (error) toast.error(error);
    else setSelectedFiles(combined);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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
    const abortController = new AbortController();
    uploadAbortRef.current = abortController;
    try {
      // FE-31: uploads run in PARALLEL with per-file progress and an
      // abort control — the old strictly-sequential loop (60s axios
      // timeout each) could lock the composer for ~3 minutes on a
      // 3-attachment send, with the textarea disabled throughout.
      // Successful uploads are still cached per file so a failed-send
      // retry does not re-upload them. Promise.all preserves the
      // selected-file order in the attachments array.
      let attachments = [];
      if (files.length > 0) {
        setIsUploading(true);
        setUploadProgress(Object.fromEntries(files.map((_, i) => [i, 0])));
        const uploaded = await Promise.all(
          files.map(async (file, index) => {
            let cached = uploadCacheRef.current.get(file);
            if (
              !cached ||
              cached.chatId !== chatId ||
              new Date(cached.expiresAt) <= new Date()
            ) {
              cached = {
                ...(await uploadChatAttachment(chatId, file, {
                  signal: abortController.signal,
                  onProgress: (pct) =>
                    setUploadProgress((prev) => ({ ...prev, [index]: pct })),
                })),
                chatId,
              };
              uploadCacheRef.current.set(file, cached);
            } else {
              setUploadProgress((prev) => ({ ...prev, [index]: 100 }));
            }
            return cached.attachment;
          }),
        );
        attachments = uploaded;
      }
      setIsUploading(false);
      setUploadProgress({});
      const fingerprint = JSON.stringify({
        chatId,
        content: text,
        attachments,
      });
      if (sendAttemptRef.current?.fingerprint !== fingerprint) {
        sendAttemptRef.current = {
          fingerprint,
          clientMessageId: crypto.randomUUID(),
        };
      }
      await sendMessageMutation.mutateAsync({
        chatId,
        content: text,
        attachments,
        clientMessageId: sendAttemptRef.current.clientMessageId,
      });
      sendAttemptRef.current = null;
      setMessage("");
      setSelectedFiles([]);
      uploadCacheRef.current.clear();
      if (textareaRef.current) textareaRef.current.style.height = "24px";
    } catch (error) {
      // FE-31: a user-cancelled upload is not an error — nothing was
      // sent, and the draft + files stay put for a retry.
      if (
        abortController.signal.aborted ||
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
      setIsUploading(false);
      setUploadProgress({});
      if (uploadAbortRef.current === abortController)
        uploadAbortRef.current = null;
    }
  };

  const canSend = (message.trim() || selectedFiles.length > 0) && !isSending;

  return (
    <>
      <div className="bg-white px-4 py-3 border-t border-gray-100/35">
        <AnimatePresence>
          {selectedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-3">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="relative bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-xs font-medium"
                >
                  {file.name}
                  {/* FE-31: per-file upload progress while sending. */}
                  {isUploading && uploadProgress[index] != null && (
                    <span className="ml-2 font-bold text-[#F27318]">
                      {uploadProgress[index]}%
                    </span>
                  )}
                  <button
                    disabled={isSending}
                    onClick={() => {
                      uploadCacheRef.current.delete(file);
                      setSelectedFiles((prev) =>
                        prev.filter((_, i) => i !== index),
                      );
                    }}
                    className="absolute right-1 top-1.5 p-0.5 text-gray-400 hover:text-red-500"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {/* FE-31: abort control for in-flight uploads. */}
              {isUploading && (
                <button
                  type="button"
                  onClick={handleCancelUpload}
                  className="self-center rounded-full border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel upload
                </button>
              )}
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
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
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
