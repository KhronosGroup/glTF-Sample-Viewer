class Camera
{
    constructor(pos, rot, near, far, fovy, aspect)
    {
        this.pos = pos;
        this.rot = rot;
        this.near = near;
        this.far = far;
        this.fovy = fovy; // degrees
        this.aspect = aspect;
    }

    // mat4
    getViewMatrix()
    {
        var view = mat4.create();

        // compute from pos & rot
        mat4.fromRotationTranslation(view, rot, pos);
        //mat4.invert(view, view);

        return view;

    };

    // mat4 (ortho proj needed?)
    getProjectionMatrix()
    {
        var proj = mat4.create();

        // compute from fovy, near, far, aspect
        mat4.perspective(proj, this.fovy * Math.PI / 180.0, this.aspect, this.near, this.far);

        return proj;
    }

    // vec3
    translate(pos)
    {
        this.pos = pos;
    }

    // quat
    rotate(rot)
    {
        this.rot = rot;
    }
};
