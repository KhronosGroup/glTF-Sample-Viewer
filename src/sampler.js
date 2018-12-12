import { fromKeys } from './utils.js';

class gltfSampler
{
    constructor(magFilter = gl.LINEAR, minFilter = gl.LINEAR_MIPMAP_LINEAR,
                wrapS = gl.REPEAT, wrapT = gl.REPEAT,
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
};

export { gltfSampler };
