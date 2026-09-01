import { useState, useRef, useEffect } from "react";
import { LucideSendHorizontal, Paperclip, Smile, X, AlertCircle } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useSendMessage } from "../../hooks/chat/useChatTan";
import { getUploadSignature, uploadToCloudinary, updateMessageAttachments } from "../../api/chatApi";
import AuthRequiredModal from "./AuthRequiredModal";
import RateLimitModal from "./RateLimitModal";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";

const ChatInput = ({ chatId, onTyping }) => {
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showRateLimitModal, setShowRateLimitModal] = useState(false);
  const [rateLimitRetry, setRateLimitRetry] = useState(900);
  const [authError, setAuthError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({}); // Track upload state per file
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);
  const sendMessageMutation = useSendMessage();
  const uploadCacheRef = useRef({}); // Cache Cloudinary credentials to avoid repeated fetches
  const blobUrlsRef = useRef({}); // Track blob URLs for cleanup
  const queryClient = useQueryClient();
  
  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(blobUrlsRef.current).forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  const handleTypingChange = (value) => {
    setMessage(value);
    onTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => onTyping(false), 1000);
  };

  const handleFileSelect = async (files) => {
    const newFiles = Array.from(files);
    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleSend = async () => {
    if (!message.trim() && selectedFiles.length === 0) return;

    try {
      setIsUploading(true);

      // Create optimistic attachments with blob URLs
      const optimisticAttachments = selectedFiles.map((file) => {
        const blobUrl = URL.createObjectURL(file);
        blobUrlsRef.current[file.name] = blobUrl;
        
        return {
          fileName: file.name,
          fileUrl: blobUrl,
          _localBlobUrl: blobUrl,
          fileType: file.type.startsWith("image") ? "image" : "document",
          fileSize: file.size,
          _uploadStatus: "uploading",
        };
      });

      // Send optimistic message immediately (render before upload)
      sendMessageMutation.mutate(
        { chatId, content: message.trim(), attachments: optimisticAttachments },
        {
          onSuccess: () => {
            setMessage("");
            setSelectedFiles([]);
            setUploadProgress({});
            onTyping(false);
            if (textareaRef.current) textareaRef.current.style.height = "24px";
          },
          onError: (error) => {
            const response = error.response?.data;

            if (response?.code === "AUTH_REQUIRED") {
              setAuthError({
                message: response.message,
                suggestion: response.suggestion,
              });
              setShowAuthModal(true);
            }

            if (response?.code === "RATE_LIMIT_EXCEEDED") {
              setRateLimitRetry(response.retryAfter || 900);
              setShowRateLimitModal(true);
            }
          },
        }
      );

      // NOW upload files to Cloudinary in BACKGROUND
      // Don't wait - this allows UI to remain responsive
      if (selectedFiles.length > 0) {
        uploadFilesInBackground();
      }
    } catch (error) {
      console.error("❌ Error in handleSend:", error);
      toast.error("Failed to send message");
      setIsUploading(false);
    } finally {
      setIsUploading(false);
    }
  };

  // Separate function for background uploads
  const uploadFilesInBackground = async () => {
    try {
      // Get upload signature
      if (!uploadCacheRef.current.signature) {
        try {
          const signatureResponse = await getUploadSignature();
          uploadCacheRef.current.signature = signatureResponse.data.signature;
          setTimeout(() => {
            uploadCacheRef.current.signature = null;
          }, 50 * 60 * 1000);
        } catch (sigError) {
          console.error("Failed to get upload signature:", sigError);
          return;
        }
      }
      const uploadConfig = uploadCacheRef.current.signature;

      console.log(`Uploading ${selectedFiles.length} file(s) to Cloudinary in background...`);

      // Upload all files in parallel
      const uploadPromises = selectedFiles.map(async (file) => {
        try {
          setUploadProgress(prev => ({ ...prev, [file.name]: { status: 'uploading', error: null } }));
          
          // Upload with compression and retry
          const cloudinaryResult = await uploadToCloudinary(file, uploadConfig, {
            maxRetries: 3,
            retryDelay: 1000,
          });
          
          setUploadProgress(prev => ({ ...prev, [file.name]: { status: 'complete', url: cloudinaryResult.secure_url } }));
          
          // Return the real attachment with Cloudinary URL
          return {
            fileName: file.name,
            fileUrl: cloudinaryResult.secure_url,
            fileType: file.type.startsWith("image") ? "image" : "document",
            fileSize: file.size,
            _uploadStatus: "complete",
          };
        } catch (error) {
          console.error(`❌ Failed to upload ${file.name}:`, error);
          setUploadProgress(prev => ({ ...prev, [file.name]: { status: 'failed', error: error.message } }));
          return null;
        }
      });

      // Wait for uploads to complete
      const uploadedAttachments = (await Promise.all(uploadPromises)).filter(Boolean);
      
      console.log(`✓ Background upload complete. Uploaded: ${uploadedAttachments.length}/${selectedFiles.length}`);
      
      if (uploadedAttachments.length > 0) {
        console.log(`✓ All ${uploadedAttachments.length} attachments have real Cloudinary URLs`);
        
        // Now sync the real URLs back to the database
        // This replaces the temporary blob URLs with permanent Cloudinary URLs
        try {
          const lastMessage = await queryClient.getQueryData(['chats', chatId, 'messages']);
          if (lastMessage?.pages?.[0]?.data?.messages?.length > 0) {
            const mostRecentMessage = lastMessage.pages[0].data.messages[lastMessage.pages[0].data.messages.length - 1];
            if (mostRecentMessage?._id) {
              console.log(`📎 Syncing ${uploadedAttachments.length} real URLs to message ${mostRecentMessage._id}...`);
              await updateMessageAttachments(chatId, mostRecentMessage._id, uploadedAttachments);
              console.log(`✓ Message attachments updated in database with real Cloudinary URLs`);
            }
          }
        } catch (syncError) {
          console.error("❌ Failed to sync attachments to message:", syncError);
          // Don't fail - message is visible with blob URLs, user can refresh to get real URLs
          toast.warning("Images visible, but couldn't sync to database. Refresh to persist.");
        }
      }
      
      if (uploadedAttachments.length === 0 && selectedFiles.length > 0) {
        console.error("❌ All uploads failed. Message saved with local previews.");
        toast.error("Uploads failed. Message visible with preview images.");
      } else if (uploadedAttachments.length < selectedFiles.length) {
        console.warn(`⚠️  Partial upload: ${uploadedAttachments.length}/${selectedFiles.length} succeeded`);
      }
    } catch (e) {
      console.error("❌ Error in background upload:", e);
    }
  };

  const canSend =
    (message.trim() || selectedFiles.length > 0) &&
    !sendMessageMutation.isPending &&
    !isUploading;

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
                    onClick={() =>
                      setSelectedFiles((prev) =>
                        prev.filter((_, i) => i !== index)
                      )
                    }
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
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
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
              disabled={isUploading}
              className="flex-1 bg-transparent text-[14px] leading-5 text-gray-800 placeholder:text-gray-400 resize-none focus:outline-none overflow-y-auto max-h-[120px] py-3 disabled:opacity-50"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !isUploading) {
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
            {sendMessageMutation.isPending || isUploading ? (
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