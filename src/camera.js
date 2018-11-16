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
    constructor(position = [0.0, 0.0, 0.0], target = [0.0, 0.0,0.0], up = [0.0, 1.0, 0.0])
    {
        super();

        this.position = jsToGl(position);
        this.target = jsToGl(target);
        this.up = jsToGl(up);
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
}
