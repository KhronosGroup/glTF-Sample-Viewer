#extension GL_EXT_shader_texture_lod: enable
#extension GL_OES_standard_derivatives : enable

precision highp float;

uniform vec3 u_LightDirection;
uniform vec3 u_LightColor;
uniform samplerCube u_DiffuseEnvSampler;
uniform samplerCube u_SpecularEnvSampler;
uniform samplerCube u_EnvSampler;
uniform sampler2D u_brdfLUT;
uniform sampler2D u_BaseColorSampler;
uniform sampler2D u_NormalSampler;
uniform sampler2D u_EmissiveSampler;
uniform sampler2D u_MetallicRoughnessSampler;
uniform sampler2D u_OcclusionSampler;
uniform vec3 u_Camera;
uniform bool u_isEmissive;
uniform bool u_hasAO;
uniform vec4 u_scaleDiffSpecAmbient;
uniform vec4 u_scaleFGD;
varying vec4 v_Color;
varying vec2 v_UV;
#ifdef GENERATE_DERIVATIVE_TANGENTS
varying vec3 v_Normal; 
#endif
#ifdef USE_SAVED_TANGENTS
varying mat3 v_TBN;
#endif
varying vec3 v_Position;

const float M_PI = 3.141592653589793;

// diffuse
vec3 disneyDiffuse(float NdotL, float NdotV, float LdotH, float roughness, vec3 baseColor)
{
  float f90 = 2.*LdotH*LdotH*roughness - 0.5;

  return (baseColor/M_PI)*(1.0+f90*pow((1.0-NdotL),5.0))*(1.0+f90*pow((1.0-NdotV),5.0));
}

// F
// spectre version (why is it called ggx?  dunno)
vec3 FresnelSchlickGGX(float VdotH, vec3 reflectance0, vec3 reflectance90)
{
	return reflectance0 + (reflectance90 - reflectance0) * pow(clamp(1.0 - VdotH, 0.0, 1.0), 5.0);
}

vec3 fresnelSchlick2(float VdotH, vec3 reflectance0, vec3 reflectance90)
{
  return reflectance0 + (reflectance90 - reflectance0) * pow(1.0 - VdotH, 5.0);
}

vec3 fresnelSchlick(float VdotH, vec3 metalness)
{
  return metalness + (vec3(1.0) - metalness) * pow(1.0 - VdotH, 5.0);
}

// G
float microfacetCookTorrance(float NdotV, float NdotH, float NdotL, float VdotH)
{
  return min(min(2.*NdotV*NdotH/VdotH, 2.*NdotL*NdotH/VdotH),1.0);
}

float microfacetSchlick(float LdotH, float NdotH, float roughness)
{
  float k = roughness * 0.79788; // 0.79788 = sqrt(2.0/3.1415);

  float l = LdotH / (LdotH * (1.0 - k) + k);
  float n = NdotH / (NdotH * (1.0 - k) + k);
  return l * n;
}

float microfacetSmithGGX(float NdotL, float NdotV, float roughness)
{
  float NdotL2 = NdotL * NdotL;
  float NdotV2 = NdotV * NdotV;
  float v = ( -1. + sqrt ( roughness * (1. - NdotL2 ) / NdotL2 + 1.)) * 0.5;
  float l = ( -1. + sqrt ( roughness * (1. - NdotV2 ) / NdotV2 + 1.)) * 0.5;
  return (1. / max((1. + v + l ),0.000001));
}

// spectre G
float SmithVisibilityG1_TrowbridgeReitzGGX(float NdotV, float alphaG){
	float tanSquared = (1.0 - NdotV * NdotV) / max((NdotV * NdotV),0.00001);

	return 2.0 / (1.0 + sqrt(1.0 + alphaG * alphaG * tanSquared));
}

float SmithVisibilityG_TrowbridgeReitzGGX_Walter(float NdotL, float NdotV, float alphaG){
	return SmithVisibilityG1_TrowbridgeReitzGGX(NdotL, alphaG) * SmithVisibilityG1_TrowbridgeReitzGGX(NdotV, alphaG);
}

// D
float GGX(float NdotH, float roughness)
{
  float roughnessSq = roughness*roughness;
  float f = (NdotH * roughnessSq - NdotH) * NdotH + 1.0;
  return roughnessSq / (M_PI * f * f);
}

// spectre D
float NormalDistributionFunction_TrowbridgeReitzGGX(float NdotH, float alphaG){
	float a = alphaG;
	float a2 = a * a;
	float d = NdotH * NdotH * (a2 - 1.0) + 1.0;

	return a2 / (M_PI * d * d);
}


void main(){
  // Normal Map
  #ifdef GENERATE_DERIVATIVE_TANGENTS
  vec3 ng = normalize(v_Normal);
  vec3 pos_dx = dFdx(v_Position);
  vec3 pos_dy = dFdy(v_Position);
  vec3 tex_dx = dFdx(vec3(v_UV, 0.0));
  vec3 tex_dy = dFdy(vec3(v_UV, 0.0));
  vec3 t = (tex_dy.t * pos_dx - tex_dx.t * pos_dy) / (tex_dx.s * tex_dy.t - tex_dy.s * tex_dx.t);
  t = normalize(t - ng * dot(ng, t));
  vec3 b = normalize(cross(ng, t));
  mat3 tbn = mat3(t, b, ng);
  #endif

  #ifdef USE_SAVED_TANGENTS
  mat3 tbn = v_TBN;
  #endif

  vec3 n = texture2D(u_NormalSampler, v_UV).rgb;
  n = normalize(tbn * (2.0 * n - 1.0));
  vec3 v = normalize(u_Camera - v_Position);
  vec3 l = normalize(u_LightDirection);
  vec3 h = normalize(l+v);
  vec3 reflection = -normalize(reflect(v, n));

  float NdotL = clamp(dot(n,l), 0.0, 1.0);
  float NdotV = clamp(dot(n,v), 0.0, 1.0);
  float NdotH = clamp(dot(n,h), 0.0, 1.0);
  float LdotH = clamp(dot(l,h), 0.0, 1.0);
  float VdotH = clamp(dot(v,h), 0.0, 1.0);
  
  float roughness = clamp(texture2D(u_MetallicRoughnessSampler, v_UV).g, 0.0005, 1.0);
  float metallic = clamp(texture2D(u_MetallicRoughnessSampler, v_UV).b, 0.0, 1.0);
  vec3 baseColor = texture2D(u_BaseColorSampler, v_UV).rgb;

  vec3 f0 = vec3(0.04);
  // is this the same? test! 
	//vec3 diffuseColor = mix(baseColor.rgb * (1.0 - f0), vec3(0., 0., 0.), metallic);
  vec3 diffuseColor = baseColor * (1.0 - metallic);
  vec3 specularColor = mix(f0, baseColor, metallic);


  #ifdef USE_MATHS
  //vec3 diffuseContrib = max(NdotL,0.) * u_LightColor * diffuseColor;
  vec3 diffuseContrib = disneyDiffuse(NdotL, NdotV, LdotH, roughness, diffuseColor) * NdotL * u_LightColor;

  	// Compute reflectance.
	float reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);

	// For typical incident reflectance range (between 4% to 100%) set the grazing reflectance to 100% for typical fresnel effect.
  // For very low reflectance range on highly diffuse objects (below 4%), incrementally reduce grazing reflecance to 0%.
  float reflectance90 = clamp(reflectance * 25.0, 0.0, 1.0);
	vec3 specularEnvironmentR0 = specularColor.rgb;
	vec3 specularEnvironmentR90 = vec3(1.0, 1.0, 1.0) * reflectance90;

  vec3 F = fresnelSchlick2(VdotH, specularEnvironmentR0, specularEnvironmentR90);
  //vec3 F = fresnelSchlick(VdotH, vec3(metallic));
  ///float G = microfacetCookTorrance(NdotV, NdotH, VdotH, NdotL);
  //float G = microfacetSchlick(LdotH, NdotH, roughness);
  float G = SmithVisibilityG_TrowbridgeReitzGGX_Walter(NdotL, NdotV, roughness);
  //float D = GGX(NdotH, roughness);
  float D = NormalDistributionFunction_TrowbridgeReitzGGX(NdotH, roughness);

  vec3 specContrib = M_PI * u_LightColor * F * G * D / 4.0*NdotL*NdotV;

  vec3 color = (diffuseContrib + specContrib);
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

  vec3 IBLcolor = (diffuseLight * diffuseColor) + (specularLight * (specularColor * brdf.x + brdf.y));

  color += IBLcolor * u_scaleDiffSpecAmbient.z;
  #endif
  
  if (u_hasAO) {
    float ao = texture2D(u_OcclusionSampler, v_UV).r;
    color *= ao;
  }

  if (u_isEmissive) {
    vec3 emissive = texture2D(u_EmissiveSampler, v_UV).rgb;
    color += emissive;
  }

  #ifdef USE_MATHS
  // mix in overrides
  color = mix(color, diffuseContrib, u_scaleDiffSpecAmbient.x);
  color = mix(color, specContrib, u_scaleDiffSpecAmbient.y);
  //color = mix(color, ambientContrib, u_scaleDiffSpecAmbient.z);

  color = mix(color, F, u_scaleFGD.x);
  color = mix(color, vec3(G), u_scaleFGD.y);
  color = mix(color, vec3(D), u_scaleFGD.z);

  color = mix(color, vec3(metallic), u_scaleDiffSpecAmbient.w);
  color = mix(color, vec3(roughness), u_scaleFGD.w);
  #endif
 
  gl_FragColor = vec4(color, 1.0);
  //gl_FragColor = vec4(h * 0.5 + 0.5, 1.0);
  //gl_FragColor = vec4(NdotH, NdotH, NdotH, 1.0);
  //gl_FragColor = vec4(specularEnvironmentR0, 1.0);
}
