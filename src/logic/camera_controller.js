import { getViewerState } from "./viewer_store.js";
import { isKeyDown, isShiftDown } from "./keyboard.js";

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

// One step of the same critically damped spring, returned as [value, velocity].
function smoothDamp(current, target, velocity, dt) {
    const omega = 2 / SMOOTH_TIME_SECONDS;
    const x = omega * dt;
    const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
    const change = current - target;
    const temp = (velocity + omega * change) * dt;
    return [target + (change + temp) * exp, (velocity - omega * temp) * exp];
}

const CAMERA_MODES = ["orbit", "trackball", "fly"];
const PROJECTIONS = ["perspective", "orthographic"];
// --- minimal quaternion helpers used by the trackball mode ------------------

function quatMultiply(a, b) {
    const [ax, ay, az, aw] = a;
    const [bx, by, bz, bw] = b;
    return [
        aw * bx + ax * bw + ay * bz - az * by,
        aw * by - ax * bz + ay * bw + az * bx,
        aw * bz + ax * by - ay * bx + az * bw,
        aw * bw - ax * bx - ay * by - az * bz
    ];
}

function quatFromAxisAngle(axis, angle) {
    const half = angle / 2;
    const s = Math.sin(half);
    return [axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(half)];
}

function quatNormalize(q) {
    const length = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
    return [q[0] / length, q[1] / length, q[2] / length, q[3] / length];
}

// Row-major 3x3 rotation matrix from a unit quaternion.
function quatToMatrix3(q) {
    const [x, y, z, w] = q;
    return [
        1 - 2 * (y * y + z * z),
        2 * (x * y - z * w),
        2 * (x * z + y * w),
        2 * (x * y + z * w),
        1 - 2 * (x * x + z * z),
        2 * (y * z - x * w),
        2 * (x * z - y * w),
        2 * (y * z + x * w),
        1 - 2 * (x * x + y * y)
    ];
}

// Yaw/pitch that place the camera on an axis looking at the scene centre.
const AXIS_VIEWS = {
    "+X": { yaw: Math.PI / 2, pitch: 0 },
    "-X": { yaw: -Math.PI / 2, pitch: 0 },
    "+Y": { yaw: 0, pitch: -Math.PI / 2 },
    "-Y": { yaw: 0, pitch: Math.PI / 2 },
    "+Z": { yaw: 0, pitch: 0 },
    "-Z": { yaw: Math.PI, pitch: 0 }
};
const MaxPitch = Math.PI / 2 - 0.01;
const DollyFactor = 0.05;
const MaxNearFarRatio = 10000;
// Keyboard speeds, in pixels (rotation/pan) or wheel notches (zoom) per second.
const ROTATE_SPEED = 180;
const ORBIT_PAN_SPEED = 400;
const FLY_MOVE_SPEED = 8;
const ZOOM_SPEED = 6.0;
// Multiplier applied to WASD/QE/+/- keyboard motion while Shift is held.
const SHIFT_SPEED_BOOST = 2.5;
// Widen the far plane in fly mode so flying away from the scene does not clip.
const FLY_FAR_PLANE_SCALE = 10;

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
    const strafeX = createSpringChannel();
    const strafeY = createSpringChannel();
    const zoom = createSpringChannel();
    const isEnabled = () => state.cameraNodeIndex === undefined;
    let lastTime = undefined;
    let mode = getViewerState().cameraMode ?? "orbit";
    let projection = getViewerState().cameraProjection ?? "perspective";
    let trackballQuat = [0, 0, 0, 1];
    let animation = null;

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

    // Strafe the fly camera along its right/up axes, scaled by distance like
    // `dolly` so lateral movement matches forward/back speed. The signs match
    // `camera.pan`: positive x moves left, positive y moves down.
    const flyStrafe = (dX, dY) => {
        const speed = camera.distance * DollyFactor;
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

    // --- trackball (free-roll) orientation ----------------------------------

    const syncTrackball = () => {
        const rotation = camera.getRotation();
        trackballQuat = [rotation[0], rotation[1], rotation[2], rotation[3]];
    };

    const applyTrackball = () => {
        const target = camera.getTarget();
        const distance = camera.distance || 1;
        const m = quatToMatrix3(trackballQuat);
        const forward = [-m[2], -m[5], -m[8]];
        const position = [
            target[0] - forward[0] * distance,
            target[1] - forward[1] * distance,
            target[2] - forward[2] * distance
        ];
        camera.transform[0] = m[0];
        camera.transform[1] = m[3];
        camera.transform[2] = m[6];
        camera.transform[4] = m[1];
        camera.transform[5] = m[4];
        camera.transform[6] = m[7];
        camera.transform[8] = m[2];
        camera.transform[9] = m[5];
        camera.transform[10] = m[8];
        camera.transform[3] = 0;
        camera.transform[7] = 0;
        camera.transform[11] = 0;
        camera.transform[15] = 1;
        camera.transform[12] = position[0];
        camera.transform[13] = position[1];
        camera.transform[14] = position[2];
    };

    const trackballRotate = (dPhi, dTheta) => {
        const speed = camera.orbitSpeed;
        const angleY = -dPhi * speed;
        const angleX = -dTheta * speed;

        const m = quatToMatrix3(trackballQuat);
        const right = [m[0], m[3], m[6]];
        const up = [m[1], m[4], m[7]];

        const qY = quatFromAxisAngle(up, angleY);
        const qX = quatFromAxisAngle(right, angleX);
        trackballQuat = quatNormalize(quatMultiply(quatMultiply(trackballQuat, qY), qX));

        applyTrackball();
    };

    const syncYawPitchFromCamera = () => {
        const [fx, fy, fz] = camera.getLookDirection();
        const pitch = Math.asin(Math.max(-1, Math.min(1, fy)));
        const yaw = Math.atan2(-fx, -fz);
        camera.rotAroundY = yaw;
        camera.rotAroundX = pitch;
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

    // Recompute the near/far planes for a projection, widening the far plane in
    // fly mode so flying away from the scene does not clip it.
    const syncFarPlane = (type) => {
        if (type === "orthographic") {
            applyOrthoPlanes();
            if (mode === "fly") camera.orthographic.zfar *= FLY_FAR_PLANE_SCALE;
        } else {
            camera.fitCameraPlanesToExtents(camera.sceneExtents.min, camera.sceneExtents.max);
            if (mode === "fly") camera.perspective.zfar *= FLY_FAR_PLANE_SCALE;
        }
    };

    // Scale or restore the far planes when entering/leaving fly mode.
    const scaleFarPlanes = (enabled) => {
        const factor = enabled ? FLY_FAR_PLANE_SCALE : 1 / FLY_FAR_PLANE_SCALE;
        camera.perspective.zfar *= factor;
        camera.orthographic.zfar *= factor;
    };

    const sceneCenter = () => {
        const min = camera.sceneExtents.min;
        const max = camera.sceneExtents.max;
        return [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
    };

    // Start a one-shot animation that springs the camera's orbit pose (and,
    // optionally, its yaw/pitch) toward a goal using the same critically damped
    // spring as the input channels.
    const startAnimation = (goal) => {
        animation = {
            yaw: goal.yaw,
            pitch: goal.pitch,
            target: [...goal.target],
            orient: goal.orient,
            yawVel: 0,
            pitchVel: 0,
            targetVel: [0, 0, 0]
        };
    };

    const stepAnimation = (dt) => {
        if (!animation) return false;

        const distance = camera.distance || 1;

        if (animation.orient) {
            const [yaw, yawVel] = smoothDamp(
                camera.rotAroundY,
                animation.yaw,
                animation.yawVel,
                dt
            );
            const [pitch, pitchVel] = smoothDamp(
                camera.rotAroundX,
                animation.pitch,
                animation.pitchVel,
                dt
            );
            animation.yawVel = yawVel;
            animation.pitchVel = pitchVel;
            camera.rotAroundY = yaw;
            camera.rotAroundX = pitch;
            camera.setRotation(yaw, pitch);
        }

        const currentTarget = camera.getTarget();
        const target = [0, 0, 0];
        let targetSettled = true;
        for (let i = 0; i < 3; i++) {
            const [value, velocity] = smoothDamp(
                currentTarget[i],
                animation.target[i],
                animation.targetVel[i],
                dt
            );
            target[i] = value;
            animation.targetVel[i] = velocity;
            if (Math.abs(value - animation.target[i]) >= 1e-4 || Math.abs(velocity) >= 1e-4) {
                targetSettled = false;
            }
        }

        const forward = camera.getLookDirection();
        camera.setPosition([
            target[0] - forward[0] * distance,
            target[1] - forward[1] * distance,
            target[2] - forward[2] * distance
        ]);

        const orientSettled =
            !animation.orient ||
            (Math.abs(camera.rotAroundY - animation.yaw) < 1e-4 &&
                Math.abs(camera.rotAroundX - animation.pitch) < 1e-4 &&
                Math.abs(animation.yawVel) < 1e-4 &&
                Math.abs(animation.pitchVel) < 1e-4);

        if (orientSettled && targetSettled) {
            if (animation.orient) {
                camera.rotAroundY = animation.yaw;
                camera.rotAroundX = animation.pitch;
                camera.setRotation(animation.yaw, animation.pitch);
            }
            const finalForward = camera.getLookDirection();
            camera.setPosition([
                animation.target[0] - finalForward[0] * distance,
                animation.target[1] - finalForward[1] * distance,
                animation.target[2] - finalForward[2] * distance
            ]);
            if (mode === "trackball") syncTrackball();
            animation = null;
            return false;
        }

        return true;
    };

    // Reposition the camera to look at the scene centre from an axis direction,
    // keeping the current zoom distance.
    const lookAtAxis = (axis) => {
        if (!isEnabled()) return;
        const view = AXIS_VIEWS[axis];
        if (!view) return;
        syncYawPitchFromCamera();
        startAnimation({ orient: true, yaw: view.yaw, pitch: view.pitch, target: sceneCenter() });
    };

    // Reapply the active projection (type and near/far planes) after the camera
    // has been reset or fitted, and resync the trackball orientation.
    const syncProjectionState = () => {
        animation = null;
        syncOrthoFromDistance();
        camera.type = projection === "orthographic" ? "orthographic" : "perspective";
        syncFarPlane(projection);
        if (mode === "trackball") syncTrackball();
    };

    // Feed held keys into the spring channels each frame, scaled by dt so
    // keyboard motion is continuous and frame-rate independent.
    const feedKeyboard = (dt) => {
        const boost = isShiftDown() ? SHIFT_SPEED_BOOST : 1;
        const rotateStep = ROTATE_SPEED * dt;
        const orbitPanStep = ORBIT_PAN_SPEED * dt;
        const flyStep = FLY_MOVE_SPEED * dt * boost;
        const zoomStep = ZOOM_SPEED * dt * boost;
        const rotateBoosted = rotateStep * boost;

        if (mode === "fly") {
            // WASD/QE move, arrows look around.
            if (isKeyDown("KeyW")) push(zoom, -flyStep);
            if (isKeyDown("KeyS")) push(zoom, flyStep);
            if (isKeyDown("KeyA")) push(strafeX, flyStep);
            if (isKeyDown("KeyD")) push(strafeX, -flyStep);
            if (isKeyDown("KeyQ")) push(strafeY, flyStep);
            if (isKeyDown("KeyE")) push(strafeY, -flyStep);
            if (isKeyDown("ArrowUp")) push(orbitY, -rotateStep);
            if (isKeyDown("ArrowDown")) push(orbitY, rotateStep);
            if (isKeyDown("ArrowLeft")) push(orbitX, -rotateStep);
            if (isKeyDown("ArrowRight")) push(orbitX, rotateStep);
        } else {
            // Orbit / trackball: WASD rotates, arrows pan.
            if (isKeyDown("KeyW")) push(orbitY, rotateBoosted);
            if (isKeyDown("KeyS")) push(orbitY, -rotateBoosted);
            if (isKeyDown("KeyA")) push(orbitX, rotateBoosted);
            if (isKeyDown("KeyD")) push(orbitX, -rotateBoosted);
            if (isKeyDown("ArrowUp")) push(panY, -orbitPanStep);
            if (isKeyDown("ArrowDown")) push(panY, orbitPanStep);
            if (isKeyDown("ArrowLeft")) push(panX, orbitPanStep);
            if (isKeyDown("ArrowRight")) push(panX, -orbitPanStep);
        }

        const zoomAmount = mode === "fly" ? flyStep : zoomStep;
        if (isKeyDown("Equal") || isKeyDown("NumpadAdd")) push(zoom, -zoomAmount);
        if (isKeyDown("Minus") || isKeyDown("NumpadSubtract")) push(zoom, zoomAmount);
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
            if (!CAMERA_MODES.includes(next) || next === mode) return;
            if (mode === "trackball") {
                // Leaving trackball: reconstruct yaw/pitch so orbit/fly continue
                // from the current view direction (dropping any roll).
                syncYawPitchFromCamera();
                camera.setRotation(camera.rotAroundY, camera.rotAroundX);
            }
            if (mode === "fly") scaleFarPlanes(false);
            if (next === "trackball") {
                syncTrackball();
            }
            if (next === "fly") scaleFarPlanes(true);
            mode = next;
        },
        lookAt: lookAtAxis,
        // Move the camera so the given world position becomes the orbit/look
        // target, keeping the current orientation and distance.
        focusOn: (position) => {
            if (!isEnabled() || !position) return;
            startAnimation({ orient: false, target: position });
        },
        setProjection: (type) => {
            if (!PROJECTIONS.includes(type) || type === projection) return;
            if (type === "orthographic") {
                syncOrthoFromDistance();
                camera.type = "orthographic";
                syncFarPlane("orthographic");
            } else {
                // Convert scale back to distance so the framed content is kept.
                camera.distance = camera.orthographic.ymag / tanHalfYfov();
                camera.setDistanceFromTarget(camera.distance, camera.getTarget());
                camera.type = "perspective";
                syncFarPlane("perspective");
            }
            projection = type;
        },
        // Called after the camera has been fitted to a scene so the orthographic
        // frustum and active projection match the new distance.
        syncProjection: syncProjectionState,
        // Refit the camera to the current scene and restore the default view.
        reset: () => {
            if (!isEnabled()) return;
            camera.resetView(state.gltf, state.sceneIndex);
            syncProjectionState();
        },
        tick: () => {
            const now = performance.now();
            const dt = lastTime === undefined ? 0 : (now - lastTime) / 1000;
            lastTime = now;

            feedKeyboard(dt);

            // A camera animation (focus / look-at) drives the camera and
            // suspends incremental input until it settles.
            if (stepAnimation(dt)) {
                return true;
            }

            const oX = orbitX.step(dt);
            const oY = orbitY.step(dt);
            const pX = panX.step(dt);
            const pY = panY.step(dt);
            const sX = strafeX.step(dt);
            const sY = strafeY.step(dt);
            const z = zoom.step(dt);

            const fly = mode === "fly";
            const trackball = mode === "trackball";
            const ortho = projection === "orthographic";

            if (oX.delta !== 0 || oY.delta !== 0) {
                if (trackball) trackballRotate(oX.delta, oY.delta);
                else if (fly) rotateView(oX.delta, oY.delta);
                else camera.orbit(oX.delta, oY.delta);
            }
            if (fly && (sX.delta !== 0 || sY.delta !== 0)) {
                // Keyboard fly strafe, scaled by distance to match dolly.
                flyStrafe(sX.delta, sY.delta);
            }
            if (pX.delta !== 0 || pY.delta !== 0) {
                // Mouse pan (all modes) and arrow-key pan in orbit/trackball.
                if (!fly && ortho) orthoPan(pX.delta, pY.delta);
                else camera.pan(pX.delta, pY.delta);
            }
            if (z.delta !== 0) {
                if (ortho) orthoZoomBy(z.delta);
                else if (fly) dolly(z.delta);
                else camera.zoomBy(z.delta);
            }

            return [oX, oY, pX, pY, sX, sY, z].some((s) => s.delta !== 0 || !s.settled);
        }
    };
}
