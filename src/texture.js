class gltfTexture
{
    constructor(sampler = undefined, source = undefined, type = gl.TEXTURE_2D, texture = undefined)
    {
        this.sampler = sampler; // index to gltfSampler, default sampler ?
        this.source = source; // index to gltfImage
        this.glTexture = texture; // gl texture
        this.initialized = false;
        this.type = type;
    }

    fromJson(jsonTexture, defaultSampler)
    {
        fromKeys(this, jsonTexture);

        if (this.sampler === undefined)
        {
            this.sampler = defaultSampler;
        }
    }

    destroy()
    {
        if (this.glTexture !== undefined)
        {
            gl.deleteTexture(this.glTexture);
        }

        this.glTexture = undefined;
    }
};

class gltfTextureInfo
{
    constructor(index = undefined, texCoord = 0, colorSpace = gl.RGBA, samplerName = "", generateMips = true) // linear by default
    {
        this.index = index; // reference to gltfTexture
        this.texCoord = texCoord; // which UV set to use
        this.colorSpace = colorSpace;
        this.samplerName = samplerName;
        this.strength = 1.0; // occlusion
        this.scale = 1.0; // normal
        this.generateMips = generateMips;
    }

    fromJson(jsonTextureInfo, samplerName, colorSpace = gl.RGBA)
    {
        fromKeys(this, jsonTextureInfo);
        this.colorSpace = colorSpace;
        this.samplerName = samplerName;
    }
};
