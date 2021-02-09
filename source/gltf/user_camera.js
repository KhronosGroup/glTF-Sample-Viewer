import { vec3, mat4, quat } from 'gl-matrix';
import { gltfCamera } from './camera.js';
import { clamp } from './utils.js';
import { getSceneExtents } from './gltf_utils.js';

const VecZero = vec3.create();
const PanSpeedDenominator = 1200;
const MaxNearFarRatio = 10000;

class UserCamera extends gltfCamera
{
    constructor()
    {
        super();

        //this.target = jsToGl(target);
        this.transform = mat4.create();
        //this.yaw = yaw;
        //this.pitch = pitch;
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
        const direction = vec3.create();
        const rotation = this.getRotation();
        vec3.transformQuat(direction, vec3.fromValues(0, 0, -1), rotation);
        return direction;
    }

    getTarget()
    {
        const target = vec3.create();
        const position = this.getPosition();
        let lookDirection = this.getLookDirection();
        lookDirection = lookDirection.map(x => x * this.distance);
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

    rotate(yaw, pitch)
    {
        let rot = mat4.create();
        mat4.rotateY(rot, this.transform, yaw);
        mat4.rotateX(rot, rot, pitch);
        this.transform = rot;
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
        const lookDirection = this.getLookDirection();
        let angleRadY = vec3.angle(lookDirection, vec3.fromValues(0, 0, 1));
        let newAngleRadY = angleRadY + (y * this.orbitSpeed);
        const yMax = Math.PI / 2 - 0.01;
        newAngleRadY = clamp(newAngleRadY, -yMax, yMax);
        y = newAngleRadY - angleRadY;

        //mat4.rotateX(this.transform, this.transform, newAngleRadY);
        let temp = mat4.create();
        const up = vec3.fromValues(this.transform[3], this.transform[4], this.transform[5]);
        vec3.normalize(up, up);
        mat4.rotateY(this.transform, this.transform, x * this.orbitSpeed);
        mat4.rotateX(this.transform, this.transform, y * this.orbitSpeed);
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
        this.fitDistanceToExtents(this.sceneExtents.min, this.sceneExtents.max);
        this.fitCameraTargetToExtents(this.sceneExtents.min, this.sceneExtents.max);
    }

    fitViewToScene(gltf, sceneIndex)
    {
        mat4.fromRotation(this.transform, Math.PI * (-90 / 180), vec3.fromValues(1,0,0));
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
        this.setTarget(target);
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
