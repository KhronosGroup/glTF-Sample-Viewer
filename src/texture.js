class gltfTexture
{
    constructor(sampler = undefined, source = undefined, texture = undefined)
    {
        this.sampler = sampler; // index to gltfSampler, default sampler ?
        this.source = source; // index to gltfImage
        this.texture = texture; // gl texture
        this.initialized = false;
    }

    fromJson(jsonTexture)
    {
        fromKeys(this, jsonTexture);
    }
};

class gltfTextureInfo
{
    constructor(index = undefined, texCoord = 0, colorSpace = gl.RGBA, type = gl.TEXTURE_2D) // linear by default
    {
        this.index = index; // reference to gltfTexture
        this.texCoord = texCoord; // which UV set to use
        this.colorSpace = colorSpace;
        this.type = type;
        this.samplerName = "";
        this.strength = 1.0; // occlusion
        this.scale = 1.0; // normal
    }

    fromJson(jsonTextureInfo, samplerName, colorSpace = gl.RGBA, type = gl.TEXTURE_2D)
    {
        fromKeys(this, jsonTextureInfo);
        this.colorSpace = colorSpace;
        this.type = type;
        this.samplerName = samplerName;
    }
};
