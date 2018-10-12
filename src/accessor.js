class gltfAccessor
{
    constructor(bufferView = undefined, byteOffset = 0,
                componentType = undefined, normalized = false,
                count = undefined, type = undefined,
                max = undefined, min = undefined,
                sparse = undefined, name = undefined)
    {
        this.bufferView = bufferView;
        this.byteOffset = byteOffset;
        this.componentType = componentType;
        this.normalized = normalized;
        this.count = count;
        this.type = type;
        this.max = max;
        this.min = min;
        this.sparse = sparse;
        this.name = name;
    }

    fromJson(jsonAccessor)
    {
        fromKeys(this, jsonAccessor);
    }
};
