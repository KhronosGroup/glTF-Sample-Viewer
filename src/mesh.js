import { gltfPrimitive } from './primitive.js';

class gltfMesh
{
    constructor(primitives = [], name = undefined)
    {
        this.primitives = primitives;
        this.name = name;
    }

    fromJson(jsonMesh, defaultMaterial, gltf)
    {
        if (jsonMesh.name !== undefined)
        {
            this.name = jsonMesh.name;
        }

        for (let i = 0; i < jsonMesh.primitives.length; ++i)
        {
            let primitive = new gltfPrimitive();
            primitive.fromJson(jsonMesh.primitives[i], defaultMaterial, gltf);
            this.primitives.push(primitive);
        }
    }
};

export { gltfMesh };
