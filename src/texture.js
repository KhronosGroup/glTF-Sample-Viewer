import { fromKeys, initGlForMembers } from './utils.js';
import { WebGl } from './webgl.js';
import { GltfObject } from './gltf_object.js';

class gltfTexture extends GltfObject
{
    constructor(sampler = undefined, source = undefined, type = WebGl.context.TEXTURE_2D, texture = undefined)
    {
        super();
        this.sampler = sampler; // index to gltfSampler, default sampler ?
        this.source = source; // index to gltfImage

        // non gltf
        this.glTexture = texture;
        this.type = type;
        this.initialized = false;
    }

    initGl(gltf)
    {
        if (this.sampler === undefined)
        {
            this.sampler = gltf.samplers.length - 1;
        }

        initGlForMembers(this, gltf);
    }

    destroy()
    {
        if (this.glTexture !== undefined)
        {
            WebGl.context.deleteTexture(this.glTexture);
        }

        this.glTexture = undefined;
    }
}

class gltfTextureInfo
{
    constructor(index = undefined, texCoord = 0, linear = true, samplerName = "", generateMips = true) // linear by default
    {
        this.index = index; // reference to gltfTexture
        this.texCoord = texCoord; // which UV set to use
        this.linear = linear;
        this.samplerName = samplerName;
        this.strength = 1.0; // occlusion
        this.scale = 1.0; // normal
        this.generateMips = generateMips;

        this.extensions = undefined;
    }

    initGl(gltf)
    {
        initGlForMembers(this, gltf);
    }

    fromJson(jsonTextureInfo)
    {
        fromKeys(this, jsonTextureInfo);
    }
}

export { gltfTexture, gltfTextureInfo };
