class gltfBuffer
{
    construct(uri = "", byteLength = 0)
    {
        this.uri = uri;
        this.byteLength = byteLength;
    }

    fromJson(jsonBuffer)
    {
        fromKeys(this, jsonBuffer);
    }
}
