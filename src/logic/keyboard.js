import { getViewerState } from "./viewer_store.js";

// Codes of the keys that drive camera navigation. `event.code` is used so the
// mapping follows physical key positions (WASD) regardless of keyboard layout.
const NAV_KEYS = new Set([
    "KeyW",
    "KeyA",
    "KeyS",
    "KeyD",
    "KeyQ",
    "KeyE",
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "Equal",
    "Minus",
    "NumpadAdd",
    "NumpadSubtract"
]);

const heldKeys = new Set();

export function isKeyDown(code) {
    return heldKeys.has(code);
}

/**
 * Tracks held navigation keys so the render loop can feed continuous per-frame
 * motion instead of relying on browser key auto-repeat. Keydown is bound to the
 * canvas so the viewer consumes those events while the canvas has focus; keyup
 * is bound to the document and blur to the window so releases are always
 * caught.
 */
export function attachKeyboard(canvas) {
    const down = (event) => {
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        if (!NAV_KEYS.has(event.code)) return;
        if (getViewerState().selectedCamera !== -1) return;
        heldKeys.add(event.code);
        event.preventDefault();
        event.stopPropagation();
    };

    const up = (event) => heldKeys.delete(event.code);
    const clear = () => heldKeys.clear();

    canvas.addEventListener("keydown", down);
    document.addEventListener("keyup", up);
    window.addEventListener("blur", clear);

    return () => {
        canvas.removeEventListener("keydown", down);
        document.removeEventListener("keyup", up);
        window.removeEventListener("blur", clear);
    };
}
