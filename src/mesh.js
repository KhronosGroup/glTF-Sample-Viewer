import { gltfPrimitive } from './primitive.js';
import { initGlForMembers, objectsFromJsons } from './utils.js';

class gltfMesh
{
    constructor()
    {
        this.primitives = [];
        this.name = undefined;
    }

    initGl(gltf)
    {
        initGlForMembers(this, gltf);
    }

    fromJson(jsonMesh)
    {
        if (jsonMesh.name !== undefined)
        {
            this.name = jsonMesh.name;
        }

        this.primitives = objectsFromJsons(jsonMesh.primitives, gltfPrimitive);
    }
}

export { gltfMesh };
