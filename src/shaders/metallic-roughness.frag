
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

// ALPHAMODE_MASK
uniform float u_AlphaCutoff;

uniform vec3 u_Camera;
uniform int u_MipCount;

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

struct MaterialInfo
{
    float perceptualRoughness;    // roughness value, as authored by the model creator (input to shader)
    vec3 f0;            // full reflectance color (normal incidence angle)

    float alphaRoughness;         // roughness mapped to a more linear change in the roughness (proposed by [2])
    vec3 diffuseColor;            // color contribution from diffuse lighting

    vec3 f90;           // reflectance color at grazing angle
    vec3 specularColor;           // color contribution from specular lighting

    vec3 normal;

    vec3 baseColor;
    float sheenIntensity;
    vec3 sheenColor;
    float sheenRoughness;

    float clearcoatFactor;
    vec3 clearcoatNormal;
    float clearcoatRoughness;
};

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
float CharlieDistribution(float sheenRoughness, float NdotH)
{
    //float alphaG = sheenRoughness * sheenRoughness;
    float invR = 1.0 / sheenRoughness;
    float cos2h = NdotH * NdotH;
    float sin2h = 1.0 - cos2h;
    return (2.0 + invR) * pow(sin2h, invR * 0.5) / (2.0 * M_PI);
}

// https://github.com/google/filament/blob/master/shaders/src/brdf.fs#L136
float NeubeltVisibility(float NdotL, float NdotV)
{
    return clamp(1.0 / (4.0 * (NdotL + NdotV - NdotL * NdotV)),0.0,1.0);
}

vec3 sheenLayer(vec3 sheenColor, float sheenIntensity, float sheenRoughness, float NdotL, float NdotV, float NdotH, vec3 diffuse_term)
{
    float sheenDistribution = CharlieDistribution(sheenRoughness, NdotH);
    float sheenVisibility = NeubeltVisibility(NdotL, NdotV);
    return sheenColor * sheenIntensity * sheenDistribution * sheenVisibility + (1.0 - sheenIntensity * sheenDistribution * sheenVisibility) * diffuse_term;
}

//--------------------- Clearcoat -------------------------------------------------------------------------
// See https://github.com/ux3d/glTF/tree/KHR_materials_pbrClearcoat/extensions/2.0/Khronos/KHR_materials_clearcoat
vec3 clearcoatBlending(vec3 color, vec3 clearcoatLayer, float clearcoatFactor, float NdotV, float NdotL, float VdotH)
{
    vec3 factor0 = (1.0 - clearcoatFactor * fresnelReflection(vec3(0.04), vec3(1.0), NdotV)) * (1.0 - clearcoatFactor * fresnelReflection(vec3(0.04), vec3(1.0), NdotL));
    vec3 factor1 = clearcoatFactor * fresnelReflection(vec3(0.04), vec3(1.0), VdotH);
    return color * factor0 + clearcoatLayer * factor1;
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

vec3 getPointShade(vec3 pointToLight, MaterialInfo materialInfo, vec3 view)
{
    AngularInfo angularInfo = getAngularInfo(pointToLight, materialInfo.normal, view);
    if (angularInfo.NdotL > 0.0 || angularInfo.NdotV > 0.0)
    {
        // Calculation of analytical ligh
        //https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#acknowledgments AppendixB
        vec3 diffuseContrib = diffuseBRDF(materialInfo.f0, materialInfo.f90, materialInfo.diffuseColor, angularInfo.VdotH);
        vec3 specContrib = specularMicrofacetBRDF(materialInfo.f0, materialInfo.f90, materialInfo.alphaRoughness, angularInfo.VdotH, angularInfo.NdotL, angularInfo.NdotV, angularInfo.NdotH);

        // Obtain final intensity as reflectance (BRDF) scaled by the energy of the light (cosine law)
        return angularInfo.NdotL * (diffuseContrib + specContrib);
    }

    return vec3(0.0, 0.0, 0.0);
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

vec3 applyDirectionalLight(Light light, MaterialInfo materialInfo, vec3 view)
{
    vec3 pointToLight = -light.direction;
    vec3 shade = getPointShade(pointToLight, materialInfo, view);
    return light.intensity * light.color * shade;
}

vec3 applyPointLight(Light light, MaterialInfo materialInfo, vec3 view)
{
    vec3 pointToLight = light.position - v_Position;
    float distance = length(pointToLight);
    float attenuation = getRangeAttenuation(light.range, distance);
    vec3 shade = getPointShade(pointToLight, materialInfo, view);
    return attenuation * light.intensity * light.color * shade;
}

vec3 applySpotLight(Light light, MaterialInfo materialInfo, vec3 view)
{
    vec3 pointToLight = light.position - v_Position;
    float distance = length(pointToLight);
    float rangeAttenuation = getRangeAttenuation(light.range, distance);
    float spotAttenuation = getSpotAttenuation(pointToLight, light.direction, light.outerConeCos, light.innerConeCos);
    vec3 shade = getPointShade(pointToLight, materialInfo, view);
    return rangeAttenuation * spotAttenuation * light.intensity * light.color * shade;
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

    // Metallic and Roughness material properties are packed together
    // In glTF, these factors can be specified by fixed scalar values
    // or from a metallic-roughness map
    float perceptualRoughness = 0.0;
    float metallic = 0.0;

    vec3 diffuseColor = vec3(0.0);
    vec3 specularColor= vec3(0.0);
    vec3 f0 = vec3(0.04);

#ifdef MATERIAL_SPECULARGLOSSINESS

#ifdef HAS_SPECULAR_GLOSSINESS_MAP
    vec4 sgSample = SRGBtoLINEAR(texture(u_SpecularGlossinessSampler, getSpecularGlossinessUV()));
    perceptualRoughness = (1.0 - sgSample.a * u_GlossinessFactor); // glossiness to roughness
    f0 = sgSample.rgb * u_SpecularFactor; // specular
#else
    f0 = u_SpecularFactor;
    perceptualRoughness = 1.0 - u_GlossinessFactor;
#endif // ! HAS_SPECULAR_GLOSSINESS_MAP

    // f0 = specular
    specularColor = f0;
    float oneMinusSpecularStrength = 1.0 - max(max(f0.r, f0.g), f0.b);
    diffuseColor = baseColor.rgb * oneMinusSpecularStrength;

#endif // ! MATERIAL_SPECULARGLOSSINESS

#ifdef MATERIAL_METALLICROUGHNESS

#ifdef HAS_METALLIC_ROUGHNESS_MAP
    // Roughness is stored in the 'g' channel, metallic is stored in the 'b' channel.
    // This layout intentionally reserves the 'r' channel for (optional) occlusion map data
    vec4 mrSample = texture(u_MetallicRoughnessSampler, getMetallicRoughnessUV());
    perceptualRoughness = mrSample.g * u_RoughnessFactor;
    metallic = mrSample.b * u_MetallicFactor;
#else
    metallic = u_MetallicFactor;
    perceptualRoughness = u_RoughnessFactor;
#endif

    diffuseColor = baseColor.rgb * (vec3(1.0) - f0) * (1.0 - metallic);
    specularColor = mix(f0, baseColor.rgb, metallic);
#endif // ! MATERIAL_METALLICROUGHNESS

    MaterialInfo materialInfo;

    perceptualRoughness = clamp(perceptualRoughness, 0.0, 1.0);
    metallic = clamp(metallic, 0.0, 1.0);

    // Roughness is authored as perceptual roughness; as is convention,
    // convert to material roughness by squaring the perceptual roughness [2].
    float alphaRoughness = perceptualRoughness * perceptualRoughness;

    // Compute reflectance.
    float reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);

    vec3 specularEnvironmentR0 = specularColor.rgb;
    // Anything less than 2% is physically impossible and is instead considered to be shadowing. Compare to "Real-Time-Rendering" 4th editon on page 325.
    vec3 specularEnvironmentR90 = vec3(clamp(reflectance * 50.0, 0.0, 1.0));

#ifdef MATERIAL_SHEEN
    #ifdef HAS_SHEEN_COLOR_INTENSITY_TEXTURE_MAP
        vec3 sheenSample = texture(u_sheenColorIntensitySampler, getSheenUV());
        materialInfo.sheenColor = sheenSample.xyz * u_SheenColorFactor;
        materialInfo.sheenIntensity = sheenSample.w * u_SheenIntensityFactor;
    #else
        materialInfo.sheenColor = u_SheenColorFactor;
        materialInfo.sheenIntensity = u_SheenIntensityFactor;
    #endif
    materialInfo.sheenRoughness = u_SheenRoughness;
#endif

#ifdef MATERIAL_CLEARCOAT
    #ifdef HAS_CLEARCOAT_TEXTURE_MAP
        vec4 ccSample = texture(u_ClearcoatSampler, getClearcoatUV());
        materialInfo.clearcoatFactor = ccSample.r * u_ClearcoatFactor;
    #else
        materialInfo.clearcoatFactor = u_ClearcoatFactor;
    #endif

    #ifdef HAS_CLEARCOAT_ROUGHNESS_MAP
        vec4 ccSampleRough = texture(u_ClearcoatRoughnessSampler, getClearcoatRoughnessUV());
        materialInfo.clearcoatRoughness = ccSampleRough.g * u_ClearcoatRoughnessFactor;
    #else
        materialInfo.clearcoatRoughness = u_ClearcoatRoughnessFactor;
    #endif

    #ifdef HAS_CLEARCOAT_NORMAL_MAP
        vec4 ccSampleNor = texture(u_ClearcoatNormalSampler, getClearcoatNormalUV());
        materialInfo.clearcoatNormal = ccSampleNor.xyz;
    #else
        materialInfo.clearcoatNormal = getNormal(true); // get geometry normal
    #endif
#endif

    // LIGHTING
    vec3 normal = getNormal(false);
    vec3 view = normalize(u_Camera - v_Position);

    materialInfo.perceptualRoughness = perceptualRoughness;
    materialInfo.f0 = specularEnvironmentR0;
    materialInfo.alphaRoughness = alphaRoughness;
    materialInfo.diffuseColor = diffuseColor;
    materialInfo.f90 = specularEnvironmentR90;
    materialInfo.specularColor = specularColor;
    materialInfo.normal = normal;
    materialInfo.baseColor = baseColor.rgb;

    vec3 f_specular = vec3(0.0);
    vec3 f_diffuse = vec3(0.0);
    vec3 f_emissive = vec3(0.0);

    // Calculate lighting contribution from image based lighting source (IBL)
#ifdef USE_IBL
    f_specular += getSpecularIBLContribution(normal, view, perceptualRoughness, specularColor);
    f_diffuse += getDiffuseIBLContribution(normal, diffuseColor);
#endif

vec3 punctualColor = vec3(0.0);

#ifdef USE_PUNCTUAL
    for (int i = 0; i < LIGHT_COUNT; ++i)
    {
        Light light = u_Lights[i];
        if (light.type == LightType_Directional)
        {
            punctualColor += applyDirectionalLight(light, materialInfo, view);
        }
        else if (light.type == LightType_Point)
        {
            punctualColor += applyPointLight(light, materialInfo, view);
        }
        else if (light.type == LightType_Spot)
        {
            punctualColor += applySpotLight(light, materialInfo, view);
        }
    }
#endif // !USE_PUNCTUAL

    f_emissive = u_EmissiveFactor;
#ifdef HAS_EMISSIVE_MAP
    f_emissive *= SRGBtoLINEAR(texture(u_EmissiveSampler, getEmissiveUV())).rgb;
#endif

    vec3 color = f_emissive + f_specular + f_diffuse + punctualColor;

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
        g_finalColor.rgb = vec3(metallic);
    #endif

    #ifdef DEBUG_ROUGHNESS
        g_finalColor.rgb = vec3(perceptualRoughness);
    #endif

    #ifdef DEBUG_NORMAL
        #ifdef HAS_NORMAL_MAP
            g_finalColor.rgb = texture(u_NormalSampler, getNormalUV()).rgb;
        #else
            g_finalColor.rgb = vec3(0.5, 0.5, 1.0);
        #endif
    #endif

    #ifdef DEBUG_BASECOLOR
        g_finalColor.rgb = LINEARtoSRGB(baseColor.rgb);
    #endif

    #ifdef DEBUG_OCCLUSION
        g_finalColor.rgb = vec3(ao);
    #endif

    #ifdef DEBUG_EMISSIVE
        g_finalColor.rgb = LINEARtoSRGB(emissive).rgb;
    #endif

    #ifdef DEBUG_F0
        g_finalColor.rgb = vec3(f0);
    #endif

    #ifdef DEBUG_ALPHA
        g_finalColor.rgb = vec3(baseColor.a);
    #endif

    g_finalColor.a = 1.0;

#endif // !DEBUG_OUTPUT
}
