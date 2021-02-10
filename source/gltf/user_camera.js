import { vec3, mat4, quat } from 'gl-matrix';
import { gltfCamera } from './camera.js';
import { clamp } from './utils.js';
import { getSceneExtents } from './gltf_utils.js';


const PanSpeedDenominator = 1200;
const MaxNearFarRatio = 10000;

class UserCamera extends gltfCamera
{
    constructor()
    {
        super();

        this.transform = mat4.create();
        this.rotAroundY = 0;
        this.rotAroundX = 0;
        this.distance = 1;
        this.zoomFactor = 1.04;
        this.orbitSpeed = 1 / 180;
        this.panSpeed = 1;
        this.sceneExtents = {
            min: vec3.create(),
            max: vec3.create()
        };
    }

    setVerticalFoV(yfov)
    {
        this.yfov = yfov;
    }

    getPosition()
    {
        let pos = vec3.create();
        mat4.getTranslation(pos, this.transform);
        return pos;
    }

    getRotation()
    {
        let rot = quat.create();
        mat4.getRotation(rot, this.transform);
        return rot;
    }

    getLookDirection()
    {
        let dir = [-this.transform[8], -this.transform[9], -this.transform[10]];
        vec3.normalize(dir, dir);
        return dir;
    }

    getTarget()
    {
        const target = vec3.create();
        const position = this.getPosition();
        let lookDirection = this.getLookDirection();
        if (this.distance != 0 && this.distance != 1)
        {
            lookDirection = lookDirection.map(x => x * this.distance);
        }
        vec3.add(target, lookDirection, position);
        return target;
    }

    lookAt(from, to)
    {
        this.transform = mat4.create();
        mat4.lookAt(this.transform, from, to, vec3.fromValues(0, 1, 0));
    }

    setPosition(position)
    {
        this.transform[12] = position[0];
        this.transform[13] = position[1];
        this.transform[14] = position[2];
    }

    setTarget(target)
    {
        let pos = vec3.create();
        mat4.getTranslation(pos, this.transform);
        this.transform = mat4.create();
        mat4.lookAt(this.transform, pos, target, vec3.fromValues(0, 1, 0));
        this.setDistanceFromTarget(this.distance, target);
    }

    setRotation(yaw, pitch)
    {
        const tmpPos = this.getPosition();
        let mat4x = mat4.create();
        let mat4y = mat4.create();
        mat4.fromXRotation(mat4x, pitch);
        mat4.fromYRotation(mat4y, yaw);
        this.transform = mat4y;
        this.setPosition(tmpPos);
        mat4.multiply(this.transform, this.transform, mat4x);
    }

    setDistanceFromTarget(distance, target)
    {
        const lookDirection = this.getLookDirection();
        const distVec = lookDirection.map(x => x * -distance);
        let pos = vec3.create();
        vec3.add(pos, target, distVec);
        this.setPosition(pos);
        this.distance = distance;

    }

    zoomBy(value)
    {
        let target = this.getTarget();
        if (value > 0)
        {
            this.distance *= this.zoomFactor;
        }
        else
        {
            this.distance /= this.zoomFactor;
        }
        this.setDistanceFromTarget(this.distance, target);
        this.fitCameraPlanesToExtents(this.sceneExtents.min, this.sceneExtents.max);
    }

    orbit(x, y)
    {
        const target = this.getTarget();
        const rotAroundXMax = Math.PI / 2 - 0.01;
        this.rotAroundY += (-x * this.orbitSpeed);
        this.rotAroundX += (-y * this.orbitSpeed);
        this.rotAroundX = clamp(this.rotAroundX, -rotAroundXMax, rotAroundXMax);
        this.setRotation(this.rotAroundY, this.rotAroundX);
        this.setDistanceFromTarget(this.distance, target);
    }

    pan(x, y)
    {
        const left = vec3.fromValues(-this.transform[0], -this.transform[1], -this.transform[2]);
        vec3.scale(left, left, x * this.panSpeed);

        const up = vec3.fromValues(this.transform[4], this.transform[5], this.transform[6]);
        vec3.scale(up, up, y * this.panSpeed);

        let pos = this.getPosition();

        vec3.add(pos, pos, up);
        vec3.add(pos, pos, left);

        this.setPosition(pos);
    }

    fitPanSpeedToScene(min, max)
    {
        const longestDistance = vec3.distance(min, max);
        this.panSpeed = longestDistance / PanSpeedDenominator;
    }

    reset()
    {
        this.transform = mat4.create();
        this.rotAroundX = 0;
        this.rotAroundY = 0;
        this.fitDistanceToExtents(this.sceneExtents.min, this.sceneExtents.max);
        this.fitCameraTargetToExtents(this.sceneExtents.min, this.sceneExtents.max);
    }

    fitViewToScene(gltf, sceneIndex)
    {
        this.transform = mat4.create();
        this.rotAroundX = 0;
        this.rotAroundY = 0;
        getSceneExtents(gltf, sceneIndex, this.sceneExtents.min, this.sceneExtents.max);
        this.fitDistanceToExtents(this.sceneExtents.min, this.sceneExtents.max);
        this.fitCameraTargetToExtents(this.sceneExtents.min, this.sceneExtents.max);

        this.fitPanSpeedToScene(this.sceneExtents.min, this.sceneExtents.max);
        this.fitCameraPlanesToExtents(this.sceneExtents.min, this.sceneExtents.max);

    }

    fitDistanceToExtents(min, max)
    {
        const maxAxisLength = Math.max(max[0] - min[0], max[1] - min[1]);
        const yfov = this.yfov;
        const xfov = this.yfov * this.aspectRatio;

        const yZoom = maxAxisLength / 2 / Math.tan(yfov / 2);
        const xZoom = maxAxisLength / 2 / Math.tan(xfov / 2);

        this.distance = Math.max(xZoom, yZoom);
    }

    fitCameraTargetToExtents(min, max)
    {
        let target = [0,0,0];
        for (const i of [0, 1, 2])
        {
            target[i] = (max[i] + min[i]) / 2;
        }
        this.setRotation(this.rotAroundY, this.rotAroundX);
        this.setDistanceFromTarget(this.distance, target);
    }

    fitCameraPlanesToExtents(min, max)
    {
        // depends only on scene min/max and the camera distance

        // Manually increase scene extent just for the camera planes to avoid camera clipping in most situations.
        const longestDistance = 10 * vec3.distance(min, max);
        let zNear = this.distance - (longestDistance * 0.6);
        let zFar = this.distance + (longestDistance * 0.6);

        // minimum near plane value needs to depend on far plane value to avoid z fighting or too large near planes
        zNear = Math.max(zNear, zFar / MaxNearFarRatio);

        this.znear = zNear;
        this.zfar = zFar;
    }
}

export { UserCamera };
