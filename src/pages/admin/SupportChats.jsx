import { useState, useEffect, useRef } from "react";
import { MessageCircle, ArrowLeft, Headset } from "lucide-react";
import { useAllChats, useWaitingQueue } from "../../hooks/chat/useChatTan";
import ChatList from "../../components/admin/chat/ChatList";
import ChatConversation from "../../components/admin/chat/ChatConversation";
import AiAssistantPanel from "../../components/admin/chat/AiAssistantPanel";

// Batch 3c — Support Chat page, redesigned to the approved mockup:
// page header (headset icon, title, subtitle) over a three-column
// card layout. Selection/data behaviour is unchanged (FE-25:
// selection by id, derived from the latest list; Back never
// re-triggers auto-select; AI panel replies reach the composer),
// except that list pages now ACCUMULATE so the list's "Load more
// conversations" footer appends instead of replacing.
const SupportChats = () => {
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [draftReply, setDraftReply] = useState(null);
  const [accumulatedChats, setAccumulatedChats] = useState([]);

  const {
    data: chatsData,
    isLoading: isLoadingChats,
    refetch: refetchChats,
  } = useAllChats({
    page,
    limit: 20,
    status: statusFilter === "all" ? undefined : statusFilter,
    sortBy: "lastMessageAt",
  });

  // Accumulate pages: page 1 replaces (fresh poll data), later pages
  // append new chats only, de-duplicated by id.
  useEffect(() => {
    const incoming = chatsData?.data?.chats || [];
    if (page === 1) {
      setAccumulatedChats(incoming);
      return;
    }
    setAccumulatedChats((prev) => {
      const seen = new Set(prev.map((c) => c._id ?? c.id));
      const merged = [...prev];
      for (const chat of incoming) {
        const id = chat._id ?? chat.id;
        if (!seen.has(id)) {
          merged.push(chat);
          seen.add(id);
        }
      }
      return merged;
    });
  }, [chatsData, page]);

  const chats = accumulatedChats;
  const selectedChat =
    chats.find((c) => (c._id ?? c.id) === selectedChatId) ?? null;

  const hasAutoSelectedRef = useRef(false);
  useEffect(() => {
    if (
      !hasAutoSelectedRef.current &&
      selectedChatId === null &&
      chats.length > 0
    ) {
      hasAutoSelectedRef.current = true;
      setSelectedChatId(chats[0]._id ?? chats[0].id);
    }
  }, [chatsData, selectedChatId, chats]);

  const handleSelectChat = (chat) => {
    setSelectedChatId(chat._id ?? chat.id);
  };

  const handleBack = () => {
    setSelectedChatId(null);
  };

  const handleStatusFilterChange = (filter) => {
    setStatusFilter(filter);
    setPage(1);
    setAccumulatedChats([]);
  };

  const handleUseReply = (text) => {
    if (typeof text === "string" && text) {
      setDraftReply({ text, nonce: Date.now() });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] gap-4 overflow-hidden">
      {/* Page Header */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
          <Headset className="w-6 h-6 text-[#2563EB]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">
            Support Chat
          </h1>
          <p className="text-sm text-gray-500">
            Help your customers with AI-powered support
          </p>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden gap-4 min-h-0">
        {/* Sidebar: Chat List */}
        <div
          className={`w-full lg:w-[340px] flex-col flex shrink-0 min-h-0 ${selectedChat ? "hidden lg:flex" : "flex"
            }`}
        >
          <ChatList
            chats={chats}
            pagination={chatsData?.data?.pagination}
            isLoading={isLoadingChats}
            selectedChat={selectedChat}
            onSelectChat={handleSelectChat}
            statusFilter={statusFilter}
            onStatusFilterChange={handleStatusFilterChange}
            onPageChange={setPage}
            currentPage={page}
          />
        </div>

        {/* Conversation Area */}
        <div
          className={`flex-1 overflow-hidden flex-col min-h-0 ${!selectedChat ? "hidden lg:flex" : "flex"
            }`}
        >
          {selectedChat ? (
            <div className="flex flex-col h-full min-h-0">
              {/* Mobile Back Button and Header */}
              <div className="lg:hidden p-4 flex items-center gap-3 shrink-0">
                <button
                  onClick={handleBack}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-500" />
                </button>
                <span className="font-bold text-gray-900">Back to List</span>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                <ChatConversation
                  chat={selectedChat}
                  onClose={handleBack}
                  onChatUpdated={refetchChats}
                  draftReply={draftReply}
                />
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center justify-center">
              <div className="text-center p-8 max-w-sm">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-[#2563EB]" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  No Chat Selected
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Click on a conversation from the left panel to view
                  messages.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Column 3: AI Copilot & Details (only visible when chat is selected) */}
        {selectedChat && (
          <div className="hidden xl:block w-[340px] shrink-0 overflow-y-auto min-h-0">
            <AiAssistantPanel
              chat={selectedChat}
              onUseReply={handleUseReply}
              onEditReply={handleUseReply}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportChats;
