import { gltfPrimitive } from './primitive.js';
import { objectsFromJsons } from './utils.js';
import { GltfObject } from './gltf_object.js';
import { PointerTargetProperty, makeAnimatable } from './animatable_property.js';

class gltfMesh extends GltfObject
{
    constructor()
    {
        super();
        this.primitives = [];
        this.name = undefined;
        this.weights = new PointerTargetProperty();
    }

    fromJson(jsonMesh)
    {
        super.fromJson(jsonMesh);

        if (jsonMesh.name !== undefined)
        {
            this.name = jsonMesh.name;
        }

        this.primitives = objectsFromJsons(jsonMesh.primitives, gltfPrimitive);

        makeAnimatable(this, jsonMesh, { "weights": [] });
    }
}

export { gltfMesh };
