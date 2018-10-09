class gltfTexture
{
    constructor()
    {
        this.sampler = undefined; // index to gltfSampler, default sampler ?
        this.source = undefined; // index to gltfImage
        this.texture = undefined; // gl texture
    }

    fromJson(jsonTexture)
    {
        fromKeys(this, jsonTexture);
    }
};
