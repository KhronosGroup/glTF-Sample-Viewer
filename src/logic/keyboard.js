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

const SHIFT_CODES = new Set(["ShiftLeft", "ShiftRight"]);

const heldKeys = new Set();
let shiftDown = false;

export function isKeyDown(code) {
    return heldKeys.has(code);
}

export function isShiftDown() {
    return shiftDown;
}

/**
 * Tracks held navigation keys so the render loop can feed continuous per-frame
 * motion instead of relying on browser key auto-repeat. Keydown is bound to the
 * window and consumes navigation keys regardless of which element has focus,
 * except when typing in a form field. Keyup is bound to the document and blur
 * to the window so releases are always caught.
 */
export function attachKeyboard() {
    const down = (event) => {
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        if (SHIFT_CODES.has(event.code)) {
            shiftDown = true;
            return;
        }
        const target = event.target;
        if (
            target?.isContentEditable ||
            target?.tagName === "INPUT" ||
            target?.tagName === "TEXTAREA" ||
            target?.tagName === "SELECT"
        ) {
            return;
        }
        if (!NAV_KEYS.has(event.code)) return;
        if (getViewerState().selection.selectedCamera !== -1) return;
        heldKeys.add(event.code);
        event.preventDefault();
        event.stopPropagation();
    };

    const up = (event) => {
        if (SHIFT_CODES.has(event.code)) shiftDown = false;
        heldKeys.delete(event.code);
    };
    const clear = () => {
        heldKeys.clear();
        shiftDown = false;
    };

    window.addEventListener("keydown", down);
    document.addEventListener("keyup", up);
    window.addEventListener("blur", clear);

    return () => {
        window.removeEventListener("keydown", down);
        document.removeEventListener("keyup", up);
        window.removeEventListener("blur", clear);
    };
}
