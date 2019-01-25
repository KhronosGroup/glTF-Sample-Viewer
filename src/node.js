import { mat4, vec3, vec4 } from 'gl-matrix';
import { jsToGl } from './utils.js';
import { GltfObject } from './gltf_object.js';

// contain:
// transform
// child indices (reference to scene array of nodes)

class gltfNode extends GltfObject
{
    constructor()
    {
        super();
        this.camera = undefined;
        this.children = [];
        this.matrix = undefined;
        this.rotation = [0, 0, 0, 1];
        this.scale = [1, 1, 1];
        this.translation = [0, 0, 0];
        this.name = undefined;

        // non gltf
        this.worldTransform = mat4.create();
        this.inverseWorldTransform = mat4.create();
        this.normalMatrix = mat4.create();
        this.light = undefined;
        this.changed = true;
    }

    initGl()
    {
        if (this.matrix !== undefined)
        {
            this.applyMatrix(this.matrix);
        }
        else
        {
            if (this.scale !== undefined)
            {
                this.scale = jsToGl(this.scale);
            }

            if (this.rotation !== undefined)
            {
                this.rotation = jsToGl(this.rotation);
            }

            if (this.translation !== undefined)
            {
                this.translation = jsToGl(this.translation);
            }
        }
        this.changed = true;
    }

    fromJson(jsonNode)
    {
        super.fromJson(jsonNode);
        this.mesh = jsonNode.mesh;
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
