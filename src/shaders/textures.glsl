in vec2 v_UVCoord1;
in vec2 v_UVCoord2;

// General Material
uniform sampler2D u_NormalSampler;
uniform float u_NormalScale;
uniform int u_NormalUVSet;
uniform mat3 u_NormalUVTransform;

uniform vec3 u_EmissiveFactor;
uniform sampler2D u_EmissiveSampler;
uniform int u_EmissiveUVSet;
uniform mat3 u_EmissiveUVTransform;

uniform sampler2D u_OcclusionSampler;
uniform int u_OcclusionUVSet;
uniform float u_OcclusionStrength;
uniform mat3 u_OcclusionUVTransform;

// Metallic Roughness Material
uniform sampler2D u_BaseColorSampler;
uniform int u_BaseColorUVSet;
uniform mat3 u_BaseColorUVTransform;

uniform sampler2D u_MetallicRoughnessSampler;
uniform int u_MetallicRoughnessUVSet;
uniform mat3 u_MetallicRoughnessUVTransform;

// Specular Glossiness Material
uniform sampler2D u_DiffuseSampler;
uniform int u_DiffuseUVSet;
uniform mat3 u_DiffuseUVTransform;

uniform sampler2D u_SpecularGlossinessSampler;
uniform int u_SpecularGlossinessUVSet;
uniform mat3 u_SpecularGlossinessUVTransform;

// IBL
uniform samplerCube u_DiffuseEnvSampler;
uniform samplerCube u_SpecularEnvSampler;
uniform sampler2D u_brdfLUT;

//clearcoat
uniform sampler2D u_ClearcoatSampler;
uniform int u_ClearcoatUVSet;

uniform sampler2D u_ClearcoatRoughnessSampler;
uniform int u_ClearcoatRoughnessUVSet;

uniform sampler2D u_ClearcoatNormalSampler;
uniform int u_ClearcoatNormalUVSet;

//sheen
uniform sampler2D u_sheenColorIntensitySampler;
uniform int u_sheenColorIntensityUVSet;

//specular
uniform sampler2D u_MetallicRoughnessSpecularTextureSampler;
uniform int u_MetallicRougnessSpecularTextureUVSet;

vec2 getNormalUV()
{
    vec3 uv = vec3(u_NormalUVSet < 1 ? v_UVCoord1 : v_UVCoord2, 1.0);

    #ifdef HAS_NORMAL_UV_TRANSFORM
    uv *= u_NormalUVTransform;
    #endif

    return uv.xy;
}

vec2 getEmissiveUV()
{
    vec3 uv = vec3(u_EmissiveUVSet < 1 ? v_UVCoord1 : v_UVCoord2, 1.0);

    #ifdef HAS_EMISSIVE_UV_TRANSFORM
    uv *= u_EmissiveUVTransform;
    #endif

    return uv.xy;
}

vec2 getOcclusionUV()
{
    vec3 uv = vec3(u_OcclusionUVSet < 1 ? v_UVCoord1 : v_UVCoord2, 1.0);

    #ifdef HAS_OCCLSION_UV_TRANSFORM
    uv *= u_OcclusionUVTransform;
    #endif

    return uv.xy;
}

vec2 getBaseColorUV()
{
    vec3 uv = vec3(u_BaseColorUVSet < 1 ? v_UVCoord1 : v_UVCoord2, 1.0);

    #ifdef HAS_BASECOLOR_UV_TRANSFORM
    uv *= u_BaseColorUVTransform;
    #endif

    return uv.xy;
}

vec2 getMetallicRoughnessUV()
{
    vec3 uv = vec3(u_MetallicRoughnessUVSet < 1 ? v_UVCoord1 : v_UVCoord2, 1.0);

    #ifdef HAS_METALLICROUGHNESS_UV_TRANSFORM
    uv *= u_MetallicRoughnessUVTransform;
    #endif

    return uv.xy;
}

vec2 getSpecularGlossinessUV()
{
    vec3 uv = vec3(u_SpecularGlossinessUVSet < 1 ? v_UVCoord1 : v_UVCoord2, 1.0);

    #ifdef HAS_SPECULARGLOSSINESS_UV_TRANSFORM
    uv *= u_SpecularGlossinessUVTransform;
    #endif

    return uv.xy;
}

vec2 getDiffuseUV()
{
    vec3 uv = vec3(u_DiffuseUVSet < 1 ? v_UVCoord1 : v_UVCoord2, 1.0);

    #ifdef HAS_DIFFUSE_UV_TRANSFORM
    uv *= u_DiffuseUVTransform;
    #endif

    return uv.xy;
}

vec2 getClearcoatUV()
{
    vec3 uv = vec3(u_ClearcoatUVSet < 1 ? v_UVCoord1 : v_UVCoord2, 1.0);
    return uv.xy;
}

vec2 getClearcoatRoughnessUV()
{
    vec3 uv = vec3(u_ClearcoatRoughnessUVSet < 1 ? v_UVCoord1 : v_UVCoord2, 1.0);
    return uv.xy;
}

vec2 getClearcoatNormalUV()
{
    vec3 uv = vec3(u_ClearcoatNormalUVSet < 1 ? v_UVCoord1 : v_UVCoord2, 1.0);
    return uv.xy;
}

vec2 getSheenUV()
{
    vec3 uv = vec3(v_UVCoord1, 1.0);
#ifdef HAS_SHEEN_COLOR_INTENSITY_TEXTURE_MAP
    uv.xy = u_sheenColorIntensityUVSet < 1 ? v_UVCoord1 : v_UVCoord2;
#endif
    return uv.xy;
}

vec2 getMetallicRoughnessSpecularUV()
{
    vec3 uv = vec3(u_MetallicRougnessSpecularTextureUVSet < 1 ? v_UVCoord1 : v_UVCoord2, 1.0);
    return uv.xy;
}
