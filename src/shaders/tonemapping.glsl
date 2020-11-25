uniform float u_Exposure;

const float GAMMA = 2.2;
const float INV_GAMMA = 1.0 / GAMMA;

// linear to sRGB approximation
// see http://chilliant.blogspot.com/2012/08/srgb-approximations-for-hlsl.html
vec3 linearTosRGB(vec3 color)
{
    return pow(color, vec3(INV_GAMMA));
}

// sRGB to linear approximation
// see http://chilliant.blogspot.com/2012/08/srgb-approximations-for-hlsl.html
vec3 sRGBToLinear(vec3 srgbIn)
{
    return vec3(pow(srgbIn.xyz, vec3(GAMMA)));
}

vec4 sRGBToLinear(vec4 srgbIn)
{
    return vec4(sRGBToLinear(srgbIn.xyz), srgbIn.w);
}

// ACES tone map
// see: https://knarkowicz.wordpress.com/2016/01/06/aces-filmic-tone-mapping-curve/
vec3 toneMapACES(vec3 color)
{
    const float A = 2.51;
    const float B = 0.03;
    const float C = 2.43;
    const float D = 0.59;
    const float E = 0.14;
    return linearTosRGB(clamp((color * (A * color + B)) / (color * (C * color + D) + E), 0.0, 1.0));
}

float toneMapACESccScalar(float color)
{
    if(color <= 0.0)
    {
        return -0.3588571428571428;
    }
    else if(color < 0.000030517578125)
    {
        return (log2(0.0000152587890625 + (color * 0.5)) + 9.72) / 17.52;
    }
    else
    {
        return (log2(color) + 9.72) / 17.52;
    }
}

// ACEScc tone map
// see: https://www.khronos.org/registry/DataFormat/specs/1.3/dataformat.1.3.html#TRANSFER_ACESCC
vec3 toneMapACEScc(vec3 color)
{
    vec3 result;
    result.x = toneMapACESccScalar(color.x);
    result.y = toneMapACESccScalar(color.y);
    result.z = toneMapACESccScalar(color.z);

    return linearTosRGB(result);
}

vec3 toneMap(vec3 color)
{
    color *= u_Exposure;

#ifdef TONEMAP_ACES
    //return toneMapACES(color);
    return toneMapACEScc(color);
#endif

    return linearTosRGB(color);
}
