import { chronologicalMessages } from "../../utils/chatMessages";
import { Suspense, lazy, useEffect, useMemo, useCallback } from "react";
import { Plus, Headset, Package, Sofa, ArrowRight } from "lucide-react";
import Skeleton, { ChatMessageSkeleton } from "../common/Skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  useChatMessages,
  useMarkMessagesRead,
  useSendMessage,
} from "../../hooks/chat/useChatTan";
import useChatSocket from "../../hooks/chat/useChatSocket";
import useNotificationSocket from "../../hooks/notification/useNotificationSocket";
import useAuthStore from "../../store/authStore";
import { useShallow } from "zustand/react/shallow";
import { getGuestSessionId } from "../../utils/guestSessionStorage";
import ChatMessageList from "./ChatMessageList";
import ChatInput from "./ChatInput";

// FE-49/FE-07: the empty-state animation lives in
// DotLottieAnimation.jsx (a CSS/SVG animation since the FE-07
// fallback dropped the dotlottie player — see that file) and is
// loaded only when the empty state mounts. The Suspense fallback is
// a static placeholder with the same footprint (the wrapping
// w-40 h-40 box is unchanged), so the layout does not jump.
const EmptyStateAnimation = lazy(() => import("./DotLottieAnimation"));

const ChatWindow = ({
  chat,
  onClose,
  onStartNew,
  onResetView,
  isCreatingChat,
}) => {
  const { user, token } = useAuthStore(
    useShallow((state) => ({ user: state.user, token: state.token })),
  );
  const guestSessionId = getGuestSessionId();
  const { socket, error: socketError } = useNotificationSocket(
    token,
    user?._id,
    guestSessionId,
  );

  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError: isMessagesError,
    refetch: refetchMessages,
  } = useChatMessages(chat?._id, { enabled: !!chat });

  const { mutate: sendMessageMutate } = useSendMessage();
  const chatId = chat?._id;
  // FE-19: tap-to-retry on a failed bubble re-sends with the SAME
  // clientMessageId, so the server/optimistic layer de-duplicates
  // instead of forking a second copy of the message.
  // FE-52: useCallback — a stable retry prop is what lets the
  // memoised message rows skip re-renders.
  const handleRetryMessage = useCallback(
    (failedMessage) => {
      if (!chatId || !failedMessage) return;
      sendMessageMutate({
        chatId,
        content: failedMessage.content,
        attachments: failedMessage.attachments || [],
        clientMessageId: failedMessage.clientMessageId,
      });
    },
    [chatId, sendMessageMutate],
  );

  const markAsReadMutation = useMarkMessagesRead();
  const { typingStatus, sendTypingIndicator, broadcastRead } = useChatSocket(
    socket,
    chat?._id,
  );

  // Derived message list — must be declared before any useEffect that depends on its length
  // FE-52: memoised on the query data — typing-state re-renders of
  // this window previously rebuilt the array (and, through it,
  // re-rendered every message row) on every keystroke.
  const allMessages = useMemo(
    () => chronologicalMessages(messagesData?.pages),
    [messagesData],
  );
  const messageCount = allMessages.length;

  // Persist read state only when there is actually an unread incoming message.
  // The previous messageCount effect fired a /read write for the user's own optimistic
  // sends and duplicated the initial read request, creating avoidable DB contention.
  const unreadIncomingKey = allMessages
    .filter(
      (m) => (m.senderRole === "admin" || m.senderRole === "bot") && !m.isRead,
    )
    .map((m) => m._id)
    .join("|");

  useEffect(() => {
    if (
      !chat?._id ||
      !unreadIncomingKey ||
      document.visibilityState !== "visible"
    )
      return;
    markAsReadMutation.mutate(chat._id);
    broadcastRead();
  }, [chat?._id, unreadIncomingKey]);

  useEffect(() => {
    if (!chat?._id) return undefined;
    const onVisibility = () => {
      if (document.visibilityState === "visible" && unreadIncomingKey) {
        markAsReadMutation.mutate(chat._id);
        broadcastRead();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [chat?._id, unreadIncomingKey]);

  return (
    <div className="flex flex-col h-full bg-white font-dm-sans overflow-hidden">
      {/* Refined Professional Header - No Gradients */}
      {/* Minimalist Header */}
      <div className="shrink-0 bg-white border-b border-gray-100 p-3 sm:p-4 shadow-sm relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#F9F8F6] flex items-center justify-center text-[#F27318]">
              {/* Using a Robot icon or similar if available, else standard Shield/Headset */}
              <Headset size={18} sm:size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-gray-900 font-semibold text-[15px] sm:text-base tracking-tight leading-none">
                Aura Assistant
              </h3>
              <p className="text-[10px] sm:text-[13px] text-gray-500 mt-0.5">
                Expert help for your home
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onResetView}
              className="text-sm font-semibold text-[#1A1714] hover:text-[#F27318] flex items-center gap-1 transition-colors"
            >
              <Plus size={16} /> New Chat
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-gray-50/30">
        {chat ? (
          <div className="h-full flex flex-col">
            {/* FE-19: socket connection failures were stored in hook
                state no component read. Surface them so a dead
                realtime channel is visible instead of silent. */}
            {socketError ? (
              <div
                role="alert"
                className="mx-3 mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-medium text-amber-800"
              >
                Connection issue — live updates may be delayed. Your messages
                are still saved.
              </div>
            ) : null}
            <div className="flex-1 overflow-hidden relative">
              {isLoading ? (
                <div className="p-4 space-y-4">
                  <ChatMessageSkeleton isUser={false} />
                  <ChatMessageSkeleton isUser={true} />
                </div>
              ) : isMessagesError ? (
                /* FE-19: a failed history load is NOT an empty
                   conversation. Distinct error state with retry. */
                <div
                  role="alert"
                  className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center"
                >
                  <p className="text-sm font-semibold text-gray-800">
                    Could not load messages
                  </p>
                  <p className="max-w-[260px] text-xs text-gray-500">
                    We couldn&apos;t fetch this conversation. It may still exist
                    — please try again.
                  </p>
                  <button
                    type="button"
                    onClick={() => refetchMessages()}
                    className="rounded-full bg-[#1A1714] px-4 py-2 text-xs font-bold text-white hover:bg-[#0F0C0A]"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <ChatMessageList
                  key={chat?._id}
                  messages={allMessages}
                  isLoading={isLoading}
                  onLoadMore={() =>
                    hasNextPage && !isFetchingNextPage && fetchNextPage()
                  }
                  hasMore={hasNextPage}
                  isFetchingMore={isFetchingNextPage}
                  currentUserId={user?._id}
                  typingStatus={typingStatus}
                  onRetryMessage={handleRetryMessage}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="h-full relative bg-white">
            {isCreatingChat ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <Skeleton className="w-48 h-5 rounded" />
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col justify-between bg-gray-50/30">
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="w-40 h-40 flex items-center justify-center overflow-hidden">
                    <Suspense
                      fallback={
                        <div className="w-full h-full" aria-hidden="true" />
                      }
                    >
                      <EmptyStateAnimation />
                    </Suspense>
                  </div>

                  <h2 className="text-[#1A1714] text-lg sm:text-xl font-black tracking-tight leading-tight max-w-[280px]">
                    Hi{user?.firstName ? ` ${user.firstName}` : ""} 👋, I'm here
                    to help.
                  </h2>
                  <p className="text-gray-500 text-xs sm:text-sm mt-2 max-w-[260px] leading-normal">
                    Ask me anything about our products, orders, or policies.
                  </p>
                </div>

                <div className="relative z-10 flex flex-col">
                  {/* Suggestions */}
                  <div className="px-10 pb-5 mb-6">
                    <h4 className="mb-4 pt-10 text-[15px] font-semibold text-gray-900">
                      Suggested questions
                    </h4>

                    <div className="space-y-3">
                      {[
                        {
                          title: "Track my order",
                          icon: Package,
                        },
                        {
                          title: "Product recommendations",
                          icon: Sofa,
                        },
                      ].map((item) => {
                        const Icon = item.icon;

                        return (
                          <button
                            key={item.title}
                            onClick={() => onStartNew(item.title)}
                            className="group flex w-full items-center justify-between rounded-xl px-2 py-3 transition-all duration-200 hover:bg-[#FFF8F3]/80"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#F27318]/10 transition-colors duration-200 group-hover:bg-[#F27318]">
                                <Icon className="h-5 w-5 text-[#F27318] transition-colors duration-200 group-hover:text-white" />
                              </div>

                              <div className="text-left">
                                <p className="text-[15px] font-semibold text-gray-900 group-hover:text-[#F27318]">
                                  {item.title}
                                </p>

                                <p className="text-[13px] text-gray-500">
                                  {item.title === "Track my order"
                                    ? "Check your delivery status"
                                    : "Discover beautiful furniture"}
                                </p>
                              </div>
                            </div>

                            <ArrowRight className="h-4 w-4 text-gray-300 transition-all duration-200 group-hover:translate-x-1 group-hover:text-[#F27318]" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t border-gray-200 bg-white py-4 shadow-[0_-8px_24px_rgba(0,0,0,0.04)] rounded-b-2xl">
                    <button
                      onClick={() => onStartNew()}
                      className="flex w-full items-center justify-center py-2 text-sm font-medium text-gray-500 transition-colors hover:text-[#F27318]"
                    >
                      Start a blank conversation
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 bg-white">
        {chat &&
          ["ai_handling", "escalated", "agent_handling"].includes(
            chat.status,
          ) && (
            <ChatInput
              chatId={chat._id}
              onTyping={(isTyping) => sendTypingIndicator(isTyping)}
            />
          )}
      </div>
    </div>
  );
};

export default ChatWindow;
