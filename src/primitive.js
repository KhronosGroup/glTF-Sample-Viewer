class gltfPrimitive
{
    constructor(attributes = {}, indices = undefined, material = undefined, mode = 4)
    {
        this.attributes = attributes;
        this.indices = indices;
        this.material = material;
        this.mode = mode;
    }

    fromJson(jsonPrimitive)
    {
        fromKeys(this, jsonPrimitive);
    }
};
