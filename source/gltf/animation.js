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

        this.errors = [];
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

            let property = null;
            switch(channel.target.path)
            {
            case InterpolationPath.TRANSLATION:
                property = `/nodes/${channel.target.node}/translation`;
                break;
            case InterpolationPath.ROTATION:
                property = `/nodes/${channel.target.node}/rotation`;
                break;
            case InterpolationPath.SCALE:
                property = `/nodes/${channel.target.node}/scale`;
                break;
            case InterpolationPath.WEIGHTS:
                property = `/meshes/${gltf.nodes[channel.target.node].mesh}/weights`;
                break;
            case InterpolationPath.POINTER:
                property = channel.target.extensions.KHR_animation_pointer.pointer;
                break;
            }

            if (property != null) {
                const animatedProperty = JsonPointer.get(gltf, property);
                if (animatedProperty === undefined || !animatedProperty instanceof AnimatableProperty) {
                    if (!this.errors.includes(property)) {
                        console.warn(`Cannot animate ${property}`);
                        this.errors.push(property);
                    }
                    continue;
                }
                if (animatedProperty.restValue === undefined) {
                    continue;
                }

                let stride = animatedProperty.restValue?.length ?? 1;

                if (property.endsWith("/weights") && stride == 0) {
                    const parent = JsonPointer.get(gltf, property.substring(0, property.length - "/weights".length));
                    const mesh = property.startsWith("/nodes") ? gltf.meshes[parent.mesh] : parent;
                    const targets = mesh.primitives[0]?.targets ?? 0;
                    stride = targets?.length ?? 0;
                }
                
                const interpolant = interpolator.interpolate(gltf, channel, sampler, totalTime, stride, this.maxTime);
                animatedProperty.animate(interpolant);

                if (property == "/nodes/16/weights") {
                    const node = gltf.nodes[16];
                    const mesh = gltf.meshes[node.mesh];
                    const targets = mesh.primitives[0].targets;
                }
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

const makeAnimatable = (object, json, properties) => {
    for (const property in properties) {
        object[property] = new AnimatableProperty(json[property] ?? properties[property]);
    }
}

export { gltfAnimation, AnimatableProperty, makeAnimatable };
