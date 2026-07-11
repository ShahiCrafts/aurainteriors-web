import { useRef, useEffect, useState } from 'react';
import { Loader2, MessageCircle, Sparkles, ChevronDown } from 'lucide-react';
import ChatMessage from './ChatMessage';
import useAuthStore from '../../store/authStore';


const ChatMessageList = ({
  messages,
  isLoading,
  onLoadMore,
  hasMore,
  isFetchingMore,
  currentUserId,
  streamingMessage,
  isAdminView = false,
}) => {
  const { user } = useAuthStore();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const prevScrollHeightRef = useRef(0);

  // FIX 1: Scroll-position tracking (using refs to avoid re-renders on every scroll tick)
  const isNearBottomRef = useRef(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const prevContentCountRef = useRef(0);


  // FIX 1: Auto-scroll only when near bottom OR on first load
  useEffect(() => {
    const currentCount = messages.length + (streamingMessage ? 1 : 0);
    const prevCount = prevContentCountRef.current;
    const isNewContent = currentCount > prevCount;

    if (!isFetchingMore && isNewContent) {
      if (isNearBottomRef.current) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setHasNewMessages(false);
      } else {
        // User is scrolled up — show the pill instead of forcing scroll
        setHasNewMessages(true);
      }
    }

    prevContentCountRef.current = currentCount;
  }, [messages.length, isFetchingMore, streamingMessage]);

  // Handle infinite scroll (load older messages) + track scroll position
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // FIX 1: Track whether user is near the bottom (threshold: 100px)
    const distFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const nearBottom = distFromBottom < 100;
    isNearBottomRef.current = nearBottom;
    if (nearBottom) setHasNewMessages(false);

    // Infinite scroll — load older messages when reaching the top
    if (container.scrollTop === 0 && hasMore && !isFetchingMore) {
      prevScrollHeightRef.current = container.scrollHeight;
      onLoadMore();
    }
  };

  // Maintain scroll position after loading older messages
  useEffect(() => {
    if (isFetchingMore && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const scrollHeightDiff = container.scrollHeight - prevScrollHeightRef.current;
      container.scrollTop = scrollHeightDiff;
    }
  }, [isFetchingMore, messages.length]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
        </div>
        <p className="text-sm text-neutral-500">Loading messages...</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-neutral-500 p-6">
        <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-teal-100 to-teal-50 flex items-center justify-center mb-4 shadow-sm">
          <MessageCircle className="w-10 h-10 text-teal-600" />
        </div>
        <p className="text-neutral-700 font-semibold text-base">Start a conversation</p>
        <p className="text-sm text-neutral-400 mt-1.5 text-center max-w-60">
          Send us a message and we'll get back to you as soon as possible
        </p>
        <div className="flex items-center gap-1.5 mt-4 text-xs text-teal-600 bg-teal-50 px-3 py-1.5 rounded-full">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Usually replies within minutes</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={messagesContainerRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto pt-6 space-y-4"
    >
      {/* Load More Indicator */}
      {isFetchingMore && (
        <div className="flex justify-center py-3">
          <div className="flex items-center gap-2 text-sm text-neutral-500 bg-white px-4 py-2 rounded-full shadow-sm border border-neutral-100">
            <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
            <span>Loading earlier messages...</span>
          </div>
        </div>
      )}

      {/* Has More Indicator */}
      {hasMore && !isFetchingMore && (
        <div className="flex justify-center py-2">
          <button
            onClick={onLoadMore}
            className="text-xs text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-full transition-colors"
          >
            Load earlier messages
          </button>
        </div>
      )}

      {/* Messages */}
      {messages.map((message) => {
        const messageSenderId = message.sender?._id || message.sender;
        const isOwnMessage =
          (messageSenderId && currentUserId && messageSenderId.toString() === currentUserId.toString()) ||
          (user?.role === "admin" ? message.senderRole === "admin" : message.senderRole === "customer");

        return (
          <ChatMessage
            key={message._id}
            message={message}
            isOwnMessage={isOwnMessage}
            isAdminView={isAdminView}
          />
        );
      })}

      {/* FIX 2: Streaming message bubble — renders as tokens arrive, disappears when real message loads */}
      {streamingMessage && (
        <div className="flex w-full mb-4 px-1 justify-start">
          <div className="flex max-w-full gap-3 flex-row items-start">
            {/* AI avatar top aligned (Fix 1) */}
            <div className="flex flex-col justify-start pt-[18px] shrink-0">
              <div className="w-8 h-8 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                <Sparkles size={14} className="text-purple-500" />
              </div>
            </div>
            {/* Bubble */}
            <div className="flex flex-col gap-1.5 min-w-0 items-start">
              <div className="flex items-center gap-2 px-1">
                <span className="text-[11px] font-bold text-gray-700">Aura Assistant</span>
              </div>
              <div className="px-4 py-2.5 rounded-2xl text-[14px] leading-snug shadow-sm w-fit max-w-[85%] sm:max-w-[80%] wrap-break-word whitespace-pre-wrap bg-[#F9F8F6] text-[#1A1714] border border-[#E5E5E5] rounded-tl-none">
                {streamingMessage}
                <span className="inline-block w-0.5 h-3.5 bg-[#F27318] ml-0.5 align-middle animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />

      {/* FIX 1: "New message" pill — shown when new messages arrive while user is scrolled up */}
      {hasNewMessages && (
        <div className="sticky bottom-3 flex justify-center pointer-events-none">
          <button
            onClick={() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              setHasNewMessages(false);
            }}
            className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 bg-[#F27318] text-white text-[11px] font-bold rounded-full shadow-lg hover:bg-[#D9620E] transition-colors animate-bounce"
          >
            <ChevronDown size={13} strokeWidth={3} />
            New message
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatMessageList;