import { mat4, vec3, vec4 } from 'gl-matrix';
import { jsToGl, initGlForMembers } from './utils.js';

// contain:
// transform
// child indices (reference to scene array of nodes)

class gltfNode
{
    constructor()
    {
        this.camera = undefined;
        this.children = [];
        this.matrix = undefined;
        this.rotation = vec4.fromValues(0, 0, 0, 1);
        this.scale = vec3.fromValues(1, 1, 1);
        this.translation = vec3.fromValues(0, 0, 0);
        this.name = undefined;

        // non gltf
        this.worldTransform = mat4.create();
        this.inverseWorldTransform = mat4.create();
        this.normalMatrix = mat4.create();
        this.light = undefined;
        this.changed = true;
    }

    initGl(gltf)
    {
        initGlForMembers(this, gltf);
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

        this.mesh = jsonNode.mesh;
        this.camera = jsonNode.camera;

        if (jsonNode.matrix !== undefined)
        {
            this.applyMatrix(jsonNode.matrix);
        }
        else
        {
            if (jsonNode.scale !== undefined)
            {
                this.scale = jsToGl(jsonNode.scale);
            }

            if (jsonNode.rotation !== undefined)
            {
                this.rotation = jsToGl(jsonNode.rotation);
            }

            if (jsonNode.translation !== undefined)
            {
                this.translation = jsToGl(jsonNode.translation);
            }
        }
        this.changed = true;
    }

    applyMatrix(matrixData)
    {
        this.matrix = jsToGl(matrixData);

        mat4.getScaling(this.scale, this.matrix);
        mat4.getRotation(this.rotation, this.matrix);
        mat4.getTranslation(this.translation, this.matrix);

        this.changed = true;
    }

    // vec3
    translate(translation)
    {
        this.translation = translation;
        this.changed = true;
    }

    // quat
    rotate(rotation)
    {
        this.rotation = rotation;
        this.changed = true;
    }

    // vec3
    scale(scale)
    {
        this.scale = scale;
        this.changed = true;
    }

    // TODO: WEIGHTS

    getLocalTransform()
    {
        if(this.transform === undefined || this.changed)
        {
            if (this.matrix !== undefined)
            {
                this.transform = this.matrix;
            }
            else
            {
                this.transform = mat4.create();
                mat4.fromRotationTranslationScale(this.transform, this.rotation, this.translation, this.scale);
            }
            this.changed = false;
        }

        return mat4.clone(this.transform);
    }
}

export { gltfNode };
