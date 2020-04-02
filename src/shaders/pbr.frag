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
// [7] "KHR_materials_subsurface"
//     https://github.com/KhronosGroup/glTF/pull/1766
// [8] "KHR_materials_thinfilm"
//     https://github.com/ux3d/glTF/tree/extensions/KHR_materials_thinfilm/extensions/2.0/Khronos/KHR_materials_thinfilm

precision highp float;

#include <tonemapping.glsl>
#include <textures.glsl>
#include <functions.glsl>
#include <brdf.glsl>

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

//Subsurface
uniform float u_SubsurfaceScale;
uniform float u_SubsurfaceDistortion;
uniform float u_SubsurfacePower;
uniform vec3 u_SubsurfaceColorFactor;
uniform float u_SubsurfaceThicknessFactor;

// Thin Film
uniform float u_ThinFilmFactor;
uniform float u_ThinFilmThicknessMinimum;
uniform float u_ThinFilmThicknessMaximum;

// IOR
uniform float u_IOR;

// Thickness
uniform float u_Thickness;

// Absorption
uniform vec3 u_AbsorptionColor;

// Transmission
uniform float u_Transmission;

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

    float subsurfaceScale;
    float subsurfaceDistortion;
    float subsurfacePower;
    vec3 subsurfaceColor;
    float subsurfaceThickness;

    float thinFilmFactor;
    float thinFilmThickness;

    float thickness;

    vec3 absorption;

    float transmission;
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

vec3 getThinFilmSpecularColor(vec3 f0, vec3 f90, float NdotV, float thinFilmFactor, float thinFilmThickness)
{
    if (thinFilmFactor == 0.0)
    {
        // No thin film applied.
        return f0;
    }

    vec3 lutSample = texture(u_ThinFilmLUT, vec2(thinFilmThickness, NdotV)).rgb - 0.5;
    vec3 intensity = thinFilmFactor * 4.0 * f0 * (1.0 - f0);
    return clamp(intensity * lutSample, 0.0, 1.0);
}

vec3 getGGXIBLContribution(vec3 n, vec3 v, float perceptualRoughness, vec3 specularColor)
{
    float NdotV = clampedDot(n, v);
    float lod = clamp(perceptualRoughness * float(u_MipCount), 0.0, float(u_MipCount));
    vec3 reflection = normalize(reflect(-v, n));

    vec2 brdfSamplePoint = clamp(vec2(NdotV, perceptualRoughness), vec2(0.0, 0.0), vec2(1.0, 1.0));
    vec2 brdf = texture(u_GGXLUT, brdfSamplePoint).rg;
    vec4 specularSample = textureLod(u_GGXEnvSampler, reflection, lod);

    vec3 specularLight = specularSample.rgb;

#ifndef USE_HDR
    specularLight = SRGBtoLINEAR(specularLight);
#endif

   return specularLight * (specularColor * brdf.x + brdf.y);
}

vec3 getTransmissionIrradianceIBL(vec3 n, vec3 v, float perceptualRoughness, float ior, vec3 baseColor)
{
    // Sample GGX LUT.
    float NdotV = clampedDot(n, v);
    vec2 brdfSamplePoint = clamp(vec2(NdotV, perceptualRoughness), vec2(0.0, 0.0), vec2(1.0, 1.0));
    vec2 brdf = texture(u_GGXLUT, brdfSamplePoint).rg;

    // Sample GGX environment map.
    float lod = clamp(perceptualRoughness * float(u_MipCount), 0.0, float(u_MipCount));

    // Approximate double refraction by assuming a solid sphere beneath the point.
    vec3 r = refract(-v, n, 1.0 / ior);
    vec3 m = 2.0 * dot(-n, r) * r + n;
    vec3 rr = -refract(-r, m, ior);

    vec4 specularSample = textureLod(u_GGXEnvSampler, rr, lod);
    vec3 specularLight = specularSample.rgb;

#ifndef USE_HDR
    specularLight = SRGBtoLINEAR(specularLight);
#endif

   return specularLight * (brdf.x + brdf.y);
}

vec3 getTransmissionIrradianceAnalytical(vec3 v, vec3 n, vec3 l, float alphaRoughness, float ior, vec3 f0)
{
    vec3 v_r = refract(-v, n, 1.0 / ior);
    vec3 h = normalize(l - v_r);
    float NdotL = clampedDot(-n, l);
    float NdotH = clampedDot(n, h);
    float NdotV = clampedDot(n, -v_r);

    float Vis = V_GGX(clampedDot(-n, l), NdotV, alphaRoughness);
    float D = D_GGX(clampedDot(v_r, l), alphaRoughness);

    return NdotL * f0 * Vis * D;
}

vec3 getLambertianIBLContribution(vec3 n, vec3 diffuseColor)
{
    vec3 diffuseLight = texture(u_LambertianEnvSampler, n).rgb;

    #ifndef USE_HDR
        diffuseLight = SRGBtoLINEAR(diffuseLight);
    #endif

    return diffuseLight * diffuseColor;
}

vec3 getCharlieIBLContribution(vec3 n, vec3 v, float sheenRoughness, vec3 sheenColor, float sheenIntensity)
{
    float NdotV = clampedDot(n, v);
    float lod = clamp(sheenRoughness * float(u_MipCount), 0.0, float(u_MipCount));
    vec3 reflection = normalize(reflect(-v, n));

    vec2 brdfSamplePoint = clamp(vec2(NdotV, sheenRoughness), vec2(0.0, 0.0), vec2(1.0, 1.0));
    float brdf = texture(u_CharlieLUT, brdfSamplePoint).b;
    vec4 sheenSample = textureLod(u_CharlieEnvSampler, reflection, lod);

    vec3 sheenLight = sheenSample.rgb;

    #ifndef USE_HDR
    sheenLight = SRGBtoLINEAR(sheenLight);
    #endif

    return sheenIntensity * sheenLight * sheenColor * brdf;
}

vec3 getSubsurfaceIBLContribution(float scale, float distortion, float power, vec3 color, float thickness, vec3 light, vec3 normal, vec3 viewer)
{
    vec3 diffuseLight = texture(u_LambertianEnvSampler, normal).rgb;

    #ifndef USE_HDR
        diffuseLight = SRGBtoLINEAR(diffuseLight);
    #endif

    return diffuseLight * subsurfaceNonBRDF(scale, distortion, power, color, thickness, light, normal, viewer);
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
#ifdef HAS_METALLICROUGHNESS_SPECULAROVERRIDE_MAP
    vec4 specSampler =  texture(u_MetallicRoughnessSpecularSampler, getMetallicRoughnessSpecularUV());
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
#ifdef MATERIAL_METALLICROUGHNESS_SPECULAROVERRIDE
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

    #ifdef HAS_SHEEN_COLOR_INTENSITY_MAP
        vec4 sheenSample = texture(u_SheenColorIntensitySampler, getSheenUV());
        info.sheenColor *= sheenSample.xyz;
        info.sheenIntensity *= sheenSample.w;
    #endif

    return info;
}

#ifdef MATERIAL_SUBSURFACE
MaterialInfo getSubsurfaceInfo(MaterialInfo info)
{
    info.subsurfaceScale = u_SubsurfaceScale;
    info.subsurfaceDistortion = u_SubsurfaceDistortion;
    info.subsurfacePower = u_SubsurfacePower;
    info.subsurfaceColor = u_SubsurfaceColorFactor;
    info.subsurfaceThickness = u_SubsurfaceThicknessFactor;

    #ifdef HAS_SUBSURFACE_COLOR_MAP
        info.subsurfaceColor *= texture(u_SubsurfaceColorSampler, getSubsurfaceColorUV()).rgb;
    #endif

    #ifdef HAS_SUBSURFACE_THICKNESS_MAP
        info.subsurfaceThickness *= texture(u_SubsurfaceThicknessSampler, getSubsurfaceThicknessUV()).r;
    #endif

    return info;
}
#endif

#ifdef MATERIAL_THIN_FILM
MaterialInfo getThinFilmInfo(MaterialInfo info)
{
    info.thinFilmFactor = u_ThinFilmFactor;
    info.thinFilmThickness = u_ThinFilmThicknessMaximum / 1200.0;

    #ifdef HAS_THIN_FILM_MAP
        info.thinFilmFactor *= texture(u_ThinFilmSampler, getThinFilmUV()).r;
    #endif

    #ifdef HAS_THIN_FILM_THICKNESS_MAP
        float thicknessSampled = texture(u_ThinFilmThicknessSampler, getThinFilmThicknessUV()).g;
        float thickness = mix(u_ThinFilmThicknessMinimum / 1200.0, u_ThinFilmThicknessMaximum / 1200.0, thicknessSampled);
        info.thinFilmThickness = thickness;
    #endif

    return info;
}
#endif

MaterialInfo getTransmissionInfo(MaterialInfo info)
{
    info.transmission = u_Transmission;
    return info;
}

MaterialInfo getThicknessInfo(MaterialInfo info)
{
    info.thickness = 1.0;

    #ifdef MATERIAL_THICKNESS
    info.thickness = u_Thickness;

    #ifdef HAS_THICKNESS_MAP
    info.thickness *= texture(u_ThicknessSampler, getThicknessUV()).r;
    #endif

    #endif

    return info;
}

MaterialInfo getAbsorptionInfo(MaterialInfo info)
{
    info.absorption = vec3(0.0);

    #ifdef MATERIAL_ABSORPTION
    info.absorption = u_AbsorptionColor;
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

#ifdef MATERIAL_SUBSURFACE
    materialInfo = getSubsurfaceInfo(materialInfo);
#endif

#ifdef MATERIAL_THIN_FILM
    materialInfo = getThinFilmInfo(materialInfo);
#endif

#ifdef MATERIAL_CLEARCOAT
    materialInfo = getClearCoatInfo(materialInfo);
#endif

#ifdef MATERIAL_TRANSMISSION
    materialInfo = getTransmissionInfo(materialInfo);
#endif

#ifdef MATERIAL_IOR
    float ior = u_IOR;
#else
    float ior = 1.0;
#endif

    materialInfo = getThicknessInfo(materialInfo);
    materialInfo = getAbsorptionInfo(materialInfo);

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
    vec3 f_subsurface = vec3(0.0);
    vec3 f_transmission = vec3(0.0);

    // Calculate lighting contribution from image based lighting source (IBL)
#ifdef USE_IBL
    vec3 specularColor = getThinFilmSpecularColor(materialInfo.f0, materialInfo.f90, clampedDot(normal, view), materialInfo.thinFilmFactor, materialInfo.thinFilmThickness);

    f_specular += getGGXIBLContribution(normal, view, materialInfo.perceptualRoughness, specularColor);
    f_diffuse += getLambertianIBLContribution(normal, materialInfo.albedoColor);

    #ifdef MATERIAL_CLEARCOAT
        f_clearcoat += getGGXIBLContribution(materialInfo.clearcoatNormal, view, materialInfo.clearcoatRoughness, materialInfo.clearcoatF0);
    #endif

    #ifdef MATERIAL_SHEEN
        f_sheen += getCharlieIBLContribution(normal, view, materialInfo.sheenRoughness, materialInfo.sheenColor, materialInfo.sheenIntensity);
    #endif

    #ifdef MATERIAL_SUBSURFACE
        f_subsurface += getSubsurfaceIBLContribution(materialInfo.subsurfaceScale, materialInfo.subsurfaceDistortion, materialInfo.subsurfacePower, materialInfo.subsurfaceColor, materialInfo.subsurfaceThickness, -view, normal, view);
    #endif

    #ifdef MATERIAL_TRANSMISSION
        f_transmission += getTransmissionIrradianceIBL(normal, view, materialInfo.perceptualRoughness, ior, materialInfo.baseColor);
    #endif
#endif

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
            // Calculation of analytical light
            //https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#acknowledgments AppendixB
            f_diffuse += intensity * angularInfo.NdotL *  lambertianBRDF(materialInfo.f0, materialInfo.f90, materialInfo.albedoColor, angularInfo.VdotH);
            vec3 specularColor = getThinFilmSpecularColor(materialInfo.f0, materialInfo.f90, angularInfo.VdotH, materialInfo.thinFilmFactor, materialInfo.thinFilmThickness);
            f_specular += intensity * angularInfo.NdotL * metallicBRDF(specularColor, materialInfo.f90, materialInfo.alphaRoughness, angularInfo.VdotH, angularInfo.NdotL, angularInfo.NdotV, angularInfo.NdotH);

            #ifdef MATERIAL_SHEEN
                f_sheen += intensity * angularInfo.NdotL * sheenBRDF(materialInfo.sheenColor, materialInfo.sheenIntensity, materialInfo.sheenRoughness, angularInfo.NdotL, angularInfo.NdotV, angularInfo.NdotH);
            #endif

            #ifdef MATERIAL_CLEARCOAT
                AngularInfo coatAngles = getAngularInfo(pointToLight, materialInfo.clearcoatNormal, view);
                f_clearcoat += intensity * coatAngles.NdotL * metallicBRDF(materialInfo.clearcoatF0, materialInfo.clearcoatF90, materialInfo.clearcoatRoughness * materialInfo.clearcoatRoughness, coatAngles.VdotH, coatAngles.NdotL, coatAngles.NdotV, coatAngles.NdotH);
            #endif
        }

        #ifdef MATERIAL_SUBSURFACE
            f_subsurface += intensity * subsurfaceNonBRDF(materialInfo.subsurfaceScale, materialInfo.subsurfaceDistortion, materialInfo.subsurfacePower, materialInfo.subsurfaceColor, materialInfo.subsurfaceThickness, normalize(pointToLight), normal, view);
        #endif

        #ifdef MATERIAL_TRANSMISSION
            f_transmission += intensity * getTransmissionIrradianceAnalytical(view, normal, normalize(pointToLight), materialInfo.alphaRoughness, ior, materialInfo.f0);
        #endif
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

    float clearcoatFactor = 0.0;
    vec3 clearcoatFresnel = vec3(0.0);

    #ifdef MATERIAL_CLEARCOAT
        clearcoatFactor = materialInfo.clearcoatFactor;
        clearcoatFresnel = F_Schlick(materialInfo.clearcoatF0, materialInfo.clearcoatF90, clampedDot(materialInfo.clearcoatNormal, view));
    #endif

    #ifdef MATERIAL_ABSORPTION
        f_transmission *= transmissionAbsorption(view, normal, ior, materialInfo.thickness, materialInfo.absorption);
    #endif

    #ifdef MATERIAL_TRANSMISSION
    vec3 diffuse = mix(f_diffuse, f_transmission, materialInfo.transmission);
    #else
    vec3 diffuse = f_diffuse;
    #endif

    color = (f_emissive + diffuse + f_specular + f_subsurface + (1.0 - reflectance) * f_sheen) * (1.0 - clearcoatFactor * clearcoatFresnel) + f_clearcoat * clearcoatFactor;

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

    #ifdef DEBUG_FEMISSIVE
        g_finalColor.rgb = f_emissive;
    #endif

    #ifdef DEBUG_FSPECULAR
        g_finalColor.rgb = f_specular;
    #endif

    #ifdef DEBUG_FDIFFUSE
        g_finalColor.rgb = f_diffuse;
    #endif

    #ifdef DEBUG_THICKNESS
        g_finalColor.rgb = vec3(materialInfo.thickness);
    #endif

    #ifdef DEBUG_FCLEARCOAT
        g_finalColor.rgb = f_clearcoat;
    #endif

    #ifdef DEBUG_FSHEEN
        g_finalColor.rgb = f_sheen;
    #endif

    #ifdef DEBUG_ALPHA
        g_finalColor.rgb = vec3(baseColor.a);
    #endif

    #ifdef DEBUG_FSUBSURFACE
        g_finalColor.rgb = f_subsurface;
    #endif

    #ifdef DEBUG_FTRANSMISSION
        g_finalColor.rgb = LINEARtoSRGB(f_transmission);
    #endif

    g_finalColor.a = 1.0;

#endif // !DEBUG_OUTPUT
}
