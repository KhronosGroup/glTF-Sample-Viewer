class gltfBufferView
{
    constructor(buffer = undefined,
                byteOffset = 0, byteLength = undefined, byteStride = undefined,
                target = undefined, name = undefined)
    {
        this.buffer = buffer;
        this.byteOffset = byteOffset;
        this.byteLength = byteLength;
        this.byteStride = byteStride;
        this.target = target;
        this.name = name;
    }

    fromJson(jsonBufferView)
    {
        fromKeys(this, jsonBufferView);
    }
};
