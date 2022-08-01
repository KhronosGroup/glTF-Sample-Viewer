import { GltfObject } from './gltf_object.js';
import { objectFromJson } from './utils.js';

class gltfAnimationChannel extends GltfObject
{
    constructor()
    {
        super();
        this.target = undefined;
        this.sampler = undefined;
    }

    fromJson(jsonChannel)
    {
        super.fromJson(jsonChannel);
        this.target = objectFromJson(jsonChannel.target, gltfAnimationTarget);
    }
}

class gltfAnimationTarget extends GltfObject
{
    constructor()
    {
        super();
        this.node = undefined;
        this.path = undefined;
    }
}

const InterpolationPath =
{
    TRANSLATION: "translation",
    ROTATION: "rotation",
    SCALE: "scale",
    WEIGHTS: "weights",
    POINTER: "pointer",
};

export { gltfAnimationChannel, gltfAnimationTarget, InterpolationPath };
