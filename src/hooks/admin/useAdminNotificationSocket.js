import { useState, useEffect } from "react";
import io from "socket.io-client";
import notificationApi from "../../api/notificationApi";
import { SOCKET_URL } from "../../config/constants";

const useAdminNotificationSocket = (token, userId, role) => {
    const [socket, setSocket] = useState(null);
    const [adminNotifications, setAdminNotifications] = useState([]);
    const [unreadAdminCount, setUnreadAdminCount] = useState(0);
    const [connected, setConnected] = useState(false);

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
            const newItems = (Array.isArray(data) ? data : [data]).filter(Boolean);
            setUnreadAdminCount(prev => prev + newItems.filter(item => !item.isRead).length);
            setAdminNotifications(prev => [...newItems, ...prev]);
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
        setUnreadAdminCount
    };
};

export default useAdminNotificationSocket;
