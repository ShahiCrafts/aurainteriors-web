import { useState } from 'react';
import { ChevronDown, MessageCircle, User, Filter } from 'lucide-react';
import { getAvatarUrl } from "../../../utils/imageUrl";

const ChatList = ({
  chats,
  pagination,
  isLoading,
  selectedChat,
  onSelectChat,
  statusFilter,
  onStatusFilterChange,
  onPageChange,
  currentPage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter chats by search query
  const filteredChats = chats.filter((chat) => {
    const customerName = `${chat.customer?.firstName || ''} ${chat.customer?.lastName || ''}`.toLowerCase();
    const subject = (chat.subject || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    return customerName.includes(query) || subject.includes(query);
  });

  // Format time ago
  const timeAgo = (date) => {
    if (!date) return '';

    const now = new Date();
    const messageDate = new Date(date);
    const diffInSeconds = Math.floor((now - messageDate) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return messageDate.toLocaleDateString();
  };

  return (
    <div className="h-full bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
        <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">All ({pagination?.total || 0})</h2>
        <div className="relative flex items-center text-gray-500 hover:text-gray-900 cursor-pointer transition-colors">
          <Filter className="w-4 h-4 mr-1" />
          <ChevronDown className="w-3.5 h-3.5" />
          {/* We'll use a hidden select overlaid on top to keep the native dropdown functionality for simplicity, 
              or just replace with actual custom dropdown later if requested. */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          >
            <option value="all">All</option>
            <option value="waiting">Escalated</option>
            <option value="active">Active</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <MessageCircle className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900">No conversations</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredChats.map((chat) => {
              const isSelected = selectedChat?._id === chat._id;
              
              // Determine urgency tag styling
              let urgencyColor = "text-blue-500 bg-blue-50";
              if (chat.priority === "urgent" || chat.priority === "high") urgencyColor = "text-red-500 bg-red-50 border border-red-100";
              else if (chat.priority === "medium") urgencyColor = "text-amber-500 bg-amber-50 border border-amber-100";
              else if (chat.priority === "low") urgencyColor = "text-blue-500 bg-blue-50 border border-blue-100";
              
              const priorityText = chat.priority ? chat.priority.charAt(0).toUpperCase() + chat.priority.slice(1) : "Medium";
              
              // Mock AI confidence for UI
              const confidence = chat.metadata?.confidence || Math.floor(Math.random() * 60) + 30; // 30-90%
              let barColor = "bg-green-500";
              if (confidence < 40) barColor = "bg-red-400";
              else if (confidence < 70) barColor = "bg-yellow-400";

              return (
                <div
                  key={chat._id}
                  onClick={() => onSelectChat(chat)}
                  className={`p-4 cursor-pointer transition-colors relative flex items-start gap-3 ${
                    isSelected ? 'bg-indigo-50/40 border-l-2 border-l-indigo-600' : 'bg-white border-l-2 border-l-transparent hover:bg-gray-50/50'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0 pt-0.5">
                    <img 
                      src={getAvatarUrl(chat.customer)}
                      alt="Customer"
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.customer?.firstName || "U")}&background=E0E7FF&color=4338CA`;
                      }}
                    />
                    {/* Presence Dot */}
                    <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${isSelected ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Top Row: Name and Time */}
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="font-bold text-[14px] text-gray-900 truncate">
                        {chat.customer?.firstName || 'Customer'} {chat.customer?.lastName || ''}
                      </p>
                      <span className={`text-[12px] font-medium shrink-0 ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`}>
                        {timeAgo(chat.lastMessageAt)}
                      </span>
                    </div>

                    {/* Middle Row: Subject and Urgency */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="text-[13px] text-gray-900 font-medium truncate flex-1">
                        {chat.subject || "General Inquiry"}
                      </p>
                      <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold tracking-wide shrink-0 ${urgencyColor}`}>
                        {priorityText}
                      </span>
                    </div>

                    {/* Bottom Row: AI Confidence */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-semibold text-gray-500">
                        AI Confidence: {confidence}%
                      </span>
                      <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${barColor}`} style={{ width: `${confidence}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Load More */}
      {pagination && pagination.totalPages > 1 && (
        <div className="p-4 border-t border-gray-100 bg-gray-50/30 flex justify-center shrink-0">
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === pagination.totalPages}
            className="flex items-center gap-1.5 text-[13px] font-bold text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
          >
            Load more conversations <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatList;
