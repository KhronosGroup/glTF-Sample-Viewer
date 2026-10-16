import { useEffect, useRef, useState } from "react";
import { initViewer } from "../main.js";

// The viewer owns a WebGL context, a physics engine and a render loop, none of
// which can meaningfully exist twice on one canvas. StrictMode mounts effects
// twice, so a restart has to wait for the previous teardown to finish rather
// than racing it.
let teardownChain = Promise.resolve();

// Dev-only bookkeeping so a test can force a remount and see that teardown ran.
// import.meta.env.DEV is replaced statically, so none of this is bundled for
// production.
const stats = { starts: 0, stops: 0 };

function publishStats() {
    if (import.meta.env.DEV) {
        window.__viewerStats = { ...stats, live: stats.starts - stats.stops };
    }
}

function startViewer(canvas) {
    let cancelled = false;
    let dispose = null;

    const started = teardownChain.then(async () => {
        if (cancelled) {
            return;
        }
        dispose = await initViewer(canvas);
        stats.starts += 1;
        publishStats();
    });

    teardownChain = started.catch((error) => console.error(error));

    return () => {
        cancelled = true;
        teardownChain = started
            .then(() => {
                if (dispose === null) {
                    return;
                }
                dispose();
                dispose = null;
                stats.stops += 1;
                publishStats();
            })
            .catch((error) => console.error(error));
    };
}

function ViewerCanvas() {
    const canvasRef = useRef(null);

    useEffect(() => startViewer(canvasRef.current), []);

    return (
        <canvas id="canvas" ref={canvasRef}>
            No Canvas!
        </canvas>
    );
}

export function Viewer() {
    // Remounting the canvas is the only way to exercise teardown, and nothing
    // in the app does it, so tests get a dev-only handle for it.
    const [generation, setGeneration] = useState(0);

    useEffect(() => {
        if (!import.meta.env.DEV) {
            return;
        }
        window.__remountViewer = () => setGeneration((current) => current + 1);
        publishStats();
        return () => delete window.__remountViewer;
    }, []);

    return <ViewerCanvas key={generation} />;
}
