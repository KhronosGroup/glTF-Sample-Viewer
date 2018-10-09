class gltfBufferView
{
    constructor()
    {
        this.buffer = undefined;
        this.byteOffset = 0;
        this.byteLength = 0;
        this.byteStride = 0;
        this.target = undefined;
        this.name = "";
        this.extensions = {};
        //this.extras = undefined;
    }

    fromJson(jsonBufferView)
    {
        fromKeys(this, jsonBufferView);
    }
};
