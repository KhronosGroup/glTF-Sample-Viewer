//import { initGlForMembers } from './utils.js';
//import { WebGl } from './webgl.js';
import { GltfObject } from './gltf_object.js';

class gltfSkin extends GltfObject
{
    constructor()
    {
        super();

        this.name = "";
        this.inverseBindMatrices = [];
        this.joints = [];
        this.skeleton = undefined;
    }
}
