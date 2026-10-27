import { useState, useEffect, useCallback, useRef } from "react";
import {
  Bell,
  Trash2,
  Check,
  Box,
  Percent,
  Palette,
  Info,
  Settings,
  ChevronRight,
  Package,
  Clock,
  CheckCheck
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import Navbar from "../../layouts/customer/Navbar";
import notificationApi from "../../api/notificationApi";
import Skeleton from "../../components/common/Skeleton";
import Pagination from "../../components/common/Pagination";
import useNotificationSocket from "../../hooks/notification/useNotificationSocket";
import { Link } from "react-router-dom";
import { safeActionUrl } from "../../utils/safeUrl";

// Phase 5 (open-redirect sweep): the stored actionUrl is
// server-controlled and must pass the same FE-04 gate as every
// other consumer (NotificationBell, AdminLayout, AnnouncementsPage)
// before it reaches <Link to>. inAppOnly: router targets are
// internal by definition — an off-site or dangerous-scheme value
// yields null, and the caller falls back to the orders tab (when
// the notification carries an orderId) or renders no link at all.
const notificationTarget = (n) =>
  n.actionUrl ? safeActionUrl(n.actionUrl, { inAppOnly: true }) : null;

export default function NotificationsPage() {
  const { user, token } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState("all"); // all, unread, orders, promos, designs, system

  const { socket } = useNotificationSocket(token, user?._id);
  const [unreadCount, setUnreadCount] = useState(0);
  const requestSequence = useRef(0);
  const fetchNotifications = useCallback(async (pageNum = 1) => {
    if (!user?._id) return;
    const sequence = ++requestSequence.current;
    setLoading(true);
    setError(null);
    try {
      const categories = { orders: "order", promos: "promotion", designs: "design", system: "system" };
      const filters = filter === "unread" ? { isRead: false } : categories[filter] ? { category: categories[filter] } : {};
      const [response, countResponse] = await Promise.all([
        notificationApi.getNotifications(pageNum, 20, filters),
        notificationApi.getUnreadCount(),
      ]);
      if (sequence !== requestSequence.current) return;
      const result = response.data;
      const lastPage = Math.max(1, result.totalPages);
      if (pageNum > lastPage) return fetchNotifications(lastPage);
      setNotifications(result.notifications);
      setPage(result.page);
      setTotalPages(lastPage);
      setUnreadCount(countResponse.data.unreadCount);
    } catch (err) {
      if (sequence === requestSequence.current) setError("Failed to load notifications");
    } finally {
      if (sequence === requestSequence.current) setLoading(false);
    }
  }, [user?._id, filter]);

  useEffect(() => {
    fetchNotifications(1);
    return () => { requestSequence.current++; };
  }, [fetchNotifications]);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => fetchNotifications(1);
    socket.on("notification:new", refresh);
    socket.on("notification:broadcast", refresh);
    socket.on("connect", refresh);
    return () => {
      socket.off("notification:new", refresh);
      socket.off("notification:broadcast", refresh);
      socket.off("connect", refresh);
    };
  }, [socket, fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      await fetchNotifications(page);
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      // Only mark the unread notifications on this page.
      const ids = notifications.filter(n => !n.isRead).map(n => n._id);
      if (ids.length === 0) return;

      await notificationApi.markMultipleAsRead(ids);
      await fetchNotifications(page);
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationApi.archiveNotification(id);
      await fetchNotifications(page);
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  // Helper: Get Icon based on type/category
  const getIcon = (type, category) => {
    // Map backend types/categories to UI icons
    if (type?.includes("order") || category === "order") return <Box className="w-5 h-5 text-blue-600" />;
    if (type?.includes("promo") || category === "promotion") return <Percent className="w-5 h-5 text-emerald-600" />;
    if (category === "design") return <Palette className="w-5 h-5 text-purple-600" />;
    if ((type === "system" || type === "announcement")) return <Settings className="w-5 h-5 text-gray-600" />;

    // Default fallback
    return <Package className="w-5 h-5 text-teal-600" />;
  };

  const getIconBg = (type, category) => {
    if (type?.includes("order") || category === "order") return "bg-blue-50";
    if (type?.includes("promo") || category === "promotion") return "bg-emerald-50";
    if (category === "design") return "bg-purple-50";
    if ((type === "system" || type === "announcement")) return "bg-gray-50";
    return "bg-teal-50";
  };

  const filteredNotifications = notifications;

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "Just now";
  };

  // Filter Tabs
  const filters = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread', count: unreadCount },
    { id: 'orders', label: 'Orders' },
    { id: 'promos', label: 'Promos' },
    { id: 'designs', label: 'Designs' },
    { id: 'system', label: 'System' },
  ];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50/50 pt-24 pb-12 font-dm-sans">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center shrink-0">
                <Bell className="w-6 h-6 text-teal-700" />
              </div>
              <div>
                <h1 className="text-[32px] md:text-[40px] font-bold text-[#1A1714] tracking-tight mb-2 font-playfair leading-tight">
                  Your <span className="italic text-[#F27318]">Notifications</span>
                </h1>
                <p className="text-[16px] text-black/40 font-medium font-dm-sans">Stay updated with orders, offers, and more</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                Mark page as read
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 mb-6 scrollbar-hide">
            {filters.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filter === f.id
                  ? 'bg-teal-700 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
              >
                {f.label}
                {f.count > 0 && (
                  <span className={`flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-[10px] ${filter === f.id ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'
                    }`}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-4 p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
                    <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="w-1/2 h-5 rounded" />
                      <Skeleton className="w-full h-4 rounded" />
                      <Skeleton className="w-1/4 h-3 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-5 text-center text-red-600" role="alert">
                <p>{error}</p>
                <button onClick={() => fetchNotifications(page)} className="mt-3 underline">Try again</button>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">No notifications found</h3>
                <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
                  {filter === 'all'
                    ? "You haven't received any notifications yet. We'll alert you when something happens!"
                    : `No ${filter} notifications found at the moment.`}
                </p>
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n._id}
                  className={`group relative flex gap-4 p-5 rounded-2xl bg-white shadow-sm transition-all duration-200 hover:shadow-md`}
                >
                  <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${getIconBg(n.type, n.category)}`}>
                    {getIcon(n.type, n.category)}
                  </div>

                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-start justify-between gap-4 mb-0.5">
                      <div className="flex items-center gap-2 pr-8">
                        <h3 className={`text-base text-gray-900 ${!n.isRead ? 'font-bold' : 'font-medium'}`}>
                          {n.title}
                        </h3>
                        {!n.isRead && (
                          <span className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm" />
                        )}
                      </div>

                      <div className="hidden sm:flex items-center gap-2">
                        {!n.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(n._id)}
                            className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(n._id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-gray-500 text-sm leading-relaxed mb-3 pr-4">
                      {n.message || n.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs font-medium text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {formatTimeAgo(n.createdAt)}
                      </span>
                      {(notificationTarget(n) || n.data?.orderId) && (
                        <Link
                          // FE-16: the fallback was /profile/orders/<id>,
                          // which matches no customer route (404). Orders
                          // live under /profile with the orders tab active
                          // (same convention as Navbar's "My Orders").
                          // Phase 5: `to` is the VALIDATED target
                          // (notificationTarget), never the raw stored
                          // actionUrl — see the helper above.
                          to={notificationTarget(n) || "/profile"}
                          state={notificationTarget(n) ? undefined : { activeTab: "orders" }}
                          className="flex items-center gap-1 text-teal-600 hover:text-teal-700 hover:underline"
                        >
                          View details <ChevronRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="absolute top-4 right-4 sm:hidden flex flex-col gap-2">
                    <button
                      onClick={() => handleDelete(n._id)}
                      className="text-gray-400 hover:text-red-500 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination — the shared Pagination, simple
              variant (Wave A); disabled while a page loads. */}
          <div className="mt-10">
            <Pagination
              variant="simple"
              page={page}
              totalPages={totalPages}
              onPageChange={(p) => fetchNotifications(p)}
              disabled={loading}
            />
          </div>

        </div>
      </div>
    </>
  );
}
