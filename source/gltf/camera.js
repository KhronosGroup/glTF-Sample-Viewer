import { mat4, vec3, quat } from 'gl-matrix';
import { fromKeys } from './utils.js';
import { GltfObject } from './gltf_object.js';

class gltfCamera extends GltfObject
{
    constructor(
        type = "perspective",
        znear = 0.01,
        zfar = Infinity,
        yfov = 45.0 * Math.PI / 180.0,
        aspectRatio = undefined,
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

    initGl(gltf, webGlContext)
    {
        super.initGl(gltf, webGlContext);

        let cameraIndex = undefined;
        for (let i = 0; i < gltf.nodes.length; i++)
        {
            cameraIndex = gltf.nodes[i].camera;
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

        // cameraIndex stays undefined if camera is not assigned to any node
        if(this.node === undefined && cameraIndex !== undefined)
        {
            console.error("Invalid node for camera " + cameraIndex);
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

    sortPrimitivesByDepth(gltf, drawables)
    {
        // Precompute the distances to avoid their computation during sorting.
        for (const drawable of drawables)
        {
            const modelView = mat4.create();
            mat4.multiply(modelView, this.getViewMatrix(gltf), drawable.node.worldTransform);

            // Transform primitive centroid to find the primitive's depth.
            const pos = vec3.transformMat4(vec3.create(), vec3.clone(drawable.primitive.centroid), modelView);

            drawable.depth = pos[2];
        }

        // 1. Remove primitives that are behind the camera.
        //    --> They will never be visible and it is cheap to discard them here.
        // 2. Sort primitives so that the furthest nodes are rendered first.
        //    This is required for correct transparency rendering.
        return drawables
            .filter((a) => a.depth <= 0)
            .sort((a, b) => a.depth - b.depth);
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
        let result = mat4.create();
        mat4.invert(result, this.getTransformMatrix(gltf));
        return result;
    }

    getTarget(gltf)
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

    getTransformMatrix(gltf)
    {
        const node = this.getNode(gltf);
        if (node !== undefined && node.worldTransform !== undefined)
        {
            return node.worldTransform;
        }
        return mat4.create();

    }

    // Returns a JSON object describing the user camera's current values.
    getDescription(gltf)
    {
        const asset = {
            "generator": "gltf-sample-viewer",
            "version": "2.0"
        };

        const camera = {
            "type": this.type
        };

        if (this.name !== undefined)
        {
            camera["name"] = this.name;
        }

        if (this.type === "perspective")
        {
            camera["perspective"] = {};
            if (this.aspectRatio !== undefined)
            {
                camera["perspective"]["aspectRatio"] = this.aspectRatio;
            }
            camera["perspective"]["yfov"] = this.yfov;
            if (this.zfar != Infinity)
            {
                camera["perspective"]["zfar"] = this.zfar;
            }
            camera["perspective"]["znear"] = this.znear;
        }
        else if (this.type === "orthographic")
        {
            camera["orthographic"] = {};
            camera["orthographic"]["xmag"] = this.xmag;
            camera["orthographic"]["ymag"] = this.ymag;
            camera["orthographic"]["zfar"] = this.zfar;
            camera["orthographic"]["znear"] = this.znear;
        }

        const mat = this.getTransformMatrix(gltf);

        const node = {
            "camera": 0,
            "matrix": [mat[0], mat[1], mat[2], mat[3],
                       mat[4], mat[5], mat[6], mat[7],
                       mat[8], mat[9], mat[10], mat[11],
                       mat[12], mat[13], mat[14], mat[15]]
        };

        if (this.nodeIndex !== undefined && gltf.nodes[this.nodeIndex].name !== undefined)
        {
            node["name"] = gltf.nodes[this.nodeIndex].name;
        }

        return {
            "asset": asset,
            "cameras": [camera],
            "nodes": [node]
        };
    }
}

export { gltfCamera };
