import { getViewerState } from "./viewer_store.js";

// Roughly how long the camera takes to reach its target after an input delta,
// in seconds. Smaller values feel snappier, larger values feel weightier.
const SMOOTH_TIME_SECONDS = 0.06;

// Turns discrete drag/scroll deltas into smooth, frame-rate independent camera
// motion using a critically damped spring (the "SmoothDamp" method). Input
// deltas are accumulated into a target; each frame the applied value is sprung
// towards that target, so the camera responds immediately and settles without
// overshooting or depending on the frame rate.
function createSpringChannel() {
    const omega = 2 / SMOOTH_TIME_SECONDS;
    let target = 0;
    let value = 0;
    let velocity = 0;
    let applied = 0;

    return {
        // Accumulate raw input into the channel's target.
        add(delta) {
            target += delta;
        },
        // Advance the spring by dt seconds and report the motion to apply to
        // the camera this frame plus whether it is still settling.
        step(dt) {
            const x = omega * dt;
            // Stable approximation of exp(-x), valid for any non-negative x.
            const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
            const change = value - target;
            const temp = (velocity + omega * change) * dt;
            velocity = (velocity - omega * temp) * exp;
            value = target + (change + temp) * exp;

            const delta = value - applied;
            applied = value;

            const settled = Math.abs(value - target) < 1e-4 && Math.abs(velocity) < 1e-4;
            if (settled) {
                // Snap the asymptotic tail so the render loop can stop once the
                // remaining motion is below a pixel and invisible.
                value = target;
                velocity = 0;
            }

            return { delta, settled };
        }
    };
}

const CAMERA_MODES = ["orbit", "fly"];
const MaxPitch = Math.PI / 2 - 0.01;
const DollyFactor = 0.05;

/**
 * Owns the user camera's motion and mode: smooths discrete input deltas and
 * applies them to the camera each frame, either orbiting around a target or
 * flying freely through the scene. Kept out of `main.js` so the render loop
 * only has to call `tick()` and forward raw input deltas.
 *
 * @param {import("@khronosgroup/gltf-viewer").GltfState} state
 */
export function createCameraController(state) {
    const camera = state.userCamera;

    const orbitX = createSpringChannel();
    const orbitY = createSpringChannel();
    const panX = createSpringChannel();
    const panY = createSpringChannel();
    const zoom = createSpringChannel();
    const isEnabled = () => state.cameraNodeIndex === undefined;
    let lastTime = undefined;
    let mode = getViewerState().cameraMode ?? "orbit";

    const push = (channel, delta) => {
        if (!isEnabled()) return;
        channel.add(delta);
    };

    // Rotate the fly camera in place around its own position (yaw, then pitch).
    const rotateView = (dPhi, dTheta) => {
        camera.rotAroundY += -dPhi * camera.orbitSpeed;
        camera.rotAroundX += -dTheta * camera.orbitSpeed;
        camera.rotAroundX = Math.max(-MaxPitch, Math.min(MaxPitch, camera.rotAroundX));
        camera.setRotation(camera.rotAroundY, camera.rotAroundX);
    };

    // Move the fly camera along its look direction. A positive delta moves
    // backwards, matching the orbit camera's zoom-out direction.
    const dolly = (delta) => {
        const direction = camera.getLookDirection();
        const step = delta * camera.distance * DollyFactor;
        const position = camera.getPosition();
        position[0] -= direction[0] * step;
        position[1] -= direction[1] * step;
        position[2] -= direction[2] * step;
        camera.setPosition(position);
    };

    return {
        pushOrbit: (dPhi, dTheta) => {
            push(orbitX, dPhi);
            push(orbitY, dTheta);
        },
        pushPan: (dX, dY) => {
            push(panX, dX);
            push(panY, dY);
        },
        pushZoom: (dZoom) => push(zoom, dZoom),
        setMode: (next) => {
            if (CAMERA_MODES.includes(next)) {
                mode = next;
            }
        },
        tick: () => {
            const now = performance.now();
            const dt = lastTime === undefined ? 0 : (now - lastTime) / 1000;
            lastTime = now;

            const oX = orbitX.step(dt);
            const oY = orbitY.step(dt);
            const pX = panX.step(dt);
            const pY = panY.step(dt);
            const z = zoom.step(dt);

            if (mode === "fly") {
                if (oX.delta !== 0 || oY.delta !== 0) rotateView(oX.delta, oY.delta);
                if (pX.delta !== 0 || pY.delta !== 0) camera.pan(pX.delta, pY.delta);
                if (z.delta !== 0) dolly(z.delta);
            } else {
                if (oX.delta !== 0 || oY.delta !== 0) camera.orbit(oX.delta, oY.delta);
                if (pX.delta !== 0 || pY.delta !== 0) camera.pan(pX.delta, pY.delta);
                if (z.delta !== 0) camera.zoomBy(z.delta);
            }

            return [oX, oY, pX, pY, z].some((s) => s.delta !== 0 || !s.settled);
        }
    };
}
