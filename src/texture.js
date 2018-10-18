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
    constructor(index = undefined, texCoord = 0, colorSpace = gl.RGBA) // linear by default
    {
        this.index = index; // reference to gltfTexture
        this.texCoord = texCoord; // which UV set to use
        this.colorSpace = colorSpace;
    }

    fromJson(jsonTextureInfo, colorSpace = gl.RGBA)
    {
        fromKeys(this, jsonTextureInfo);
        this.colorSpace = colorSpace;
    }
};
