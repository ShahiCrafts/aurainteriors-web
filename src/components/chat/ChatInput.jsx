import { validateChatFiles, ATTACHMENT_MIME_TYPES } from "../../utils/chatAttachmentPolicy";
import { useState, useRef, useEffect } from "react";
import { LucideSendHorizontal, Paperclip, Smile, X } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useSendMessage } from "../../hooks/chat/useChatTan";
import { uploadChatAttachment } from "../../api/chatApi";
import AuthRequiredModal from "./AuthRequiredModal";
import RateLimitModal from "./RateLimitModal";
import { toast } from "react-toastify";

const ChatInput = ({ chatId, onTyping }) => {
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showRateLimitModal, setShowRateLimitModal] = useState(false);
  const [rateLimitRetry, setRateLimitRetry] = useState(900);
  const [authError, setAuthError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);
  const sendMessageMutation = useSendMessage();
  const uploadCacheRef = useRef(new Map());
  const sendingRef = useRef(false);
  const sendAttemptRef = useRef(null);
  const [isSending, setIsSending] = useState(false);
  useEffect(() => () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  }, []);

  const handleTypingChange = (value) => {
    setMessage(value);
    onTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => onTyping(false), 300);
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
    const validationError = validateChatFiles(files);
    if (validationError) { toast.error(validationError); return; }
    sendingRef.current = true;
    setIsSending(true);
    onTyping(false);
    try {
      const attachments = [];
      // Sequential uploads cap concurrency and retain each success for a failed-send retry.
      for (const file of files) {
        setIsUploading(true);
        let cached = uploadCacheRef.current.get(file);
        if (!cached || cached.chatId !== chatId || new Date(cached.expiresAt) <= new Date()) {
          cached = { ...await uploadChatAttachment(chatId, file), chatId };
          uploadCacheRef.current.set(file, cached);
        }
        attachments.push(cached.attachment);
      }
      setIsUploading(false);
      const fingerprint = JSON.stringify({ chatId, content: text, attachments });
      if (sendAttemptRef.current?.fingerprint !== fingerprint) {
        sendAttemptRef.current = { fingerprint, clientMessageId: crypto.randomUUID() };
      }
      await sendMessageMutation.mutateAsync({ chatId, content: text, attachments, clientMessageId: sendAttemptRef.current.clientMessageId });
      sendAttemptRef.current = null;
      setMessage("");
      setSelectedFiles([]);
      uploadCacheRef.current.clear();
      if (textareaRef.current) textareaRef.current.style.height = "24px";
    } catch (error) {
      // The composer stays intact until the server accepts the message.
      const response = error.response?.data;
      if (response?.code === "AUTH_REQUIRED") {
        setAuthError({ message: response.message, suggestion: response.suggestion });
        setShowAuthModal(true);
      } else if (response?.code === "RATE_LIMIT_EXCEEDED") {
        setRateLimitRetry(response.retryAfter || 900);
        setShowRateLimitModal(true);
      } else toast.error(error.displayMessage || "Could not send. Your message and files are ready to retry.");
    } finally {
      sendingRef.current = false;
      setIsSending(false);
      setIsUploading(false);
    }
  };

  const canSend =
    (message.trim() || selectedFiles.length > 0) &&
    !isSending;

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
                  <button
                    disabled={isSending}
                    onClick={() => {
                      uploadCacheRef.current.delete(file);
                      setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                    }}
                    className="absolute right-1 top-1.5 p-0.5 text-gray-400 hover:text-red-500"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
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
              disabled={isSending}
              className="flex-1 bg-transparent text-[14px] leading-5 text-gray-800 placeholder:text-gray-400 resize-none focus:outline-none overflow-y-auto max-h-[120px] py-3 disabled:opacity-50"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !isSending) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />

            <button
              type="button"
              className="shrink-0 rounded-full p-1.5 text-[#F27318] transition-colors hover:text-gray-600 hover:bg-white/70"
            >
              <Smile className="h-5 w-5" />
            </button>
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
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#F27318]" />
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