// contain:
// transform
// primitives & materials
// child indices (reference to scene array of nodes)

class Node
{
    // TODO: children, primitives

    //  vec3 translation, quat rotation, vec3 scale
    constructor(translation = [0, 0, 0], rotation = [0.0, 0.0, 0.0, 1.0], scale = [1.0, 1.0, 1.0])
    {
        this.translation = translation;
        this.rotation = rotation;
        this.scale = scale;
        this.children = [];
        this.name = "";
    }

    fromMatrix(matrix)
    {
        // decompose from matrix
        // into T * R * S
        // convert from Euler representation
        // to Quaternion rep later
    }

    fromJson(jsonNode)
    {
        if (jsonNode.name !== undefined)
        {
            this.name = jsonNode.name;
        }

        if (jsonNode.children !== undefined)
        {
            this.children = jsonNode.children;
        }

        if (jsonNode.matrix !== undefined)
        {
            decomposeMatrix(jsonNode.matrix);
        }
        else
        {
            if (jsonNode.scale !== undefined)
            {
                this.scale = jsonNode.scale;
            }

            if (jsonNode.rotation !== undefined)
            {
                this.rotation = jsonNode.rotation;
            }

            if (jsonNode.translation !== undefined)
            {
                this.translation = jsonNode.translation;
            }
        }
    }

    decomposeMatrix(matrix)
    {
        this.scale = ...;
        this.rotation = ...;
        this.translation = ...;
    }

    // vec3
    translate(translation)
    {
        this.translation = translation;
    }

    // quat
    rotate(rotation)
    {
        this.rotation = rotation;
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

        mat4.fromRotationTranslationScale(transform, this.rotation, this.translate, this.scale);

        return transform;
    }
}
