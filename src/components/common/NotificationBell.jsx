import React, { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NotificationDropdown from "./NotificationDropdown";
import useAdminNotificationSocket from "../../hooks/admin/useAdminNotificationSocket";
import notificationApi from "../../api/notificationApi";

const NotificationBell = ({ user, token }) => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const bellRef = useRef(null);

  const {
    adminNotifications,
    unreadAdminCount,
    setAdminNotifications,
    setUnreadAdminCount,
  } = useAdminNotificationSocket(token, user?._id, user?.role);

  const fetchNotifications = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const response = await notificationApi.getNotifications(1, 10);

      const fetchedList =
        response?.data?.notifications ||
        response?.notifications ||
        [];

      setAdminNotifications(fetchedList);

      const unread = Array.isArray(fetchedList)
        ? fetchedList.filter((n) => !n.isRead).length
        : 0;

      setUnreadAdminCount(unread);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
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
        className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-colors duration-200 ${showDropdown
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
        <div className="absolute right-0 mt-2 z-50 min-w-[320px] sm:min-w-[380px] bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden origin-top-right">
          <NotificationDropdown
            notifications={adminNotifications}
            loading={loading}
            unreadCount={unreadAdminCount}
            onNotificationClick={(notification) => {
              if (!notification.isRead) {
                handleMarkAsRead(notification._id || notification.id);
              }

              if (notification.actionUrl) {
                const targetUrl = notification.actionUrl.replace(
                  "/admin",
                  "/dashboard"
                );

                navigate(targetUrl);
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default NotificationBell;