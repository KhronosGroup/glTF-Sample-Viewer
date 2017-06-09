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
#endif
#ifdef HAS_EMISSIVEMAP
uniform sampler2D u_EmissiveSampler;
#endif
#ifdef HAS_METALROUGHNESSMAP
uniform sampler2D u_MetallicRoughnessSampler;
#endif
uniform vec2 u_MetallicRoughnessValues;
#ifdef HAS_OCCLUSIONMAP
uniform sampler2D u_OcclusionSampler;
#endif

uniform vec3 u_Camera;
uniform vec4 u_scaleDiffBaseMR;
uniform vec4 u_scaleFGDSpec;
uniform vec4 u_scaleIBLAmbient;

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
  float roughness;
  float metalness;
  vec3 baseColor;
  vec3 reflectance0;
  vec3 reflectance90;
};

const float M_PI = 3.141592653589793;

// diffuse
vec3 disneyDiffuse(PBRInfo pbrInputs)
{
  float f90 = 2.*pbrInputs.LdotH*pbrInputs.LdotH*pbrInputs.roughness - 0.5;

  return (pbrInputs.baseColor/M_PI)*(1.0+f90*pow((1.0-pbrInputs.NdotL),5.0))*(1.0+f90*pow((1.0-pbrInputs.NdotV),5.0));
}

vec3 lambertianDiffuse(PBRInfo pbrInputs)
{
  return pbrInputs.baseColor / M_PI;
}

// F
// r
vec3 fresnelSchlick2(PBRInfo pbrInputs)
{
	return pbrInputs.reflectance0 + (pbrInputs.reflectance90 - pbrInputs.reflectance0) * pow(clamp(1.0 - pbrInputs.VdotH, 0.0, 1.0), 5.0);
}

vec3 fresnelSchlick(PBRInfo pbrInputs)
{
  return pbrInputs.metalness + (vec3(1.0) - pbrInputs.metalness) * pow(1.0 - pbrInputs.VdotH, 5.0);
}

// G
float microfacetCookTorrance(PBRInfo pbrInputs)
{
  return min(min(2.*pbrInputs.NdotV*pbrInputs.NdotH/pbrInputs.VdotH, 2.*pbrInputs.NdotL*pbrInputs.NdotH/pbrInputs.VdotH),1.0);
}

float microfacetSchlick(PBRInfo pbrInputs)
{
  float k = pbrInputs.roughness * 0.79788; // 0.79788 = sqrt(2.0/3.1415);
  // alternately, k can be defined with
  // float k = (pbrInputs.roughness + 1)*(pbrInputs.roughness + 1)/8;

  float l = pbrInputs.LdotH / (pbrInputs.LdotH * (1.0 - k) + k);
  float n = pbrInputs.NdotH / (pbrInputs.NdotH * (1.0 - k) + k);
  return l * n;
}

float microfacetSmith_var1(PBRInfo pbrInputs)
{
  float NdotL2 = pbrInputs.NdotL * pbrInputs.NdotL;
  float NdotV2 = pbrInputs.NdotV * pbrInputs.NdotV;
  float v = ( -1. + sqrt ( pbrInputs.roughness * (1. - NdotL2 ) / NdotL2 + 1.)) * 0.5;
  float l = ( -1. + sqrt ( pbrInputs.roughness * (1. - NdotV2 ) / NdotV2 + 1.)) * 0.5;
  return (1. / max((1. + v + l ),0.000001));
}

float SmithVisibilityG1_var2(float NdotV, float r){
	float tanSquared = (1.0 - NdotV * NdotV) / max((NdotV * NdotV),0.00001);
	return 2.0 / (1.0 + sqrt(1.0 + r * r * tanSquared));
}

float SmithG1(float NdotV, float r) {
  return 2.0 * NdotV / (NdotV + sqrt(r*r+(1.0-r*r)*(NdotV*NdotV)));
}


float SmithVisibilityGGX(PBRInfo pbrInputs){
	return SmithVisibilityG1_var2(pbrInputs.NdotL, pbrInputs.roughness) * SmithVisibilityG1_var2(pbrInputs.NdotV, pbrInputs.roughness);
}

// D
float GGX(PBRInfo pbrInputs)
{
  float roughnessSq = pbrInputs.roughness*pbrInputs.roughness;
  float f = (pbrInputs.NdotH * roughnessSq - pbrInputs.NdotH) * pbrInputs.NdotH + 1.0;
  return roughnessSq / (M_PI * f * f);
}


void main() {

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

  #ifdef HAS_NORMALMAP
  vec3 n = texture2D(u_NormalSampler, v_UV).rgb;
  n = normalize(tbn * (2.0 * n - 1.0));
  #else
  vec3 n = tbn[2].xyz;
  #endif

  vec3 v = normalize(u_Camera - v_Position);
  vec3 l = normalize(u_LightDirection);
  vec3 h = normalize(l+v);
  vec3 reflection = -normalize(reflect(v, n));

  float NdotL = clamp(dot(n,l), 0.001, 1.0);
  float NdotV = abs(dot(n,v)) + 0.001;
  float NdotH = clamp(dot(n,h), 0.0, 1.0);
  float LdotH = clamp(dot(l,h), 0.0, 1.0);
  float VdotH = clamp(dot(v,h), 0.0, 1.0);

  float roughness = clamp(u_MetallicRoughnessValues.y, 0.04, 1.0);
  float metallic = u_MetallicRoughnessValues.x;
  #ifdef HAS_METALROUGHNESSMAP
  vec4 mrSample = texture2D(u_MetallicRoughnessSampler, v_UV);
  roughness = clamp(mrSample.g * roughness, 0.04, 1.0);
  metallic = clamp(mrSample.b * metallic, 0.0, 1.0);
  #endif

  #ifdef HAS_BASECOLORMAP
  vec3 baseColor = texture2D(u_BaseColorSampler, v_UV).rgb;
  #else
  vec3 baseColor = vec3(1.0, 1.0, 1.0);
  #endif

  vec3 f0 = vec3(0.04);
  // is this the same? test!
	vec3 diffuseColor = mix(baseColor.rgb * (1.0 - f0), vec3(0., 0., 0.), metallic);
  //vec3 diffuseColor = baseColor * (1.0 - metallic);
  vec3 specularColor = mix(f0, baseColor, metallic);


  #ifdef USE_MATHS

  // Compute reflectance.
  float reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);

  // For typical incident reflectance range (between 4% to 100%) set the grazing reflectance to 100% for typical fresnel effect.
  // For very low reflectance range on highly diffuse objects (below 4%), incrementally reduce grazing reflecance to 0%.
  float reflectance90 = clamp(reflectance * 25.0, 0.0, 1.0);
  vec3 specularEnvironmentR0 = specularColor.rgb;
  vec3 specularEnvironmentR90 = vec3(1.0, 1.0, 1.0) * reflectance90;

  PBRInfo pbrInputs = PBRInfo(
    NdotL,
    NdotV,
    NdotH,
    LdotH,
    VdotH,
    roughness,
    metallic,
    diffuseColor,
    specularEnvironmentR0,
    specularEnvironmentR90
  );

  vec3 F = fresnelSchlick2(pbrInputs);
  //vec3 F = fresnelSchlick(pbrInputs);
  //float G = microfacetCookTorrance(pbrInputs);
  //float G = microfacetSmith(pbrInputs);
  //float G = microfacetSchlick(pbrInputs);
  float G = SmithVisibilityGGX(pbrInputs);
  float D = GGX(pbrInputs);

  vec3 diffuseContrib = (1.0 - F) * lambertianDiffuse(pbrInputs);
  //vec3 diffuseContrib = (1.0 - F) * disneyDiffuse(pbrInputs);

  vec3 specContrib = F * G * D / (4.0 * NdotL * NdotV);

  vec3 color = NdotL * u_LightColor * (diffuseContrib + specContrib);
  #endif

  #ifdef USE_IBL
  float mipCount = 9.0; // resolution of 512x512
  float lod = (roughness * mipCount);
  vec3 brdf = texture2D(u_brdfLUT, vec2(NdotV, 1.0 - roughness)).rgb;
  vec3 diffuseLight = textureCube(u_DiffuseEnvSampler, n).rgb;

  #ifdef USE_TEX_LOD
  vec3 specularLight = textureCubeLodEXT(u_SpecularEnvSampler, reflection, lod).rgb;
  #else
  vec3 specularLight = textureCube(u_SpecularEnvSampler, reflection).rgb;
  #endif

  vec3 IBLcolor = (diffuseLight * diffuseColor * u_scaleIBLAmbient.x) + (specularLight * (specularColor * brdf.x + brdf.y) *u_scaleIBLAmbient.y);

  color += IBLcolor;
  #endif

  #ifdef HAS_OCCLUSIONMAP
    float ao = texture2D(u_OcclusionSampler, v_UV).r;
    color *= ao;
  #endif

  #ifdef HAS_EMISSIVEMAP
    vec3 emissive = texture2D(u_EmissiveSampler, v_UV).rgb;
    color += emissive;
  #endif

  #ifdef USE_MATHS
  // mix in overrides
  color = mix(color, F, u_scaleFGDSpec.x);
  color = mix(color, vec3(G), u_scaleFGDSpec.y);
  color = mix(color, vec3(D), u_scaleFGDSpec.z);
  color = mix(color, specContrib, u_scaleFGDSpec.w);

  color = mix(color, diffuseContrib, u_scaleDiffBaseMR.x);
  color = mix(color, baseColor, u_scaleDiffBaseMR.y);
  color = mix(color, vec3(metallic), u_scaleDiffBaseMR.z);
  color = mix(color, vec3(roughness), u_scaleDiffBaseMR.w);
  #endif

  gl_FragColor = vec4(color, 1.0);
  //gl_FragColor = vec4(n * 0.5 + 0.5, 1.0);
  //gl_FragColor = vec4(NdotV, NdotV, NdotV, 1.0);
  //gl_FragColor = vec4(v_UV.rg, 0.0, 1.0);
}
