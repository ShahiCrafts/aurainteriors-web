import React, { useState, useEffect, useRef, useMemo } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NotificationDropdown from "./NotificationDropdown";
import useAdminNotificationSocket from "../../hooks/admin/useAdminNotificationSocket";
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkMultipleNotificationsRead,
  mergeNotificationsById,
  collectUnreadNotificationIds,
} from "../../hooks/notification/useNotificationsTan";
import { safeActionUrl } from "../../utils/safeUrl";

const NotificationBell = ({ user, token }) => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const bellRef = useRef(null);

  const {
    adminNotifications,
    unreadAdminCount,
    setAdminNotifications,
    setUnreadAdminCount,
  } = useAdminNotificationSocket(token, user?._id, user?.role);

  // REUSE-016: the list + unread count are React Query state now
  // (useNotificationsTan); the hand-rolled fetch/sequence-ref logic is
  // gone — React Query's fetch supersession replaces the FE-24
  // sequence guard, and the merge-by-id with socket items is kept.
  // Each open is a new query (keyExtra cycle): a response from a
  // previous open can never overwrite the current one (the FE-24
  // stale rule React Query's same-key dedupe alone would not give,
  // because the first fetch is still in flight on a quick reopen).
  const [openCycle, setOpenCycle] = useState(0);
  const listQuery = useNotifications({
    page: 1,
    limit: 10,
    enabled: !!user && showDropdown,
    keyExtra: openCycle,
  });
  const unreadQuery = useUnreadNotificationCount({ enabled: !!user });
  const markAsReadMutation = useMarkNotificationRead();
  const markMultipleReadMutation = useMarkMultipleNotificationsRead();

  // FE-24: the badge comes from the dedicated unread-count endpoint
  // on mount. The socket hook owns the live badge state (socket pushes
  // increment it), so the query result is synced into it — pre-fix
  // nothing was fetched until the dropdown was first opened, and the
  // badge was then computed as unread∩first-10-items.
  const unreadFromServer = unreadQuery.data;
  useEffect(() => {
    if (Number.isFinite(unreadFromServer)) {
      setUnreadAdminCount(unreadFromServer);
    }
  }, [unreadFromServer, setUnreadAdminCount]);

  // (openCycle is bumped in the toggle handler below, in the same
  // state batch as opening, so the first enabled render already
  // carries the new key.)

  const fetchedList = useMemo(
    () =>
      listQuery.data?.data?.notifications || listQuery.data?.notifications || [],
    [listQuery.data]
  );
  // Socket items not yet in the REST page stay at the front (FE-24).
  const notifications = useMemo(
    () => mergeNotificationsById(fetchedList, adminNotifications),
    [fetchedList, adminNotifications]
  );
  const loading = showDropdown && listQuery.isFetching;
  const fetchError = showDropdown && listQuery.isError;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  // FE-24: 'Mark all read' collects the ids of ALL unread
  // notifications (paging the isRead=false filter, not just the
  // visible first page) and marks them in one API call.
  const handleMarkAllAsRead = async () => {
    try {
      const ids = await collectUnreadNotificationIds();
      if (ids.length > 0) {
        await markMultipleReadMutation.mutateAsync(ids);
      }
      setAdminNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
      setUnreadAdminCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markAsReadMutation.mutateAsync(id);
      setAdminNotifications((prev) =>
        prev.map((n) =>
          n._id === id || n.id === id
            ? { ...n, isRead: true }
            : n
        )
      );
      setUnreadAdminCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  return (
    <div className="relative inline-flex" ref={bellRef}>
      <button
        onClick={() => {
          if (!showDropdown) setOpenCycle((c) => c + 1);
          setShowDropdown((prev) => !prev);
        }}
        aria-label={unreadAdminCount > 0 ? `Notifications, ${unreadAdminCount} unread` : "Notifications"}
        aria-expanded={showDropdown}
        aria-haspopup="true"
        className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-colors duration-200 ${showDropdown}
            ? "bg-gray-100 text-gray-900"
            : "text-gray-500 hover:bg-gray-100"
          }`}
      >
        <Bell
          className={`w-5 h-5 ${unreadAdminCount > 0
              ? "text-gray-700"
              : "text-gray-500"
            }`}
        />

        {unreadAdminCount > 0 && (
          <span className="absolute -top-2 -right-2 flex items-center justify-center w-[22px] h-[22px] rounded-full bg-red-500 border-2 border-white text-[10px] font-bold text-white">
            {unreadAdminCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 sm:right-[-60px] mt-2 z-50 min-w-[320px] sm:min-w-[380px] bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden origin-top-right">
          <NotificationDropdown
            notifications={notifications}
            loading={loading}
            unreadCount={unreadAdminCount}
            onMarkAllAsRead={handleMarkAllAsRead}
            error={
              fetchError
                ? "Couldn't load notifications. Please try again."
                : undefined
            }
            onNotificationClick={(notification) => {
              if (!notification.isRead) {
                handleMarkAsRead(notification._id || notification.id);
              }

              if (notification.actionUrl) {
                // FE-04: validate the stored actionUrl before it
                // reaches the router. safeActionUrl rewrites only a
                // leading /admin segment, merges highlight via
                // URLSearchParams, and returns null for anything
                // off-site or malformed — then we simply do not
                // navigate (mark-as-read above still happened).
                const targetUrl = safeActionUrl(notification.actionUrl, {
                  highlight: notification.data?.orderId,
                  inAppOnly: true,
                });
                if (targetUrl) {
                  navigate(targetUrl);
                }
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
