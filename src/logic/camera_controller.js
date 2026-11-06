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
const PROJECTIONS = ["perspective", "orthographic"];
const MaxPitch = Math.PI / 2 - 0.01;
const DollyFactor = 0.05;
const MaxNearFarRatio = 10000;

/**
 * Owns the user camera's motion, mode and projection: smooths discrete input
 * deltas and applies them to the camera each frame, either orbiting around a
 * target or flying freely through the scene, with a perspective or orthographic
 * frustum. Kept out of `main.js` so the render loop only has to call `tick()`
 * and forward raw input deltas.
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
    let projection = getViewerState().cameraProjection ?? "perspective";

    const getAspectRatio = () => camera.perspective.aspectRatio ?? 1;
    const tanHalfYfov = () => Math.tan(camera.perspective.yfov / 2);

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

    // Zoom the orthographic frustum by scaling xmag/ymag, mirroring `zoomBy`'s
    // exponential behaviour so the same zoom level is preserved when toggling.
    const orthoZoomBy = (delta) => {
        const baseYmag = camera.baseDistance * tanHalfYfov();
        let zoomLevel = Math.pow(camera.orthographic.ymag / baseYmag, 1 / camera.zoomExponent);
        zoomLevel += camera.zoomFactor * delta;
        zoomLevel = Math.max(zoomLevel, 0.0001);
        camera.orthographic.ymag = Math.pow(zoomLevel, camera.zoomExponent) * baseYmag;
        camera.orthographic.xmag = camera.orthographic.ymag * getAspectRatio();
    };

    // Pan in orthographic mode, scaling the translation by the current zoom so
    // the scene stays under the cursor regardless of magnification.
    const orthoPan = (dX, dY) => {
        const ratio = camera.orthographic.ymag / (camera.baseDistance * tanHalfYfov());
        const speed = camera.panSpeed * ratio;
        const right = [camera.transform[0], camera.transform[1], camera.transform[2]];
        const up = [camera.transform[4], camera.transform[5], camera.transform[6]];
        const rightLength = Math.hypot(right[0], right[1], right[2]) || 1;
        const upLength = Math.hypot(up[0], up[1], up[2]) || 1;
        const position = camera.getPosition();
        position[0] += (-dX * speed * right[0]) / rightLength + (-dY * speed * up[0]) / upLength;
        position[1] += (-dX * speed * right[1]) / rightLength + (-dY * speed * up[1]) / upLength;
        position[2] += (-dX * speed * right[2]) / rightLength + (-dY * speed * up[2]) / upLength;
        camera.setPosition(position);
    };

    // Fit the orthographic near/far planes around the scene, mirroring
    // `fitCameraPlanesToExtents` which only writes to the perspective planes.
    const applyOrthoPlanes = () => {
        const min = camera.sceneExtents.min;
        const max = camera.sceneExtents.max;
        const longest = 10 * Math.hypot(max[0] - min[0], max[1] - min[1], max[2] - min[2]);
        let zNear = camera.distance - longest * 0.6;
        let zFar = camera.distance + longest * 0.6;
        zNear = Math.max(zNear, zFar / MaxNearFarRatio);
        if (!Number.isFinite(zNear) || zNear <= 0) zNear = 0.001;
        if (!Number.isFinite(zFar) || zFar <= zNear) zFar = zNear + 1;
        camera.orthographic.znear = zNear;
        camera.orthographic.zfar = zFar;
    };

    // Derive the orthographic frustum from the current distance so both
    // projections frame the same content.
    const syncOrthoFromDistance = () => {
        camera.orthographic.ymag = camera.distance * tanHalfYfov();
        camera.orthographic.xmag = camera.orthographic.ymag * getAspectRatio();
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
        setProjection: (type) => {
            if (!PROJECTIONS.includes(type) || type === projection) return;
            if (type === "orthographic") {
                syncOrthoFromDistance();
                camera.type = "orthographic";
                applyOrthoPlanes();
            } else {
                // Convert scale back to distance so the framed content is kept.
                camera.distance = camera.orthographic.ymag / tanHalfYfov();
                camera.setDistanceFromTarget(camera.distance, camera.getTarget());
                camera.type = "perspective";
                camera.fitCameraPlanesToExtents(camera.sceneExtents.min, camera.sceneExtents.max);
            }
            projection = type;
        },
        // Called after the camera has been fitted to a scene so the orthographic
        // frustum and active projection match the new distance.
        syncProjection: () => {
            syncOrthoFromDistance();
            if (projection === "orthographic") {
                camera.type = "orthographic";
                applyOrthoPlanes();
            } else {
                camera.type = "perspective";
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

            const fly = mode === "fly";
            const ortho = projection === "orthographic";

            if (oX.delta !== 0 || oY.delta !== 0) {
                if (fly) rotateView(oX.delta, oY.delta);
                else camera.orbit(oX.delta, oY.delta);
            }
            if (pX.delta !== 0 || pY.delta !== 0) {
                if (ortho && !fly) orthoPan(pX.delta, pY.delta);
                else camera.pan(pX.delta, pY.delta);
            }
            if (z.delta !== 0) {
                if (ortho) orthoZoomBy(z.delta);
                else if (fly) dolly(z.delta);
                else camera.zoomBy(z.delta);
            }

            return [oX, oY, pX, pY, z].some((s) => s.delta !== 0 || !s.settled);
        }
    };
}
