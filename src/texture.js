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

class gltfTextureInfo
{
    constructor(index = undefined, texCoord = 0)
    {
        this.index = index;
        this.texCoord = texCoord;
    }

    fromJson(jsonTextureInfo)
    {
        fromKeys(this, jsonTextureInfo);
    }
};
