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

precision highp float;

out vec4 g_finalColor;

void exportColor(vec4 color, int rtIdx)
{
    g_finalColor = color;
}

void exportColor(vec4 color)
{
    exportColor(color, 0);
}

#include <tonemapping.glsl>
#include <textures.glsl>
#include <functions.glsl>

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

#if defined(MATERIAL_SPECULARGLOSSINESS) || defined(MATERIAL_METALLICROUGHNESS)
uniform float u_MetallicFactor;
uniform float u_RoughnessFactor;
uniform vec4 u_BaseColorFactor;
#endif

#ifdef MATERIAL_SPECULARGLOSSINESS
uniform vec3 u_SpecularFactor;
uniform vec4 u_DiffuseFactor;
uniform float u_GlossinessFactor;
#endif

#ifdef ALPHAMODE_MASK
uniform float u_AlphaCutoff;
#endif

uniform vec3 u_Camera;

// debugging flags used for shader output of intermediate PBR variables
uniform vec4 u_ScaleIBLAmbient;

struct MaterialInfo
{
    float perceptualRoughness;    // roughness value, as authored by the model creator (input to shader)
    vec3 reflectance0;            // full reflectance color (normal incidence angle)

    float alphaRoughness;         // roughness mapped to a more linear change in the roughness (proposed by [2])
    vec3 diffuseColor;            // color contribution from diffuse lighting

    vec3 reflectance90;           // reflectance color at grazing angle
    vec3 specularColor;           // color contribution from specular lighting
};

// Calculation of the lighting contribution from an optional Image Based Light source.
// Precomputed Environment Maps are required uniform inputs and are computed as outlined in [1].
// See our README.md on Environment Maps [3] for additional discussion.
#ifdef USE_IBL
vec3 getIBLContribution(MaterialInfo materialInfo, vec3 n, vec3 v)
{
    float mipCount = u_ScaleIBLAmbient.z;

    //

    float NdotV = clamp(dot(n, v), 0.0, 1.0);

    float lod = clamp(materialInfo.perceptualRoughness * mipCount, 0.0, mipCount);
    vec3 reflection = normalize(reflect(-v, n));

    vec2 brdfSamplePoint = clamp(vec2(NdotV, materialInfo.perceptualRoughness), vec2(0.0, 0.0), vec2(1.0, 1.0));
    // retrieve a scale and bias to F0. See [1], Figure 3
    vec2 brdf = texture(u_brdfLUT, brdfSamplePoint).rg;

    vec4 diffuseSample = texture(u_DiffuseEnvSampler, n);

    vec4 specularSample = textureLod(u_SpecularEnvSampler, reflection, lod);

#ifdef USE_HDR
    // Already linear.
    vec3 diffuseLight = diffuseSample.rgb;
    vec3 specularLight = specularSample.rgb;
#else
    vec3 diffuseLight = SRGBtoLINEAR(diffuseSample).rgb;
    vec3 specularLight = SRGBtoLINEAR(specularSample).rgb;
#endif

    vec3 diffuse = diffuseLight * materialInfo.diffuseColor;
    vec3 specular = specularLight * (materialInfo.specularColor * brdf.x + brdf.y);

    // For presentation, this allows us to disable IBL terms
    diffuse *= u_ScaleIBLAmbient.x;
    specular *= u_ScaleIBLAmbient.y;

    return diffuse + specular;
}
#endif

// Lambert lighting
// see https://seblagarde.wordpress.com/2012/01/08/pi-or-not-to-pi-in-game-lighting-equation/
vec3 diffuse(MaterialInfo materialInfo)
{
    return materialInfo.diffuseColor / M_PI;
}

// The following equation models the Fresnel reflectance term of the spec equation (aka F())
// Implementation of fresnel from [4], Equation 15
vec3 specularReflection(MaterialInfo materialInfo, AngularInfo angularInfo)
{
    return materialInfo.reflectance0 + (materialInfo.reflectance90 - materialInfo.reflectance0) * pow(clamp(1.0 - angularInfo.VdotH, 0.0, 1.0), 5.0);
}

// This calculates the specular geometric attenuation (aka G()),
// where rougher material will reflect less light back to the viewer.
// This implementation is based on [1] Equation 4, and we adopt their modifications to
// alphaRoughness as input as originally proposed in [2].
float geometricOcclusion(MaterialInfo materialInfo, AngularInfo angularInfo)
{
    float NdotL = angularInfo.NdotL;
    float NdotV = angularInfo.NdotV;
    float r = materialInfo.alphaRoughness;

    float attenuationL = 2.0 * NdotL / (NdotL + sqrt((NdotL * NdotL) + r * r * (1.0 - (NdotL * NdotL))));
    float attenuationV = 2.0 * NdotV / (NdotV + sqrt((NdotV * NdotV) + r * r * (1.0 - (NdotV * NdotV))));

    return attenuationL * attenuationV;
}

// The following equation(s) model the distribution of microfacet normals across the area being drawn (aka D())
// Implementation from "Average Irregularity Representation of a Roughened Surface for Ray Reflection" by T. S. Trowbridge, and K. P. Reitz
// Follows the distribution function recommended in the SIGGRAPH 2013 course notes from EPIC Games [1], Equation 3.
float microfacetDistribution(MaterialInfo materialInfo, AngularInfo angularInfo)
{
    float roughnessSq = materialInfo.alphaRoughness * materialInfo.alphaRoughness;
    float f = (angularInfo.NdotH * roughnessSq - angularInfo.NdotH) * angularInfo.NdotH + 1.0;
    return roughnessSq / (M_PI * f * f);
}

vec3 getPointShade(vec3 pointToLight, MaterialInfo materialInfo, vec3 normal, vec3 view)
{
    AngularInfo angularInfo = getAngularInfo(pointToLight, normal, view);

    if (angularInfo.NdotL > 0.0 && angularInfo.NdotV > 0.0)
    {
        // Calculate the shading terms for the microfacet specular shading model
        vec3 F = specularReflection(materialInfo, angularInfo);
        float G = geometricOcclusion(materialInfo, angularInfo);
        float D = microfacetDistribution(materialInfo, angularInfo);

        // Calculation of analytical lighting contribution
        vec3 diffuseContrib = (1.0 - F) * diffuse(materialInfo);
        vec3 specContrib = F * G * D / (4.0 * angularInfo.NdotL * angularInfo.NdotV);

        // Obtain final intensity as reflectance (BRDF) scaled by the energy of the light (cosine law)
        return angularInfo.NdotL * (diffuseContrib + specContrib);
    }

    return vec3(0.0, 0.0, 0.0);
}

// https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_lights_punctual/README.md#range-property
float getRangeAttenuation(float range, float distance)
{
    if (range < 0.0)
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

vec3 applyDirectionalLight(Light light, MaterialInfo materialInfo, vec3 normal, vec3 view)
{
    vec3 pointToLight = -light.direction;
    vec3 shade = getPointShade(pointToLight, materialInfo, normal, view);
    return light.intensity * light.color * shade;
}

vec3 applyPointLight(Light light, MaterialInfo materialInfo, vec3 normal, vec3 view)
{
    vec3 pointToLight = light.position - v_Position;
    float distance = length(pointToLight);
    float attenuation = getRangeAttenuation(light.range, distance);
    vec3 shade = getPointShade(pointToLight, materialInfo, normal, view);
    return attenuation * light.intensity * light.color * shade;
}

vec3 applySpotLight(Light light, MaterialInfo materialInfo, vec3 normal, vec3 view)
{
    vec3 pointToLight = light.position - v_Position;
    float distance = length(pointToLight);
    float rangeAttenuation = getRangeAttenuation(light.range, distance);
    float spotAttenuation = getSpotAttenuation(pointToLight, light.direction, light.outerConeCos, light.innerConeCos);
    vec3 shade = getPointShade(pointToLight, materialInfo, normal, view);
    return rangeAttenuation * spotAttenuation * light.intensity * light.color * shade;
}

void main()
{
    // Metallic and Roughness material properties are packed together
    // In glTF, these factors can be specified by fixed scalar values
    // or from a metallic-roughness map
    float perceptualRoughness = 0.0;
    float metallic = 0.0;
    vec4 baseColor = vec4(0.0, 0.0, 0.0, 1.0);
    vec3 diffuseColor = vec3(0.0);
    vec3 specularColor= vec3(0.0);
    vec3 f0 = vec3(0.04);
    vec4 outputColor = baseColor;

#ifdef MATERIAL_SPECULARGLOSSINESS

#ifdef HAS_SPECULAR_GLOSSINESS_MAP
    vec4 sgSample = SRGBtoLINEAR(texture(u_SpecularGlossinessSampler, getSpecularGlossinessUV()));
    perceptualRoughness = (1.0 - sgSample.a * u_GlossinessFactor); // glossiness to roughness
    f0 = sgSample.rgb * u_SpecularFactor; // specular
#else
    f0 = u_SpecularFactor;
    perceptualRoughness = 1.0 - u_GlossinessFactor;
#endif // ! HAS_SPECULAR_GLOSSINESS_MAP

#ifdef HAS_DIFFUSE_MAP
    baseColor = SRGBtoLINEAR(texture(u_DiffuseSampler, getDiffuseUV())) * u_DiffuseFactor;
#else
    baseColor = u_DiffuseFactor;
#endif // !HAS_DIFFUSE_MAP

    baseColor *= getVertexColor();

    // f0 = specular
    specularColor = f0;
    float oneMinusSpecularStrength = 1.0 - max(max(f0.r, f0.g), f0.b);
    diffuseColor = baseColor.rgb * oneMinusSpecularStrength;

    // do conversion between metallic M-R and S-G metallic
    metallic = solveMetallic(baseColor.rgb, specularColor, oneMinusSpecularStrength);

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

    // The albedo may be defined from a base texture or a flat color
#ifdef HAS_BASE_COLOR_MAP
    baseColor = SRGBtoLINEAR(texture(u_BaseColorSampler, getBaseColorUV())) * u_BaseColorFactor;
#else
    baseColor = u_BaseColorFactor;
#endif

    baseColor *= getVertexColor();

    diffuseColor = baseColor.rgb * (vec3(1.0) - f0) * (1.0 - metallic);

    specularColor = mix(f0, baseColor.rgb, metallic);

#endif // ! MATERIAL_METALLICROUGHNESS

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
    exportColor(vec4(toneMap(baseColor.rgb), baseColor.a));
    return;
#endif

    perceptualRoughness = clamp(perceptualRoughness, 0.0, 1.0);
    metallic = clamp(metallic, 0.0, 1.0);

    // Roughness is authored as perceptual roughness; as is convention,
    // convert to material roughness by squaring the perceptual roughness [2].
    float alphaRoughness = perceptualRoughness * perceptualRoughness;

    // Compute reflectance.
    float reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);

    // For typical incident reflectance range (between 4% to 100%) set the grazing reflectance to 100% for typical fresnel effect.
    // For very low reflectance range on highly diffuse objects (below 4%), incrementally reduce grazing reflecance to 0%.
    float reflectance90 = clamp(reflectance * 25.0, 0.0, 1.0);
    vec3 specularEnvironmentR0 = specularColor.rgb;
    vec3 specularEnvironmentR90 = vec3(1.0, 1.0, 1.0) * reflectance90;

    MaterialInfo materialInfo = MaterialInfo(
        perceptualRoughness,
        specularEnvironmentR0,
        alphaRoughness,
        diffuseColor,
        specularEnvironmentR90,
        specularColor
    );

    // LIGHTING

    vec3 color = vec3(0.0, 0.0, 0.0);
    vec3 normal = getNormal();
    vec3 view = normalize(u_Camera - v_Position);

#ifdef USE_PUNCTUAL
    for (int i = 0; i < LIGHT_COUNT; ++i)
    {
        Light light = u_Lights[i];
        if (light.type == LightType_Directional)
        {
            color += applyDirectionalLight(light, materialInfo, normal, view);
        }
        else if (light.type == LightType_Point)
        {
            color += applyPointLight(light, materialInfo, normal, view);
        }
        else if (light.type == LightType_Spot)
        {
            color += applySpotLight(light, materialInfo, normal, view);
        }
    }
#endif

    // Calculate lighting contribution from image based lighting source (IBL)
#ifdef USE_IBL
    color += getIBLContribution(materialInfo, normal, view);
#endif

    float ao = 1.0;
    // Apply optional PBR terms for additional (optional) shading
#ifdef HAS_OCCLUSION_MAP
    ao = texture(u_OcclusionSampler,  getOcclusionUV()).r;
    color = mix(color, color * ao, u_OcclusionStrength);
#endif

    vec3 emissive = vec3(0);
#ifdef HAS_EMISSIVE_MAP
    emissive = SRGBtoLINEAR(texture(u_EmissiveSampler, getEmissiveUV())).rgb * u_EmissiveFactor;
    color += emissive;
#endif

#ifndef DEBUG_OUTPUT // no debug

   // regular shading
    outputColor = vec4(toneMap(color), baseColor.a);

#else // debug output

    #ifdef DEBUG_METALLIC
        outputColor.rgb = vec3(metallic);
    #endif

    #ifdef DEBUG_ROUGHNESS
        outputColor.rgb = vec3(perceptualRoughness); //alphaRoughness
    #endif

    #ifdef DEBUG_NORMAL
        #ifdef HAS_NORMAL_MAP
            outputColor.rgb = texture(u_NormalSampler, getNormalUV()).rgb;
        #else
            outputColor.rgb = vec3(0.5, 0.5, 1.0);
        #endif
    #endif

    #ifdef DEBUG_BASECOLOR
        outputColor.rgb = baseColor.rgb;
    #endif

    #ifdef DEBUG_OCCLUSION
        outputColor.rgb = vec3(ao);
    #endif

    #ifdef DEBUG_EMISSIVE
        outputColor.rgb = emissive;
    #endif

    #ifdef DEBUG_F0
        outputColor.rgb = vec3(f0);
    #endif

    #ifdef DEBUG_ALPHA
        outputColor.rgb = vec3(baseColor.a);
    #endif

    outputColor.a = 1.0;

#endif // !DEBUG_OUTPUT

    exportColor(outputColor);
}
