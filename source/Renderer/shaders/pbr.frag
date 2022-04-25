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
//     https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_clearcoat

precision highp float;


#include <tonemapping.glsl>
#include <textures.glsl>
#include <functions.glsl>
#include <brdf.glsl>
#include <punctual.glsl>
#include <ibl.glsl>
#include <material_info.glsl>

#ifdef MATERIAL_IRIDESCENCE
#include <iridescence.glsl>
#endif


out vec4 g_finalColor;


void main()
{
    vec4 baseColor = getBaseColor();

#if ALPHAMODE == ALPHAMODE_OPAQUE
    baseColor.a = 1.0;
#endif

    vec3 v = normalize(u_Camera - v_Position);
    NormalInfo normalInfo = getNormalInfo(v);
    vec3 n = normalInfo.n;
    vec3 t = normalInfo.t;
    vec3 b = normalInfo.b;

    float NdotV = clampedDot(n, v);
    float TdotV = clampedDot(t, v);
    float BdotV = clampedDot(b, v);

    MaterialInfo materialInfo;
    materialInfo.baseColor = baseColor.rgb;
    
    // The default index of refraction of 1.5 yields a dielectric normal incidence reflectance of 0.04.
    materialInfo.ior = 1.5;
    materialInfo.f0 = vec3(0.04);
    materialInfo.specularWeight = 1.0;

    // If the MR debug output is selected, we have to enforce evaluation of the non-iridescence BRDF functions.
#if DEBUG == DEBUG_METALLIC_ROUGHNESS
#undef MATERIAL_IRIDESCENCE
#endif

#ifdef MATERIAL_IOR
    materialInfo = getIorInfo(materialInfo);
#endif

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
    materialInfo = getClearCoatInfo(materialInfo, normalInfo);
#endif

#ifdef MATERIAL_SPECULAR
    materialInfo = getSpecularInfo(materialInfo);
#endif

#ifdef MATERIAL_TRANSMISSION
    materialInfo = getTransmissionInfo(materialInfo);
#endif

#ifdef MATERIAL_VOLUME
    materialInfo = getVolumeInfo(materialInfo);
#endif

#ifdef MATERIAL_IRIDESCENCE
    materialInfo = getIridescenceInfo(materialInfo);
#endif

    materialInfo.perceptualRoughness = clamp(materialInfo.perceptualRoughness, 0.0, 1.0);
    materialInfo.metallic = clamp(materialInfo.metallic, 0.0, 1.0);

    // Roughness is authored as perceptual roughness; as is convention,
    // convert to material roughness by squaring the perceptual roughness.
    materialInfo.alphaRoughness = materialInfo.perceptualRoughness * materialInfo.perceptualRoughness;

    // Compute reflectance.
    float reflectance = max(max(materialInfo.f0.r, materialInfo.f0.g), materialInfo.f0.b);

    // Anything less than 2% is physically impossible and is instead considered to be shadowing. Compare to "Real-Time-Rendering" 4th editon on page 325.
    materialInfo.f90 = vec3(1.0);

    // LIGHTING
    vec3 f_specular = vec3(0.0);
    vec3 f_diffuse = vec3(0.0);
    vec3 f_emissive = vec3(0.0);
    vec3 f_clearcoat = vec3(0.0);
    vec3 f_sheen = vec3(0.0);
    vec3 f_transmission = vec3(0.0);

    float albedoSheenScaling = 1.0;

#ifdef MATERIAL_IRIDESCENCE
    vec3 iridescenceFresnel = materialInfo.f0;
    vec3 iridescenceF0 = materialInfo.f0;

    if (materialInfo.iridescenceThickness == 0.0) {
        materialInfo.iridescenceFactor = 0.0;
    }

    if (materialInfo.iridescenceFactor > 0.0) {
        iridescenceFresnel = evalIridescence(1.0, materialInfo.iridescenceIor, NdotV, materialInfo.iridescenceThickness, materialInfo.f0);
        iridescenceF0 = Schlick_to_F0(iridescenceFresnel, NdotV);
    }
#endif

    // Calculate lighting contribution from image based lighting source (IBL)
#ifdef USE_IBL
#ifdef MATERIAL_IRIDESCENCE
    f_specular += getIBLRadianceGGXIridescence(n, v, materialInfo.perceptualRoughness, materialInfo.f0, iridescenceFresnel, materialInfo.iridescenceFactor, materialInfo.specularWeight);
    f_diffuse += getIBLRadianceLambertianIridescence(n, v, materialInfo.perceptualRoughness, materialInfo.c_diff, materialInfo.f0, iridescenceF0, materialInfo.iridescenceFactor, materialInfo.specularWeight);
#else
    f_specular += getIBLRadianceGGX(n, v, materialInfo.perceptualRoughness, materialInfo.f0, materialInfo.specularWeight);
    f_diffuse += getIBLRadianceLambertian(n, v, materialInfo.perceptualRoughness, materialInfo.c_diff, materialInfo.f0, materialInfo.specularWeight);
#endif

#ifdef MATERIAL_CLEARCOAT
    f_clearcoat += getIBLRadianceGGX(materialInfo.clearcoatNormal, v, materialInfo.clearcoatRoughness, materialInfo.clearcoatF0, 1.0);
#endif

#ifdef MATERIAL_SHEEN
    f_sheen += getIBLRadianceCharlie(n, v, materialInfo.sheenRoughnessFactor, materialInfo.sheenColorFactor);
#endif
#endif

#if defined(MATERIAL_TRANSMISSION) && (defined(USE_PUNCTUAL) || defined(USE_IBL))
    f_transmission += getIBLVolumeRefraction(
        n, v,
        materialInfo.perceptualRoughness,
        materialInfo.c_diff, materialInfo.f0, materialInfo.f90,
        v_Position, u_ModelMatrix, u_ViewMatrix, u_ProjectionMatrix,
        materialInfo.ior, materialInfo.thickness, materialInfo.attenuationColor, materialInfo.attenuationDistance);
#endif

    float ao = 1.0;
    // Apply optional PBR terms for additional (optional) shading
#ifdef HAS_OCCLUSION_MAP
    ao = texture(u_OcclusionSampler,  getOcclusionUV()).r;
    f_diffuse = mix(f_diffuse, f_diffuse * ao, u_OcclusionStrength);
    // apply ambient occlusion to all lighting that is not punctual
    f_specular = mix(f_specular, f_specular * ao, u_OcclusionStrength);
    f_sheen = mix(f_sheen, f_sheen * ao, u_OcclusionStrength);
    f_clearcoat = mix(f_clearcoat, f_clearcoat * ao, u_OcclusionStrength);
#endif

#ifdef USE_PUNCTUAL
    for (int i = 0; i < LIGHT_COUNT; ++i)
    {
        Light light = u_Lights[i];

        vec3 pointToLight;
        if (light.type != LightType_Directional)
        {
            pointToLight = light.position - v_Position;
        }
        else
        {
            pointToLight = -light.direction;
        }

        // BSTF
        vec3 l = normalize(pointToLight);   // Direction from surface point to light
        vec3 h = normalize(l + v);          // Direction of the vector between l and v, called halfway vector
        float NdotL = clampedDot(n, l);
        float NdotV = clampedDot(n, v);
        float NdotH = clampedDot(n, h);
        float LdotH = clampedDot(l, h);
        float VdotH = clampedDot(v, h);
        if (NdotL > 0.0 || NdotV > 0.0)
        {
            // Calculation of analytical light
            // https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#acknowledgments AppendixB
            vec3 intensity = getLighIntensity(light, pointToLight);
#ifdef MATERIAL_IRIDESCENCE
            f_diffuse += intensity * NdotL *  BRDF_lambertianIridescence(materialInfo.f0, materialInfo.f90, iridescenceFresnel, materialInfo.iridescenceFactor, materialInfo.c_diff, materialInfo.specularWeight, VdotH);
            f_specular += intensity * NdotL * BRDF_specularGGXIridescence(materialInfo.f0, materialInfo.f90, iridescenceFresnel, materialInfo.alphaRoughness, materialInfo.iridescenceFactor, materialInfo.specularWeight, VdotH, NdotL, NdotV, NdotH);
#else
            f_diffuse += intensity * NdotL *  BRDF_lambertian(materialInfo.f0, materialInfo.f90, materialInfo.c_diff, materialInfo.specularWeight, VdotH);
            f_specular += intensity * NdotL * BRDF_specularGGX(materialInfo.f0, materialInfo.f90, materialInfo.alphaRoughness, materialInfo.specularWeight, VdotH, NdotL, NdotV, NdotH);
#endif

#ifdef MATERIAL_SHEEN
            f_sheen += intensity * getPunctualRadianceSheen(materialInfo.sheenColorFactor, materialInfo.sheenRoughnessFactor, NdotL, NdotV, NdotH);
            albedoSheenScaling = min(1.0 - max3(materialInfo.sheenColorFactor) * albedoSheenScalingLUT(NdotV, materialInfo.sheenRoughnessFactor),
                1.0 - max3(materialInfo.sheenColorFactor) * albedoSheenScalingLUT(NdotL, materialInfo.sheenRoughnessFactor));
#endif

#ifdef MATERIAL_CLEARCOAT
            f_clearcoat += intensity * getPunctualRadianceClearCoat(materialInfo.clearcoatNormal, v, l, h, VdotH,
                materialInfo.clearcoatF0, materialInfo.clearcoatF90, materialInfo.clearcoatRoughness);
#endif
        }

        // BDTF
#ifdef MATERIAL_TRANSMISSION
        // If the light ray travels through the geometry, use the point it exits the geometry again.
        // That will change the angle to the light source, if the material refracts the light ray.
        vec3 transmissionRay = getVolumeTransmissionRay(n, v, materialInfo.thickness, materialInfo.ior, u_ModelMatrix);
        pointToLight -= transmissionRay;
        l = normalize(pointToLight);

        vec3 intensity = getLighIntensity(light, pointToLight);
        vec3 transmittedLight = intensity * getPunctualRadianceTransmission(n, v, l, materialInfo.alphaRoughness, materialInfo.f0, materialInfo.f90, materialInfo.c_diff, materialInfo.ior);

#ifdef MATERIAL_VOLUME
        transmittedLight = applyVolumeAttenuation(transmittedLight, length(transmissionRay), materialInfo.attenuationColor, materialInfo.attenuationDistance);
#endif

        f_transmission += transmittedLight;
#endif
    }
#endif

    f_emissive = u_EmissiveFactor;
#ifdef MATERIAL_EMISSIVE_STRENGTH
    f_emissive *= u_EmissiveStrength;
#endif
#ifdef HAS_EMISSIVE_MAP
    f_emissive *= texture(u_EmissiveSampler, getEmissiveUV()).rgb;
#endif

    // Layer blending

    float clearcoatFactor = 0.0;
    vec3 clearcoatFresnel = vec3(0);

#ifdef MATERIAL_CLEARCOAT
    clearcoatFactor = materialInfo.clearcoatFactor;
    clearcoatFresnel = F_Schlick(materialInfo.clearcoatF0, materialInfo.clearcoatF90, clampedDot(materialInfo.clearcoatNormal, v));
    f_clearcoat = f_clearcoat * clearcoatFactor;
#endif

#ifdef MATERIAL_TRANSMISSION
    vec3 diffuse = mix(f_diffuse, f_transmission, materialInfo.transmissionFactor);
#else
    vec3 diffuse = f_diffuse;
#endif

    vec3 color = vec3(0);
#ifdef MATERIAL_UNLIT
    color = baseColor.rgb;
#else
    color = f_emissive + diffuse + f_specular;
    color = f_sheen + color * albedoSheenScaling;
    color = color * (1.0 - clearcoatFactor * clearcoatFresnel) + f_clearcoat;
#endif

#if DEBUG == DEBUG_NONE

#if ALPHAMODE == ALPHAMODE_MASK
    // Late discard to avoid samplig artifacts. See https://github.com/KhronosGroup/glTF-Sample-Viewer/issues/267
    if (baseColor.a < u_AlphaCutoff)
    {
        discard;
    }
    baseColor.a = 1.0;
#endif

#ifdef LINEAR_OUTPUT
    g_finalColor = vec4(color.rgb, baseColor.a);
#else
    g_finalColor = vec4(toneMap(color), baseColor.a);
#endif

#else
    // In case of missing data for a debug view, render a magenta stripe pattern.
    g_finalColor = vec4(1, 0, 1, 1);
    g_finalColor.rb = vec2(max(2.0 * sin(0.1 * (gl_FragCoord.x + gl_FragCoord.y)), 0.0) + 0.3);
#endif

    // Debug views:

    // Generic:
#if DEBUG == DEBUG_UV_0 && defined(HAS_TEXCOORD_0_VEC2)
    g_finalColor.rgb = vec3(v_texcoord_0, 0);
#endif
#if DEBUG == DEBUG_UV_1 && defined(HAS_TEXCOORD_1_VEC2)
    g_finalColor.rgb = vec3(v_texcoord_1, 0);
#endif
#if DEBUG == DEBUG_NORMAL_TEXTURE && defined(HAS_NORMAL_MAP)
    g_finalColor.rgb = (normalInfo.ntex + 1.0) / 2.0;
#endif
#if DEBUG == DEBUG_NORMAL_SHADING
    g_finalColor.rgb = (n + 1.0) / 2.0;
#endif
#if DEBUG == DEBUG_NORMAL_GEOMETRY
    g_finalColor.rgb = (normalInfo.ng + 1.0) / 2.0;
#endif
#if DEBUG == DEBUG_TANGENT
    g_finalColor.rgb = (normalInfo.t + 1.0) / 2.0;
#endif
#if DEBUG == DEBUG_BITANGENT
    g_finalColor.rgb = (normalInfo.b + 1.0) / 2.0;
#endif
#if DEBUG == DEBUG_ALPHA
    g_finalColor.rgb = linearTosRGB(vec3(baseColor.a));
#endif
#if DEBUG == DEBUG_OCCLUSION && defined(HAS_OCCLUSION_MAP)
    g_finalColor.rgb = linearTosRGB(vec3(ao));
#endif
#if DEBUG == DEBUG_EMISSIVE
    g_finalColor.rgb = linearTosRGB(f_emissive);
#endif

    // MR:
#ifdef MATERIAL_METALLICROUGHNESS
#if DEBUG == DEBUG_METALLIC_ROUGHNESS
    g_finalColor.rgb = linearTosRGB(f_diffuse + f_specular);
#endif
#if DEBUG == DEBUG_METALLIC
    g_finalColor.rgb = linearTosRGB(vec3(materialInfo.metallic));
#endif
#if DEBUG == DEBUG_ROUGHNESS
    g_finalColor.rgb = linearTosRGB(vec3(materialInfo.perceptualRoughness));
#endif
#if DEBUG == DEBUG_BASE_COLOR
    g_finalColor.rgb = linearTosRGB(materialInfo.baseColor);
#endif
#endif

    // Clearcoat:
#ifdef MATERIAL_CLEARCOAT
#if DEBUG == DEBUG_CLEARCOAT
    g_finalColor.rgb = linearTosRGB(f_clearcoat);
#endif
#if DEBUG == DEBUG_CLEARCOAT_FACTOR
    g_finalColor.rgb = linearTosRGB(vec3(materialInfo.clearcoatFactor));
#endif
#if DEBUG == DEBUG_CLEARCOAT_ROUGHNESS
    g_finalColor.rgb = linearTosRGB(vec3(materialInfo.clearcoatRoughness));
#endif
#if DEBUG == DEBUG_CLEARCOAT_NORMAL
    g_finalColor.rgb = (materialInfo.clearcoatNormal + vec3(1)) / 2.0;
#endif
#endif

    // Sheen:
#ifdef MATERIAL_SHEEN
#if DEBUG == DEBUG_SHEEN
    g_finalColor.rgb = linearTosRGB(f_sheen);
#endif
#if DEBUG == DEBUG_SHEEN_COLOR
    g_finalColor.rgb = linearTosRGB(materialInfo.sheenColorFactor);
#endif
#if DEBUG == DEBUG_SHEEN_ROUGHNESS
    g_finalColor.rgb = linearTosRGB(vec3(materialInfo.sheenRoughnessFactor));
#endif
#endif

    // Specular:
#ifdef MATERIAL_SPECULAR
#if DEBUG == DEBUG_SPECULAR
    g_finalColor.rgb = linearTosRGB(f_specular);
#endif
#if DEBUG == DEBUG_SPECULAR_FACTOR
    g_finalColor.rgb = vec3(materialInfo.specularWeight);
#endif

#if DEBUG == DEBUG_SPECULAR_COLOR
vec3 specularTexture = vec3(1.0);
#ifdef HAS_SPECULAR_COLOR_MAP
    specularTexture.rgb = texture(u_SpecularColorSampler, getSpecularColorUV()).rgb;
#endif
    g_finalColor.rgb = u_KHR_materials_specular_specularColorFactor * specularTexture.rgb;
#endif
#endif

    // Transmission, Volume:
#ifdef MATERIAL_TRANSMISSION
#if DEBUG == DEBUG_TRANSMISSION_VOLUME
    g_finalColor.rgb = linearTosRGB(f_transmission);
#endif
#if DEBUG == DEBUG_TRANSMISSION_FACTOR
    g_finalColor.rgb = linearTosRGB(vec3(materialInfo.transmissionFactor));
#endif
#endif
#ifdef MATERIAL_VOLUME
#if DEBUG == DEBUG_VOLUME_THICKNESS
    g_finalColor.rgb = linearTosRGB(vec3(materialInfo.thickness));
#endif
#endif

    // Iridescence:
#ifdef MATERIAL_IRIDESCENCE
#if DEBUG == DEBUG_IRIDESCENCE
    g_finalColor.rgb = linearTosRGB(iridescenceFresnel);
#endif
#if DEBUG == DEBUG_IRIDESCENCE_FACTOR
    g_finalColor.rgb = linearTosRGB(vec3(materialInfo.iridescenceFactor));
#endif
#if DEBUG == DEBUG_IRIDESCENCE_THICKNESS
    g_finalColor.rgb = linearTosRGB(vec3(materialInfo.iridescenceThickness / 1200.0));
#endif
#endif
}
