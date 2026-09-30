/**
 * Lets the loading/rendering layer surface messages without knowing which UI
 * framework is mounted. The UI registers a sink; until it does, messages are
 * dropped rather than queued, since they are all transient toasts.
 */
let sink = null;

export function setNotificationSink(handler) {
    sink = handler;
}

export function notify(message, type = "is-info") {
    sink?.(message, type);
}
