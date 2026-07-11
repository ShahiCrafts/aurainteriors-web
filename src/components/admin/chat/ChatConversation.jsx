import { useState, useEffect } from "react";
import { User, Mail, Info, MoreVertical, X, ArrowRightLeft, FileText, ShoppingBag, Clock, Diamond, Paperclip, Smile, Bookmark, Zap, Send, ChevronDown, Check, Tag } from "lucide-react";
import {
  useChatMessages,
  useMarkMessagesRead,
} from "../../../hooks/chat/useChatTan";
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
  const [activeTab, setActiveTab] = useState("Conversation");

  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useChatMessages(chat?._id, { enabled: !!chat });

  const markAsReadMutation = useMarkMessagesRead();
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
    if (priority === "urgent" || priority === "high") return "bg-red-50 text-red-500 border-red-100";
    if (priority === "low") return "bg-blue-50 text-blue-500 border-blue-100";
    return "bg-amber-50 text-amber-500 border-amber-100";
  };
  
  const priorityText = chat?.priority ? chat.priority.charAt(0).toUpperCase() + chat.priority.slice(1) + " Priority" : "High Priority";

  return (
    <div className="flex flex-col h-full w-full bg-white relative">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex flex-col shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h2 className="text-[20px] font-bold text-gray-900">
              {chat?.customer?.firstName} {chat?.customer?.lastName}
            </h2>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide border ${getUrgencyColor(chat?.priority)}`}>
              {priorityText}
            </span>
          </div>
          <button className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
        
        {/* Header Row 2 */}
        <div className="flex items-center gap-4 text-[13px] text-gray-500 font-medium">
          <span className="flex items-center gap-1.5">
            <User className="w-4 h-4" /> 
            Customer since {new Date(chat?.customer?.createdAt || Date.now()).getFullYear()}
          </span>
          <span className="flex items-center gap-1.5">
            <Diamond className="w-4 h-4 text-purple-400" /> 
            Premium Plan
          </span>
          <span className="flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4" /> 
            Order #12931
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-6 border-b border-gray-100 shrink-0">
        {["Conversation", "Customer Info", "Order History", `Notes (${chat?.adminNotes?.length || 0})`].map((tab) => {
          const tabName = tab.split(" ")[0]; // "Conversation", "Customer", "Order", "Notes"
          const isActive = activeTab === tabName || (activeTab === "Notes" && tab.startsWith("Notes"));
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.startsWith("Notes") ? "Notes" : tabName)}
              className={`px-4 py-3 text-[14px] font-semibold border-b-2 transition-colors relative top-px ${
                isActive
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden flex flex-col bg-white">
        {activeTab === "Conversation" && (
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
            />
          </div>
        )}
        
        {activeTab === "Customer" && (
           <div className="p-6">
             <h3 className="text-sm font-bold text-gray-900 mb-4">Customer Details</h3>
             <div className="space-y-3 text-sm">
                <p><span className="text-gray-500 font-medium">Name:</span> {chat?.customer?.firstName} {chat?.customer?.lastName}</p>
                <p><span className="text-gray-500 font-medium">Email:</span> {chat?.customer?.email}</p>
             </div>
           </div>
        )}
        
        {activeTab === "Order" && (
           <div className="p-6 flex flex-col items-center justify-center h-full text-gray-400">
             <ShoppingBag className="w-12 h-12 mb-3 text-gray-300" />
             <p className="text-sm font-medium text-gray-500">Order history will appear here</p>
           </div>
        )}
        
        {activeTab === "Notes" && (
           <div className="p-6 flex flex-col h-full">
             <div className="flex-1 overflow-y-auto">
               {(chat?.adminNotes || []).length > 0 ? (
                 <div className="space-y-4">
                   {chat.adminNotes.map((note, i) => (
                     <div key={i} className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-sm text-yellow-900">
                        {note.content}
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center h-full text-gray-400">
                   <FileText className="w-12 h-12 mb-3 text-gray-300" />
                   <p className="text-sm font-medium text-gray-500">No internal notes yet</p>
                 </div>
               )}
             </div>
           </div>
        )}
      </div>

      {/* Input Area (only on Conversation tab) */}
      {activeTab === "Conversation" && (
        <div className="shrink-0 flex flex-col pt-2 bg-white">
          {typingStatus?.isTyping && (
            <div className="px-6 py-2 bg-white/80 backdrop-blur-sm border-b border-gray-50">
              <TypingIndicator isAdmin={typingStatus.userRole === "admin"} />
            </div>
          )}

          {chat.status === "resolved" || chat.status === "closed" ? (
             <div className="p-4 bg-gray-50 flex justify-center border-t border-gray-100">
               <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-400 text-xs font-bold uppercase tracking-widest shadow-sm">
                 <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse" />
                 Chat {chat.status}
               </div>
             </div>
          ) : (
             <div className="flex flex-col px-6 pb-4 pt-1">
               <ChatInput
                 chatId={chat._id}
                 onTyping={(isTyping) => sendTypingIndicator(isTyping)}
               />
               
               {/* Action Row */}
               <div className="flex items-center gap-3 pt-4">
                 <button className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors shadow-sm">
                   <Check className="w-4 h-4" /> Close Conversation
                 </button>
                 <button className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors shadow-sm">
                   <ArrowRightLeft className="w-4 h-4" /> Transfer
                 </button>
                 <button className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors shadow-sm">
                   <Tag className="w-4 h-4" /> Add Tag
                 </button>
                 <button className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors shadow-sm">
                   <MoreVertical className="w-4 h-4" /> More
                 </button>
               </div>
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatConversation;
