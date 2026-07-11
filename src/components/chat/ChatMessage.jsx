import { Check, CheckCheck, Info, Bot, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ChatAttachment from "./ChatAttachment";
import { getAvatarUrl } from "../../utils/imageUrl";

// FIX 6: Markdown link renderer — opens in new tab, uses brand colour
const MarkdownLink = ({ href, children }) => {
  let cleanHref = href;
  if (cleanHref && cleanHref.includes("/product/")) {
    cleanHref = "/product/" + cleanHref.split("/product/")[1];
  }
  return (
    <a
      href={cleanHref}
      target="_blank"
      rel="noopener noreferrer"
      className="text-indigo-600 underline underline-offset-2 hover:text-indigo-800 transition-colors"
    >
      {children}
    </a>
  );
};

// FIX 6: ReactMarkdown component config
const BotMessageContent = ({ content }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    disallowedElements={["script", "style", "iframe", "object", "embed"]}
    unwrapDisallowed
    components={{
      a: MarkdownLink,
      p: ({ children }) => <span className="block">{children}</span>,
      ul: ({ children }) => <ul className="list-disc list-inside mt-2 space-y-1 ml-2">{children}</ul>,
      ol: ({ children }) => <ol className="list-decimal list-inside mt-2 space-y-1 ml-2">{children}</ol>,
      strong: ({ children }) => <strong className="font-bold">{children}</strong>,
    }}
  >
    {content}
  </ReactMarkdown>
);

const ChatMessage = ({ message, isOwnMessage, isAdminView = false }) => {
  const isBot = message.senderRole === "bot" || message.isAiGenerated === true;
  const isAdmin = message.senderRole === "admin" && !isBot;
  const isSystem = message.senderRole === "system" || message.messageType === "system";

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
    <div className={`flex w-full mb-6 px-4 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-full gap-4 items-start ${isOwnMessage ? "flex-row-reverse" : "flex-row"}`}>

        {/* Avatar */}
        <div className="flex flex-col justify-start pt-1 shrink-0">
          {isBot ? (
            <div className="w-10 h-10 rounded-full bg-slate-800 text-teal-400 border border-slate-700 flex items-center justify-center shrink-0">
              <Bot size={20} />
            </div>
          ) : (
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center border shadow-sm shrink-0 overflow-hidden ${
                isAdmin
                  ? "bg-indigo-100 border-indigo-200 text-indigo-600"
                  : "bg-gray-50 border-gray-100 text-gray-400"
              }`}
            >
              <img
                src={getAvatarUrl(message.sender)}
                alt={isAdmin ? "Admin" : message.sender?.firstName || "User"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    isAdmin ? "Admin" : message.sender?.firstName || "U"
                  )}&background=${isAdmin ? 'E0E7FF' : 'F3F4F6'}&color=${isAdmin ? '4338CA' : '9CA3AF'}`;
                }}
              />
            </div>
          )}
        </div>

        {/* Message container */}
        <div className={`flex flex-col gap-1.5 min-w-0 w-full ${isOwnMessage ? "items-end" : "items-start"}`}>

          {/* Sender label + timestamp */}
          <div
            className={`flex items-center gap-2 px-1 w-full max-w-[85%] sm:max-w-[80%] ${
              isOwnMessage ? "justify-between flex-row-reverse" : "justify-between"
            }`}
          >
            <span className={`text-[13px] font-bold ${isBot ? 'text-emerald-600' : 'text-gray-900'}`}>
              {isBot
                ? "AI Assistant"
                : isAdmin
                ? "You"
                : message.sender?.firstName || "Customer"}
            </span>
            <span className="text-[11px] text-gray-400 font-medium">
              {new Date(message.createdAt).toLocaleTimeString([], {
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
                w-fit min-w-[180px] max-w-[85%] sm:max-w-[80%] wrap-break-word whitespace-pre-wrap
                ${
                  message.isInternalNote
                    ? "bg-[#FFF9E6] text-[#8C6D1F]"
                    : isBot
                    ? "bg-gray-200/60 text-gray-800"
                    : isAdmin 
                    ? "bg-white text-gray-800"
                    : isOwnMessage
                    ? "bg-[#F27318] text-white" // Own customer message (light purple)
                    : "bg-[#F27318] text-white" // Other customer's message
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
              {message.attachments.map((attachment, index) => (
                <ChatAttachment key={index} attachment={attachment} />
              ))}
            </div>
          )}

          {/* Delivery status (own messages only) */}
          {isOwnMessage && !isBot && !message.isInternalNote && (
            <div className="flex items-center gap-1 px-1 mt-0.5">
              <span className={message.isRead ? "text-indigo-400" : "text-gray-300"}>
                {message.isRead ? (
                  <CheckCheck size={14} strokeWidth={3} />
                ) : (
                  <Check size={14} strokeWidth={3} />
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;