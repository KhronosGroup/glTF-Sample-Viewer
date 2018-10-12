class gltfBuffer
{
    construct(uri = undefined, byteLength = undefined, name = undefined)
    {
        this.uri = uri;
        this.byteLength = byteLength;
        this.name = name;
    }

    fromJson(jsonBuffer)
    {
        fromKeys(this, jsonBuffer);
    }
};
