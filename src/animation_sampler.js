import { GltfObject } from './gltf_object.js';

class gltfAnimationSampler extends GltfObject
{
    constructor()
    {
        super();
        this.input = undefined;
        this.interpolation = undefined;
        this.output = undefined;
    }
}

const InterpolationModes =
{
    LINEAR: "LINEAR",
    STEP: "STEP",
    CUBICSPLINE: "CUBICSPLINE"
};

export { gltfAnimationSampler, InterpolationModes };
