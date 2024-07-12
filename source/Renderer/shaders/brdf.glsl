//
// Fresnel
//
// http://graphicrants.blogspot.com/2013/08/specular-brdf-reference.html
// https://github.com/wdas/brdf/tree/master/src/brdfs
// https://google.github.io/filament/Filament.md.html
//

// The following equation models the Fresnel reflectance term of the spec equation (aka F())
// Implementation of fresnel from [4], Equation 15
vec3 F_Schlick(vec3 f0, vec3 f90, float VdotH) 
{
    return f0 + (f90 - f0) * pow(clamp(1.0 - VdotH, 0.0, 1.0), 5.0);
}

float F_Schlick(float f0, float f90, float VdotH)
{
    float x = clamp(1.0 - VdotH, 0.0, 1.0);
    float x2 = x * x;
    float x5 = x * x2 * x2;
    return f0 + (f90 - f0) * x5;
}

float F_Schlick(float f0, float VdotH)
{
    float f90 = 1.0; //clamp(50.0 * f0, 0.0, 1.0);
    return F_Schlick(f0, f90, VdotH);
}

vec3 F_Schlick(vec3 f0, float f90, float VdotH)
{
    float x = clamp(1.0 - VdotH, 0.0, 1.0);
    float x2 = x * x;
    float x5 = x * x2 * x2;
    return f0 + (f90 - f0) * x5;
}

vec3 F_Schlick(vec3 f0, float VdotH)
{
    float f90 = 1.0; //clamp(dot(f0, vec3(50.0 * 0.33)), 0.0, 1.0);
    return F_Schlick(f0, f90, VdotH);
}

vec3 Schlick_to_F0(vec3 f, vec3 f90, float VdotH) {
    float x = clamp(1.0 - VdotH, 0.0, 1.0);
    float x2 = x * x;
    float x5 = clamp(x * x2 * x2, 0.0, 0.9999);

    return (f - f90 * x5) / (1.0 - x5);
}

float Schlick_to_F0(float f, float f90, float VdotH) {
    float x = clamp(1.0 - VdotH, 0.0, 1.0);
    float x2 = x * x;
    float x5 = clamp(x * x2 * x2, 0.0, 0.9999);

    return (f - f90 * x5) / (1.0 - x5);
}

vec3 Schlick_to_F0(vec3 f, float VdotH) {
    return Schlick_to_F0(f, vec3(1.0), VdotH);
}

float Schlick_to_F0(float f, float VdotH) {
    return Schlick_to_F0(f, 1.0, VdotH);
}


// Smith Joint GGX
// Note: Vis = G / (4 * NdotL * NdotV)
// see Eric Heitz. 2014. Understanding the Masking-Shadowing Function in Microfacet-Based BRDFs. Journal of Computer Graphics Techniques, 3
// see Real-Time Rendering. Page 331 to 336.
// see https://google.github.io/filament/Filament.md.html#materialsystem/specularbrdf/geometricshadowing(specularg)
float V_GGX(float NdotL, float NdotV, float alphaRoughness)
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
float D_GGX(float NdotH, float alphaRoughness)
{
    float alphaRoughnessSq = alphaRoughness * alphaRoughness;
    float f = (NdotH * NdotH) * (alphaRoughnessSq - 1.0) + 1.0;
    return alphaRoughnessSq / (M_PI * f * f);
}


float lambdaSheenNumericHelper(float x, float alphaG)
{
    float oneMinusAlphaSq = (1.0 - alphaG) * (1.0 - alphaG);
    float a = mix(21.5473, 25.3245, oneMinusAlphaSq);
    float b = mix(3.82987, 3.32435, oneMinusAlphaSq);
    float c = mix(0.19823, 0.16801, oneMinusAlphaSq);
    float d = mix(-1.97760, -1.27393, oneMinusAlphaSq);
    float e = mix(-4.32054, -4.85967, oneMinusAlphaSq);
    return a / (1.0 + b * pow(x, c)) + d * x + e;
}


float lambdaSheen(float cosTheta, float alphaG)
{
    if (abs(cosTheta) < 0.5)
    {
        return exp(lambdaSheenNumericHelper(cosTheta, alphaG));
    }
    else
    {
        return exp(2.0 * lambdaSheenNumericHelper(0.5, alphaG) - lambdaSheenNumericHelper(1.0 - cosTheta, alphaG));
    }
}


float V_Sheen(float NdotL, float NdotV, float sheenRoughness)
{
    sheenRoughness = max(sheenRoughness, 0.000001); //clamp (0,1]
    float alphaG = sheenRoughness * sheenRoughness;

    return clamp(1.0 / ((1.0 + lambdaSheen(NdotV, alphaG) + lambdaSheen(NdotL, alphaG)) *
        (4.0 * NdotV * NdotL)), 0.0, 1.0);
}


//Sheen implementation-------------------------------------------------------------------------------------
// See  https://github.com/sebavan/glTF/tree/KHR_materials_sheen/extensions/2.0/Khronos/KHR_materials_sheen

// Estevez and Kulla http://www.aconty.com/pdf/s2017_pbs_imageworks_sheen.pdf
float D_Charlie(float sheenRoughness, float NdotH)
{
    sheenRoughness = max(sheenRoughness, 0.000001); //clamp (0,1]
    float alphaG = sheenRoughness * sheenRoughness;
    float invR = 1.0 / alphaG;
    float cos2h = NdotH * NdotH;
    float sin2h = 1.0 - cos2h;
    return (2.0 + invR) * pow(sin2h, invR * 0.5) / (2.0 * M_PI);
}


//https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#acknowledgments AppendixB
vec3 BRDF_lambertian(vec3 diffuseColor)
{
    // see https://seblagarde.wordpress.com/2012/01/08/pi-or-not-to-pi-in-game-lighting-equation/
    return (diffuseColor / M_PI);
}

//  https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#acknowledgments AppendixB
vec3 BRDF_specularGGX(float alphaRoughness, float NdotL, float NdotV, float NdotH)
{
    float Vis = V_GGX(NdotL, NdotV, alphaRoughness);
    float D = D_GGX(NdotH, alphaRoughness);

    return vec3(Vis * D);
}


#ifdef MATERIAL_ANISOTROPY
// GGX Distribution Anisotropic (Same as Babylon.js)
// https://blog.selfshadow.com/publications/s2012-shading-course/burley/s2012_pbs_disney_brdf_notes_v3.pdf Addenda
float D_GGX_anisotropic(float NdotH, float TdotH, float BdotH, float anisotropy, float at, float ab)
{
    float a2 = at * ab;
    vec3 f = vec3(ab * TdotH, at * BdotH, a2 * NdotH);
    float w2 = a2 / dot(f, f);
    return a2 * w2 * w2 / M_PI;
}

// GGX Mask/Shadowing Anisotropic (Same as Babylon.js - smithVisibility_GGXCorrelated_Anisotropic)
// Heitz http://jcgt.org/published/0003/02/03/paper.pdf
float V_GGX_anisotropic(float NdotL, float NdotV, float BdotV, float TdotV, float TdotL, float BdotL, float at, float ab)
{
    float GGXV = NdotL * length(vec3(at * TdotV, ab * BdotV, NdotV));
    float GGXL = NdotV * length(vec3(at * TdotL, ab * BdotL, NdotL));
    float v = 0.5 / (GGXV + GGXL);
    return clamp(v, 0.0, 1.0);
}

vec3 BRDF_specularGGXAnisotropy(float alphaRoughness, float anisotropy, vec3 n, vec3 v, vec3 l, vec3 h, vec3 t, vec3 b)
{
    // Roughness along the anisotropy bitangent is the material roughness, while the tangent roughness increases with anisotropy.
    float at = mix(alphaRoughness, 1.0, anisotropy * anisotropy);
    float ab = clamp(alphaRoughness, 0.001, 1.0);

    float NdotL = clamp(dot(n, l), 0.0, 1.0);
    float NdotH = clamp(dot(n, h), 0.001, 1.0);
    float NdotV = dot(n, v);

    float V = V_GGX_anisotropic(NdotL, NdotV, dot(b, v), dot(t, v), dot(t, l), dot(b, l), at, ab);
    float D = D_GGX_anisotropic(NdotH, dot(t, h), dot(b, h), anisotropy, at, ab);

    return vec3(V * D);
}
#endif


// f_sheen
vec3 BRDF_specularSheen(vec3 sheenColor, float sheenRoughness, float NdotL, float NdotV, float NdotH)
{
    float sheenDistribution = D_Charlie(sheenRoughness, NdotH);
    float sheenVisibility = V_Sheen(NdotL, NdotV, sheenRoughness);
    return sheenColor * sheenDistribution * sheenVisibility;
}
