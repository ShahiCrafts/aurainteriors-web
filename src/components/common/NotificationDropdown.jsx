import React from "react";
import { 
  AlertCircle, 
  BellOff, 
  CheckCheck, 
  Archive, 
  ShoppingCart,
  XCircle,
  RotateCcw,
  Star,
  Mail,
  MessageSquare,
  Bell
} from "lucide-react";
import Skeleton from "./Skeleton";

const getNotificationIcon = (type) => {
  switch (type) {
    case "order:new":
      return {
        icon: <ShoppingCart className="w-4 h-4 text-blue-600" />,
        bg: "bg-blue-50 border-blue-100",
      };
    case "order:cancelled":
      return {
        icon: <XCircle className="w-4 h-4 text-red-600" />,
        bg: "bg-red-50 border-red-100",
      };
    case "return:requested":
      return {
        icon: <RotateCcw className="w-4 h-4 text-amber-600" />,
        bg: "bg-amber-50 border-amber-100",
      };
    case "review:new":
      return {
        icon: <Star className="w-4 h-4 text-yellow-600" fill="currentColor" />,
        bg: "bg-yellow-50 border-yellow-100",
      };
    case "contact:new":
      return {
        icon: <Mail className="w-4 h-4 text-teal-600" />,
        bg: "bg-teal-50 border-teal-100",
      };
    case "chat:started":
      return {
        icon: <MessageSquare className="w-4 h-4 text-indigo-600" />,
        bg: "bg-indigo-50 border-indigo-100",
      };
    default:
      return {
        icon: <Bell className="w-4 h-4 text-gray-600" />,
        bg: "bg-gray-50 border-gray-100",
      };
  }
};

const NotificationDropdown = ({
  notifications = [],
  loading,
  unreadCount,
  onNotificationClick,
  onMarkAllAsRead,
  onArchive,
  error,
}) => {
  console.log(
    "🎨 [Dropdown Render] Notifications count:",
    notifications.length
  );

  const formatTime = (date) => {
    if (!date) return "";
    const notificationDate = new Date(date);
    return notificationDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-full h-full flex flex-col bg-white">
      <div className="flex justify-between items-center p-4 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-900">
          Notifications ({notifications.length})
        </h3>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="text-xs font-semibold text-teal-600 hover:text-teal-700"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto max-h-[400px]">
        {loading && notifications.length === 0 ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="w-3/4 h-4 rounded" />
                  <Skeleton className="w-full h-3 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <BellOff className="mx-auto mb-2 opacity-20" size={32} />
            <p className="text-sm font-medium">No notifications found.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {notifications.map((n, index) => {
              const id = n._id || n.id;
              const title = n.title || n.notification?.title || "No Title";
              const message =
                n.message || n.notification?.description || "No Message";
              const isRead = n.isRead === true;
              const createdAt = n.createdAt;
              const type = n.type || "";

              const iconBox = getNotificationIcon(type);

              return (
                <div
                  key={id || index}
                  className={`group relative flex items-start gap-3 px-4 py-3.5 border-b border-gray-50 cursor-pointer transition-all ${!isRead
                    ? "bg-blue-50/20 border-l-4 border-l-teal-600"
                    : "hover:bg-gray-50/80 border-l-4 border-l-transparent"
                    }`}
                  onClick={() => onNotificationClick(n)}
                >
                  <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 shadow-sm ${iconBox.bg}`}>
                    {iconBox.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        className={`text-sm ${!isRead ? "font-bold" : "font-semibold"
                          } text-gray-900 truncate`}
                      >
                        {title}
                      </h4>
                      <span className="text-[10px] text-gray-400 font-medium shrink-0">
                        {formatTime(createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">
                      {message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-100 bg-gray-50 text-center">
        <a
          href="/notifications"
          className="text-xs font-bold text-gray-500 hover:text-teal-600"
        >
          View All Notifications
        </a>
      </div>
    </div>
  );
};

export default NotificationDropdown;
