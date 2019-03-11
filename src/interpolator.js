import { InterpolationModes } from './animation_sampler.js';
import { InterpolationPath } from './channel.js';
import { clamp, jsToGlSlice } from './utils.js';
import { quat, glMatrix } from 'gl-matrix';

class gltfInterpolator
{
    constructor()
    {
        this.prevKey = 0;
        this.prevT = 0.0;
    }

    slerpQuat(q1, q2, t)
    {
        const qn1 = quat.create();
        const qn2 = quat.create();

        quat.normalize(qn1, q1);
        quat.normalize(qn2, q2);

        const quatResult = quat.create();

        quat.slerp(quatResult, qn1, qn2, t);
        quat.normalize(quatResult, quatResult);

        return quatResult;
    }

    linear(prevKey, nextKey, output, t, stride)
    {
        const result = new glMatrix.ARRAY_TYPE(stride);

        for(let i = 0; i < stride; ++i)
        {
            result[i] = output[prevKey * stride + i] * (1-t) + output[nextKey * stride + i] * t;
        }

        return result;
    }

    cubicSpline(prevKey, nextKey, output, keyDelta, t, stride)
    {
        // stride: Count of components (4 in a quaternion).
        // Scale by 3, because each output entry consist of two tangents and one data-point.
        const prevIndex = prevKey * stride * 3;
        const nextIndex = nextKey * stride * 3;
        const A = 0;
        const V = 1 * stride;
        const B = 2 * stride;

        const result = new glMatrix.ARRAY_TYPE(stride);
        const tSq = t ** 2;
        const tCub = t ** 3;

        // We assume that the components in output are laid out like this: in-tangent, point, out-tangent.
        // https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#appendix-c-spline-interpolation
        for(let i = 0; i < stride; ++i)
        {
            const p0 = output[prevIndex + V + i];
            const m0 = keyDelta * output[prevIndex + B + i];
            const p1 = output[nextIndex + V + i];
            const m1 = keyDelta * output[nextIndex + A + i];

            result[i] = ((2*tCub - 3*tSq + 1) * p0) + ((tCub - 2*tSq + t) * m0) + ((-2*tCub + 3*tSq) * p1) + ((tCub - tSq) * m1);
        }

        return result;
    }

    resetKey()
    {
        this.prevKey = 0;
    }

    interpolate(gltf, channel, sampler, t, stride)
    {
        const input = gltf.accessors[sampler.input].getDeinterlacedView(gltf);
        const output = gltf.accessors[sampler.output].getDeinterlacedView(gltf);

        if(output.length === stride) // no interpolation for single keyFrame animations
        {
            return jsToGlSlice(output, 0, stride);
        }

        let nextKey = undefined;

        const maxKeyTime = input[input.length - 1];
        t = t % maxKeyTime; // loop animation

        if (this.prevT > t)
        {
            this.prevKey = 0;
        }

        this.prevT = t;

        for (let i = this.prevKey; i < input.length; ++i) // find current keyframe interval
        {
            if (t <= input[i])
            {
                nextKey = i;
                break;
            }
        }

        nextKey = clamp(nextKey, 1, input.length - 1);
        this.prevKey = clamp(nextKey - 1, 0, nextKey);

        const keyDelta = input[nextKey] - input[this.prevKey];
        t = (t - input[this.prevKey]) / keyDelta; // normalize t to 0..1

        if(channel.target.path === InterpolationPath.ROTATION)
        {

            if(InterpolationModes.CUBICSPLINE === sampler.interpolation)
            {
                // Output data is interpreted like this:
                // <tangent0> <data0> <tangent1> <tangent2> <data1> <tangent2>
                // ...        <q0>    <control0> <control1> <q1>    ...

                const q0 = this.getQuat(output, this.prevKey * 3 + 1);
                const control0 = this.getQuat(output, this.prevKey * 3 + 2);
                const control1 = this.getQuat(output, nextKey * 3);
                const q1 = this.getQuat(output, nextKey * 3 + 1);

                const result = quat.sqlerp(quat.create(), q0, control0, control1, q1, t);
                quat.normalize(result, result);
                return result;
            }
            else {
                const q0 = this.getQuat(output, this.prevKey);
                const q1 = this.getQuat(output, nextKey);

                return this.slerpQuat(q0, q1, t);
            }

        }

        switch(sampler.interpolation)
        {
            case InterpolationModes.STEP: return jsToGlSlice(output, this.prevKey * stride, stride); // t < 0.5 ? output[preKey] : output[nextKey]
            case InterpolationModes.CUBICSPLINE: return this.cubicSpline(this.prevKey, nextKey, output, keyDelta, t, stride);
            default: return this.linear(this.prevKey, nextKey, output, t, stride);
        }
    }

    getQuat(output, index)
    {
        const x = output[4 * index];
        const y = output[4 * index + 1];
        const z = output[4 * index + 2];
        const w = output[4 * index + 3];
        return quat.fromValues(x, y, z, w);
    }
}

export { gltfInterpolator };
