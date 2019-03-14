import { mat4, vec3, vec4, quat } from 'gl-matrix';
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
        this.rotation = jsToGl([0, 0, 0, 1]);
        this.scale = jsToGl([1, 1, 1]);
        this.translation = jsToGl([0, 0, 0]);
        this.name = undefined;
        this.mesh = undefined;
        this.skin = undefined;

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

    applyMatrix(matrixData)
    {
        this.matrix = jsToGl(matrixData);

        // Normalize axis vectors of matrix.
        // To extract a correct rotation, the scaling component must be eliminated.
        const mn = mat4.create();
        for(const col of [0, 1, 2])
        {
            const mat = this.matrix;
            const length = Math.sqrt(mat[col] ** 2 + mat[col + 4] ** 2 + mat[col + 8] ** 2);
            mn[col] = mat[col] / length;
            mn[col + 4] = mat[col + 4] / length;
            mn[col + 8] = mat[col + 8] / length;
            mn[col + 12] = mat[col + 12] / length;
        }

        mat4.getScaling(this.scale, this.matrix);
        mat4.getRotation(this.rotation, mn);
        mat4.getTranslation(this.translation, this.matrix);

        quat.normalize(this.rotation, this.rotation);

        this.changed = true;
    }

    // vec3
    applyTranslation(translation)
    {
        this.translation = translation;
        this.changed = true;
    }

    // quat
    applyRotation(rotation)
    {
        this.rotation = rotation;
        this.changed = true;
    }

    // vec3
    applyScale(scale)
    {
        this.scale = scale;
        this.changed = true;
    }

    resetTransform()
    {
        this.rotation = jsToGl([0, 0, 0, 1]);
        this.scale = jsToGl([1, 1, 1]);
        this.translation = jsToGl([0, 0, 0]);
        this.changed = true;
    }

    getLocalTransform()
    {
        if(this.matrix !== undefined) {
            //return mat4.clone(this.matrix);
        }

        if(this.transform === undefined || this.changed)
        {
            this.transform = mat4.create();
            mat4.fromRotationTranslationScale(this.transform, this.rotation, this.translation, this.scale);
            this.changed = false;
        }

        return mat4.clone(this.transform);
    }
}

export { gltfNode };
