import { useEffect, useState } from "react";
import { setNotificationSink } from "../logic/notifications.js";

let nextId = 0;

const DURATIONS = {
    "is-danger": 5000,
    "is-warning": 3000
};

/**
 * Replaces Buefy's programmatic toast API. Messages arrive from the logic layer
 * through the notification sink, so they can be raised without a component
 * reference.
 */
export function Toasts() {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        setNotificationSink((message, type) => {
            const id = nextId++;
            setToasts((current) => [...current, { id, message, type }]);
            setTimeout(
                () => setToasts((current) => current.filter((toast) => toast.id !== id)),
                DURATIONS[type] ?? 2000
            );
        });
        return () => setNotificationSink(null);
    }, []);

    if (toasts.length === 0) {
        return null;
    }

    return (
        <div className="toast-notices is-top">
            {toasts.map((toast) => (
                <div key={toast.id} className={`toast ${toast.type} is-top`} role="alert">
                    <div>{toast.message}</div>
                </div>
            ))}
        </div>
    );
}

export function LoadingOverlay({ active }) {
    if (!active) {
        return null;
    }
    return (
        <div className="loading-overlay is-active">
            <div className="loading-background" />
            <div className="loading-icon" />
        </div>
    );
}
