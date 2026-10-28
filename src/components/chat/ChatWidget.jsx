import { useState, useMemo, useEffect } from "react";
import { MessageSquare, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useMyChats,
  useStartChat,
  useSendMessage,
  useChatDetails,
} from "../../hooks/chat/useChatTan";
import useAuthStore from "../../store/authStore";
import { useShallow } from "zustand/react/shallow";
import {
  getGuestSessionId,
  setGuestSessionId,
  clearGuestSession,
} from "../../utils/guestSessionStorage";
import ChatWindow from "./ChatWindow";
import { toast } from "../../lib/toast";

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showGreeting, setShowGreeting] = useState(() => {
    // Only show if not seen before
    return !localStorage.getItem("aura_chat_greeted");
  });
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeChatData, setActiveChatData] = useState(null); // Store guest chat data directly
  const { user } = useAuthStore(useShallow((state) => ({ user: state.user })));

  // Handle guest session lifecycle
  useEffect(() => {
    if (user) {
      // User logged in - clear guest session and cached chat
      clearGuestSession();
      setActiveChatData(null);
      setActiveChatId(null);
    } else {
      // The server creates guest capabilities; discard legacy weak credentials.
      if (!getGuestSessionId()) {
        clearGuestSession();
        setActiveChatData(null);
        setActiveChatId(null);
      }
    }
  }, [user]);

  const handleCloseGreeting = () => {
    setShowGreeting(false);
    localStorage.setItem("aura_chat_greeted", "true");
  };

  // CHAT-FIXES-9: Removed 5000ms polling on useMyChats.
  // Real-time chat list updates come from socket events (chat:message:new, chat:status:changed, etc.)
  // which automatically invalidate the 'chats/my' query key in useChatSocket.
  // Guests don't have persistent lists, so this query is disabled for them
  const { data: chatsData } = useMyChats(
    { page: 1, limit: 10 },
    { enabled: !!user && user.role !== "admin" },
  );

  const startChatMutation = useStartChat();

  // FE-33: the first page holds only the 10 most recent chats. An
  // active chat older than that is NOT in this list — resolve the
  // in-page / guest copies first, and fetch the chat by id (the
  // existing getChatDetails API, via useChatDetails) when the stored
  // active id is missing from the page, instead of falling back to
  // the welcome screen.
  const chatsList = chatsData?.data?.chats || [];
  const guestChat =
    activeChatData && activeChatData._id === activeChatId
      ? activeChatData
      : null;
  const listedChat = activeChatId
    ? chatsList.find((chat) => chat._id === activeChatId) || null
    : null;
  const needsDetailsFetch = !!activeChatId && !guestChat && !listedChat;
  const { data: activeChatDetailsData } = useChatDetails(activeChatId, {
    enabled: needsDetailsFetch,
  });

  const activeChat = useMemo(() => {
    if (!activeChatId) return null;
    if (guestChat) return guestChat;
    if (listedChat) return listedChat;
    const fetched = activeChatDetailsData?.data?.chat || null;
    return fetched && fetched._id === activeChatId ? fetched : null;
  }, [activeChatId, guestChat, listedChat, activeChatDetailsData]);

  // FE-33: badge the SUM of unread counts across the fetched chat
  // list — unread replies in a non-active conversation badge too.
  const totalUnread = chatsList.reduce(
    (sum, chat) => sum + (Number(chat.unreadCountCustomer) || 0),
    0,
  );

  const handleToggle = () => {
    if (!isOpen) {
      setIsOpen(true);
      if (showGreeting) {
        setShowGreeting(false);
        localStorage.setItem("aura_chat_greeted", "true");
      }
      if (chatsData?.data?.chats?.length > 0) {
        const recentChat = chatsData.data.chats.find((c) =>
          ["ai_handling", "escalated", "agent_handling"].includes(c.status),
        );
        if (recentChat) setActiveChatId(recentChat._id);
        else setActiveChatId(null);
      } else {
        setActiveChatId(null);
      }
    } else {
      setIsOpen(false);
    }
  };

  const { mutate: sendMessage } = useSendMessage();

  const handleResetView = () => {
    setActiveChatId(null);
  };

  const handleStartNewChat = (initialMessage = null) => {
    if (startChatMutation.isPending) return;
    startChatMutation.mutate(
      {
        subject: initialMessage || "Support Request",
        metadata: { userAgent: navigator.userAgent },
      },
      {
        onSuccess: (res) => {
          const newChatId = res.data.chat._id;
          const guestSessionId = res.data.guestSessionId;

          // Store chat data for lookup
          setActiveChatData(res.data.chat);

          // If guest, store the new session ID
          if (guestSessionId) {
            setGuestSessionId(guestSessionId);
          }

          setActiveChatId(newChatId);
          if (initialMessage) {
            sendMessage({ chatId: newChatId, content: initialMessage });
          }
        },
        onError: (error) => {
          // FE-19: EVERY start-chat failure must be visible — the old
          // handler spoke only for RATE_LIMIT_EXCEEDED (via alert())
          // and was silent for everything else, so a failed click did
          // nothing at all. The retryAfter division also produced
          // "NaN minutes" when the field was absent; guard it.
          const response = error.response?.data;
          const status = error.response?.status;
          const retryAfter = Number(error.retryAfter ?? response?.retryAfter);
          if (response?.code === "RATE_LIMIT_EXCEEDED" || status === 429) {
            if (Number.isFinite(retryAfter) && retryAfter > 0) {
              toast.error(
                `Too many chat sessions started. Please try again in ${Math.ceil(retryAfter / 60)} minute${Math.ceil(retryAfter / 60) === 1 ? "" : "s"}.`,
              );
            } else {
              toast.error(
                "Too many chat sessions started. Please wait a moment and try again.",
              );
            }
            return;
          }
          toast.error(
            error.displayMessage ||
              response?.message ||
              "Could not start a new chat. Please try again.",
          );
        },
      },
    );
  };

  // Admin users don't see the chat widget
  if (user && user.role === "admin") return null;

  return (
    <div className="fixed bottom-6 right-6 z-60 flex flex-col items-end gap-4 pointer-events-none">
      <AnimatePresence>
        {!isOpen && showGreeting && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="mb-4 mr-2 pointer-events-auto hidden lg:block"
          >
            <div className="bg-white rounded-[20px] border border-stone-200/60 p-5 w-64 relative">
              {/* Close Button */}
              <button
                onClick={handleCloseGreeting}
                className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center bg-[#F1F3F5] text-stone-500 rounded-full hover:bg-stone-200 transition-colors"
              >
                <X size={12} strokeWidth={3} />
              </button>

              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#1A1714] flex items-center justify-center text-white font-bold text-base border border-black/20">
                  A
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm leading-tight">
                    Aura Support
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-tighter">
                      Online
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[13px] text-gray-600 font-medium leading-relaxed">
                Hi there! 👋 Need help finding the perfect furniture? We're here
                to assist you!
              </p>

              {/* Tooltip Arrow - Flat */}
              <div className="absolute -bottom-1.5 right-8 w-3 h-3 bg-white border-r border-b border-stone-200/60 rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 sm:fixed sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[430px] sm:h-[650px] sm:max-h-[82vh] bg-white rounded-2xl border border-stone-200/60 overflow-hidden pointer-events-auto"
          >
            <ChatWindow
              chat={activeChat}
              onClose={() => setIsOpen(false)}
              onStartNew={handleStartNewChat}
              onResetView={handleResetView}
              isCreatingChat={startChatMutation.isPending}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={handleToggle}
        className={`w-14 h-14 rounded-full items-center justify-center transition-all duration-300 hover:scale-105 pointer-events-auto relative z-10 border ${
          isOpen
            ? "hidden sm:flex bg-white text-[#1A1714] border-stone-200"
            : "flex bg-[#1A1714] text-white border-black/30"
        }`}
      >
        {isOpen ? (
          <X className="w-7 h-7" strokeWidth={2.5} />
        ) : (
          <>
            <MessageSquare className="w-7 h-7 p-0.5" strokeWidth={2.5} />
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#E13A3E] text-white text-[11px] font-black rounded-full w-6 h-6 flex items-center justify-center ring-2 ring-white z-20">
                {totalUnread > 9 ? "9+" : totalUnread}
              </span>
            )}
          </>
        )}
      </button>
    </div>
  );
};

export default ChatWidget;
