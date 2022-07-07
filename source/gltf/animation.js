import { GltfObject } from './gltf_object.js';
import { objectsFromJsons } from './utils.js';
import { gltfAnimationChannel, InterpolationPath } from './channel.js';
import { gltfAnimationSampler } from './animation_sampler.js';
import { gltfInterpolator } from './interpolator.js';
// import { JsonPointer } from 'json-ptr';
import { JsonPointer } from '../../node_modules/json-ptr/dist/esm/index.js';

class gltfAnimation extends GltfObject
{
    constructor()
    {
        super();
        this.channels = [];
        this.samplers = [];
        this.name = '';

        // not gltf
        this.interpolators = [];
        this.maxTime = 0;
        this.disjointAnimations = [];
    }

    fromJson(jsonAnimation)
    {
        super.fromJson(jsonAnimation);

        this.channels = objectsFromJsons(jsonAnimation.channels, gltfAnimationChannel);
        this.samplers = objectsFromJsons(jsonAnimation.samplers, gltfAnimationSampler);
        this.name = jsonAnimation.name;

        if(this.channels === undefined)
        {
            console.error("No channel data found for skin");
            return;
        }

        for(let i = 0; i < this.channels.length; ++i)
        {
            this.interpolators.push(new gltfInterpolator());
        }
    }

    // advance the animation, if totalTime is undefined, the animation is deactivated
    advance(gltf, totalTime)
    {
        if(this.channels === undefined)
        {
            return;
        }

        if(this.maxTime == 0)
        {
            for(let i = 0; i < this.channels.length; ++i)
            {
                const channel = this.channels[i];
                const sampler = this.samplers[channel.sampler];
                const input = gltf.accessors[sampler.input].getDeinterlacedView(gltf);
                const max = input[input.length - 1];
                if(max > this.maxTime)
                {
                    this.maxTime = max;
                }
            }
        }

        for(let i = 0; i < this.interpolators.length; ++i)
        {
            const channel = this.channels[i];
            const sampler = this.samplers[channel.sampler];
            const interpolator = this.interpolators[i];

            const node = gltf.nodes[channel.target.node];
            let property = null;
            let interpolant = null;

            switch(channel.target.path)
            {
            case InterpolationPath.TRANSLATION:
                interpolant = interpolator.interpolate(gltf, channel, sampler, totalTime, 3, this.maxTime);
                property = `/nodes/${channel.target.node}/translation`;
                break;
            case InterpolationPath.ROTATION:
                interpolant = interpolator.interpolate(gltf, channel, sampler, totalTime, 4, this.maxTime);
                property = `/nodes/${channel.target.node}/rotation`;
                break;
            case InterpolationPath.SCALE:
                interpolant = interpolator.interpolate(gltf, channel, sampler, totalTime, 3, this.maxTime);
                property = `/nodes/${channel.target.node}/scale`;
                break;
            case InterpolationPath.WEIGHTS:
            {
                interpolant = interpolator.interpolate(gltf, channel, sampler, totalTime, gltf.meshes[node.mesh].weights.value().length, this.maxTime);
                property = `/meshes/${node.mesh}/weights`;
                break;
            }
            case InterpolationPath.POINTER:
                break;
            }

            if (property != null) {
                let animatedProperty = JsonPointer.get(gltf, property);
                animatedProperty.animate(interpolant);
            }
        }
    }
}

class AnimatableProperty {
    constructor(value) {
        this.restValue = value;
        this.animatedValue = null;
    }

    restAt(value) {
        this.restValue = value;
    }

    animate(value) {
        this.animatedValue = value;
    }

    rest() {
        this.animatedValue = null;
    }

    value() {
        return this.animatedValue ?? this.restValue;
    }

    isDefined() {
        return this.restValue !== undefined;
    }
}

export { gltfAnimation, AnimatableProperty };
