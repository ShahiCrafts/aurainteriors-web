import React, { useState } from "react";
import { 
  Sparkles, X, ChevronDown, ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown, 
  BookOpen, Bot, CheckCircle2, MessageSquare, Edit2, Zap, User, ShoppingBag, 
  Mail, Calendar, Tag, DollarSign, Package, Compass, Copy, ArrowUpRight,
  Shield, Check, UserCheck, ShieldAlert
} from "lucide-react";
import Skeleton from "../../common/Skeleton";
import { getAvatarUrl } from "../../../utils/imageUrl";
import { useToggleBot } from "../../../hooks/chat/useChatTan";
import { useAllOrders } from "../../../hooks/order/useOrderTan";

const AiAssistantPanel = ({ chat, onClose, onUseReply, onEditReply }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedKb, setExpandedKb] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggleBotMutation = useToggleBot();
  const isBotActive = chat?.status === "ai_handling";

  // Query actual orders matching this customer's email from store DB
  const { data: ordersData, isLoading: isLoadingOrders } = useAllOrders(
    { search: chat?.customer?.email, limit: 5 },
    { enabled: !!chat?.customer?.email }
  );

  const customerOrders = ordersData?.data?.orders || [];

  const summary = chat?.metadata?.aiSummary || "The customer is asking about delivery status and showing concern over order timelines.";
  const suggestedReply = chat?.metadata?.suggestedReply || "Hello! Let me pull up your order status right away and see what's happening.";

  const handleCopy = () => {
    navigator.clipboard.writeText(suggestedReply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleBot = () => {
    toggleBotMutation.mutate({
      chatId: chat._id,
      botActive: !isBotActive
    });
  };

  return (
    <div
      className={`rounded-xl border border-gray-100 flex flex-col h-full shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'bg-white shadow-sm' : 'bg-gray-50'}`}
      style={{ width: isExpanded ? "340px" : "48px" }}
    >
      {/* Header (expanded) */}
      {isExpanded && (
        <div className="h-14 flex items-center justify-between px-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-teal-600" />
            </div>
            <span className="font-bold text-gray-900 text-sm whitespace-nowrap">AI Copilot & Details</span>
          </div>
          <button 
            onClick={() => setIsExpanded(false)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md shrink-0 transition-colors"
            title="Collapse Panel"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Collapsed toggle — centered vertically */}
      {!isExpanded && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <button 
            onClick={() => setIsExpanded(true)}
            className="p-2 hover:bg-gray-200 rounded-lg text-teal-600 transition-colors"
            title="Expand AI Assistant"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Content */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-gray-50/20">
          
          {/* 1. Chat Control: Bot Status Toggle */}
          <div className="bg-white rounded-xl border border-gray-100 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Chat Mode</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                isBotActive ? "bg-teal-50 text-teal-700" : "bg-amber-50 text-amber-700"
              }`}>
                {isBotActive ? "Bot Active" : "Human Agent"}
              </span>
            </div>
            
            <button
              onClick={handleToggleBot}
              disabled={toggleBotMutation.isPending}
              className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 border shadow-2xs ${
                isBotActive
                  ? "bg-white text-amber-600 border-amber-200 hover:bg-amber-50/50"
                  : "bg-teal-600 text-white border-teal-600 hover:bg-teal-700"
              }`}
            >
              {isBotActive ? (
                <>
                  <UserCheck className="w-3.5 h-3.5" /> Handover to Human (Stop Bot)
                </>
              ) : (
                <>
                  <Bot className="w-3.5 h-3.5" /> Enable AI Auto-Reply (Start Bot)
                </>
              )}
            </button>
          </div>

          {/* 2. Suggested Response */}
          <div className="bg-linear-to-b from-teal-50/20 to-white rounded-xl border border-teal-100 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-teal-700 uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5 text-teal-600" />
                Suggested Response
              </div>
              <button 
                onClick={handleCopy}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md transition-colors"
                title="Copy suggested response"
              >
                {copied ? <span className="text-[10px] text-teal-600 font-bold">Copied!</span> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="bg-white border border-teal-50 rounded-lg p-3 text-xs text-gray-700 leading-relaxed italic">
              "{suggestedReply}"
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onUseReply?.(suggestedReply)}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Send to Input
              </button>
            </div>
          </div>

          {/* 3. Conversation Summary */}
          <div className="bg-white rounded-xl border border-gray-100 p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <MessageSquare className="w-3.5 h-3.5" />
              Conversation Summary
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              {summary}
            </p>
          </div>

          {/* 4. Customer Profile Card */}
          <div className="bg-white rounded-xl border border-gray-100 p-3.5 space-y-3">
            <div className="flex items-center gap-3">
              <img 
                src={getAvatarUrl(chat?.customer)}
                alt="Customer Profile"
                className="w-10 h-10 rounded-full object-cover border border-gray-100 shrink-0"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(chat?.customer?.firstName || "U")}&background=E0E7FF&color=4338CA`;
                }}
              />
              <div className="min-w-0">
                <h4 className="font-bold text-gray-900 text-xs truncate">
                  {chat?.customer?.firstName} {chat?.customer?.lastName}
                </h4>
                <p className="text-[10px] text-gray-400 truncate">{chat?.customer?.email}</p>
              </div>
            </div>
            
            <div className="border-t border-gray-50 pt-2 flex justify-between text-[11px] text-gray-500">
              <span>Customer since:</span>
              <span className="font-semibold text-gray-800">
                {new Date(chat?.customer?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* 5. Live Customer Order History from Store DB */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Live Store Orders</span>
              <span className="text-[10px] text-teal-600 font-bold flex items-center">
                Real-Time DB
              </span>
            </div>

            {isLoadingOrders ? (
              <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
                <Skeleton className="w-full h-12 rounded-lg" />
                <Skeleton className="w-full h-12 rounded-lg" />
              </div>
            ) : customerOrders.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-4 text-center text-xs text-gray-400">
                No orders found for this customer.
              </div>
            ) : (
              <div className="space-y-2.5">
                {customerOrders.map((order) => (
                  <div key={order._id} className="bg-white rounded-xl border border-gray-100 p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">#{order.orderId}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        order.orderStatus === "delivered" ? "bg-emerald-50 text-emerald-700" :
                        order.orderStatus === "cancelled" ? "bg-rose-50 text-rose-700" :
                        "bg-blue-50 text-blue-700"
                      }`}>
                        {order.orderStatus}
                      </span>
                    </div>
                    
                    <div className="space-y-0.5 text-gray-600">
                      {order.items?.map((item, idx) => (
                        <p key={idx} className="truncate font-medium text-gray-800">
                          {item.quantity}x {item.product?.name || "Product"}
                        </p>
                      ))}
                      <p className="text-[10px] text-gray-400">Ordered: {new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>

                    <div className="flex justify-between items-center border-t border-gray-50 pt-2 text-[11px]">
                      <span className="text-gray-400">Total Price</span>
                      <span className="font-bold text-gray-900">NRs. {order.total.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default AiAssistantPanel;
