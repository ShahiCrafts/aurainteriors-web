import React, { useState } from "react";
import { Sparkles, X, ChevronDown, ChevronRight, ThumbsUp, ThumbsDown, BookOpen, Bot, CheckCircle2, MessageSquare, Edit2, Zap } from "lucide-react";

const AiAssistantPanel = ({ chat, onClose, onUseReply, onEditReply }) => {
  const [expandedKb, setExpandedKb] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  if (!isExpanded) {
    return (
      <div className="w-12 border-l border-gray-100 bg-gray-50 flex flex-col items-center py-4 gap-4 h-full shrink-0 transition-all duration-300">
        <button 
          onClick={() => setIsExpanded(true)}
          className="p-2 hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-gray-200 text-teal-600 transition-colors tooltip-trigger"
          title="Expand AI Assistant"
        >
          <Bot className="w-5 h-5" />
        </button>
      </div>
    );
  }

  const confidenceScore = chat?.metadata?.confidence || 0;
  const sentiment = chat?.metadata?.sentiment || "Neutral";
  const summary = chat?.metadata?.aiSummary || "No summary available yet. AI is analyzing the conversation.";
  
  // Mock suggested reply for now
  const suggestedReply = "Hello! I understand you are having an issue. Let me check the order history and get back to you with an update.";
  const kbArticles = [
    { title: "Return Policy", url: "#", relevance: "95%" },
    { title: "Shipping Delays", url: "#", relevance: "82%" },
  ];

  return (
    <div className="w-80 border-l border-gray-100 bg-gray-50/50 flex flex-col h-full shrink-0 transition-all duration-300">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 bg-white shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-teal-600" />
          </div>
          <span className="font-bold text-gray-900">AI Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsExpanded(false)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
            title="Collapse Panel"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md lg:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Status Indicators */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sentiment</span>
            <div className="flex items-center gap-1.5">
              {sentiment === "Positive" ? <ThumbsUp className="w-4 h-4 text-green-500" /> : 
               sentiment === "Negative" ? <ThumbsDown className="w-4 h-4 text-red-500" /> : 
               <div className="w-4 h-4 rounded-full border-2 border-gray-300" />}
              <span className="text-sm font-semibold text-gray-800">{sentiment}</span>
            </div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Confidence</span>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold text-gray-800">{confidenceScore}%</span>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2 bg-gray-50/50">
            <MessageSquare className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-bold text-gray-700">Conversation Summary</span>
          </div>
          <div className="p-4 text-sm text-gray-600 leading-relaxed">
            {summary}
          </div>
        </div>

        {/* Suggested Reply */}
        <div className="bg-linear-to-b from-indigo-50/50 to-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-indigo-50 flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold text-indigo-900">Suggested Reply</span>
          </div>
          <div className="p-4">
            <div className="bg-white border border-indigo-50 rounded-lg p-3 text-sm text-gray-700 mb-3 shadow-sm italic">
              "{suggestedReply}"
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onUseReply?.(suggestedReply)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Use Reply
              </button>
              <button 
                onClick={() => onEditReply?.(suggestedReply)}
                className="flex-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
            </div>
          </div>
        </div>

        {/* Knowledge Base Used */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <button 
            onClick={() => setExpandedKb(!expandedKb)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-bold text-gray-700">Sources Used</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedKb ? 'rotate-180' : ''}`} />
          </button>
          
          {expandedKb && (
            <div className="p-2 border-t border-gray-50 bg-gray-50/30">
              {kbArticles.length > 0 ? (
                <div className="space-y-1">
                  {kbArticles.map((article, i) => (
                    <a 
                      key={i}
                      href={article.url}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all group"
                    >
                      <span className="text-xs text-gray-600 group-hover:text-indigo-600 font-medium">{article.title}</span>
                      <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold">{article.relevance}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center py-2">No sources used.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiAssistantPanel;
