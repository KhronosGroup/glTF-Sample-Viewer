import { gltfPrimitive } from './primitive.js';
import { objectsFromJsons } from './utils.js';
import { GltfObject } from './gltf_object.js';

class gltfMesh extends GltfObject
{
    constructor()
    {
        super();
        this.primitives = [];
        this.name = undefined;
        this.weights = [];

        // non gltf
        this.weightsAnimated = undefined;
    }

    fromJson(jsonMesh)
    {
        super.fromJson(jsonMesh);

        if (jsonMesh.name !== undefined)
        {
            this.name = jsonMesh.name;
        }

        this.primitives = objectsFromJsons(jsonMesh.primitives, gltfPrimitive);

        if(jsonMesh.weights !== undefined)
        {
            this.weights = jsonMesh.weights;
        }
    }

    getWeightsAnimated()
    {
        return this.weightsAnimated !== undefined ? this.weightsAnimated : this.weights;
    }
}

export { gltfMesh };
