import { useEffect, useState } from "react";
import { setNotificationSink } from "../logic/notifications.js";

let nextId = 0;

const DURATIONS = {
    error: 5000,
    warning: 3000
};

const TONES = {
    error: "bg-red-600",
    warning: "bg-amber-500",
    success: "bg-accent",
    info: "bg-sky-600"
};

/**
 * Messages arrive from the logic layer through the notification sink, so they
 * can be raised without a component reference.
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
        <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    role="alert"
                    className={`max-w-lg rounded px-4 py-2 text-white shadow-lg ${
                        TONES[toast.type] ?? TONES["info"]
                    }`}
                >
                    {toast.message}
                </div>
            ))}
        </div>
    );
}

export function LoadingOverlay({ active }) {
    const [mounted, setMounted] = useState(active);

    if (active && !mounted) {
        setMounted(true);
    }

    if (!mounted) {
        return null;
    }

    // Unmounts only once the fade has run, so "overlay gone" still means the
    // element is detached rather than merely transparent.
    return (
        <div
            className={`loading-overlay fixed inset-0 z-40 flex items-center justify-center bg-black/40 transition-opacity duration-300 ${
                active ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            onTransitionEnd={() => {
                if (!active) {
                    setMounted(false);
                }
            }}
        >
            <div className="spinner" />
        </div>
    );
}
