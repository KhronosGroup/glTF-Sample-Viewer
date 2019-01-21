import { gltfPrimitive } from './primitive.js';
import { initGlForMembers } from './utils.js';

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

    fromJson(jsonMesh, gltf)
    {
        if (jsonMesh.name !== undefined)
        {
            this.name = jsonMesh.name;
        }

        for (const jsonPrimitive of jsonMesh.primitives)
        {
            const primitive = new gltfPrimitive();
            primitive.fromJson(jsonPrimitive, gltf);
            this.primitives.push(primitive);
        }
    }
}

export { gltfMesh };
