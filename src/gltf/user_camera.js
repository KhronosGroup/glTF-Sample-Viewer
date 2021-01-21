import { vec3 } from 'gl-matrix';
import { gltfCamera } from './camera.js';
import { jsToGl, clamp } from './utils.js';
import { getSceneExtents } from './gltf_utils.js';

const VecZero = vec3.create();
const PanSpeedDenominator = 1200;
const MaxNearFarRatio = 10000;

class UserCamera extends gltfCamera
{
    constructor(
        target = [0, 0, 0],
        yaw = 0,
        pitch = 0,
        zoom = 1)
    {
        super();

        this.target = jsToGl(target);
        this.yaw = yaw;
        this.pitch = pitch;
        this.zoom = zoom;
        this.zoomFactor = 1.04;
        this.orbitSpeed = 1 / 180;
        this.panSpeed = 1;
        this.sceneExtents = {
            min: vec3.create(),
            max: vec3.create()
        };
    }

    getPosition()
    {
        // calculate direction from focus to camera (assuming camera is at positive z)
        // pitch rotates *around* x-axis, yaw rotates *around* y-axis
        const direction = vec3.fromValues(0, 0, this.zoom);
        this.toGlobalOrientation(direction);

        const position = vec3.create();
        vec3.add(position, this.target, direction);
        return position;
    }

    getTarget()
    {
        return this.target;
    }

    lookAt(from, to)
    {
        // up is implicitly (0, 1, 0)
        this.target = to;

        const difference = vec3.create();
        vec3.subtract(difference, from, to);
        const projectedDifference = vec3.fromValues(from[0] - to[0], 0, from[2] - to[2]);

        this.pitch = vec3.angle(difference, projectedDifference);
        this.yaw = vec3.angle(projectedDifference, vec3.fromValues(1.0, 0.0, 0.0));
        this.zoom = vec3.length(difference);
    }

    setPosition(position)
    {
        this.lookAt(position, this.target);
    }

    setTarget(target)
    {
        this.lookAt(target, this.getPosition());
    }

    setRotation(yaw, pitch)
    {
        this.yaw = yaw;
        this.pitch = pitch;
    }

    setZoom(zoom)
    {
        this.zoom = zoom;
    }

    reset(gltf, sceneIndex)
    {
        this.yaw = 0;
        this.pitch = 0;
        this.fitViewToScene(gltf, sceneIndex, true);
    }

    zoomBy(value)
    {
        if (value > 0)
        {
            this.zoom *= this.zoomFactor;
        }
        else
        {
            this.zoom /= this.zoomFactor;
        }
        this.fitCameraPlanesToExtents(this.sceneExtents.min, this.sceneExtents.max);
    }

    orbit(x, y)
    {
        const yMax = Math.PI / 2 - 0.01;
        this.yaw += (x * this.orbitSpeed);
        this.pitch += (y * this.orbitSpeed);
        this.pitch = clamp(this.pitch, -yMax, yMax);
    }

    pan(x, y)
    {
        const left = vec3.fromValues(-1, 0, 0);
        this.toGlobalOrientation(left);
        vec3.scale(left, left, x * this.panSpeed);

        const up = vec3.fromValues(0, 1, 0);
        this.toGlobalOrientation(up);
        vec3.scale(up, up, y * this.panSpeed);

        vec3.add(this.target, this.target, up);
        vec3.add(this.target, this.target, left);
    }

    fitPanSpeedToScene(min, max)
    {
        const longestDistance = vec3.distance(min, max);
        this.panSpeed = longestDistance / PanSpeedDenominator;
    }

    fitViewToScene(gltf, sceneIndex)
    {
        getSceneExtents(gltf, sceneIndex, this.sceneExtents.min, this.sceneExtents.max);
        this.fitCameraTargetToExtents(this.sceneExtents.min, this.sceneExtents.max);
        this.fitZoomToExtents(this.sceneExtents.min, this.sceneExtents.max);

        const direction = vec3.fromValues(0, 0, this.zoom);
        vec3.add(this.getPosition(), this.target, direction);

        this.fitPanSpeedToScene(this.sceneExtents.min, this.sceneExtents.max);
        this.fitCameraPlanesToExtents(this.sceneExtents.min, this.sceneExtents.max);
    }

    // Converts orientation from camera space to global space
    toGlobalOrientation(vector)
    {
        vec3.rotateX(vector, vector, VecZero, -this.pitch);
        vec3.rotateY(vector, vector, VecZero, -this.yaw);
    }

    fitZoomToExtents(min, max)
    {
        const maxAxisLength = Math.max(max[0] - min[0], max[1] - min[1]);
        this.zoom = this.getFittingZoom(maxAxisLength);
    }

    fitCameraTargetToExtents(min, max)
    {
        for (const i of [0, 1, 2])
        {
            this.target[i] = (max[i] + min[i]) / 2;
        }
    }

    fitCameraPlanesToExtents(min, max)
    {
        // depends only on scene min/max and the camera zoom

        // Manually increase scene extent just for the camera planes to avoid camera clipping in most situations.
        const longestDistance = 10 * vec3.distance(min, max);
        let zNear = this.zoom - (longestDistance * 0.6);
        let zFar = this.zoom + (longestDistance * 0.6);

        // minimum near plane value needs to depend on far plane value to avoid z fighting or too large near planes
        zNear = Math.max(zNear, zFar / MaxNearFarRatio);

        this.znear = zNear;
        this.zfar = zFar;
    }

    getFittingZoom(axisLength)
    {
        const yfov = this.yfov;
        const xfov = this.yfov * this.aspectRatio;

        const yZoom = axisLength / 2 / Math.tan(yfov / 2);
        const xZoom = axisLength / 2 / Math.tan(xfov / 2);

        return Math.max(xZoom, yZoom);
    }
}

export { UserCamera };
