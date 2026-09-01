import { useEffect, useRef, useCallback, useState } from "react";
import io from "socket.io-client";
import { SOCKET_URL } from "../../config/constants";

const useNotificationSocket = (token, userId, guestSessionId) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState(null);

  // Heartbeat interval ref
  const heartbeatIntervalRef = useRef(null);

  /**
   * INITIALIZE SOCKET CONNECTION
   */
  useEffect(() => {
    // For authenticated users: need token and userId
    // For guests: need guestSessionId
    if (!token && !guestSessionId) return;
    if (token && !userId) return;

    try {
      // Create socket instance with authentication
      const authPayload = token 
        ? { token } 
        : { guestSessionId }; // Guests auth with guestSessionId instead
      
      const ioSocket = io(SOCKET_URL, {
        auth: authPayload,
        transports: ["websocket", "polling"], // Fallback to polling
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10,
      });

      ioSocket.on("connect", () => {
        setConnected(true);
        setError(null);

        // Start heartbeat
        startHeartbeat(ioSocket);
      });

      ioSocket.on("disconnect", (reason) => {
        setConnected(false);

        // Stop heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }
      });

      ioSocket.on("error", (error) => {
        setError(error);
      });

      ioSocket.on("notification:new", (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });

      ioSocket.on("notification:broadcast", (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });

      ioSocket.on("badge:update", (data) => {
        setUnreadCount(data.unreadCount);
      });

      ioSocket.on("notifications:list", (data) => {
        setNotifications(data.notifications);
      });

      ioSocket.on("subscribed", (data) => {
        // Subscribed to topic
      });

      ioSocket.on("unsubscribed", (data) => {
        // Unsubscribed from topic
      });

      ioSocket.on("notification:read:success", (data) => {
        // Notification marked as read
      });

      ioSocket.on("notification:archive:success", (data) => {
        // Notification archived
      });

      ioSocket.on("heartbeat:ack", (data) => {
        // Heartbeat acknowledged
      });

      setSocket(ioSocket);

      // Cleanup on unmount
      return () => {
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }
        ioSocket.disconnect();
      };
    } catch (err) {
      setError(err.message);
    }
  }, [token, userId, guestSessionId]);

  /**
   * START HEARTBEAT
   * Keep-alive signal every 30 seconds
   */
  const startHeartbeat = useCallback((activeSocket) => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(() => {
      if (activeSocket.connected) {
        activeSocket.emit("heartbeat");
      }
    }, 30000); // Every 30 seconds
  }, []);

  /**
   * SUBSCRIBE TO TOPIC
   */
  const subscribeTopic = useCallback((topic) => {
    if (socket && socket.connected) {
      socket.emit("subscribe:topic", { topic });
    }
  }, [socket]);

  /**
   * UNSUBSCRIBE FROM TOPIC
   */
  const unsubscribeTopic = useCallback((topic) => {
    if (socket && socket.connected) {
      socket.emit("unsubscribe:topic", { topic });
    }
  }, [socket]);

  /**
   * MARK NOTIFICATION AS READ (via socket)
   */
  const markAsReadSocket = useCallback((userNotificationId) => {
    if (socket && socket.connected) {
      socket.emit("notification:read", { userNotificationId });
    }
  }, [socket]);

  /**
   * ARCHIVE NOTIFICATION (via socket)
   */
  const archiveNotificationSocket = useCallback((userNotificationId) => {
    if (socket && socket.connected) {
      socket.emit("notification:archive", { userNotificationId });
    }
  }, [socket]);

  /**
   * REQUEST NOTIFICATIONS SYNC
   */
  const requestNotificationsSync = useCallback((page = 1, limit = 10) => {
    if (socket && socket.connected) {
      socket.emit("request:notifications", { page, limit });
    }
  }, [socket]);

  return {
    connected,
    notifications,
    unreadCount,
    error,
    subscribeTopic,
    unsubscribeTopic,
    markAsReadSocket,
    archiveNotificationSocket,
    requestNotificationsSync,
    socket,
  };
};

export default useNotificationSocket;
