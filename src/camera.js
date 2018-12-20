import { mat4, vec3, quat } from 'gl-matrix';
import { fromKeys } from './utils.js';

class gltfCamera
{
    constructor(type = "perspective",
                znear = 0.01, zfar = 10000.0,
                yfov = 45.0 * Math.PI / 180.0,
                aspectRatio = 16.0 / 9.0,
                xmag = 1.0, ymag = 1.0,
                name = undefined,
                node = undefined)
    {
        this.type = type;
        this.znear = znear;
        this.zfar = zfar;
        this.yfov = yfov; // radians
        this.xmag = xmag;
        this.ymag = ymag;
        this.aspectRatio = aspectRatio;
        this.name = name;
        this.node = node;
    }

    clone()
    {
        return new gltfCamera(this.type, this.znear, this.zfar, this.yfov, this.aspectRatio, this.xmag, this.ymag, this.name, this.node);
    }

    getProjectionMatrix()
    {
        let proj = mat4.create();

        if (this.type == "perspective")
        {
            mat4.perspective(proj, this.yfov, this.aspectRatio, this.znear, this.zfar);
        }
        else if (this.type == "orthographic")
        {
            proj[0]  = 1.0 / this.xmag;
            proj[5]  = 1.0 / this.ymag;
            proj[10] = 2.0 / (this.znear / this.zfar)
            proj[14] = (this.zfar + this.znear) / (this.znear - this.zfar);
        }

        return proj;
    }

    getViewMatrix(gltf)
    {
        const view = mat4.create();

        if(this.node !== undefined && gltf !== undefined)
        {
            const nodeParent = gltf.nodes[this.node];
            const position = vec3.create();
            const rotation = quat.create();
            const targetDirection = vec3.create();
            const target = vec3.create();

            mat4.getTranslation(position, nodeParent.worldTransform);
            mat4.getRotation(rotation, nodeParent.worldTransform);
            vec3.transformQuat(targetDirection, vec3.fromValues(0, 0, -1), rotation);
            vec3.add(target, targetDirection, position);

            mat4.lookAt(view, position, target, vec3.fromValues(0, 1, 0));
        }

        return view;
    }

    getPosition(gltf)
    {
        const pos = vec3.create();

        if(this.node !== undefined && gltf !== undefined)
        {
            const nodeParent = gltf.nodes[this.node];
            mat4.getTranslation(pos, nodeParent.worldTransform);
        }
        return pos;
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
};

export { gltfCamera };
