import { fromKeys } from './utils.js';
import { WebGl } from './webgl.js';

class gltfSampler
{
    constructor(magFilter = WebGl.context.LINEAR, minFilter = WebGl.context.LINEAR_MIPMAP_LINEAR,
        wrapS = WebGl.context.REPEAT, wrapT = WebGl.context.REPEAT,
        name = undefined)
    {
        this.magFilter = magFilter;
        this.minFilter = minFilter;
        this.wrapS = wrapS;
        this.wrapT = wrapT;
        this.name = name;
    }

    fromJson(jsonSampler)
    {
        fromKeys(this, jsonSampler);
    }
}

export { gltfSampler };
