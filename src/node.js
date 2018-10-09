// contain:
// transform
// primitives & materials
// child indices (reference to scene array of nodes)

class Node
{
    // TODO: children, primitives

    //  vec3 pos, quat rot, vec3 scale
    constructor(pos = [0, 0, 0], rot = [0.0, 0.0, 0.0, 1.0], scale = [1.0, 1.0, 1.0])
    {
        this.pos = pos;
        this.rot = rot;
        this.scale = scale;
    }

    // child index
    addChild(child)
    {
        this.children.push(child);
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
