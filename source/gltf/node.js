import { mat4 } from 'gl-matrix';
import { jsToGl } from './utils.js';
import { GltfObject } from './gltf_object.js';
import { AnimatableProperty, makeAnimatable } from './animatable_property.js';

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
        this.rotation = new AnimatableProperty(jsToGl([0, 0, 0, 1]));
        this.scale = new AnimatableProperty(jsToGl([1, 1, 1]));
        this.translation = new AnimatableProperty(jsToGl([0, 0, 0]));
        this.name = undefined;
        this.mesh = undefined;
        this.skin = undefined;
        this.weights = new AnimatableProperty(undefined);

        // non gltf
        this.worldTransform = mat4.create();
        this.inverseWorldTransform = mat4.create();
        this.normalMatrix = mat4.create();
        this.light = undefined;
    }

    fromJson(json)
    {
        super.fromJson(json);
        makeAnimatable(this, json, { "weights": [] });
    }

    getWeights(gltf)
    {
        if (this.weights.value()  !== undefined && this.weights.value().length > 0) {
            return this.weights;
        }
        else {
            return gltf.meshes[this.mesh].weights;
        }
    }

    // TODO: Not called. What about nodes which only define a matrix?
    applyMatrix(matrixData)
    {
        // this.matrix = jsToGl(matrixData);

        // mat4.getScaling(this.scale, this.matrix);

        // // To extract a correct rotation, the scaling component must be eliminated.
        // const mn = mat4.create();
        // for(const col of [0, 1, 2])
        // {
        //     mn[col] = this.matrix[col] / this.scale[0];
        //     mn[col + 4] = this.matrix[col + 4] / this.scale[1];
        //     mn[col + 8] = this.matrix[col + 8] / this.scale[2];
        // }
        // mat4.getRotation(this.rotation, mn);
        // quat.normalize(this.rotation, this.rotation);

        // mat4.getTranslation(this.translation, this.matrix);
    }

    resetTransform()
    {
        this.rotation.rest();
        this.scale.rest();
        this.translation.rest();
    }

    getLocalTransform()
    {
        return mat4.fromRotationTranslationScale(
            mat4.create(),
            this.rotation.value(),
            this.translation.value(),
            this.scale.value()
        );
    }
}

export { gltfNode };
