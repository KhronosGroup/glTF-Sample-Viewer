import { initGlForMembers } from './utils.js';
import { GltfObject } from './gltf_object.js';

class gltfBufferView extends GltfObject
{
    constructor()
    {
        super();
        this.buffer = undefined;
        this.byteOffset = 0;
        this.byteLength = undefined;
        this.byteStride = 0;
        this.target = undefined;
        this.name = undefined;
    }

    initGl(gltf)
    {
        initGlForMembers(this, gltf);
    }
}

export { gltfBufferView };
