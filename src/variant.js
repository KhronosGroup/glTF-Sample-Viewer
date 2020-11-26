import { GltfObject } from './gltf_object.js';

class gltfVariant extends GltfObject
{
    constructor()
    {
        super();
        this.name = undefined;
    }

    fromJson(jsonVariant)
    {
        if(jsonVariant.name !== undefined)
        {
            this.name = jsonVariant.name;
        }
    }
}

export { gltfVariant as gltfVariant };
