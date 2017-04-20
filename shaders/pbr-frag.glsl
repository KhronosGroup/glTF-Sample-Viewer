precision highp float;

#extension GL_EXT_shader_texture_lod: enable
#extension GL_OES_standard_derivatives : enable

uniform vec3 u_LightPosition;
uniform samplerCube u_DiffuseEnvSampler;
uniform samplerCube u_SpecularEnvSampler;
uniform samplerCube u_EnvSampler;
uniform sampler2D u_brdfLUT;
uniform sampler2D u_BaseColorSampler;
uniform sampler2D u_MetallicRoughnessSampler;
uniform sampler2D u_NormalSampler;
uniform sampler2D u_EmissiveSampler;
uniform sampler2D u_OcclusionSampler;
uniform vec3 u_Camera;
uniform vec3 u_BaseColor;
uniform float u_Metallic;
uniform float u_Roughness;
uniform bool u_useTextures;
uniform bool u_isEmissive;
uniform bool u_hasAO;
varying vec4 v_Color;
varying vec2 v_UV;
varying vec3 v_Tangent;
varying vec3 v_Normal; 
varying vec3 v_Position;

const float M_PI = 3.141592653589793;
const float zero = 1E-5;
const float one = 1.0 - zero;

void main(){
  // Normal Map
  vec3 ng = normalize(v_Normal);
  vec3 pos_dx = dFdx(v_Position);
  vec3 pos_dy = dFdy(v_Position);
  vec3 tex_dx = dFdx(vec3(v_UV, 0.0));
  vec3 tex_dy = dFdy(vec3(v_UV, 0.0));
  vec3 t = (tex_dy.t * pos_dx - tex_dx.t * pos_dy) / (tex_dx.s * tex_dy.t - tex_dy.s * tex_dx.t);
  t = normalize(t - ng * dot(ng, t));
  vec3 b = normalize(cross(ng, t));
  mat3 tbn = mat3(t, b, ng);
  vec3 n = texture2D(u_NormalSampler, v_UV).rgb;
  n = normalize(tbn * (2.0 * n - 1.0));
  vec3 v = normalize(u_Camera - v_Position);
  vec3 r = -normalize(reflect(v, n));
  float NoV = clamp(dot(n, v), zero, one);

  float roughness, metallic;
  vec3 baseColor;
  if (u_useTextures) { 
    roughness = clamp(texture2D(u_MetallicRoughnessSampler, v_UV).y, zero, one);
    metallic = clamp(texture2D(u_MetallicRoughnessSampler, v_UV).x, zero, one);
    baseColor = texture2D(u_BaseColorSampler, v_UV).rgb;
  }
  else {
    roughness = u_Roughness;
    metallic = u_Metallic;
    baseColor = u_BaseColor;
  }
  float mipCount = 9.0; // resolution of 512x512
  float lod = (roughness * mipCount);
  vec3 brdf = texture2D(u_brdfLUT, vec2(NoV, clamp(1.0 - roughness, zero, one))).rgb;
  vec3 diffuseLight = textureCube(u_DiffuseEnvSampler, n).rgb;
  vec3 specularLight = textureCubeLodEXT(u_SpecularEnvSampler, r, lod).rgb;

  vec3 f0 = vec3(0.04);
  vec3 diffuseColor = baseColor * (1.0 - metallic);
  vec3 specularColor = mix(f0, baseColor, metallic);

  vec3 color = (diffuseLight * diffuseColor) + (specularLight * (specularColor * brdf.x + brdf.y));
  
  if (u_hasAO && u_useTextures) {
    vec3 ao = texture2D(u_OcclusionSampler, v_UV).rgb;
    color *= ao;
  }

  if (u_isEmissive && u_useTextures) {
    vec3 emissive = texture2D(u_EmissiveSampler, v_UV).rgb;
    color += emissive;
  }
 
  gl_FragColor = vec4(color, 1.0);
}
