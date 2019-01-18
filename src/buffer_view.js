import { fromKeys, initGlForMembers } from './utils.js';

class gltfBufferView
{
    constructor()
    {
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

    fromJson(jsonBufferView)
    {
        fromKeys(this, jsonBufferView);
    }
}

export { gltfBufferView };
