import { useRef, useEffect, useLayoutEffect, useState, memo } from "react";
import { MessageCircle, ChevronDown, Bot } from "lucide-react";
import { ChatMessageSkeleton } from "../../common/Skeleton";
import BrandLoader from "../../common/BrandLoader";
import AdminMessage from "./AdminMessage";
import { dayKey, formatDayLabel } from "./supportChatDesign";

// Batch 3c — admin Support Chat message list. The shared
// ChatMessageList keeps serving the customer widget untouched; this
// list carries the redesigned thread (day-divider pills, design-side
// bubbles) while mirroring ChatMessageList's scroll contract:
// initial scroll to bottom, older-page loads anchored so the viewport
// doesn't jump, auto-scroll only when already near the bottom, and a
// "New message" pill when the agent is scrolled up.
const AdminMessageList = ({
  messages,
  isLoading,
  onLoadMore,
  hasMore,
  isFetchingMore,
  currentUserId,
  typingStatus,
  onRetryMessage,
}) => {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const prevContentCountRef = useRef(0);
  const isFirstLoadRef = useRef(true);
  const historyAnchorRef = useRef(null);

  useLayoutEffect(() => {
    const currentCount = messages.length;
    const prevCount = prevContentCountRef.current;
    const isNewContent = currentCount > prevCount;
    if (historyAnchorRef.current) {
      if (!isFetchingMore && messagesContainerRef.current) {
        const container = messagesContainerRef.current;
        const anchor = historyAnchorRef.current;
        container.scrollTop =
          anchor.top + container.scrollHeight - anchor.height;
        historyAnchorRef.current = null;
      }
      prevContentCountRef.current = currentCount;
      return;
    }

    if (!isFetchingMore && isNewContent) {
      if (isFirstLoadRef.current) {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
        isFirstLoadRef.current = false;
        setHasNewMessages(false);
      } else if (isNearBottomRef.current) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        setHasNewMessages(false);
      } else {
        setHasNewMessages(true);
      }
    }

    prevContentCountRef.current = currentCount;
  }, [messages.length, isFetchingMore]);

  useEffect(() => {
    if (typingStatus?.isTyping && isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [typingStatus?.isTyping]);

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const distFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    const nearBottom = distFromBottom < 100;
    isNearBottomRef.current = nearBottom;
    if (nearBottom) setHasNewMessages(false);

    if (container.scrollTop === 0 && hasMore && !isFetchingMore) {
      historyAnchorRef.current = {
        height: container.scrollHeight,
        top: container.scrollTop,
      };
      onLoadMore();
    }
  };

  const showTypingBubble =
    typingStatus?.isTyping &&
    ["customer", "ai"].includes(typingStatus.userRole);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 h-full">
        <ChatMessageSkeleton isUser={false} />
        <ChatMessageSkeleton isUser={true} />
        <ChatMessageSkeleton isUser={false} />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-neutral-500 p-6">
        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
          <MessageCircle className="w-8 h-8 text-[#2563EB]" />
        </div>
        <p className="text-neutral-700 font-semibold text-base">
          No messages yet
        </p>
        <p className="text-sm text-neutral-400 mt-1.5 text-center max-w-60">
          Messages in this conversation will appear here.
        </p>
      </div>
    );
  }

  // Interleave a centred day-divider pill whenever the calendar day
  // changes between consecutive messages.
  const items = [];
  let lastDay = null;
  for (const message of messages) {
    const key = dayKey(message.createdAt);
    if (key !== lastDay) {
      items.push({
        type: "divider",
        key: `divider-${key}-${message._id}`,
        label: formatDayLabel(message.createdAt),
      });
      lastDay = key;
    }
    items.push({ type: "message", key: message._id, message });
  }

  return (
    <div
      ref={messagesContainerRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto py-5 space-y-4"
    >
      {isFetchingMore && (
        <div className="flex justify-center py-3">
          <div className="flex items-center gap-2 text-sm text-neutral-500 bg-white px-4 py-2 rounded-full shadow-sm border border-neutral-100">
            <span
              className="h-2 w-2 shrink-0 rounded-full bg-[#2563EB] motion-safe:animate-pulse"
              aria-hidden="true"
            />
            <span>Loading earlier messages...</span>
          </div>
        </div>
      )}

      {hasMore && !isFetchingMore && (
        <div className="flex justify-center py-2">
          <button
            onClick={onLoadMore}
            className="text-xs text-[#2563EB] hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors"
          >
            Load earlier messages
          </button>
        </div>
      )}

      {items.map((item) =>
        item.type === "divider" ? (
          <div key={item.key} className="flex justify-center px-4">
            <span className="bg-gray-100 text-gray-500 text-[11px] font-medium px-3 py-1 rounded-full">
              {item.label}
            </span>
          </div>
        ) : (
          <AdminMessage
            key={item.key}
            message={item.message}
            currentUserId={currentUserId}
            onRetry={onRetryMessage}
          />
        ),
      )}

      {showTypingBubble && (
        <div className="flex w-full justify-end px-5">
          <div className="flex items-end gap-2">
            <div className="bg-gray-100 px-3 py-1.5 rounded-2xl flex items-center justify-center w-fit">
              <BrandLoader size={28} />
            </div>
            {typingStatus.userRole === "ai" && (
              <div className="w-9 h-9 rounded-full bg-[#2563EB] text-white flex items-center justify-center shrink-0">
                <Bot size={18} />
              </div>
            )}
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />

      {hasNewMessages && (
        <div className="sticky bottom-3 flex justify-center pointer-events-none">
          <button
            onClick={() => {
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
              setHasNewMessages(false);
            }}
            className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB] text-white text-[11px] font-bold rounded-full shadow-lg hover:bg-blue-700 transition-colors animate-bounce"
          >
            <ChevronDown size={13} strokeWidth={3} />
            New message
          </button>
        </div>
      )}
    </div>
  );
};

export default memo(AdminMessageList);
