// contain:
// transform
// primitives & materials
// child indices (reference to scene array of nodes)

class Node
{
    // TODO: children, primitives

    //  vec3 pos, quat rot, vec3 scale
    constructor(pos, rot, scale, children)
    {
        this.pos = pos;
        this.rot = rot;
        this.scale = scale;
        this.children = children;
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

    // vec3
    scale(scale)
    {
        this.scale = scale;
    }

    // TODO: WEIGHTS

    getTransform()
    {
        var transform = mat4.create();

        mat4.fromRotationTranslationScale(transform, rotation, translate, scale);

        return transform;
    }
}
