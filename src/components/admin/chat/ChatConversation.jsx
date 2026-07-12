import { useState, useEffect } from "react";
import { User, Mail, Info, MoreVertical, X, ArrowRightLeft, FileText, ShoppingBag, Clock, Diamond, Paperclip, Smile, Bookmark, Zap, Send, ChevronDown, Check, Tag } from "lucide-react";
import {
  useChatMessages,
  useMarkMessagesRead,
  useResolveChat,
} from "../../../hooks/chat/useChatTan";
import { getAvatarUrl } from "../../../utils/imageUrl";
import useChatSocket from "../../../hooks/chat/useChatSocket";
import useNotificationSocket from "../../../hooks/notification/useNotificationSocket";
import useAuthStore from "../../../store/authStore";
import ChatMessageList from "../../chat/ChatMessageList";
import ChatInput from "../../chat/ChatInput";
import TypingIndicator from "../../chat/TypingIndicator";

const ChatConversation = ({ chat, onClose, onChatUpdated }) => {
  const { user } = useAuthStore();
  const token = localStorage.getItem("token");
  const { socket } = useNotificationSocket(token, user?._id);


  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useChatMessages(chat?._id, { enabled: !!chat });

  const markAsReadMutation = useMarkMessagesRead();
  const resolveChatMutation = useResolveChat();
  const { typingStatus, sendTypingIndicator, broadcastRead } = useChatSocket(
    socket,
    chat?._id
  );

  useEffect(() => {
    if (chat?._id && chat?.unreadCountAdmin > 0) {
      markAsReadMutation.mutate(chat._id);
      broadcastRead();
    }
  }, [chat?._id]);

  const allMessages =
    messagesData?.pages.flatMap((page) => page.data.messages) || [];

  const isBotActive = chat?.status === "ai_handling";

  // Helpers for urgency tag color
  const getUrgencyColor = (priority) => {
    if (priority === "urgent" || priority === "high") return "bg-red-50 text-red-500";
    if (priority === "low") return "bg-blue-50 text-blue-500";
    return "bg-amber-50 text-amber-500";
  };
  
  const priorityText = chat?.priority ? chat.priority.charAt(0).toUpperCase() + chat.priority.slice(1) : "High";

  return (
    <div className="flex flex-col h-full w-full bg-white relative">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100/45 flex flex-col shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <img 
              src={getAvatarUrl(chat?.customer)}
              alt="Customer"
              className="w-10 h-10 rounded-full object-cover shrink-0"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(chat?.customer?.firstName || "U")}&background=E0E7FF&color=4338CA`;
              }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[18px] font-bold text-gray-900 leading-tight">
                  {chat?.customer?.firstName} {chat?.customer?.lastName}
                </h2>
                <span className={`px-2 py-1.5 rounded-full text-[11px] font-bold tracking-wide ${getUrgencyColor(chat?.priority)}`}>
                  {priorityText}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
          </div>
        </div>
        
        {/* Header Row 2 */}
        <div className="flex items-center gap-4 text-[13px] text-gray-500 font-medium">
          <span className="flex items-center gap-1.5">
            <User className="w-4 h-4" /> 
            Customer since {new Date(chat?.customer?.createdAt || Date.now()).getFullYear()}
          </span>
          <span className="flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4" /> 
            Order #12931
          </span>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden flex flex-col bg-white">
        <div className="flex-1 overflow-hidden">
          <ChatMessageList
            messages={allMessages}
            isLoading={isLoading}
            onLoadMore={() =>
              hasNextPage && !isFetchingNextPage && fetchNextPage()
            }
            hasMore={hasNextPage}
            isFetchingMore={isFetchingNextPage}
            currentUserId={user?._id}
            isAdminView={true} 
            typingStatus={typingStatus}
          />
        </div>
      </div>

      {/* Input Area */}
      <div className="shrink-0 flex flex-col pt-2 bg-white">

        {chat.status === "resolved" || chat.status === "closed" ? (
           <div className="p-4 bg-gray-50 flex justify-center border-t border-gray-100">
             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-400 text-xs font-bold uppercase tracking-widest shadow-sm">
               <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse" />
               Chat {chat.status}
             </div>
           </div>
        ) : (
          <div className="flex flex-col bg-white">
            <ChatInput
              chatId={chat._id}
              onTyping={(isTyping) => sendTypingIndicator(isTyping)}
            />
            <div className="flex items-center gap-2.5 px-4 pb-3 pt-1 border-t border-gray-50 bg-white">
              <button 
                onClick={() => resolveChatMutation.mutate(chat?._id, { onSuccess: () => onChatUpdated?.() })}
                disabled={resolveChatMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
              >
                <Check className="w-4 h-4" /> Close
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
                <ArrowRightLeft className="w-4 h-4" /> Transfer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatConversation;
