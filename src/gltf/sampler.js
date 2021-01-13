import { GltfObject } from './gltf_object.js';

class gltfSampler extends GltfObject
{
    constructor(
        magFilter = WebGLRenderingContext.LINEAR,
        minFilter = WebGLRenderingContext.LINEAR_MIPMAP_LINEAR,
        wrapS = WebGLRenderingContext.REPEAT,
        wrapT = WebGLRenderingContext.REPEAT)
    {
        super();
        this.magFilter = magFilter;
        this.minFilter = minFilter;
        this.wrapS = wrapS;
        this.wrapT = wrapT;
        this.name = undefined;
    }

    static createDefault()
    {
        return new gltfSampler();
    }
}

export { gltfSampler };
