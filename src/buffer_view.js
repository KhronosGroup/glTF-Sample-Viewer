import { fromKeys, initGlForMembers } from './utils.js';

class gltfBufferView
{
    constructor(buffer = undefined,
        byteOffset = 0, byteLength = undefined, byteStride = 0,
        target = undefined, name = undefined)
    {
        this.buffer = buffer;
        this.byteOffset = byteOffset;
        this.byteLength = byteLength;
        this.byteStride = byteStride;
        this.target = target;
        this.name = name;
    }

    initGl()
    {
        initGlForMembers(this);
    }

    fromJson(jsonBufferView)
    {
        fromKeys(this, jsonBufferView);
    }
}

export { gltfBufferView };
