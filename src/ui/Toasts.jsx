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

/** Drains left to right over the toast's lifetime, so its exit is not a surprise. */
function Progress({ duration }) {
    const [drained, setDrained] = useState(false);

    // The transition needs a painted full width to animate away from.
    useEffect(() => {
        const frame = requestAnimationFrame(() => setDrained(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    return (
        <div
            className="h-1 bg-black/25"
            style={{ width: drained ? "100%" : "0%", transition: `width ${duration}ms linear` }}
        />
    );
}

/**
 * Messages arrive from the logic layer through the notification sink, so they
 * can be raised without a component reference.
 */
export function Toasts() {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        setNotificationSink((message, type) => {
            const id = nextId++;
            const duration = DURATIONS[type] ?? 2000;
            setToasts((current) => [...current, { id, message, type, duration }]);
            setTimeout(
                () => setToasts((current) => current.filter((toast) => toast.id !== id)),
                duration
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
                    className={`max-w-lg overflow-hidden rounded text-white shadow-lg ${
                        TONES[toast.type] ?? TONES["info"]
                    }`}
                >
                    <p className="px-4 py-2">{toast.message}</p>
                    <Progress duration={toast.duration} />
                </div>
            ))}
        </div>
    );
}
