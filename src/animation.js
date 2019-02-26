import { GltfObject } from './gltf_object.js';
import { objectsFromJsons } from './utils.js';
import { gltfAnimationChannel } from './channel.js';

class gltfAnimation extends GltfObject
{
    constructor()
    {
        super();
        this.channels = [];
        this.samplers = [];
    }

    fromJson(jsonAnimation)
    {
        this.channels = objectsFromJsons(jsonAnimation.channels, gltfAnimationChannel);
        this.samplers = objectsFromJsons(jsonAnimation.samplers, gltfAnimationSampler);
    }
}

export { gltfAnimation };
