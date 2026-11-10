import { SimpleDropzone } from "simple-dropzone";
import normalizeWheel from "normalize-wheel";
import { getViewerState } from "./viewer_store.js";

// Keyboard deltas are expressed in the same units as mouse deltas (pixels for
// orbit/pan, wheel notches for zoom), so the spring smoothing treats both alike.
const KEY_STEP = 10;
const KEY_ZOOM_STEP = 1;

/**
 * Canvas input, translated from the RxJS gesture streams it replaces.
 *
 * The drag gestures were `mousedown -> mousemove.pairwise().takeUntil(mouseup)`,
 * which is just "remember the previous position while a button is held". The
 * mouse and touch paths stay separate because they are not equivalent: touch
 * orbit is doubled, and pinch zoom has no mouse counterpart.
 *
 * Returns a dispose function; every listener it adds is removed again.
 */
export function attachCanvasInput(canvas, handlers) {
    const { onOrbit, onPan, onZoom, onSelect, onHover, onDrop, onDropError } = handlers;
    const cleanups = [];

    const listen = (target, type, handler, options) => {
        target.addEventListener(type, handler, options);
        cleanups.push(() => target.removeEventListener(type, handler, options));
    };

    for (const type of ["mousemove", "mousedown", "mouseup", "dblclick", "click", "mouseout"]) {
        listen(canvas, type, (event) => event.preventDefault());
    }
    for (const type of ["scroll", "wheel"]) {
        listen(canvas, type, (event) => event.preventDefault(), { passive: false });
    }

    // null when no button is held; otherwise the gesture in progress. x and y
    // stay undefined until the first move, because deltas come from consecutive
    // moves rather than from the press position.
    let drag = null;

    listen(canvas, "mousedown", (event) => {
        if (event.button === 0 && !event.shiftKey) {
            drag = { kind: "orbit" };
        } else if (event.button === 1 || event.button === 2 || event.shiftKey) {
            drag = { kind: "pan" };
        }
    });

    const endDrag = () => {
        drag = null;
    };
    listen(document, "mouseup", endDrag);
    listen(document, "mouseleave", endDrag);

    listen(canvas, "mousemove", (event) => {
        onHover({ x: event.pageX, y: event.pageY });

        if (drag === null) {
            return;
        }

        if (drag.x !== undefined) {
            const deltaX = event.pageX - drag.x;
            const deltaY = event.pageY - drag.y;
            if (drag.kind === "orbit") {
                onOrbit({ deltaPhi: deltaX, deltaTheta: deltaY });
            } else {
                onPan({ deltaX, deltaY });
            }
        }
        drag.x = event.pageX;
        drag.y = event.pageY;
    });

    listen(canvas, "mouseout", () => onHover({ x: undefined, y: undefined }));

    listen(canvas, "click", (event) => {
        if (event.button === 0) {
            onSelect({ x: event.pageX, y: event.pageY });
        }
    });

    listen(canvas, "wheel", (event) => onZoom({ deltaZoom: normalizeWheel(event).spinY }));

    // Keyboard navigation. Arrow keys orbit/look, Shift+Arrow pans/strafes and
    // +/- zooms; in fly mode WASD/QE move the camera through the scene.
    listen(window, "keydown", (event) => {
        if (event.ctrlKey || event.metaKey || event.altKey) {
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
        // Keyboard navigation only moves the user camera.
        if (getViewerState().selectedCamera !== -1) {
            return;
        }

        const mode = getViewerState().cameraMode;
        const shift = event.shiftKey;
        const orbit = (x, y) => {
            onOrbit({ deltaPhi: x, deltaTheta: y });
            event.preventDefault();
        };
        const pan = (x, y) => {
            onPan({ deltaX: x, deltaY: y });
            event.preventDefault();
        };
        const zoom = (d) => {
            onZoom({ deltaZoom: d });
            event.preventDefault();
        };

        switch (event.key) {
            case "ArrowLeft":
                shift ? pan(KEY_STEP, 0) : orbit(-KEY_STEP, 0);
                break;
            case "ArrowRight":
                shift ? pan(-KEY_STEP, 0) : orbit(KEY_STEP, 0);
                break;
            case "ArrowUp":
                shift ? pan(0, KEY_STEP) : orbit(0, -KEY_STEP);
                break;
            case "ArrowDown":
                shift ? pan(0, -KEY_STEP) : orbit(0, KEY_STEP);
                break;
            case "+":
            case "=":
                zoom(-KEY_ZOOM_STEP);
                break;
            case "-":
            case "_":
                zoom(KEY_ZOOM_STEP);
                break;
            default:
                if (mode !== "fly") {
                    return;
                }
                switch (event.key.toLowerCase()) {
                    case "w":
                        zoom(-KEY_STEP);
                        break;
                    case "s":
                        zoom(KEY_STEP);
                        break;
                    case "a":
                        pan(KEY_STEP, 0);
                        break;
                    case "d":
                        pan(-KEY_STEP, 0);
                        break;
                    case "q":
                        pan(0, -KEY_STEP);
                        break;
                    case "e":
                        pan(0, KEY_STEP);
                        break;
                    default:
                        return;
                }
                event.preventDefault();
        }
    });

    // Touch: one finger orbits, two pinch to zoom.
    let touch = null;

    const pinchDistance = (event) =>
        Math.hypot(
            event.touches[1].clientX - event.touches[0].clientX,
            event.touches[1].clientY - event.touches[0].clientY
        );

    listen(canvas, "touchstart", (event) => {
        if (event.touches.length === 1) {
            touch = { kind: "orbit" };
        } else if (event.touches.length === 2) {
            touch = { kind: "pinch" };
        }
    });

    // Bound to the document so a finger leaving the canvas keeps the gesture.
    listen(document, "touchmove", (event) => {
        if (touch === null) {
            return;
        }
        if (touch.kind === "orbit" && event.touches.length === 1) {
            const { clientX, clientY } = event.touches[0];
            if (touch.x !== undefined) {
                onOrbit({
                    deltaPhi: 2.0 * (clientX - touch.x),
                    deltaTheta: 2.0 * (clientY - touch.y)
                });
            }
            touch.x = clientX;
            touch.y = clientY;
        } else if (touch.kind === "pinch" && event.touches.length === 2) {
            const distance = pinchDistance(event);
            if (touch.distance !== undefined) {
                onZoom({ deltaZoom: 0.1 * (touch.distance - distance) });
            }
            touch.distance = distance;
        }
    });

    const endTouch = () => {
        touch = null;
    };
    listen(canvas, "touchend", endTouch);
    listen(canvas, "touchcancel", endTouch);

    const dropZone = new SimpleDropzone(canvas, canvas);
    dropZone.on("drop", ({ files }) => onDrop(Array.from(files.entries())));
    dropZone.on("droperror", () => onDropError());

    const blockContextMenu = () => false;
    const previousContextMenu = canvas.oncontextmenu;
    canvas.oncontextmenu = blockContextMenu;
    cleanups.push(() => {
        canvas.oncontextmenu = previousContextMenu;
    });

    return () => {
        for (const cleanup of cleanups.reverse()) {
            cleanup();
        }
    };
}

/**
 * Splits dropped files into a main glTF plus its side files, or an HDR.
 */
export function partitionDroppedFiles(entries) {
    const files = entries.map(([path, file]) => [path.replaceAll("\\", "/").substring(1), file]);

    const mainFile = files.find(([path]) => path.endsWith(".glb") || path.endsWith(".gltf"));
    const additionalFiles = files.filter(
        ([path]) => !path.endsWith(".glb") && !path.endsWith(".gltf")
    );
    const hdrFile = files.find(([path]) => path.endsWith(".hdr"));

    if (mainFile === undefined && hdrFile === undefined) {
        console.warn("Only glTF, glb and hdr files can be loaded on drop.");
    }

    return { mainFile, additionalFiles, hdrFile };
}
