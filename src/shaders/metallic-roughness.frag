//
// This fragment shader defines a reference implementation for Physically Based Shading of
// a microfacet surface material defined by a glTF model.
//
// References:
// [1] Real Shading in Unreal Engine 4
//     http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf
// [2] Physically Based Shading at Disney
//     http://blog.selfshadow.com/publications/s2012-shading-course/burley/s2012_pbs_disney_brdf_notes_v3.pdf
// [3] README.md - Environment Maps
//     https://github.com/KhronosGroup/glTF-WebGL-PBR/#environment-maps
// [4] "An Inexpensive BRDF Model for Physically based Rendering" by Christophe Schlick
//     https://www.cs.virginia.edu/~jdl/bib/appearance/analytic%20models/schlick94b.pdf
// [5] "KHR_materials_clearcoat"
//     https://github.com/ux3d/glTF/tree/KHR_materials_pbrClearcoat/extensions/2.0/Khronos/KHR_materials_clearcoat
// [6] "KHR_materials_specular"
//     https://github.com/ux3d/glTF/tree/KHR_materials_pbrClearcoat/extensions/2.0/Khronos/KHR_materials_specular


precision highp float;

#include <tonemapping.glsl>
#include <textures.glsl>
#include <functions.glsl>

out vec4 g_finalColor;

// KHR_lights_punctual extension.
// see https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_lights_punctual

struct Light
{
    vec3 direction;
    float range;

    vec3 color;
    float intensity;

    vec3 position;
    float innerConeCos;

    float outerConeCos;
    int type;

    vec2 padding;
};

const int LightType_Directional = 0;
const int LightType_Point = 1;
const int LightType_Spot = 2;

#ifdef USE_PUNCTUAL
uniform Light u_Lights[LIGHT_COUNT];
#endif

// METALLICROUGHNESS)
uniform float u_MetallicFactor;
uniform float u_RoughnessFactor;
uniform vec4 u_BaseColorFactor;

// SPECULARGLOSSINESS
uniform vec3 u_SpecularFactor;
uniform vec4 u_DiffuseFactor;
uniform float u_GlossinessFactor;

//Sheen extension
uniform float u_SheenIntensityFactor;
uniform vec3 u_SheenColorFactor;
uniform float u_SheenRoughness;

//Clearcoat
uniform float u_ClearcoatFactor;
uniform float u_ClearcoatRoughnessFactor;

//KHR Specular
uniform float u_MetallicRoughnessSpecularFactor;

// ALPHAMODE_MASK
uniform float u_AlphaCutoff;

uniform vec3 u_Camera;
uniform int u_MipCount;

struct MaterialInfo
{
    float perceptualRoughness;      // roughness value, as authored by the model creator (input to shader)
    vec3 f0;                        // full reflectance color (normal incidence angle)

    float alphaRoughness;           // roughness mapped to a more linear change in the roughness (proposed by [2])
    vec3 albedoColor;

    vec3 f90;                       // reflectance color at grazing angle
    float metallic;

    vec3 normal; // getNormal()
    vec3 baseColor; // getBaseColor()

    float sheenIntensity;
    vec3 sheenColor;
    float sheenRoughness;

    vec3 clearcoatF0;
    vec3 clearcoatF90;
    float clearcoatFactor;
    vec3 clearcoatNormal;
    float clearcoatRoughness;
};

vec4 getBaseColor()
{
    vec4 baseColor = vec4(1, 1, 1, 1);

    #if defined(MATERIAL_SPECULARGLOSSINESS)
        baseColor = u_DiffuseFactor;
    #elif defined(MATERIAL_METALLICROUGHNESS)
        baseColor = u_BaseColorFactor;
    #endif

    #if defined(MATERIAL_SPECULARGLOSSINESS) && defined(HAS_DIFFUSE_MAP)
        baseColor *= SRGBtoLINEAR(texture(u_DiffuseSampler, getDiffuseUV()));
    #elif defined(MATERIAL_METALLICROUGHNESS) && defined(HAS_BASE_COLOR_MAP)
        baseColor *= SRGBtoLINEAR(texture(u_BaseColorSampler, getBaseColorUV()));
    #endif

    return baseColor * getVertexColor();
}

// Lambert lighting
// see https://seblagarde.wordpress.com/2012/01/08/pi-or-not-to-pi-in-game-lighting-equation/
vec3 lambertian(vec3 diffuseColor)
{
    return diffuseColor / M_PI;
}

// The following equation models the Fresnel reflectance term of the spec equation (aka F())
// Implementation of fresnel from [4], Equation 15
vec3 fresnelReflection(vec3 f0, vec3 f90, float VdotH)
{
    return f0 + (f90 - f0) * pow(clamp(1.0 - VdotH, 0.0, 1.0), 5.0);
}

// Smith Joint GGX
// Note: Vis = G / (4 * NdotL * NdotV)
// see Eric Heitz. 2014. Understanding the Masking-Shadowing Function in Microfacet-Based BRDFs. Journal of Computer Graphics Techniques, 3
// see Real-Time Rendering. Page 331 to 336.
// see https://google.github.io/filament/Filament.md.html#materialsystem/specularbrdf/geometricshadowing(specularg)
float visibility(float NdotL, float NdotV, float alphaRoughness)
{
    float alphaRoughnessSq = alphaRoughness * alphaRoughness;

    float GGXV = NdotL * sqrt(NdotV * NdotV * (1.0 - alphaRoughnessSq) + alphaRoughnessSq);
    float GGXL = NdotV * sqrt(NdotL * NdotL * (1.0 - alphaRoughnessSq) + alphaRoughnessSq);

    float GGX = GGXV + GGXL;
    if (GGX > 0.0)
    {
        return 0.5 / GGX;
    }
    return 0.0;
}

// The following equation(s) model the distribution of microfacet normals across the area being drawn (aka D())
// Implementation from "Average Irregularity Representation of a Roughened Surface for Ray Reflection" by T. S. Trowbridge, and K. P. Reitz
// Follows the distribution function recommended in the SIGGRAPH 2013 course notes from EPIC Games [1], Equation 3.
float microfacetDistribution(float NdotH, float alphaRoughness)
{
    float alphaRoughnessSq = alphaRoughness * alphaRoughness;
    float f = (NdotH * NdotH) * (alphaRoughnessSq - 1.0) + 1.0;
    return alphaRoughnessSq / (M_PI * f * f);
}

//Sheen implementation-------------------------------------------------------------------------------------
// See  https://github.com/sebavan/glTF/tree/KHR_materials_sheen/extensions/2.0/Khronos/KHR_materials_sheen

// Estevez and Kulla http://www.aconty.com/pdf/s2017_pbs_imageworks_sheen.pdf
float charlieDistribution(float sheenRoughness, float NdotH)
{
    float alphaG = sheenRoughness * sheenRoughness;
    float invR = 1.0 / alphaG;
    float cos2h = NdotH * NdotH;
    float sin2h = 1.0 - cos2h;
    return (2.0 + invR) * pow(sin2h, invR * 0.5) / (2.0 * M_PI);
}

// https://github.com/google/filament/blob/master/shaders/src/brdf.fs#L136
float neubeltVisibility(float NdotL, float NdotV)
{
    return clamp(1.0 / (4.0 * (NdotL + NdotV - NdotL * NdotV)),0.0,1.0);
}

// f_sheen
vec3 evaluateSheen(vec3 sheenColor, float sheenIntensity, float sheenRoughness, float NdotL, float NdotV, float NdotH)
{
    float sheenDistribution = charlieDistribution(sheenRoughness, NdotH);
    float sheenVisibility = neubeltVisibility(NdotL, NdotV);
    vec3 sheenTerm = sheenColor * sheenIntensity * sheenDistribution * sheenVisibility;
    return sheenTerm * M_PI;
}

//https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#acknowledgments AppendixB
vec3 diffuseBRDF(vec3 f0, vec3 f90, vec3 diffuseColor, float VdotH)
{
    return (1.0 - fresnelReflection(f0, f90, VdotH)) * lambertian(diffuseColor);
}

//  https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#acknowledgments AppendixB
vec3 specularMicrofacetBRDF (vec3 f0, vec3 f90, float alphaRoughness, float VdotH, float NdotL, float NdotV, float NdotH)
{
    vec3 F = fresnelReflection(f0, f90, VdotH);
    float Vis = visibility(NdotL, NdotV, alphaRoughness);
    float D = microfacetDistribution(NdotH, alphaRoughness);

    return F * Vis * D;
}

vec3 getSpecularIBLContribution(vec3 n, vec3 v, float perceptualRoughness, vec3 specularColor)
{
    float NdotV = clampedDot(n, v);
    float lod = clamp(perceptualRoughness * float(u_MipCount), 0.0, float(u_MipCount));
    vec3 reflection = normalize(reflect(-v, n));

    vec2 brdfSamplePoint = clamp(vec2(NdotV, perceptualRoughness), vec2(0.0, 0.0), vec2(1.0, 1.0));
    vec2 brdf = texture(u_brdfLUT, brdfSamplePoint).rg;
    vec4 specularSample = textureLod(u_SpecularEnvSampler, reflection, lod);

    vec3 specularLight = specularSample.rgb;

#ifndef USE_HDR
    specularLight = SRGBtoLINEAR(specularLight);
#endif

   return specularLight * (specularColor * brdf.x + brdf.y);
}

vec3 getDiffuseIBLContribution(vec3 n, vec3 diffuseColor)
{
    vec3 diffuseLight = texture(u_DiffuseEnvSampler, n).rgb;

    #ifndef USE_HDR
        diffuseLight = SRGBtoLINEAR(diffuseLight);
    #endif

    return diffuseLight * diffuseColor;
}

vec3 getSheenIBLContribution(vec3 n, vec3 v, float perceptualRoughness, vec3 sheenColor)
{
    // TODO: implement
    return vec3(0);
}

// https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_lights_punctual/README.md#range-property
float getRangeAttenuation(float range, float distance)
{
    if (range <= 0.0)
    {
        // negative range means unlimited
        return 1.0;
    }
    return max(min(1.0 - pow(distance / range, 4.0), 1.0), 0.0) / pow(distance, 2.0);
}

// https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_lights_punctual/README.md#inner-and-outer-cone-angles
float getSpotAttenuation(vec3 pointToLight, vec3 spotDirection, float outerConeCos, float innerConeCos)
{
    float actualCos = dot(normalize(spotDirection), normalize(-pointToLight));
    if (actualCos > outerConeCos)
    {
        if (actualCos < innerConeCos)
        {
            return smoothstep(outerConeCos, innerConeCos, actualCos);
        }
        return 1.0;
    }
    return 0.0;
}

MaterialInfo getSpecularGlossinessInfo(MaterialInfo info)
{
    info.f0 = u_SpecularFactor;
    info.perceptualRoughness = u_GlossinessFactor;

#ifdef HAS_SPECULAR_GLOSSINESS_MAP
    vec4 sgSample = SRGBtoLINEAR(texture(u_SpecularGlossinessSampler, getSpecularGlossinessUV()));
    info.perceptualRoughness *= sgSample.a ; // glossiness to roughness
    info.f0 *= sgSample.rgb; // specular
#endif // ! HAS_SPECULAR_GLOSSINESS_MAP

    info.perceptualRoughness = 1.0 - info.perceptualRoughness; // 1 - glossiness
    info.albedoColor = info.baseColor.rgb * (1.0 - max(max(info.f0.r, info.f0.g), info.f0.b));

    return info;
}

// KHR_extension_specular alters f0 on metallic materials based on the specular factor specified in the extention
float getMetallicRoughnessSpecularFactor()
{
    //F0 = 0.08 * specularFactor * specularTexture
#ifdef HAS_MR_SPECULAR_TEXTURE_MAP
    vec4 specSampler =  texture(u_MetallicRoughnessSpecularTextureSampler, getMetallicRoughnessSpecularUV());
    return 0.08 * u_MetallicRoughnessSpecularFactor * specSampler.a;
#endif
    return  0.08 * u_MetallicRoughnessSpecularFactor;
}

MaterialInfo getMetallicRoughnessInfo(MaterialInfo info)
{
    info.metallic = u_MetallicFactor;
    info.perceptualRoughness = u_RoughnessFactor;

#ifdef HAS_METALLIC_ROUGHNESS_MAP
    // Roughness is stored in the 'g' channel, metallic is stored in the 'b' channel.
    // This layout intentionally reserves the 'r' channel for (optional) occlusion map data
    vec4 mrSample = texture(u_MetallicRoughnessSampler, getMetallicRoughnessUV());
    info.perceptualRoughness *= mrSample.g;
    info.metallic *= mrSample.b;
#endif

    vec3 f0 = vec3(0.04);
#ifdef MATERIAL_SPECULAR
    f0 = vec3(getMetallicRoughnessSpecularFactor());
#endif
    info.albedoColor = mix(info.baseColor.rgb * (vec3(1.0) - f0),  vec3(0), info.metallic);
    info.f0 = mix(f0, info.baseColor.rgb, info.metallic);

    return info;
}

MaterialInfo getSheenInfo(MaterialInfo info)
{
    info.sheenColor = u_SheenColorFactor;
    info.sheenIntensity = u_SheenIntensityFactor;
    info.sheenRoughness = u_SheenRoughness;

    #ifdef HAS_SHEEN_COLOR_INTENSITY_TEXTURE_MAP
        vec4 sheenSample = texture(u_sheenColorIntensitySampler, getSheenUV());
        info.sheenColor *= sheenSample.xyz;
        info.sheenIntensity *= sheenSample.w;
    #endif

    return info;
}

MaterialInfo getClearCoatInfo(MaterialInfo info)
{
    info.clearcoatFactor = u_ClearcoatFactor;
    info.clearcoatRoughness = u_ClearcoatRoughnessFactor;
    info.clearcoatF0 = vec3(0.04);
    info.clearcoatF90 = vec3(clamp(info.clearcoatF0 * 50.0, 0.0, 1.0));

    #ifdef HAS_CLEARCOAT_TEXTURE_MAP
        vec4 ccSample = texture(u_ClearcoatSampler, getClearcoatUV());
        info.clearcoatFactor *= ccSample.r;
    #endif

    #ifdef HAS_CLEARCOAT_ROUGHNESS_MAP
        vec4 ccSampleRough = texture(u_ClearcoatRoughnessSampler, getClearcoatRoughnessUV());
        info.clearcoatRoughness *= ccSampleRough.g;
    #endif

    #ifdef HAS_CLEARCOAT_NORMAL_MAP
        vec4 ccSampleNor = texture(u_ClearcoatNormalSampler, getClearcoatNormalUV());
        info.clearcoatNormal = ccSampleNor.xyz;
    #else
        info.clearcoatNormal = getNormal(true); // get geometry normal
    #endif

    info.clearcoatRoughness = clamp(info.clearcoatRoughness, 0.0, 1.0);

    return info;
}

void main()
{
    vec4 baseColor = getBaseColor();

#ifdef ALPHAMODE_MASK
    if(baseColor.a < u_AlphaCutoff)
    {
        discard;
    }
    baseColor.a = 1.0;
#endif

#ifdef ALPHAMODE_OPAQUE
    baseColor.a = 1.0;
#endif

#ifdef MATERIAL_UNLIT
    g_finalColor = (vec4(LINEARtoSRGB(baseColor.rgb), baseColor.a));
    return;
#endif

    MaterialInfo materialInfo;

    materialInfo.baseColor = baseColor.rgb;

#ifdef MATERIAL_SPECULARGLOSSINESS
    materialInfo = getSpecularGlossinessInfo(materialInfo);
#endif

#ifdef MATERIAL_METALLICROUGHNESS
    materialInfo = getMetallicRoughnessInfo(materialInfo);
#endif

#ifdef MATERIAL_SHEEN
    materialInfo = getSheenInfo(materialInfo);
#endif

#ifdef MATERIAL_CLEARCOAT
    materialInfo = getClearCoatInfo(materialInfo);
#endif

    materialInfo.perceptualRoughness = clamp(materialInfo.perceptualRoughness, 0.0, 1.0);
    materialInfo.metallic = clamp(materialInfo.metallic, 0.0, 1.0);

    // Roughness is authored as perceptual roughness; as is convention,
    // convert to material roughness by squaring the perceptual roughness.
    materialInfo.alphaRoughness = materialInfo.perceptualRoughness * materialInfo.perceptualRoughness;

    // Compute reflectance.
    float reflectance = max(max(materialInfo.f0.r, materialInfo.f0.g), materialInfo.f0.b);

    // Anything less than 2% is physically impossible and is instead considered to be shadowing. Compare to "Real-Time-Rendering" 4th editon on page 325.
    materialInfo.f90 = vec3(clamp(reflectance * 50.0, 0.0, 1.0));

    vec3 normal = getNormal(false);
    vec3 view = normalize(u_Camera - v_Position);

    materialInfo.normal = normal;

    // LIGHTING
    vec3 f_specular = vec3(0.0);
    vec3 f_diffuse = vec3(0.0);
    vec3 f_emissive = vec3(0.0);
    vec3 f_clearcoat = vec3(0.0);
    vec3 f_sheen = vec3(0.0);

    // Calculate lighting contribution from image based lighting source (IBL)
#ifdef USE_IBL
    f_specular += getSpecularIBLContribution(normal, view, materialInfo.perceptualRoughness, materialInfo.f0); // specularColor
    f_diffuse += getDiffuseIBLContribution(normal, materialInfo.albedoColor);

    #ifdef MATERIAL_CLEARCOAT
        f_clearcoat += getSpecularIBLContribution(materialInfo.clearcoatNormal, view, materialInfo.clearcoatRoughness, materialInfo.clearcoatF0);
    #endif

    #ifdef MATERIAL_SHEEN
        f_sheen += getSheenIBLContribution(normal, view, materialInfo.sheenRoughness, materialInfo.sheenColor);
    #endif
#endif

vec3 punctualColor = vec3(0.0);

#ifdef USE_PUNCTUAL
    for (int i = 0; i < LIGHT_COUNT; ++i)
    {
        Light light = u_Lights[i];

        vec3 pointToLight = -light.direction;
        float rangeAttenuation = 1.0;
        float spotAttenuation = 1.0;

        if(light.type != LightType_Directional)
        {
            pointToLight = light.position - v_Position;
        }

        // point and spot
        if (light.type != LightType_Directional)
        {
            rangeAttenuation = getRangeAttenuation(light.range, length(pointToLight));
        }
        if (light.type == LightType_Spot)
        {
            spotAttenuation = getSpotAttenuation(pointToLight, light.direction, light.outerConeCos, light.innerConeCos);
        }

        vec3 intensity = rangeAttenuation * spotAttenuation * light.intensity * light.color;

        AngularInfo angularInfo = getAngularInfo(pointToLight, materialInfo.normal, view);

        if (angularInfo.NdotL > 0.0 || angularInfo.NdotV > 0.0)
        {
            // Calculation of analytical ligh
            //https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#acknowledgments AppendixB
            f_diffuse += intensity * angularInfo.NdotL *  diffuseBRDF(materialInfo.f0, materialInfo.f90, materialInfo.albedoColor, angularInfo.VdotH);
            f_specular += intensity * angularInfo.NdotL * specularMicrofacetBRDF(materialInfo.f0, materialInfo.f90, materialInfo.alphaRoughness, angularInfo.VdotH, angularInfo.NdotL, angularInfo.NdotV, angularInfo.NdotH);

            #ifdef MATERIAL_SHEEN
                f_sheen += intensity * angularInfo.NdotL * evaluateSheen(materialInfo.sheenColor, materialInfo.sheenIntensity, materialInfo.sheenRoughness, angularInfo.NdotL, angularInfo.NdotV, angularInfo.NdotH);
            #endif

            #ifdef MATERIAL_CLEARCOAT
                AngularInfo coatAngles = getAngularInfo(pointToLight, materialInfo.clearcoatNormal, view);
                f_clearcoat += intensity * coatAngles.NdotL * specularMicrofacetBRDF(materialInfo.
                , materialInfo.clearcoatF90, materialInfo.clearcoatRoughness * materialInfo.clearcoatRoughness, coatAngles.VdotH, coatAngles.NdotL, coatAngles.NdotV, coatAngles.NdotH);
            #endif
        }
    }
#endif // !USE_PUNCTUAL

    f_emissive = u_EmissiveFactor;
#ifdef HAS_EMISSIVE_MAP
    f_emissive *= SRGBtoLINEAR(texture(u_EmissiveSampler, getEmissiveUV())).rgb;
#endif

    vec3 color = vec3(0);

///
/// Layer blending
///

    vec3 cleacoatBlendFactor = vec3(0.f);

    #ifdef MATERIAL_CLEARCOAT
        cleacoatBlendFactor = materialInfo.clearcoatFactor * fresnelReflection(materialInfo.clearcoatF0, materialInfo.clearcoatF90, clampedDot(materialInfo.clearcoatNormal, view));
    #endif

    color = (f_emissive + f_diffuse + (1.0 - reflectance) * f_sheen) * (1.0 - cleacoatBlendFactor) + mix(f_specular, f_clearcoat, cleacoatBlendFactor);

    float ao = 1.0;
    // Apply optional PBR terms for additional (optional) shading
#ifdef HAS_OCCLUSION_MAP
    ao = texture(u_OcclusionSampler,  getOcclusionUV()).r;
    color = mix(color, color * ao, u_OcclusionStrength);
#endif

#ifndef DEBUG_OUTPUT // no debug

    // regular shading
    g_finalColor = vec4(toneMap(color), baseColor.a);

#else // debug output

    #ifdef DEBUG_METALLIC
        g_finalColor.rgb = vec3(materialInfo.metallic);
    #endif

    #ifdef DEBUG_ROUGHNESS
        g_finalColor.rgb = vec3(materialInfo.perceptualRoughness);
    #endif

    #ifdef DEBUG_NORMAL
        #ifdef HAS_NORMAL_MAP
            g_finalColor.rgb = texture(u_NormalSampler, getNormalUV()).rgb;
        #else
            g_finalColor.rgb = vec3(0.5, 0.5, 1.0);
        #endif
    #endif

    #ifdef DEBUG_BASECOLOR
        g_finalColor.rgb = LINEARtoSRGB(materialInfo.baseColor);
    #endif

    #ifdef DEBUG_OCCLUSION
        g_finalColor.rgb = vec3(ao);
    #endif

    #ifdef DEBUG_F0
        g_finalColor.rgb = materialInfo.f0;
    #endif

    #ifdef DEBUG_EMISSIVE
        g_finalColor.rgb = f_emissive;
    #endif

    #ifdef DEBUG_FSPECULAR
        g_finalColor.rgb = f_specular;
    #endif

    #ifdef DEBUG_FDIFFUSE
        g_finalColor.rgb = f_diffuse;
    #endif

    #ifdef DEBUG_FCLEARCOAT
        g_finalColor.rgb = f_clearcoat;
    #endif

    #ifdef DEBUG_ALPHA
        g_finalColor.rgb = vec3(baseColor.a);
    #endif

    g_finalColor.a = 1.0;

#endif // !DEBUG_OUTPUT
}
