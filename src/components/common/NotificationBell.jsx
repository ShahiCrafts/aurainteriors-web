import React, { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NotificationDropdown from "./NotificationDropdown";
import useAdminNotificationSocket from "../../hooks/admin/useAdminNotificationSocket";
import notificationApi from "../../api/notificationApi";
import { safeActionUrl } from "../../utils/safeUrl";

const notifId = (n) => n?._id ?? n?.id;

// FE-24: merge a REST page with what the socket already delivered.
// Items the socket pushed that are not in the fetched page are the
// NEWEST arrivals — they stay at the front instead of being silently
// overwritten by the fetch result (the old code replaced the list
// unconditionally). Items present in both keep the fresher REST copy.
const mergeNotificationsById = (fetchedList, existingList) => {
  const fetchedIds = new Set(
    (fetchedList || []).map(notifId).filter((id) => id != null)
  );
  const socketOnly = (existingList || []).filter((n) => {
    const id = notifId(n);
    return id == null || !fetchedIds.has(id);
  });
  return [...socketOnly, ...(fetchedList || [])];
};

const NotificationBell = ({ user, token }) => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const bellRef = useRef(null);
  // FE-24: monotonically increasing fetch sequence — a response is
  // applied only if no newer fetch has started since (rapid
  // open/close races let an older, slower response win before).
  const fetchSeqRef = useRef(0);

  const {
    adminNotifications,
    unreadAdminCount,
    setAdminNotifications,
    setUnreadAdminCount,
  } = useAdminNotificationSocket(token, user?._id, user?.role);

  // FE-24: the badge comes from the dedicated unread-count endpoint
  // on mount. Pre-fix nothing was fetched until the dropdown was
  // first opened, and the badge was then computed as
  // unread∩first-10-items — an admin with 25 unread saw no badge,
  // then a badge capped at 10.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await notificationApi.getUnreadCount();
        const count = response?.data?.unreadCount;
        if (!cancelled && Number.isFinite(count)) {
          setUnreadAdminCount(count);
        }
      } catch (error) {
        console.error("Failed to fetch unread count:", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, setUnreadAdminCount]);

  const fetchNotifications = async () => {
    if (!user) return;

    const seq = ++fetchSeqRef.current;
    setLoading(true);

    try {
      const response = await notificationApi.getNotifications(1, 10);

      if (seq !== fetchSeqRef.current) return; // stale response

      const fetchedList =
        response?.data?.notifications ||
        response?.notifications ||
        [];

      setFetchError(false);
      setAdminNotifications((prev) =>
        mergeNotificationsById(fetchedList, prev)
      );
    } catch (error) {
      if (seq !== fetchSeqRef.current) return; // stale response
      console.error("Failed to fetch notifications:", error);
      // FE-24: a failed fetch is an error state, not an empty list —
      // the dropdown renders this instead of 'No notifications found'.
      setFetchError(true);
    } finally {
      if (seq === fetchSeqRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (showDropdown) {
      fetchNotifications();
    }
  }, [showDropdown]);

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

  // FE-24: 'Mark all read' was dead — the bell rendered
  // NotificationDropdown WITHOUT onMarkAllAsRead, so the button's
  // onClick was undefined. This handler collects the ids of ALL
  // unread notifications (paging the isRead=false filter, not just
  // the visible first page) and marks them in one API call.
  const handleMarkAllAsRead = async () => {
    try {
      const ids = [];
      let page = 1;
      let totalPages = 1;
      do {
        const response = await notificationApi.getNotifications(page, 50, {
          isRead: false,
        });
        const list =
          response?.data?.notifications || response?.notifications || [];
        for (const n of list) {
          const id = notifId(n);
          if (id != null) ids.push(id);
        }
        totalPages = response?.data?.totalPages || 1;
        page += 1;
      } while (page <= totalPages && page <= 20);

      if (ids.length > 0) {
        await notificationApi.markMultipleAsRead(ids);
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
      await notificationApi.markAsRead(id);

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
        onClick={() => setShowDropdown((prev) => !prev)}
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
            notifications={adminNotifications}
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