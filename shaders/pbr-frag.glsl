#extension GL_EXT_shader_texture_lod: enable
#extension GL_OES_standard_derivatives : enable

precision highp float;

uniform vec3 u_LightDirection;
uniform vec3 u_LightColor;

#ifdef USE_IBL
uniform samplerCube u_DiffuseEnvSampler;
uniform samplerCube u_SpecularEnvSampler;
uniform sampler2D u_brdfLUT;
#endif

#ifdef HAS_BASECOLORMAP
uniform sampler2D u_BaseColorSampler;
#endif
#ifdef HAS_NORMALMAP
uniform sampler2D u_NormalSampler;
uniform float u_NormalScale;
#endif
#ifdef HAS_EMISSIVEMAP
uniform sampler2D u_EmissiveSampler;
uniform vec3 u_EmissiveFactor;
#endif
#ifdef HAS_METALROUGHNESSMAP
uniform sampler2D u_MetallicRoughnessSampler;
#endif
#ifdef HAS_OCCLUSIONMAP
uniform sampler2D u_OcclusionSampler;
uniform float u_OcclusionStrength;
#endif

uniform vec2 u_MetallicRoughnessValues;
uniform vec4 u_BaseColorFactor;

uniform vec3 u_Camera;

// debugging flags used for shader output of intermediate PBR variables
uniform vec4 u_ScaleDiffBaseMR;
uniform vec4 u_ScaleFGDSpec;
uniform vec4 u_ScaleIBLAmbient;

varying vec3 v_Position;

varying vec2 v_UV;

#ifdef HAS_NORMALS
#ifdef HAS_TANGENTS
varying mat3 v_TBN;
#else
varying vec3 v_Normal;
#endif
#endif

struct PBRInfo
{
  float NdotL;
  float NdotV;
  float NdotH;
  float LdotH;
  float VdotH;
  float perceptualRoughness;
  float metalness;
  vec3 baseColor;
  vec3 reflectance0;
  vec3 reflectance90;
  float alphaRoughness;
  vec3 diffuseColor;
  vec3 specularColor;
};

const float M_PI = 3.141592653589793;
const float c_MinRoughness = 0.04;

// helper function to get the tangent space matrix under several possible model configurations
mat3 tangentSpaceMatrix()
{
  // Normal Map
  #ifndef HAS_TANGENTS
    vec3 pos_dx = dFdx(v_Position);
    vec3 pos_dy = dFdy(v_Position);
    vec3 tex_dx = dFdx(vec3(v_UV, 0.0));
    vec3 tex_dy = dFdy(vec3(v_UV, 0.0));
    vec3 t = (tex_dy.t * pos_dx - tex_dx.t * pos_dy) / (tex_dx.s * tex_dy.t - tex_dy.s * tex_dx.t);

    #ifdef HAS_NORMALS
      vec3 ng = normalize(v_Normal);
    #else
      vec3 ng = cross(pos_dx, pos_dy);
    #endif

    t = normalize(t - ng * dot(ng, t));
    vec3 b = normalize(cross(ng, t));
    mat3 tbn = mat3(t, b, ng);
  #else // HAS_TANGENTS && HAS_NORMALS
    mat3 tbn = v_TBN;
  #endif

  return tbn;
}

vec3 getIBLContribution(PBRInfo pbrInputs, vec3 n, vec3 reflection)
{
    float mipCount = 9.0; // resolution of 512x512
    float lod = (pbrInputs.perceptualRoughness * mipCount);
    vec3 brdf = texture2D(u_brdfLUT, vec2(pbrInputs.NdotV, 1.0 - pbrInputs.perceptualRoughness)).rgb;
    vec3 diffuseLight = textureCube(u_DiffuseEnvSampler, n).rgb;

    #ifdef USE_TEX_LOD
      vec3 specularLight = textureCubeLodEXT(u_SpecularEnvSampler, reflection, lod).rgb;
    #else
      vec3 specularLight = textureCube(u_SpecularEnvSampler, reflection).rgb;
    #endif

    vec3 diffuse = diffuseLight * pbrInputs.diffuseColor;
    vec3 specular = specularLight * (pbrInputs.specularColor * brdf.x + brdf.y);

    // For presentation, this allows us to disable IBL terms
    diffuse *= u_ScaleIBLAmbient.x;
    specular *= u_ScaleIBLAmbient.y;

    return diffuse + specular;
}

// basic Lambertian diffuse, implementation from Lambert's Photometria https://archive.org/details/lambertsphotome00lambgoog
vec3 diffuse(PBRInfo pbrInputs)
{
  return pbrInputs.baseColor / M_PI;
}

// The following equations model the Fresnel reflectance term of the spec equation (aka F())
// implementation of fresnel from “An Inexpensive BRDF Model for Physically based Rendering” by Christophe Schlick
vec3 fresnelSchlick(PBRInfo pbrInputs)
{
  return pbrInputs.reflectance0 + (pbrInputs.reflectance90 - pbrInputs.reflectance0) * pow(clamp(1.0 - pbrInputs.VdotH, 0.0, 1.0), 5.0);
}

float GSmithSub(float NdotV, float r)
{
  float tanSquared = (1.0 - NdotV * NdotV) / max((NdotV * NdotV), 0.00001);
  return 2.0 / (1.0 + sqrt(1.0 + r * r * tanSquared));
}

float geometricOcclusion(PBRInfo pbrInputs)
{
  return GSmithSub(pbrInputs.NdotL, pbrInputs.alphaRoughness) * GSmithSub(pbrInputs.NdotV, pbrInputs.alphaRoughness);
}

// The following equation(s) model the distribution of microfacet normals across the area being drawn (aka D())
// implementation from “Average Irregularity Representation of a Roughened Surface for Ray Reflection” by T. S. Trowbridge, and K. P. Reitz
float GGX(PBRInfo pbrInputs)
{
  float roughnessSq = pbrInputs.alphaRoughness*pbrInputs.alphaRoughness;
  float f = (pbrInputs.NdotH * roughnessSq - pbrInputs.NdotH) * pbrInputs.NdotH + 1.0;
  return roughnessSq / (M_PI * f * f);
}

void main()
{
  // Metallic and Roughness material properties are packed together
  // In glTF, these factors can be specified by fixed scalar values
  // or from a metallic-roughness map
  float perceptualRoughness = u_MetallicRoughnessValues.y;
  float metallic = u_MetallicRoughnessValues.x;
  #ifdef HAS_METALROUGHNESSMAP
    vec4 mrSample = texture2D(u_MetallicRoughnessSampler, v_UV);
    perceptualRoughness = mrSample.g * perceptualRoughness;
    metallic = mrSample.b * metallic;
  #endif
  // Roughness is authored as perceptual roughness; as is convention,
  // convert to material roughness by squaring the perceptual roughness.
  // TODO: citation
  float alphaRoughness = perceptualRoughness * perceptualRoughness;
  perceptualRoughness = clamp(perceptualRoughness, c_MinRoughness, 1.0);
  metallic = clamp(metallic, 0.0, 1.0);

  // The albedo may be defined from a base texture or a flat color
  #ifdef HAS_BASECOLORMAP
    vec4 baseColor = texture2D(u_BaseColorSampler, v_UV) * u_BaseColorFactor;
  #else
    vec4 baseColor = u_BaseColorFactor;
  #endif

  vec3 f0 = vec3(0.04);
  vec3 diffuseColor = baseColor.rgb * (vec3(1.0) - f0);
  diffuseColor *= 1.0 - metallic;
  vec3 specularColor = mix(f0, baseColor.rgb, metallic);

  // Compute reflectance.
  float reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);

  // For typical incident reflectance range (between 4% to 100%) set the grazing reflectance to 100% for typical fresnel effect.
  // For very low reflectance range on highly diffuse objects (below 4%), incrementally reduce grazing reflecance to 0%.
  float reflectance90 = clamp(reflectance * 25.0, 0.0, 1.0);
  vec3 specularEnvironmentR0 = specularColor.rgb;
  vec3 specularEnvironmentR90 = vec3(1.0, 1.0, 1.0) * reflectance90;

  // Find the normal for this fragment, pulling either from a predefined normal map
  // or from the interpolated mesh normal and tangent attributes.
  mat3 tbn = tangentSpaceMatrix();
  #ifdef HAS_NORMALMAP
    vec3 n = texture2D(u_NormalSampler, v_UV).rgb;
    n = normalize(tbn * ((2.0 * n - 1.0) * vec3(u_NormalScale, u_NormalScale, 1.0)));
  #else
    vec3 n = tbn[2].xyz;
  #endif

  vec3 v = normalize(u_Camera - v_Position);        // View vector
  vec3 l = normalize(u_LightDirection);             // Light Direction
  vec3 h = normalize(l+v);                          // Half vector
  vec3 reflection = -normalize(reflect(v, n));

  float NdotL = clamp(dot(n, l), 0.001, 1.0);
  float NdotV = abs(dot(n, v)) + 0.001;
  float NdotH = clamp(dot(n, h), 0.0, 1.0);
  float LdotH = clamp(dot(l, h), 0.0, 1.0);
  float VdotH = clamp(dot(v, h), 0.0, 1.0);

  PBRInfo pbrInputs = PBRInfo(
    NdotL,
    NdotV,
    NdotH,
    LdotH,
    VdotH,
    perceptualRoughness,
    metallic,
    baseColor.rgb,
    specularEnvironmentR0,
    specularEnvironmentR90,
    alphaRoughness,
    diffuseColor,
    specularColor
  );

  vec3 F = fresnelSchlick(pbrInputs);
  float G = geometricOcclusion(pbrInputs);
  float D = GGX(pbrInputs);

  // Calculation of analytical lighting contribution
  vec3 diffuseContrib = (1.0 - F) * diffuse(pbrInputs);
  vec3 specContrib = F * G * D / (4.0 * NdotL * NdotV);
  vec3 color = NdotL * u_LightColor * (diffuseContrib + specContrib);

  // Calculate lighting contribution from image based lighting source (IBL)
  #ifdef USE_IBL
    color += getIBLContribution(pbrInputs, n, reflection);
  #endif // USE_IBL

  // Apply optional PBR terms for additional (optional) shading
  #ifdef HAS_OCCLUSIONMAP
    float ao = texture2D(u_OcclusionSampler, v_UV).r;
    color = mix(color, color * ao, u_OcclusionStrength);
  #endif

  #ifdef HAS_EMISSIVEMAP
    vec3 emissive = texture2D(u_EmissiveSampler, v_UV).rgb * u_EmissiveFactor;
    color += emissive;
  #endif

  // This section uses mix to override final color for reference app visualization
  // of various parameters in the lighting equation.
  color = mix(color, F, u_ScaleFGDSpec.x);
  color = mix(color, vec3(G), u_ScaleFGDSpec.y);
  color = mix(color, vec3(D), u_ScaleFGDSpec.z);
  color = mix(color, specContrib, u_ScaleFGDSpec.w);

  color = mix(color, diffuseContrib, u_ScaleDiffBaseMR.x);
  color = mix(color, baseColor.rgb, u_ScaleDiffBaseMR.y);
  color = mix(color, vec3(metallic), u_ScaleDiffBaseMR.z);
  color = mix(color, vec3(perceptualRoughness), u_ScaleDiffBaseMR.w);

  gl_FragColor = vec4(color, baseColor.a);
}
