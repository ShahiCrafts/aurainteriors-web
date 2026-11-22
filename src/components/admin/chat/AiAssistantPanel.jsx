import React, { useState } from "react";
import {
  Sparkles,
  ChevronDown,
  ChevronRight,
  FileText,
  User,
  Bot,
  UserCheck,
  Zap,
  Copy,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import Skeleton from "../../common/Skeleton";
import { UserAvatar } from "../../common/InitialsAvatar";
import { formatNPR } from "../../../utils/formatCurrency";
import { formatDate } from "../../../utils/formatDate";
import { useToggleBot } from "../../../hooks/chat/useChatTan";
import { useAllOrders } from "../../../hooks/order/useOrderTan";
import { formatShortDate } from "./supportChatDesign";

const cardClass =
  "bg-white rounded-2xl border border-gray-200 shadow-sm p-4";
const cardTitleClass =
  "flex items-center gap-2 font-bold text-gray-900 text-[15px]";

const orderStatusPill = (status) => {
  switch (status) {
    case "delivered":
      return "bg-green-50 text-green-600";
    case "cancelled":
      return "bg-red-50 text-red-500";
    case "shipped":
      return "bg-blue-50 text-blue-600";
    case "processing":
    case "confirmed":
    case "pending":
      return "bg-amber-50 text-amber-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

// Batch 3c — right rail of the admin Support Chat page, redesigned
// to the approved mockup as stacked cards: AI Copilot & Details
// (collapsible; chat mode + auto-reply toggle), Suggested Response
// (only when the API provided one), Conversation Summary, Customer
// Profile, and Live Store Orders. Data sources are unchanged:
// chat.metadata for AI text, useToggleBot for the mode switch, and
// the customer's real orders via useAllOrders.
const AiAssistantPanel = ({ chat, onClose, onUseReply, onEditReply }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const toggleBotMutation = useToggleBot();
  const isBotActive = chat?.status === "ai_handling";

  // Query actual orders matching this customer's email from store DB
  const { data: ordersData, isLoading: isLoadingOrders } = useAllOrders(
    { search: chat?.customer?.email, limit: 5 },
    { enabled: !!chat?.customer?.email },
  );

  const customerOrders = ordersData?.data?.orders || [];

  // FE-14: only real, API-provided AI text may be shown or dispatched.
  // A missing summary renders an honest empty state, and a missing
  // suggested reply renders no suggestion UI and no send/copy path.
  const summary = chat?.metadata?.aiSummary;
  const suggestedReply = chat?.metadata?.suggestedReply;

  const handleCopy = () => {
    navigator.clipboard.writeText(suggestedReply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleBot = () => {
    toggleBotMutation.mutate({
      chatId: chat._id,
      botActive: !isBotActive,
    });
  };

  return (
    <div className="flex flex-col gap-4 w-[340px] shrink-0">
      {/* 1. AI Copilot & Details — Chat Mode */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-5 h-5 text-[#2563EB] shrink-0" />
            <span className="font-bold text-gray-900 text-[15px] whitespace-nowrap">
              AI Copilot & Details
            </span>
          </div>
          <button
            onClick={() => setIsExpanded((open) => !open)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
            aria-label={isExpanded ? "Collapse panel" : "Expand panel"}
            title={isExpanded ? "Collapse panel" : "Expand panel"}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>

        {isExpanded && (
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-900">
                Chat Mode
              </span>
              <span
                className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider ${
                  isBotActive
                    ? "bg-blue-50 text-blue-600"
                    : "bg-amber-50 text-amber-600"
                }`}
              >
                {isBotActive ? "AI Assistant" : "Human Agent"}
              </span>
            </div>

            <button
              onClick={handleToggleBot}
              disabled={toggleBotMutation.isPending}
              className={`w-full py-2.5 px-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60 ${
                isBotActive
                  ? "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  : "bg-[#2563EB] text-white hover:bg-blue-700 shadow-sm"
              }`}
            >
              {isBotActive ? (
                <>
                  <UserCheck className="w-4 h-4" /> Disable AI Auto-Reply
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4" /> Enable AI Auto-Reply (Start Bot)
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 2. Suggested Response — only when the API actually provided one */}
      {suggestedReply && (
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2 font-bold text-gray-900 text-[15px]">
              <Zap className="w-4 h-4 text-[#2563EB]" />
              Suggested Response
            </div>
            <button
              onClick={handleCopy}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-md transition-colors"
              title="Copy suggested response"
            >
              {copied ? (
                <span className="text-[10px] text-blue-600 font-bold">
                  Copied!
                </span>
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-[13px] text-gray-700 leading-relaxed italic mb-3">
            "{suggestedReply}"
          </div>
          <button
            onClick={() => onUseReply?.(suggestedReply)}
            className="w-full bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-semibold py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" /> Send to Input
          </button>
        </div>
      )}

      {/* 3. Conversation Summary */}
      <div className={cardClass}>
        <div className={`${cardTitleClass} mb-2`}>
          <FileText className="w-4 h-4 text-[#2563EB]" />
          Conversation Summary
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">
          {summary || "No AI summary available"}
        </p>
      </div>

      {/* 4. Customer Profile */}
      <div className={cardClass}>
        <div className={`${cardTitleClass} mb-3`}>
          <User className="w-4 h-4 text-[#2563EB]" />
          Customer Profile
        </div>
        <div className="flex items-center gap-3">
          {/* FE-06: real avatar img or local initials — the
              customer's name never leaves for a placeholder service. */}
          <UserAvatar
            user={chat?.customer}
            alt="Customer Profile"
            className="w-12 h-12 rounded-full text-base border border-gray-100"
          />
          <div className="min-w-0">
            <h4 className="font-bold text-gray-900 text-sm truncate">
              {chat?.customer?.firstName} {chat?.customer?.lastName}
            </h4>
            <p className="text-[13px] text-gray-500 truncate">
              {chat?.customer?.email}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between items-center text-sm">
          <span className="text-gray-500">Customer since:</span>
          <span className="font-semibold text-gray-900">
            {formatDate(chat?.customer?.createdAt || Date.now(), {
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* 5. Live Store Orders */}
      <div className={cardClass}>
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-gray-900 text-[15px]">
            Live Store Orders
          </span>
          <a
            href="/dashboard/orders"
            className="text-sm font-medium text-[#2563EB] flex items-center gap-1 hover:underline"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {isLoadingOrders ? (
          <div className="space-y-2.5">
            <Skeleton className="w-full h-20 rounded-xl" />
            <Skeleton className="w-full h-20 rounded-xl" />
          </div>
        ) : customerOrders.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-3">
            No orders found for this customer.
          </p>
        ) : (
          <div>
            {customerOrders.map((order) => {
              const totalQty = (order.items || []).reduce(
                (sum, item) => sum + (item.quantity || 1),
                0,
              );
              return (
                <div
                  key={order._id}
                  className="border border-gray-100 rounded-xl p-3 mb-2.5 last:mb-0"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-gray-900 text-[13px] truncate">
                      #{order.orderId}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0 ${orderStatusPill(order.orderStatus)}`}
                    >
                      {order.orderStatus}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1.5">
                    {totalQty}x {totalQty === 1 ? "Product" : "Products"}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-400">
                      Ordered: {formatShortDate(order.createdAt)}
                    </span>
                    <span className="font-bold text-gray-900 text-[13px]">
                      {formatNPR(order.total)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AiAssistantPanel;
