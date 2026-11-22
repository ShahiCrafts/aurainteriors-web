import { chronologicalMessages } from "../../../utils/chatMessages";
import { useState, useEffect } from "react";
import { User, MoreVertical, Check, ChevronDown } from "lucide-react";
import {
  useChatMessages,
  useMarkMessagesRead,
  useResolveChat,
  useUpdateChatPriority,
} from "../../../hooks/chat/useChatTan";
import { UserAvatar } from "../../common/InitialsAvatar";
import useChatSocket from "../../../hooks/chat/useChatSocket";
import useNotificationSocket from "../../../hooks/notification/useNotificationSocket";
import useAuthStore from "../../../store/authStore";
import { useShallow } from "zustand/react/shallow";
import AdminMessageList from "./AdminMessageList";
import ChatInput from "../../chat/ChatInput";
import { PRIORITY_OPTIONS, prioritySelectClass } from "./supportChatDesign";

// Batch 3c — conversation thread, redesigned to the approved mockup:
// header with customer identity, an editable priority dropdown pill
// (PATCH /chats/:id/priority) and a kebab menu; the redesigned
// AdminMessageList thread; the shared ChatInput composer in its
// admin variant; and the outlined "Close conversation" action below
// the composer. All data plumbing (messages query, sockets, typing,
// mark-as-read, resolve) is unchanged from the previous version.
const ChatConversation = ({ chat, onClose, onChatUpdated, draftReply }) => {
  const { user, token } = useAuthStore(
    useShallow((state) => ({ user: state.user, token: state.token })),
  );
  const { socket } = useNotificationSocket(token, user?._id);
  const [menuOpen, setMenuOpen] = useState(false);

  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useChatMessages(chat?._id, { enabled: !!chat });

  const markAsReadMutation = useMarkMessagesRead();
  const resolveChatMutation = useResolveChat();
  const updatePriorityMutation = useUpdateChatPriority();
  const { typingStatus, sendTypingIndicator, broadcastRead } = useChatSocket(
    socket,
    chat?._id,
  );

  useEffect(() => {
    if (chat?._id && chat?.unreadCountAdmin > 0) {
      markAsReadMutation.mutate(chat._id);
      broadcastRead();
    }
  }, [chat?._id]);

  // Switching conversations closes the kebab menu.
  useEffect(() => {
    setMenuOpen(false);
  }, [chat?._id]);

  if (!chat) {
    // FE-17: a null chat renders a placeholder, never a dereference.
    return (
      <div className="flex flex-col h-full w-full bg-white rounded-2xl border border-gray-200 shadow-sm" />
    );
  }

  const allMessages = chronologicalMessages(messagesData?.pages);
  const isClosed = chat.status === "resolved" || chat.status === "closed";

  const handleCloseConversation = () => {
    setMenuOpen(false);
    resolveChatMutation.mutate(chat._id, {
      onSuccess: () => onChatUpdated?.(),
    });
  };

  const handlePriorityChange = (event) => {
    const priority = event.target.value;
    if (priority === chat.priority) return;
    updatePriorityMutation.mutate(
      { chatId: chat._id, priority },
      { onSuccess: () => onChatUpdated?.() },
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {/* FE-06: real avatar img or local initials — never an
              external placeholder URL built from the name. */}
          <UserAvatar
            user={chat.customer}
            alt="Customer"
            className="w-11 h-11 rounded-full text-sm"
          />
          <div className="min-w-0">
            <h2 className="text-[17px] font-bold text-gray-900 leading-tight truncate">
              {chat.customer?.firstName} {chat.customer?.lastName}
            </h2>
            {/* FE-14: the chat object carries no order reference, so
                no order element is rendered here — only the real
                customer tenure. */}
            <p className="flex items-center gap-1.5 text-[13px] text-gray-500 mt-0.5">
              <User className="w-3.5 h-3.5 shrink-0" />
              {`Customer since ${new Date(chat.customer?.createdAt || Date.now()).getFullYear()}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Editable priority pill */}
          <div className="relative">
            <select
              aria-label="Conversation priority"
              value={chat.priority || "normal"}
              onChange={handlePriorityChange}
              disabled={updatePriorityMutation.isPending}
              className={`appearance-none pl-3.5 pr-8 py-1.5 rounded-full text-[13px] font-semibold cursor-pointer focus:outline-none disabled:opacity-60 ${prioritySelectClass(chat.priority)}`}
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Kebab menu — FE-38: only wired actions live here. */}
          <div className="relative">
            <button
              type="button"
              aria-label="Conversation actions"
              onClick={() => setMenuOpen((open) => !open)}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1.5">
                  <button
                    type="button"
                    onClick={handleCloseConversation}
                    disabled={resolveChatMutation.isPending}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" /> Close conversation
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden flex flex-col bg-white min-h-0">
        <AdminMessageList
          key={chat._id}
          messages={allMessages}
          isLoading={isLoading}
          onLoadMore={() =>
            hasNextPage && !isFetchingNextPage && fetchNextPage()
          }
          hasMore={hasNextPage}
          isFetchingMore={isFetchingNextPage}
          currentUserId={user?._id}
          typingStatus={typingStatus}
        />
      </div>

      {/* Composer + Close */}
      <div className="shrink-0 flex flex-col bg-white border-t border-gray-100">
        {isClosed ? (
          <div className="p-4 bg-gray-50 flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-400 text-xs font-bold uppercase tracking-widest shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse" />
              Chat {chat.status}
            </div>
          </div>
        ) : (
          <>
            <ChatInput
              chatId={chat._id}
              onTyping={(isTyping) => sendTypingIndicator(isTyping)}
              draftReply={draftReply}
              variant="admin"
            />
            <div className="px-4 pb-4">
              <button
                onClick={handleCloseConversation}
                disabled={resolveChatMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" /> Close conversation
              </button>
              {/* FE-38: the 'Transfer' button that rendered here had
                  no onClick and no feature behind it — removed rather
                  than left as a dead control. */}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatConversation;
