import { notify } from "./notifications.js";

/**
 * Pipes console warnings/errors into the toast UI.
 *
 * Patching `console` makes this file the call site DevTools reports, so the
 * originating frame is recovered from a captured stack and attached to the
 * message. To get clickable links back in DevTools, add this file to the
 * browser's ignore list (Chrome: right click the location link > "Add script
 * to ignore list"); DevTools then blames the first frame outside of it.
 */

const BRIDGE_MARKER = "console_bridge";
const FRAME_LOCATION = /((?:[a-z][a-z0-9+.-]*:\/\/|\/)[^\s()]+?):(\d+):(\d+)/i;

let installed = false;
let forwarding = false;

function describe(value) {
    if (typeof value === "string") {
        return value;
    }
    if (value instanceof Error) {
        return value.stack ?? `${value.name}: ${value.message}`;
    }
    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
}

function originOf(stack) {
    const frame = (stack ?? "")
        .split("\n")
        .filter((line) => FRAME_LOCATION.test(line))
        .find((line) => !line.includes(BRIDGE_MARKER));
    if (frame === undefined) {
        return null;
    }
    const [, url, line, column] = frame.match(FRAME_LOCATION);
    const file = url.split("?")[0].split("/").slice(-2).join("/");
    return `${file}:${line}:${column}`;
}

function patch(level, type) {
    const original = console[level].bind(console);
    console[level] = function (...args) {
        original(...args);

        // a failing sink must not re-enter through console.error
        if (forwarding) {
            return;
        }
        forwarding = true;
        try {
            const origin = originOf(new Error().stack);
            const message = args.map(describe).join(" ");
            notify(origin === null ? message : `${message} (${origin})`, type);
        } catch {
            original("Failed to forward message to the notification UI");
        } finally {
            forwarding = false;
        }
    };
}

export function installConsoleBridge() {
    if (installed) {
        return;
    }
    installed = true;

    patch("warn", "warning");
    patch("error", "error");

    window.addEventListener("error", (event) => {
        // errors without a source are not ours (e.g. cross-origin scripts)
        if (!event.filename) {
            return;
        }
        notify(
            `${event.message} (${event.filename.split("/").slice(-2).join("/")}:${event.lineno}:${event.colno})`,
            "error"
        );
    });

    window.addEventListener("unhandledrejection", (event) => {
        notify(`Unhandled rejection: ${describe(event.reason)}`, "error");
    });
}
