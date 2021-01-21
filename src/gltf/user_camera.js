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
        xRot = 0,
        yRot = 0,
        zoom = 1)
    {
        super();

        this.target = jsToGl(target);
        this.xRot = xRot;
        this.yRot = yRot;
        this.zoom = zoom;
        this.zoomFactor = 1.04;
        this.rotateSpeed = 1 / 180;
        this.panSpeed = 1;
        this.sceneExtents = {
            min: vec3.create(),
            max: vec3.create()
        };
    }

    getPosition()
    {
        // calculate direction from focus to camera (assuming camera is at positive z)
        // yRot rotates *around* x-axis, xRot rotates *around* y-axis
        const direction = vec3.fromValues(0, 0, this.zoom);
        this.toLocalRotation(direction);

        const position = vec3.create();
        vec3.add(position, this.target, direction);
        return position;
    }

    lookAt(from, to)
    {
        // up is implicitly (0, 1, 0)
        this.target = to;

        const difference = vec3.create();
        vec3.subtract(difference, from, to);
        const projectedDifference = vec3.fromValues(from[0] - to[0], 0, from[2] - to[2]);

        this.yRot = vec3.angle(difference, projectedDifference);
        this.xRot = vec3.angle(projectedDifference, vec3.fromValues(1.0, 0.0, 0.0));
        this.zoom = vec3.length(difference);
    }

    setRotation(yaw, pitch)
    {
        // Rotates target instead of position

        const difference = vec3.create();
        vec3.subtract(difference, this.target, this.position);

        vec3.rotateY(difference, difference, VecZero, -yaw * this.rotateSpeed);
        vec3.rotateX(difference, difference, VecZero, -pitch * this.rotateSpeed);

        vec3.add(this.target, this.position, difference);
    }

    reset(gltf, sceneIndex)
    {
        this.xRot = 0;
        this.yRot = 0;
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
        this.xRot += (x * this.rotateSpeed);
        this.yRot += (y * this.rotateSpeed);
        this.yRot = clamp(this.yRot, -yMax, yMax);

        // const difference = vec3.create();
        // vec3.subtract(difference, this.position, this.target);

        // vec3.rotateY(difference, difference, VecZero, -x * this.rotateSpeed);
        // vec3.rotateX(difference, difference, VecZero, -y * this.rotateSpeed);

        // vec3.add(this.position, this.target, difference);
    }

    pan(x, y)
    {
        const left = vec3.fromValues(-1, 0, 0);
        this.toLocalRotation(left);
        vec3.scale(left, left, x * this.panSpeed);

        const up = vec3.fromValues(0, 1, 0);
        this.toLocalRotation(up);
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

    toLocalRotation(vector)
    {
        vec3.rotateX(vector, vector, VecZero, -this.yRot);
        vec3.rotateY(vector, vector, VecZero, -this.xRot);
    }

    getLookAtTarget()
    {
        return this.target;
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
