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
        return gltfCamera(this.type, this.znear, this.zfar, this.yfov, this.aspectRatio, this.xmag, this.ymag, this.name, this.node);
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
        if(this.node !== undefined && gltf !== undefined)
        {
            const node = gltf.nodes[currentCamera.node];
            return mat4.clone(node.worldTransform);
        }

        return mat4.create();
    }

    getPosition(gltf)
    {
        let pos = vec3.create();
        mat4.getTranslation(pos, this.getViewMatrix(gltf));
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

class UserCamera extends gltfCamera
{
    constructor(
        position = [0, 0, 0],
        target = [0, 0,0],
        up = [0, 1, 0],
        xRot = 0, yRot = 0,
        zoom = 1)
    {
        super();

        this.position = jsToGl(position);
        this.target = jsToGl(target);
        this.up = jsToGl(up);
        this.xRot = xRot;
        this.yRot = yRot;
        this.zoom = zoom;
        this.zoomFactor = 1.04;
        this.rotateSpeed = 1 / 180;
    }

    getViewMatrix(gltf)
    {
        let view = mat4.create();
        mat4.lookAt(view, this.position, this.target, this.up);
        return view;
    }

    getPosition(gltf)
    {
        return this.position;
    }

    updatePosition()
    {
        // calculate direction from focus to camera (assuming camera is at positive z)
        // yRot rotates *around* x-axis, xRot rotates *around* y-axis
        let direction = vec3.fromValues(0, 0, 1);
        const zero = vec3.create();
        vec3.rotateX(direction, direction, zero, -this.yRot);
        vec3.rotateY(direction, direction, zero, -this.xRot);

        let position = vec3.create();
        vec3.scale(position, direction, this.zoom);
        vec3.add(position, position, this.target);

        this.position = position;
    }

    zoomIn(value)
    {
        if (value > 0)
        {
            this.zoom *= this.zoomFactor;
        }
        else
        {
            this.zoom /= this.zoomFactor;
        }
    }

    rotate(x, y)
    {
        const yMax = Math.PI / 2 - 0.01;
        this.xRot += (x * this.rotateSpeed);
        this.yRot += (y * this.rotateSpeed);
        this.yRot = clamp(this.yRot, -yMax, yMax);
    }

    fitViewToAsset(gltf)
    {
        let min = vec3.fromValues(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        let max = vec3.fromValues(Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE);
        this.getAssetExtends(gltf, min, max);

        this.fitCameraTargetToExtends(min, max);
        this.fitZoomToExtends(min, max);
    }

    getAssetExtends(gltf, outMin, outMax)
    {
        for (const node of gltf.nodes.filter(n => n.mesh !== undefined))
        {
            const mesh = gltf.meshes[node.mesh];
            if (mesh.primitives === undefined)
            {
                continue;
            }

            for (const primitive of mesh.primitives)
            {
                const attribute = primitive.attributes.find(a => a.attribute == "POSITION");
                if (attribute === undefined)
                {
                    continue;
                }

                const accessor = gltf.accessors[attribute.accessor];
                let assetMin = vec3.create();
                let assetMax = vec3.create();
                this.getExtendsFromAccessor(accessor, node.worldTransform, assetMin, assetMax);

                for (let i of [0, 1, 2])
                {
                    outMin[i] = Math.min(outMin[i], assetMin[i]);
                    outMax[i] = Math.max(outMax[i], assetMax[i]);
                }
            }
        }
    }

    fitZoomToExtends(min, max)
    {
        const maxAxisLength = Math.max(max[0] - min[0], max[1] - min[1]);
        this.zoom = this.getFittingZoom(maxAxisLength);
    }

    fitCameraTargetToExtends(min, max)
    {
        for (let i of [0, 1, 2])
        {
            this.target[i] = (max[i] + min[i]) / 2;
        }
    }

    getFittingZoom(axisLength)
    {
        const yfov = this.yfov;
        const xfov = this.yfov * this.aspectRatio;

        const yZoom = axisLength / 2 / Math.tan(yfov / 2);
        const xZoom = axisLength / 2 / Math.tan(xfov / 2);

        return Math.max(xZoom, yZoom);
    }

    getExtendsFromAccessor(accessor, worldTransform, outMin, outMax)
    {
        let boxMin = vec3.create();
        vec3.transformMat4(boxMin, jsToGl(accessor.min), worldTransform);

        let boxMax = vec3.create();
        vec3.transformMat4(boxMax, jsToGl(accessor.max), worldTransform);

        let center = vec3.create();
        vec3.add(center, boxMax, boxMin);
        vec3.scale(center, center, 0.5);

        let centerToSurface = vec3.create();
        vec3.sub(centerToSurface, boxMax, center);

        const radius = vec3.length(centerToSurface);

        for (let i of [1, 2, 3])
        {
            outMin[i] = center[i] - radius;
            outMax[i] = center[i] + radius;
        }
    }
}
