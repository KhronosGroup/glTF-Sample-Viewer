import { WebGl } from './webgl.js';
import { GltfObject } from './gltf_object.js';

class gltfSampler extends GltfObject
{
    constructor(
        magFilter = WebGl.context.LINEAR,
        minFilter = WebGl.context.LINEAR_MIPMAP_LINEAR,
        wrapS = WebGl.context.REPEAT,
        wrapT = WebGl.context.REPEAT)
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
