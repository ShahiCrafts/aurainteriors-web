import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import notificationApi from "../../api/notificationApi";
import { SOCKET_URL } from "../../config/constants";

const useAdminNotificationSocket = (token, userId, role) => {
  const [socket, setSocket] = useState(null);
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [unreadAdminCount, setUnreadAdminCount] = useState(0);
  const [connected, setConnected] = useState(false);
  // FE-24: ids already delivered over the socket. A replayed or
  // re-emitted notification (e.g. across a reconnect) must not
  // duplicate the list entry or inflate the unread badge.
  const seenSocketIdsRef = useRef(new Set());

  useEffect(() => {
    setSocket(null);
    setConnected(false);
    setAdminNotifications([]);
    setUnreadAdminCount(0);
    if (!token || !userId || role !== "admin") return;

    const socketInstance = io(SOCKET_URL, {
      auth: { ...(token !== "cookie" ? { token } : {}) },
      transports: ["websocket"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on("connect", () => {
      setConnected(true);
    });

    socketInstance.on("disconnect", () => {
      setConnected(false);
    });

    socketInstance.on("connect_error", (err) => {
      console.error("Socket Error:", err);
      setConnected(false);
    });

    socketInstance.on("admin:notification:new", (data) => {
      const incoming = (Array.isArray(data) ? data : [data]).filter(Boolean);
      const newItems = incoming.filter((item) => {
        const id = item?._id ?? item?.id;
        if (id == null) return true;
        if (seenSocketIdsRef.current.has(id)) return false;
        seenSocketIdsRef.current.add(id);
        return true;
      });
      if (newItems.length === 0) return;
      setUnreadAdminCount(
        (prev) => prev + newItems.filter((item) => !item.isRead).length,
      );
      setAdminNotifications((prev) => [...newItems, ...prev]);
    });

    setSocket(socketInstance);

    return () => {
      if (socketInstance) {
        socketInstance.removeAllListeners();
        socketInstance.disconnect();
      }
    };
  }, [token, userId, role]);

  return {
    socket,
    connected,
    adminNotifications,
    unreadAdminCount,
    setAdminNotifications,
    setUnreadAdminCount,
  };
};

export default useAdminNotificationSocket;
