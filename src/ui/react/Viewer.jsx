import { useEffect, useRef } from "react";
import { initViewer } from "../../main.js";

// The viewer owns a WebGL context, a physics engine and a render loop, none of
// which can meaningfully exist twice on one canvas. StrictMode mounts effects
// twice, so a restart has to wait for the previous teardown to finish rather
// than racing it.
let teardownChain = Promise.resolve();

function startViewer(canvas) {
    let cancelled = false;
    let dispose = null;

    const started = teardownChain.then(async () => {
        if (cancelled) {
            return;
        }
        dispose = await initViewer(canvas);
    });

    teardownChain = started.catch((error) => console.error(error));

    return () => {
        cancelled = true;
        teardownChain = started
            .then(() => dispose?.())
            .catch((error) => console.error(error))
            .then(() => {
                dispose = null;
            });
    };
}

export function Viewer() {
    const canvasRef = useRef(null);

    useEffect(() => startViewer(canvasRef.current), []);

    return (
        <canvas id="canvas" ref={canvasRef}>
            No Canvas!
        </canvas>
    );
}
