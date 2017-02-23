// References:
// [1] : Real Shading in Unreal Engine 4 (B. Karis) 
//       http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf
// [2] : Moving Frostbite to Physically Based Rendering 2.0 (S. Lagarde)
//       http://www.frostbite.com/wp-content/uploads/2014/11/course_notes_moving_frostbite_to_pbr_v2.pdf
// [3] : Microfacet Models for Refraction through Rough Surfaces (B. Walter)
//       http://www.cs.cornell.edu/~srm/publications/EGSR07-btdf.pdf
// [4] : An Inexpensive BRDF Model for Physically-based Rendering (C. Schlick)
//       https://www.cs.virginia.edu/~jdl/bib/appearance/analytic models/schlick94b.pdf
// [5] : A Reflectance Model for Computer Graphics (R. Cook)
//       http://graphics.pixar.com/library/ReflectanceModel/paper.pdf
// [6] : Crafting a Next-Gen Material Pipeline for The Order: 1886 (D. Neubelt)
//       http://blog.selfshadow.com/publications/s2013-shading-course/rad/s2013_pbs_rad_notes.pdf

precision mediump float;

uniform sampler2D u_baseColorTexture;
uniform sampler2D u_metallicRoughnessTexture;
uniform sampler2D u_normalTexture;
uniform sampler2D u_occlusionTexture;
uniform sampler2D u_emissionTexture;

uniform int u_hasBaseColorTexture;
uniform int u_hasMetallicRoughnessTexture;
uniform int u_hasNormalTexture;
uniform int u_hasOcclusionTexture;
uniform int u_hasEmissionTexture;

uniform vec4 u_baseColorFactor;
uniform float u_metallicFactor;
uniform float u_roughnessFactor;
uniform float u_normalScale;
uniform float u_occlusionStrength;
uniform vec3 u_emissionFactor;

varying vec3 v_lightPosition;

varying vec2 v_baseColorTexCoord;
varying vec2 v_metallicRoughnessTexCoord;
varying vec2 v_normalTexCoord;
varying vec2 v_occlusionTexCoord;
varying vec2 v_emissionTexCoord;

varying vec3 v_position;
varying vec3 v_normal; 
varying vec3 v_tangent;

const float M_PI = 3.141592653589793;


// Computation of the specular distribution of microfacet normals on the 
// surface. This is also referred to as "NDF", the "normal distribution 
// function". It receives the half-vector H, the surface normal N, and the 
// roughness. This implementation is based on the description in [1], which 
// is supposed to be a summary of [3], although I didn't do the maths...

float microfacetDistribution(
    vec3 H, vec3 N, float roughness)
{
    float alpha = roughness * roughness;
    float alpha_squared = alpha * alpha;
    
    float NdotH = clamp(dot(N, H), 0.0, 1.0);
    float NdotH_squared = NdotH * NdotH;
    
    float x = (NdotH * NdotH) * (alpha_squared - 1.0) + 1.0;
    return alpha_squared / (M_PI * x * x);
}

// Computation of the Fresnel specular reflectance, using the approximation 
// described in [4]. It receives the specular color, the 
// direction from the surface point to the viewer V, and the half-vector H. 

vec3 specularReflectance(
    vec3 specularColor, vec3 V, vec3 H)
{
    float HdotV = clamp(dot(H, V), 0.0, 1.0);
    return specularColor + (1.0 - specularColor) * pow(1.0 - HdotV, 5.0);
}

// Computation of the geometric shadowing or "specular geometric attenuation". 
// This describes how much the microfacets of the surface shadow each other, 
// based on the roughness of the surface. 
// This implementation is based on [1], which contains some odd tweaks and 
// cross-references to [3] and [4], which I did not follow in all depth. 
// Let's hope they know their stuff.
// It receives the roughness value, the normal vector of the surface N,
// the vector from the surface to the viewer V, the vector from the
// surface to the light L, and the half vector H

float specularAttenuation(
    float roughness, vec3 V, vec3 N, vec3 L, vec3 H)
{
    float NdotL = clamp(dot(N, L), 0.0, 1.0);
    float NdotV = clamp(dot(N, V), 0.0, 1.0);
    float k = (roughness + 1.0) * (roughness + 1.0) / 8.0;
    
    float GL = NdotL / (NdotL * (1.0 - k) + k);
    float GV = NdotV / (NdotV * (1.0 - k) + k);

    return GL * GV;
}





void main()
{
    // Fetch the base color
    vec4 baseColor = vec4(1.0);
    if (u_hasBaseColorTexture != 0)
    {
        baseColor = texture2D(u_baseColorTexture, v_baseColorTexCoord) * u_baseColorFactor;
    }

    // Fetch the metallic and roughness values
    vec4 metallicRoughness = vec4(1.0);
    if (u_hasMetallicRoughnessTexture != 0)
    {
        metallicRoughness = texture2D(u_metallicRoughnessTexture, v_metallicRoughnessTexCoord);
    }
    float metallic = metallicRoughness.x * u_metallicFactor;
    float roughness = metallicRoughness.y * u_roughnessFactor;

    vec3 N = normalize(v_normal);
    
    // Fetch the normal from the normal texture
    if (u_hasNormalTexture != 0)
    {
        vec3 textureNormal = texture2D(u_normalTexture, v_normalTexCoord).rgb;
        vec3 normalizedTextureNormal = normalize(textureNormal * 2.0 - 1.0);
        vec3 scaledTextureNormal = normalizedTextureNormal * u_normalScale;
        
        // Compute the TBN (tangent, bitangent, normal) matrix
        // that maps the normal of the normal texture from the
        // surface coordinate system into view space
        vec3 T = normalize(v_tangent);
        vec3 B = cross(N, T);
        mat3 TBN = mat3(T, B, N);
        
        N = normalize(TBN * scaledTextureNormal);
    }
    
    // Compute the vector from the surface point to the light (L),
    // the vector from the surface point to the viewer (V),
    // and the half-vector between both (H)
    // The camera position in view space is fixed.
    vec3 cameraPosition = vec3(0.0, 0.0, 1.0);
    vec3 L = normalize(v_lightPosition - v_position);
    vec3 V = normalize(cameraPosition - v_position);
    vec3 H = normalize(L + V);

    
    // Copute the microfacet distribution (D)
    float microfacetDistribution = 
        microfacetDistribution(H, N, roughness);
        
    // Compute the specularly reflected color (F)
    vec3 specularInputColor = (baseColor.rgb * metallic);
    vec3 specularReflectance = 
        specularReflectance(specularInputColor, V, H);
    
    // Compute the geometric specular attenuation (G)
    float specularAttenuation = 
       specularAttenuation(roughness, V, N, L, H);
    
    // Compute the BRDF, as it is described in [1], with a reference
    // to [5], although the formula does not seem to appear there.
    // However.
    // The seemingly arbitrary clamping to avoid divide-by-zero
    // was inspired by [6].
    float NdotV = dot(N,V);
    float NdotL = dot(N,L);
    vec3 specularBRDF = vec3(0.0);
    if (NdotV > 0.0001 && NdotL > 0.0001)
    {
        float d = microfacetDistribution;
        vec3 f = specularReflectance;
        float g = specularAttenuation;
        specularBRDF = (d * f * g) / (4.0 * NdotL * NdotV);
    }

    vec3 diffuseColor = baseColor.rgb * (1.0 - metallic);
    vec4 diffuse = vec4(diffuseColor * NdotL, 1.0);
    vec4 specular = vec4(specularInputColor * specularBRDF, 1.0);

    vec4 occlusion = vec4(1.0);
    if (u_hasOcclusionTexture != 0)
    {
        occlusion = texture2D(u_occlusionTexture, v_occlusionTexCoord);
    }
    vec4 occlusionFactor = vec4(1.0) - ((vec4(1.0) - occlusion) * u_occlusionStrength);
    
    vec4 sampledEmission = vec4(1.0);
    if (u_hasEmissionTexture != 0)
    {
        sampledEmission = texture2D(u_emissionTexture, v_emissionTexCoord);
    }
    vec4 emission = sampledEmission * vec4(u_emissionFactor, 1.0);
    
    vec4 mainColor = clamp(diffuse + specular, 0.0, 1.0);
    vec4 finalColor = clamp(mainColor * occlusionFactor + emission, 0.0, 1.0);
    
    //finalColor = vec4(0.0, 0.0, 0.0, 1.0);
    //finalColor.r = u_metallicFactor;
    //finalColor.g = u_roughnessFactor;
    
    gl_FragColor = finalColor;
}


