import { GltfObject } from './gltf_object.js';
import { Behavior } from '@khronosgroup/gltf-behavior';

class gltfBehavior extends GltfObject
{
    constructor()
    {
        super();
    }

    initGl(gltf, webGlContext)
    {
        super.initGl(gltf, webGlContext);
    }

    fromJson(jsonBehavior)
    {
        super.fromJson(jsonBehavior);
        this.behavior = new Behavior(jsonBehavior);
    }
}


export { gltfBehavior };
