import { SimpleDropzone } from "simple-dropzone";
import normalizeWheel from "normalize-wheel";
import { ResourceLoaderUtils } from "@khronosgroup/gltf-viewer";

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
        } else if (event.button === 1 || event.shiftKey) {
            drag = { kind: "pan" };
        } else if (event.button === 2) {
            drag = { kind: "zoom" };
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
        if (drag.kind === "zoom") {
            onZoom({ deltaZoom: event.movementY });
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

const isGltf = ([path]) => path.endsWith(".glb") || path.endsWith(".gltf");

/**
 * The paths a .gltf instantiates through glTF 2.1 `externalAssets`, resolved against its
 * own folder. A .glb keeps its JSON in a chunk and is not inspected, so a dropped tree
 * rooted at a .glb that references siblings still relies on drop order.
 */
async function externalAssetPaths([path, file]) {
    if (!path.endsWith(".gltf")) {
        return [];
    }
    try {
        const json = JSON.parse(await file.text());
        const folder = ResourceLoaderUtils.getContainingFolder(path);
        return (json.externalAssets ?? [])
            .map((externalAsset) => json.files?.[externalAsset.file]?.uri)
            .filter((uri) => uri !== undefined && !ResourceLoaderUtils.isAbsoluteUrl(uri))
            .map((uri) => ResourceLoaderUtils.cleanRelativePath(folder + uri));
    } catch {
        return [];
    }
}

/**
 * Splits dropped files into a main glTF plus its side files, or an HDR.
 */
export async function partitionDroppedFiles(entries) {
    const files = entries.map(([path, file]) => [path.replaceAll("\\", "/").substring(1), file]);

    const gltfFiles = files.filter(isGltf);
    const referenced = new Set((await Promise.all(gltfFiles.map(externalAssetPaths))).flat());

    // A glTF that another dropped glTF instantiates is a part, not the thing to show.
    const mainFile = gltfFiles.find(([path]) => !referenced.has(path)) ?? gltfFiles[0];
    // Everything else rides along. External assets are themselves .gltf and .glb files,
    // so side files can no longer be identified by not having a glTF extension.
    const additionalFiles = files.filter((entry) => entry !== mainFile);
    const hdrFile = files.find(([path]) => path.endsWith(".hdr"));

    if (mainFile === undefined && hdrFile === undefined) {
        console.warn("Only glTF, glb and hdr files can be loaded on drop.");
    }

    return { mainFile, additionalFiles, hdrFile };
}
