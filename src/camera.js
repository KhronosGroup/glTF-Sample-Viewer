import { mat4, mat3, vec3, quat } from 'gl-matrix';
import { fromKeys } from './utils.js';
import { GltfObject } from './gltf_object.js';

class gltfCamera extends GltfObject
{
    constructor(
        type = "perspective",
        znear = 0.01,
        zfar = 1000.0,
        yfov = 45.0 * Math.PI / 180.0,
        aspectRatio = 16.0 / 9.0,
        xmag = 1.0,
        ymag = 1.0,
        name = undefined,
        nodeIndex = undefined)
    {
        super();
        this.type = type;
        this.znear = znear;
        this.zfar = zfar;
        this.yfov = yfov; // radians
        this.xmag = xmag;
        this.ymag = ymag;
        this.aspectRatio = aspectRatio;
        this.name = name;
        this.node = nodeIndex;
    }

    initGl(gltf)
    {
        super.initGl(gltf);

        for (let i = 0; i < gltf.nodes.length; i++)
        {
            const cameraIndex = gltf.nodes[i].camera;
            if (cameraIndex === undefined)
            {
                continue;
            }

            if (gltf.cameras[cameraIndex] === this)
            {
                this.node = i;
                break;
            }
        }
    }

    fromJson(jsonCamera)
    {
        this.name = name;
        if(jsonCamera.perspective !== undefined)
        {
            this.type = "perspective";
            fromKeys(this, jsonCamera.perspective);
        }
        else if(jsonCamera.orthographic !== undefined)
        {
            this.type = "orthographic";
            fromKeys(this, jsonCamera.orthographic);
        }
    }

    sortNodesByDepth(nodes)
    {
        // precompute the distances to avoid their computation during sorting
        const sortedNodes = [];
        for (const node of nodes)
        {
            const modelView = mat4.create();
            mat4.multiply(modelView, this.getViewMatrix(), node.worldTransform);

            const pos = vec3.create();
            mat4.getTranslation(pos, modelView);

            sortedNodes.push({depth: pos[2], node: node});
        }

        // remove nodes that are behind the camera
        // --> will never be visible and it is cheap to discard them here
        sortedNodes.filter((a) => a.depth >= 0);

        sortedNodes.sort((a, b) => b.depth - a.depth);

        return sortedNodes.map((a) => a.node);
    }

    getProjectionMatrix()
    {
        const projection = mat4.create();

        if (this.type === "perspective")
        {
            mat4.perspective(projection, this.yfov, this.aspectRatio, this.znear, this.zfar);
        }
        else if (this.type === "orthographic")
        {
            projection[0]  = 1.0 / this.xmag;
            projection[5]  = 1.0 / this.ymag;
            projection[10] = 2.0 / (this.znear - this.zfar);
            projection[14] = (this.zfar + this.znear) / (this.znear - this.zfar);
        }

        return projection;
    }

    getViewMatrix(gltf)
    {
        const view = mat4.create();
        const position = this.getPosition(gltf);
        const target = this.getLookAtTarget(gltf);
        mat4.lookAt(view, position, target, vec3.fromValues(0, 1, 0));
        return view;
    }

    getViewProjectionMatrix(gltf)
    {
        let projMatrix = this.getProjectionMatrix();
        let viewMatrix = this.getViewMatrix(gltf);

        let viewProj = mat4.create();
        mat4.multiply(viewProj, projMatrix, viewMatrix);

        return viewProj;
    }

    getInvViewProjectionMatrix(gltf)
    {
        let invViewProj = mat4.create();
        mat4.invert(invViewProj, this.getViewProjectionMatrix(gltf))
        return invViewProj;
    }

    getLookAtTarget(gltf)
    {
        const target = vec3.create();
        const position = this.getPosition(gltf);
        const lookDirection = this.getLookDirection(gltf);
        vec3.add(target, lookDirection, position);
        return target;
    }

    getPosition(gltf)
    {
        const position = vec3.create();
        const node = this.getNode(gltf);
        mat4.getTranslation(position, node.worldTransform);
        return position;
    }

    getLookDirection(gltf)
    {
        const direction = vec3.create();
        const rotation = this.getRotation(gltf);
        vec3.transformQuat(direction, vec3.fromValues(0, 0, -1), rotation);
        return direction;
    }

    getRotation(gltf)
    {
        const rotation = quat.create();
        const node = this.getNode(gltf);
        mat4.getRotation(rotation, node.worldTransform);
        return rotation;
    }

    clone()
    {
        return new gltfCamera(
            this.type,
            this.znear,
            this.zfar,
            this.yfov,
            this.aspectRatio,
            this.xmag,
            this.ymag,
            this.name,
            this.node);
    }

    getNode(gltf)
    {
        return gltf.nodes[this.node];
    }
}

export { gltfCamera };
