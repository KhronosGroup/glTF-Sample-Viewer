import { fromKeys, initGlForMembers } from './utils.js';
import { GL } from '../Renderer/webgl.js';
import { GltfObject } from './gltf_object.js';

class gltfTexture extends GltfObject
{
    constructor(sampler = undefined, source = undefined, type = GL.TEXTURE_2D)
    {
        super();
        this.sampler = sampler; // index to gltfSampler, default sampler ?
        this.source = source; // index to gltfImage

        // non gltf
        this.glTexture = undefined;
        this.type = type;
        this.initialized = false;
        this.mipLevelCount = 0;
    }

    initGl(gltf, webGlContext)
    {
        if (this.sampler === undefined)
        {
            this.sampler = gltf.samplers.length - 1;
        }

        initGlForMembers(this, gltf, webGlContext);
    }

    fromJson(jsonTexture)
    {
        super.fromJson(jsonTexture);
        if (jsonTexture.extensions !== undefined &&
            jsonTexture.extensions.KHR_texture_basisu !== undefined &&
            jsonTexture.extensions.KHR_texture_basisu.source !== undefined)
        {
            this.source = jsonTexture.extensions.KHR_texture_basisu.source;
        }
    }

    destroy()
    {
        if (this.glTexture !== undefined)
        {
            // TODO: this breaks the dependency direction
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

    initGl(gltf, webGlContext)
    {
        initGlForMembers(this, gltf, webGlContext);
    }

    fromJson(jsonTextureInfo)
    {
        fromKeys(this, jsonTextureInfo);
    }
}

export { gltfTexture, gltfTextureInfo };
