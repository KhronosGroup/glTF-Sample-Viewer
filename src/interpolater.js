import { gltfAnimationSampler, InterpolationModes } from './sampler.js';
import { gltfAnimationChannel, InterpolationPath } from './channel.js';
import { gltfAccessor } from './accessor.js';
import { clamp } from './utils.js';
import { InterpolationPath } from './channel.js';
import { quat } from 'gl-matrix';

class gltfInterpolater
{
    constructor()
    {
        this.prevKey = 0;
    }

    slerpQuat(q1, q2, t)
    {
        let quatResult = quat.create();
        quat.slerp(quatResult, q1, q2, t);
        quat.normalize(quatResult, quatResult);
        return quatResult;
    }

    linear(a, b, t)
    {
        return a * (1-t) + b * t;
    }

    cubicSpline(prevKey, nextKey, output, keyDelta, t)
    {
        const prevIndex = prevKey * 3;
        const nextIndex = nextKey * 3;
        const InTangent = 0;
        const Point = 1;
        const OutTangent = 2;

        // we assume that the components are layed out like this: in-tangent, point, out-tangent in output
        // https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#appendix-c-spline-interpolation
        const p0 = output[prevIndex + Point];
        const m0 = keyDelta * output[prevIndex + OutTangent];
        const p1 = output[nextIndex + Point];
        const m1 = keyDelta * output[nextIndex + InTangent];

        const tSq = t * t;
        const tCub = t * t * t;

        return ((2*tCub - 3*tSq + 1) * p0) + ((tCub - 2*tSq + t) * m0) + ((-2*tCub + 3*tSq) * p1) + ((tCub - tSq) * m1);
    }

    resetKey()
    {
        this.prevKey = 0;
    }

    interpolate(gltf, channel, sampler, t)
    {
        const input = gltf.accessors[sampler.input].getTypedView(gltf);
        const output = gltf.accessors[sampler.output].getTypedView(gltf);

        if(output.length === 1) // no interpolation for single keyFrame animations
        {
            return output[0];
        }

        let nextKey = undefined;
        const maxKeyTime = input[input.length - 1];
        t = t % maxKeyTime; // loop animation

        for(let i = this.prevKey; i < input.length; ++i) // find current keyframe interval
        {
            if(t <= input[i])
            {
                nextKey = i;
                break;
            }
        }

        if(nextKey === undefined)
        {
            nextKey = 1;
        }

        this.prevKey = clamp(nextKey - 1, 0, nextKey);

        const keyDelta = input[nextKey] - input[this.prevKey];
        t = (t - input[this.prevKey]) / keyDelta; // normalize t to 0..1

        if(channel.target.path === InterpolationPath.ROTATION)
        {
            return this.slerpQuat(output[this.prevKey], output[nextKey], t);
        }

        switch(sampler.interpolation)
        {
            case InterpolationModes.STEP: return output[this.prevKey]; // t < 0.5 ? output[preKey] : output[nextKey]
            case InterpolationModes.CUBICSPLINE:
            {
                return this.cubicSpline(this.prevKey, nextKey, output, keyDelta, t);
            }
            default: return this.linear(output[this.prevKey], output[nextKey], t);
        }
    }
}
