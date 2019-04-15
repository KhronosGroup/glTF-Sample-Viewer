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
}

export { gltfBufferView };
