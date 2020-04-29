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
uniform int u_MipCount;
uniform samplerCube u_LambertianEnvSampler;
uniform samplerCube u_GGXEnvSampler;
uniform sampler2D u_GGXLUT;
uniform samplerCube u_CharlieEnvSampler;
uniform sampler2D u_CharlieLUT;

//clearcoat
uniform sampler2D u_ClearcoatSampler;
uniform int u_ClearcoatUVSet;
uniform mat3 u_ClearcoatUVTransform;

uniform sampler2D u_ClearcoatRoughnessSampler;
uniform int u_ClearcoatRoughnessUVSet;
uniform mat3 u_ClearcoatRoughnessUVTransform;

uniform sampler2D u_ClearcoatNormalSampler;
uniform int u_ClearcoatNormalUVSet;
uniform mat3 u_ClearcoatNormalUVTransform;

//sheen
uniform sampler2D u_SheenColorIntensitySampler;
uniform int u_SheenColorIntensityUVSet;
uniform mat3 u_SheenColorIntensityUVTransform;

//specular
uniform sampler2D u_MetallicRoughnessSpecularSampler;
uniform int u_MetallicRougnessSpecularTextureUVSet;
uniform mat3 u_MetallicRougnessSpecularUVTransform;

//subsurface
uniform sampler2D u_SubsurfaceColorSampler;
uniform int u_SubsurfaceColorUVSet;
uniform mat3 u_SubsurfaceColorUVTransform;

uniform sampler2D u_SubsurfaceThicknessSampler;
uniform int u_SubsurfaceThicknessUVSet;
uniform mat3 u_SubsurfaceThicknessUVTransform;

//thin film
uniform sampler2D u_ThinFilmLUT;

uniform sampler2D u_ThinFilmSampler;
uniform int u_ThinFilmUVSet;
uniform mat3 u_ThinFilmUVTransform;

uniform sampler2D u_ThinFilmThicknessSampler;
uniform int u_ThinFilmThicknessUVSet;
uniform mat3 u_ThinFilmThicknessUVTransform;

// Thickness:
uniform sampler2D u_ThicknessSampler;
uniform int u_ThicknessUVSet;
uniform mat3 u_ThicknessUVTransform;

// Anisotropy:
uniform sampler2D u_AnisotropySampler;
uniform int u_AnisotropyUVSet;
uniform mat3 u_AnisotropyUVTransform;
uniform sampler2D u_AnisotropyDirectionSampler;
uniform int u_AnisotropyDirectionUVSet;
uniform mat3 u_AnisotropyDirectionUVTransform;

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

    #ifdef HAS_OCCLUSION_UV_TRANSFORM
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
    #ifdef HAS_CLEARCOAT_UV_TRANSFORM
    uv *= u_ClearcoatUVTransform;
    #endif
    return uv.xy;
}

vec2 getClearcoatRoughnessUV()
{
    vec3 uv = vec3(u_ClearcoatRoughnessUVSet < 1 ? v_UVCoord1 : v_UVCoord2, 1.0);
    #ifdef HAS_CLEARCOATROUGHNESS_UV_TRANSFORM
    uv *= u_ClearcoatRoughnessUVTransform;
    #endif
    return uv.xy;
}

vec2 getClearcoatNormalUV()
{
    vec3 uv = vec3(u_ClearcoatNormalUVSet < 1 ? v_UVCoord1 : v_UVCoord2, 1.0);
    #ifdef HAS_CLEARCOATNORMAL_UV_TRANSFORM
    uv *= u_ClearcoatNormalUVTransform;
    #endif
    return uv.xy;
}

vec2 getSheenUV()
{
    vec3 uv = vec3(u_SheenColorIntensityUVSet < 1 ? v_UVCoord1 : v_UVCoord2, 1.0);
    #ifdef HAS_SHEENCOLORINTENSITY_UV_TRANSFORM
    uv *= u_SheenUVTransform;
    #endif
    return uv.xy;
}

vec2 getMetallicRoughnessSpecularUV()
{
    vec3 uv = vec3(u_MetallicRougnessSpecularTextureUVSet < 1 ? v_UVCoord1 : v_UVCoord2, 1.0);
    #ifdef HAS_METALLICROUGHNESSSPECULAR_UV_TRANSFORM
    uv *= u_MetallicRougnessSpecularUVTransform;
    #endif
    return uv.xy;
}

vec2 getSubsurfaceColorUV()
{
    vec3 uv = vec3(u_SubsurfaceColorUVSet < 1 ? v_UVCoord1 : v_UVCoord2, 1.0);
    #ifdef HAS_SUBSURFACECOLOR_UV_TRANSFORM
    uv *= u_SubsurfaceColorUVTransform;
    #endif
    return uv.xy;
}

vec2 getSubsurfaceThicknessUV()
{
    vec3 uv = vec3(u_SubsurfaceThicknessUVSet < 1 ? v_UVCoord1 : v_UVCoord2, 1.0);
    #ifdef HAS_SUBSURFACETHICKNESS_UV_TRANSFORM
    uv *= u_SubsurfaceThicknessUVTransform;
    #endif
    return uv.xy;
}

vec2 getThinFilmUV()
{
    vec3 uv = vec3(u_ThinFilmUVSet < 1 ? v_UVCoord1 : v_UVCoord2, 1.0);

    #ifdef HAS_THIN_FILM_UV_TRANSFORM
    uv *= u_ThinFilmUVTransform;
    #endif

    return uv.xy;
}

vec2 getThinFilmThicknessUV()
{
    vec3 uv = vec3(u_ThinFilmThicknessUVSet < 1 ? v_UVCoord1 : v_UVCoord2, 1.0);

    #ifdef HAS_THIN_FILM_THICKNESS_UV_TRANSFORM
    uv *= u_ThinFilmThicknessUVTransform;
    #endif

    return uv.xy;
}

vec2 getThicknessUV()
{
    vec3 uv = vec3(u_ThicknessUVSet < 1 ? v_UVCoord1 : v_UVCoord2, 1.0);

    #ifdef HAS_THICKNESS_UV_TRANSFORM
    uv *= u_ThicknessUVTransform;
    #endif

    return uv.xy;
}

vec2 getAnisotropyUV()
{
    vec3 uv = vec3(u_AnisotropyUVSet < 1 ? v_UVCoord1 : v_UVCoord2, 1.0);

    #ifdef HAS_ANISOTROPY_UV_TRANSFORM
    uv *= u_AnisotropyUVTransform;
    #endif

    return uv.xy;
}

vec2 getAnisotropyDirectionUV()
{
    vec3 uv = vec3(u_AnisotropyDirectionUVSet < 1 ? v_UVCoord1 : v_UVCoord2, 1.0);

    #ifdef HAS_ANISOTROPY_DIRECTION_UV_TRANSFORM
    uv *= u_AnisotropyDirectionUVTransform;
    #endif

    return uv.xy;
}
