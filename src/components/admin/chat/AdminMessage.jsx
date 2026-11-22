import { Suspense, lazy, memo } from "react";
import {
  Check,
  CheckCheck,
  Info,
  Bot,
  User,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import ChatAttachment from "../../chat/ChatAttachment";
import { ATTACHMENT_RETRY_EVENT } from "../../chat/ChatMessage";
import { UserAvatar } from "../../common/InitialsAvatar";
import { formatTime } from "../../../utils/formatDate";

// Same lazy markdown pipeline the shared ChatMessage uses for bot
// content (FE-49): loaded only when a bot message actually renders.
const BotMarkdown = lazy(() => import("../../chat/BotMarkdown.jsx"));

const BotMessageContent = memo(function BotMessageContent({ content }) {
  return (
    <Suspense fallback={<>{content}</>}>
      <BotMarkdown content={content} />
    </Suspense>
  );
});

const timeLabel = (message) =>
  formatTime(message.createdAt, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).toLowerCase();

// Read ticks for the right-hand side of the thread (customer + AI
// messages): blue double-check once read, mirroring the shared
// ChatMessage delivery semantics.
const ReadTicks = ({ message }) => {
  if (message.isRead)
    return (
      <CheckCheck size={14} strokeWidth={2.5} className="text-[#2563EB]" />
    );
  if (message.deliveredAt)
    return (
      <CheckCheck size={14} strokeWidth={2.5} className="text-gray-300" />
    );
  return <Check size={14} strokeWidth={2.5} className="text-gray-300" />;
};

// Attachment rendering (incl. the optimistic-upload overlay and the
// failed-upload retry affordance) matches the shared ChatMessage
// block-for-block, so the composer's background sync keeps working:
// the retry dispatches the same ATTACHMENT_RETRY_EVENT the composer
// listens for.
const MessageAttachments = ({ message }) => {
  if (!message.attachments || message.attachments.length === 0) return null;
  return (
    <div className="flex flex-col gap-2 w-full max-w-[300px]">
      {message.attachments
        .filter(
          (attachment) =>
            attachment && attachment.fileUrl && attachment.fileName,
        )
        .map((attachment, index) => {
          const isOptimistic = attachment._localBlobUrl === attachment.fileUrl;
          return (
            <div key={index} className="relative">
              <ChatAttachment
                attachment={attachment}
                isOwnMessage={false}
                isOptimistic={isOptimistic}
              />
              {isOptimistic && !attachment._syncFailed && (
                <div className="absolute inset-0 rounded-xl bg-black/5 flex items-center justify-center pointer-events-none">
                  <div className="flex items-center gap-1 bg-white/90 px-2 py-1 rounded-full text-[10px] font-bold text-gray-600 shadow-sm backdrop-blur-sm">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#2563EB] motion-safe:animate-pulse" />
                    Uploading
                  </div>
                </div>
              )}
              {attachment._syncFailed && (
                <div className="absolute inset-0 rounded-xl bg-black/45 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent(ATTACHMENT_RETRY_EVENT, {
                          detail: {
                            messageId: message._id,
                            localKey: attachment._localKey,
                          },
                        }),
                      )
                    }
                    className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-full text-[10px] font-bold text-red-600 shadow-sm hover:bg-red-50"
                  >
                    <RotateCcw size={11} strokeWidth={2.5} />
                    Couldn&apos;t upload — retry
                  </button>
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
};

// Batch 3c — admin Support Chat thread bubble, redesigned to the
// approved mockup. Sides follow the design (not the customer widget):
// human agent = left, gray; customer = right, light blue; AI = right,
// light green with the blue "AI Assistant" label and bot avatar.
// Authorship uses the same fields the shared ChatMessage uses:
// senderRole "bot" / isAiGenerated for AI, senderRole "admin" for the
// human agent. In this admin-only view an optimistic entry whose
// sender is the "current-user" placeholder is the signed-in admin's
// own just-sent message (see useSendMessage's optimistic bubble).
const AdminMessage = ({ message, currentUserId, onRetry }) => {
  const isBot = message.senderRole === "bot" || message.isAiGenerated === true;
  const isSystem =
    message.senderRole === "system" || message.messageType === "system";
  const isGuest =
    message.sender?.firstName === "Guest" &&
    message.sender?.lastName === "User";

  if (isSystem) {
    return (
      <div className="flex w-full justify-center px-4 select-none">
        <div className="bg-gray-50 border border-gray-100 rounded-full px-4 py-1.5 text-[11px] font-bold text-gray-500 flex items-center gap-1.5 max-w-[90%] text-center">
          <Info size={14} className="text-gray-400 shrink-0" />
          <span>{message.content}</span>
        </div>
      </div>
    );
  }

  const senderId = message.sender?._id || message.sender;
  const isAgent =
    !isBot &&
    (message.senderRole === "admin" ||
      senderId === "current-user" ||
      (senderId &&
        currentUserId &&
        String(senderId) === String(currentUserId)));

  // --- AI Assistant (right, green) ---
  if (isBot) {
    return (
      <div className="flex w-full justify-end px-5">
        <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[75%]">
          <div className="flex flex-col items-end gap-1 min-w-0">
            <span className="text-xs font-semibold text-[#2563EB] px-1">
              AI Assistant
            </span>
            {message.content && (
              <div className="bg-green-50 text-gray-800 px-3.5 py-2.5 rounded-2xl rounded-br-md text-[14.5px] leading-[1.6] w-fit wrap-break-word whitespace-pre-wrap">
                <BotMessageContent content={message.content} />
              </div>
            )}
            <MessageAttachments message={message} />
            <div className="flex items-center gap-1 px-1">
              <span className="text-[11px] text-gray-400 font-medium">
                {timeLabel(message)}
              </span>
              <ReadTicks message={message} />
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#2563EB] text-white flex items-center justify-center shrink-0">
            <Bot size={18} />
          </div>
        </div>
      </div>
    );
  }

  // --- Human agent (left, gray) ---
  if (isAgent) {
    return (
      <div className="flex w-full justify-start px-5">
        <div className="flex items-start gap-2.5 max-w-[85%] sm:max-w-[75%]">
          <div className="shrink-0 pt-0.5">
            {isGuest ? (
              <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 text-gray-500 flex items-center justify-center">
                <User size={14} strokeWidth={1.5} />
              </div>
            ) : (
              /* FE-06: real avatar img or local initials. */
              <UserAvatar
                user={message.sender}
                name="Admin"
                alt="Admin"
                className="w-8 h-8 rounded-full text-xs border shadow-sm"
              />
            )}
          </div>
          <div className="flex flex-col items-start gap-1 min-w-0">
            {message.content && (
              <div
                className={`px-3.5 py-2.5 rounded-2xl rounded-bl-md text-[14.5px] leading-[1.6] w-fit wrap-break-word whitespace-pre-wrap ${
                  message.isInternalNote
                    ? "bg-[#FFF9E6] text-[#8C6D1F]"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {message.content}
              </div>
            )}
            <MessageAttachments message={message} />
            {/* FE-19: a failed send must never look delivered. */}
            {message.isFailed ? (
              <div
                className="flex items-center gap-1.5 px-1 mt-0.5"
                role="alert"
              >
                <span className="flex items-center gap-1 text-[11px] font-semibold text-red-600">
                  <AlertCircle size={13} strokeWidth={2.5} />
                  Failed to send
                  {message.sendError ? ` — ${message.sendError}` : ""}
                </span>
                {onRetry && (
                  <button
                    type="button"
                    onClick={() => onRetry(message)}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#2563EB] hover:text-blue-700 underline underline-offset-2"
                  >
                    <RotateCcw size={12} strokeWidth={2.5} />
                    Retry
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1 px-1">
                <span className="text-[11px] text-gray-400 font-medium">
                  {timeLabel(message)}
                </span>
                {message.isPending && (
                  <span className="w-3 h-3 rounded-full bg-gray-300 animate-pulse" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Customer (right, light blue) ---
  return (
    <div className="flex w-full justify-end px-5">
      <div className="flex flex-col items-end gap-1 max-w-[85%] sm:max-w-[75%] min-w-0">
        {message.content && (
          <div className="bg-blue-100 text-gray-800 px-3.5 py-2.5 rounded-2xl rounded-br-md text-[14.5px] leading-[1.6] w-fit wrap-break-word whitespace-pre-wrap">
            {message.content}
          </div>
        )}
        <MessageAttachments message={message} />
        <div className="flex items-center gap-1 px-1">
          <span className="text-[11px] text-gray-400 font-medium">
            {timeLabel(message)}
          </span>
          <ReadTicks message={message} />
        </div>
      </div>
    </div>
  );
};

export default memo(AdminMessage);
