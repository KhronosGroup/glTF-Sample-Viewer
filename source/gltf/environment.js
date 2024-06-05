import { fromKeys, initGlForMembers } from './utils.js';
import { GL } from '../Renderer/webgl.js';
import { GltfObject } from './gltf_object.js';

class gltfxEnvironment extends GltfObject
{
    constructor(uri = undefined, intensity = 1.0 )
    {
        super();
        this.uri = uri;   
        this.intensity = intensity;   

        // non gltf
        this.filteredEnvironment = undefined;
    }
 

    fromJson(jsonEnvironment)
    {
        super.fromJson(jsonEnvironment);

    }

    destroy()
    {
        this.filteredEnvironment = undefined;
    }
}
 

export {gltfxEnvironment};
