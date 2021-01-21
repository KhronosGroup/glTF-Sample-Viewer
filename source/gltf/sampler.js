import { GltfObject } from './gltf_object.js';
import { GL } from '../Renderer/webgl.js';

class gltfSampler extends GltfObject
{
    constructor(
        magFilter = GL.LINEAR,
        minFilter = GL.LINEAR_MIPMAP_LINEAR,
        wrapS = GL.REPEAT,
        wrapT = GL.REPEAT)
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
