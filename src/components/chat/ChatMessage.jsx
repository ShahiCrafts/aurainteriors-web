import { Suspense, lazy, memo } from "react";
import {
  Check,
  CheckCheck,
  Info,
  Bot,
  Sparkles,
  User,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import ChatAttachment from "./ChatAttachment";
import { UserAvatar } from "../common/InitialsAvatar";
import { formatTime } from "../../utils/formatDate";

// FE-49: the react-markdown pipeline lives in BotMarkdown.jsx and is
// loaded only when a bot message with content actually renders. User
// messages never trigger the import. While the chunk is in flight the
// Suspense fallback renders the raw content as plain text, so a slow
// chunk degrades to readable text — never a blank bubble.
const BotMarkdown = lazy(() => import("./BotMarkdown.jsx"));

// FE-52: memoised on the content string so an ancestor re-render
// never re-enters the markdown pipeline for an unchanged message.
const BotMessageContent = memo(function BotMessageContent({ content }) {
  return (
    <Suspense fallback={<>{content}</>}>
      <BotMarkdown content={content} />
    </Suspense>
  );
});

const ChatMessage = ({
  message,
  isOwnMessage,
  isAdminView = false,
  onRetry,
}) => {
  const isBot = message.senderRole === "bot" || message.isAiGenerated === true;
  const isAdmin = message.senderRole === "admin" && !isBot;
  const isSystem =
    message.senderRole === "system" || message.messageType === "system";
  const isGuest =
    message.sender?.firstName === "Guest" &&
    message.sender?.lastName === "User";

  if (message.isInternalNote && !isAdminView) {
    return null;
  }

  if (isSystem) {
    return (
      <div className="flex w-full justify-center mb-6 px-4 select-none">
        <div className="bg-gray-50 border border-gray-100 rounded-full px-4 py-1.5 text-[11px] font-bold text-gray-500 flex items-center gap-1.5 max-w-[90%] text-center">
          <Info size={14} className="text-gray-400 shrink-0" />
          <span>{message.content}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex w-full mb-3 px-4 ${isOwnMessage ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`flex max-w-full gap-4 items-start ${isOwnMessage ? "flex-row-reverse" : "flex-row"}`}
      >
        {/* Avatar */}
        <div className="flex flex-col justify-start pt-1 shrink-0">
          {isBot ? (
            <div className="w-10 h-10 rounded-full bg-slate-800 text-teal-400 border border-slate-700 flex items-center justify-center shrink-0">
              <Bot size={20} />
            </div>
          ) : isGuest || (isOwnMessage && !message.sender?.avatar) ? (
            <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 text-gray-500 flex items-center justify-center shrink-0">
              <User size={18} strokeWidth={1.5} />
            </div>
          ) : (
            /* FE-06: real avatar img or local initials — never an
               external placeholder URL built from the sender's name. */
            <UserAvatar
              user={message.sender}
              name={isAdmin ? "Admin" : undefined}
              alt={isAdmin ? "Admin" : message.sender?.firstName || "User"}
              className="w-10 h-10 rounded-full text-sm border shadow-sm"
            />
          )}
        </div>

        {/* Message container */}
        <div
          className={`flex flex-col gap-1.5 min-w-0 w-full ${isOwnMessage ? "items-end" : "items-start"}`}
        >
          {/* Sender label + timestamp */}
          <div
            className={`flex items-center gap-2 px-1 w-full max-w-[85%] sm:max-w-[80%] ${
              isOwnMessage
                ? "justify-between flex-row-reverse"
                : "justify-between"
            }`}
          >
            <span
              className={`text-[13px] font-bold ${isBot ? "text-emerald-600" : "text-gray-900"}`}
            >
              {isBot
                ? "AI Assistant"
                : isOwnMessage
                  ? "You"
                  : isAdmin
                    ? message.sender?.firstName || "Admin"
                    : message.sender?.firstName || "Customer"}
            </span>
            <span className="text-[11px] text-gray-400 font-medium">
              {formatTime(message.createdAt, {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }).toLowerCase()}
            </span>
          </div>

          {/* Text Bubble */}
          {message.content && (
            <div
              className={`px-3 py-2 rounded-xl text-[14.5px] leading-[1.6]
                w-fit min-w-[50px] max-w-[85%] sm:max-w-[80%] wrap-break-word whitespace-pre-wrap
                ${
                  message.isInternalNote
                    ? "bg-[#FFF9E6] text-[#8C6D1F]"
                    : isOwnMessage
                      ? "bg-[#F27318] text-white"
                      : "bg-gray-100 text-gray-800"
                }`}
            >
              {isBot ? (
                <BotMessageContent content={message.content} />
              ) : (
                message.content
              )}
            </div>
          )}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-col gap-2 w-full max-w-[300px] mt-1">
              {message.attachments
                .filter(
                  (attachment) =>
                    attachment && attachment.fileUrl && attachment.fileName,
                )
                .map((attachment, index) => {
                  const isOptimistic =
                    attachment._localBlobUrl === attachment.fileUrl;
                  return (
                    <div key={index} className="relative">
                      <ChatAttachment
                        attachment={attachment}
                        isOwnMessage={isOwnMessage}
                        isOptimistic={isOptimistic}
                      />
                      {/* PERF-OPT 1: Show subtle upload indicator overlay for optimistic attachments */}
                      {isOptimistic && (
                        <div className="absolute inset-0 rounded-xl bg-black/5 flex items-center justify-center pointer-events-none">
                          <div className="flex items-center gap-1 bg-white/90 px-2 py-1 rounded-full text-[10px] font-bold text-gray-600 shadow-sm backdrop-blur-sm">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#F27318] motion-safe:animate-pulse" />
                            Uploading
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}

          {/* FE-19: a failed send must never look delivered. The
              optimistic-send failure flags (isFailed/sendError, set by
              useChatTan onError) are rendered here with a tap-to-retry
              affordance; the delivered/read checks below are skipped
              for failed messages. */}
          {isOwnMessage && message.isFailed ? (
            <div className="flex items-center gap-1.5 px-1 mt-0.5" role="alert">
              <span className="flex items-center gap-1 text-[11px] font-semibold text-red-600">
                <AlertCircle size={13} strokeWidth={2.5} />
                Failed to send
                {message.sendError ? ` — ${message.sendError}` : ""}
              </span>
              {onRetry && (
                <button
                  type="button"
                  onClick={() => onRetry(message)}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#F27318] hover:text-[#D9620E] underline underline-offset-2"
                >
                  <RotateCcw size={12} strokeWidth={2.5} />
                  Retry
                </button>
              )}
            </div>
          ) : null}

          {/* Delivery status (own messages only) */}
          {isOwnMessage &&
            !isBot &&
            !message.isInternalNote &&
            !message.isFailed && (
              <div className="flex items-center gap-1 px-1 mt-0.5 select-none">
                {/* PERF-OPT 2: Show pending dot for optimistic messages until confirmed by server */}
                {message.isPending ? (
                  <span className="text-gray-300">
                    <div className="w-3 h-3 rounded-full bg-gray-300 animate-pulse" />
                  </span>
                ) : message.isRead ? (
                  <span className="text-sky-500">
                    <CheckCheck size={14} strokeWidth={3} />
                  </span>
                ) : message.deliveredAt ? (
                  <span className="text-gray-400">
                    <CheckCheck size={14} strokeWidth={3} />
                  </span>
                ) : (
                  <span className="text-gray-400">
                    <Check size={14} strokeWidth={3} />
                  </span>
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

// FE-52: memoised — props are the (cache-stable) message object plus
// booleans and a stable onRetry callback, so typing-driven ancestor
// re-renders skip unchanged rows entirely instead of re-rendering
// (and re-parsing) the whole history per keystroke.
export default memo(ChatMessage);
