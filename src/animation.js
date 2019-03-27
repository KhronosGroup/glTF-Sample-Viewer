import { GltfObject } from './gltf_object.js';
import { objectsFromJsons } from './utils.js';
import { gltfAnimationChannel, InterpolationPath } from './channel.js';
import { gltfAnimationSampler } from './animation_sampler.js';
import { gltfInterpolator } from './interpolator.js';

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
    }

    fromJson(jsonAnimation)
    {
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

    advance(gltf, totalTime)
    {
        if(this.channels === undefined)
        {
            return;
        }

        for(let i = 0; i < this.interpolators.length; ++i)
        {
            const channel = this.channels[i];
            const sampler = this.samplers[channel.sampler];
            const interpolator = this.interpolators[i];

            const node = gltf.nodes[channel.target.node];

            switch(channel.target.path)
            {
            case InterpolationPath.TRANSLATION:
                node.applyTranslation(interpolator.interpolate(gltf, channel, sampler, totalTime, 3));
                break;
            case InterpolationPath.ROTATION:
                node.applyRotation(interpolator.interpolate(gltf, channel, sampler, totalTime, 4));
                break;
            case InterpolationPath.SCALE:
                node.applyScale(interpolator.interpolate(gltf, channel, sampler, totalTime, 3));
                break;
            case InterpolationPath.WEIGHTS:
            {
                const mesh = gltf.meshes[node.mesh];
                mesh.weights = interpolator.interpolate(gltf, channel, sampler, totalTime, mesh.weights.length);
                break;
            }
            }
        }
    }
}

export { gltfAnimation };
