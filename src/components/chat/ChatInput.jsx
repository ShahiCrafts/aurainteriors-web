import { useState, useRef } from "react";
import { LucideSendHorizontal, Paperclip, Smile, X } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useSendMessage } from "../../hooks/chat/useChatTan";

const ChatInput = ({ chatId, onTyping }) => {
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);
  const sendMessageMutation = useSendMessage();

  const handleTypingChange = (value) => {
    setMessage(value);
    onTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => onTyping(false), 1000);
  };

  const handleSend = () => {
    if (!message.trim() && selectedFiles.length === 0) return;
    sendMessageMutation.mutate(
      { chatId, content: message.trim(), attachments: selectedFiles },
      {
        onSuccess: () => {
          setMessage("");
          setSelectedFiles([]);
          onTyping(false);
          if (textareaRef.current) textareaRef.current.style.height = "24px";
        },
      }
    );
  };

  const canSend =
    (message.trim() || selectedFiles.length > 0) &&
    !sendMessageMutation.isPending;

  return (
<div className="rounded-b-xl rounded-t-none bg-white shadow-2xl p-3 border-t border-gray-100">      <AnimatePresence>
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
      onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
    />

    <button
      onClick={() => fileInputRef.current?.click()}
      className="p-2 rounded-lg hover:bg-gray-100 hover:text-gray-600 transition-colors"
    >
      <Paperclip className="w-5 h-5" />
    </button>

    <div className="h-6 w-px bg-gray-200 mx-1 shrink-0" />
  </div>

  {/* Text Input */}
<div className="flex flex-1 items-center min-h-[46px] rounded-full bg-gray-100 pl-4 pr-2">  <textarea
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
      if (e.key === "Enter" && !e.shiftKey) {
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
  {sendMessageMutation.isPending ? (
    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#F27318]" />
  ) : (
    <LucideSendHorizontal className="h-6 w-6" />
  )}
</button>
  </div>
    </div>
  );
};

export default ChatInput;