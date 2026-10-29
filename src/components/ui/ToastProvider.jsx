import { useState, useCallback, useEffect } from "react";
import { _registerDispatch } from "../../lib/toast";
import ToastItem from "./ToastItem";

const MAX_TOASTS = 4;
export default function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const dismiss = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    useEffect(() => {
        _registerDispatch((toast) => {
            setToasts((prev) => {
                const trimmed = prev.length >= MAX_TOASTS ? prev.slice(1) : prev;
                return [...trimmed, toast];
            });
        });
        return () => _registerDispatch(null);
    }, []);

    return (
        <>
            {children}
            <div
                aria-label="Notifications"
                className="fixed bottom-4 right-4 z-999999 flex flex-col gap-2 items-end pointer-events-none"
            >
                {toasts.map((t) => (
                    <ToastItem key={t.id} {...t} onDismiss={dismiss} />
                ))}
            </div>
        </>
    );
}
