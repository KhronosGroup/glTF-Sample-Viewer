class gltfPrimitive
{
    constructor(attributes = {}, indices = [], mode = 4, targets = [])
    {
        this.attributes = attributes;
        this.indices = indices;
        this.mode = mode;
        this.targets = targets;
    }

    fromJson(jsonPrimitive)
    {
        fromKeys(this, jsonPrimitive);
    }
};
