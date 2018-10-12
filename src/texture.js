class gltfTexture
{
    constructor(sampler = undefined, source = undefined, texture = undefined)
    {
        this.sampler = sampler; // index to gltfSampler, default sampler ?
        this.source = source; // index to gltfImage
        this.texture = texture; // gl texture
    }

    fromJson(jsonTexture)
    {
        fromKeys(this, jsonTexture);
    }
};
