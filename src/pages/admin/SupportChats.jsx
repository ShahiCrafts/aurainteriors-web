import { useState, useEffect } from "react";
import { MessageCircle, ArrowLeft, ShieldCheck, Zap } from "lucide-react";
import { useAllChats, useWaitingQueue } from "../../hooks/chat/useChatTan";
import ChatList from "../../components/admin/chat/ChatList";
import ChatConversation from "../../components/admin/chat/ChatConversation";
import AiAssistantPanel from "../../components/admin/chat/AiAssistantPanel";

const SupportChats = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

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

  useEffect(() => {
    const chats = chatsData?.data?.chats || [];
    if (!selectedChat && chats.length > 0) {
      setSelectedChat(chats[0]);
    }
  }, [chatsData, selectedChat]);

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
  };

  const handleBack = () => {
    setSelectedChat(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] gap-4 overflow-hidden">

      <div className="flex-1 flex overflow-hidden gap-4 min-h-0">
        {/* Sidebar: Chat List */}
        <div
          className={`w-full lg:w-86 flex-col flex shrink-0 min-h-0 ${
            selectedChat ? "hidden lg:flex" : "flex"
          }`}
        >
            <div className="flex-1 overflow-hidden flex flex-col min-h-0 border-r border-r-gray-100">
              <ChatList
                chats={chatsData?.data?.chats || []}
                pagination={chatsData?.data?.pagination}
                isLoading={isLoadingChats}
                selectedChat={selectedChat}
                onSelectChat={handleSelectChat}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                onPageChange={setPage}
                currentPage={page}
                hideTitle={false} // Set to true if ChatList still shows a title internally
              />
            </div>
        </div>

        {/* Conversation Area */}
        <div
          className={`flex-1 bg-white border border-gray-100 overflow-hidden flex flex-col min-h-0 ${
            !selectedChat ? "hidden lg:flex" : "flex"
          }`}
        >
          {selectedChat ? (
            <div className="flex flex-col h-full min-h-0">
              {/* Mobile Back Button and Header */}
              <div className="lg:hidden p-4 border-b border-gray-100 flex items-center gap-3 shrink-0">
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
                />
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="flex items-center justify-center h-full text-gray-500 w-full relative overflow-hidden bg-gray-50/30">
              <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#0066ff_1px,transparent_1px)] [background-size:20px_20px]" />
              <div className="text-center p-8 relative z-10 max-w-sm">
                <div className="w-20 h-20 rounded-3xl bg-white shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-6 transform rotate-3">
                  <MessageCircle className="w-10 h-10 text-teal-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No Chat Selected
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-8">
                  Click on a conversation from the left panel to view messages.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/50 border border-gray-100">
                    <Zap className="w-4 h-4 text-teal-500" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Instant
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/50 border border-gray-100">
                    <ShieldCheck className="w-4 h-4 text-teal-500" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Secure
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Column 3: AI Assistant (only visible when chat is selected) */}
        {selectedChat && (
          <div className="hidden xl:flex h-full shrink-0">
             <AiAssistantPanel 
                chat={selectedChat}
                onUseReply={(text) => console.log("Use text:", text)} 
                onEditReply={(text) => console.log("Edit text:", text)}
             />
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportChats;
