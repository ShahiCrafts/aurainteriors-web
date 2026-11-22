import { useState } from "react";
import { ChevronDown, MessageCircle, Filter, Search } from "lucide-react";
import Skeleton from "../../common/Skeleton";
import { UserAvatar } from "../../common/InitialsAvatar";
import { priorityPill, formatShortDate } from "./supportChatDesign";

// Batch 3c — conversation list, redesigned to the approved mockup:
// card with "Conversations (N)" + live dot, search + filter row,
// rows with avatar/unread badge, date and priority pill, and the
// "Load more conversations" footer. Data flow unchanged: the parent
// owns pagination (pages accumulate there), the status filter still
// rides the overlaid native select, and search still filters the
// loaded conversations client-side.
const ChatList = ({
  chats = [],
  pagination,
  isLoading,
  selectedChat,
  onSelectChat,
  statusFilter,
  onStatusFilterChange,
  onPageChange,
  currentPage,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter chats by search query
  const filteredChats = (chats || []).filter((chat) => {
    const customerName =
      `${chat.customer?.firstName || ""} ${chat.customer?.lastName || ""}`.toLowerCase();
    const subject = (chat.subject || "").toLowerCase();
    const lastMessage = (chat.lastMessageText || "").toLowerCase();
    const query = searchQuery.toLowerCase();

    return (
      customerName.includes(query) ||
      subject.includes(query) ||
      lastMessage.includes(query)
    );
  });

  return (
    <div className="h-full bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 shrink-0">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">
            Conversations ({pagination?.total || 0})
          </h2>
          <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div className="relative shrink-0">
            <button
              type="button"
              aria-hidden="true"
              tabIndex={-1}
              className="p-2.5 rounded-xl border border-gray-200 text-gray-500 bg-white"
            >
              <Filter className="w-4 h-4" />
            </button>
            {/* The native select overlays the filter button (same
                pattern as before) so the status filter keeps its
                platform behaviour and accessibility. */}
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              aria-label="Filter conversations by status"
              className="absolute inset-0 opacity-0 cursor-pointer w-full"
            >
              <option value="all">All</option>
              <option value="waiting">Escalated</option>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {isLoading ? (
          <div className="p-3 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-11 h-11 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="w-3/4 h-4 rounded" />
                  <Skeleton className="w-1/2 h-3 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-3">
              <MessageCircle className="w-6 h-6 text-brand" />
            </div>
            <p className="text-sm font-medium text-gray-900">
              No conversations
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredChats.map((chat) => {
              const isSelected = selectedChat?._id === chat._id;
              const pill = priorityPill(chat.priority);

              // FE-14: no AI confidence is rendered in this list (the
              // previous code invented one per render for chats
              // without a real metadata.confidence).

              return (
                <div
                  key={chat._id}
                  onClick={() => onSelectChat(chat)}
                  className={`px-3 py-3 cursor-pointer transition-colors relative flex items-start gap-3 rounded-xl ${
                    isSelected ? "bg-brand/10" : "bg-white hover:bg-gray-50"
                  }`}
                >
                  {isSelected && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-9 w-1 rounded-full bg-brand" />
                  )}

                  {/* Avatar + unread badge */}
                  <div className="relative shrink-0">
                    {/* FE-06: real avatar img or local initials —
                        never an external placeholder URL built from
                        the customer's name. */}
                    <UserAvatar
                      user={chat.customer}
                      alt="Customer"
                      className="w-11 h-11 rounded-full text-sm"
                    />
                    {chat.unreadCountAdmin > 0 && (
                      <span className="absolute -bottom-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                        {chat.unreadCountAdmin}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Top Row: Name and Date */}
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-semibold text-[15px] text-gray-900 truncate">
                        {chat.customer?.firstName || "Customer"}{" "}
                        {chat.customer?.lastName || ""}
                      </p>
                      <span className="text-xs text-gray-400 shrink-0">
                        {formatShortDate(chat.lastMessageAt)}
                      </span>
                    </div>

                    {/* Bottom Row: Snippet and Priority Pill */}
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className="text-[13px] text-gray-500 truncate flex-1">
                        {chat.lastMessageText ||
                          chat.subject ||
                          "General Inquiry"}
                      </p>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${pill.className}`}
                      >
                        {pill.label}
                      </span>
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
        <div className="px-3 py-2 border-t border-gray-100 shrink-0">
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === pagination.totalPages}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
          >
            Load more conversations <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatList;
