precision mediump float;

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
uniform bool u_isEmissive;
uniform bool u_hasAO;
varying vec4 v_Color;
varying vec2 v_UV;
varying vec3 v_Tangent;
varying vec3 v_Normal; 
varying vec3 v_Position;

const float M_PI = 3.141592653589793;

void main(){
  // Normal Map
  vec3 pos_dx = dFdx(v_Position);
  vec3 pos_dy = dFdy(v_Position);
  vec3 tex_dx = dFdx(vec3(v_UV, 0.0));
  vec3 tex_dy = dFdx(vec3(v_UV, 0.0));
  vec3 t = normalize(tex_dy.y * pos_dx - tex_dx.y * pos_dy);
  vec3 b = normalize(tex_dy.x * pos_dy - tex_dy.x * pos_dx);
  vec3 n = normalize(v_Normal);
  //vec3 x = cross(n, t);
  mat3 tbn = mat3(t, b, n);
  //vec3 t = normalize(v_Tangent);
  //vec3 b = cross(n, t);
  //mat3 tbn = mat3(t, b, n);
  n = texture2D(u_NormalSampler, v_UV).rgb;
  n = normalize(n * 2.0 - 1.0);
  n = normalize(tbn * n);
  vec3 v = normalize(u_Camera - v_Position);
  vec3 r = -normalize(reflect(v, n));
  float NoV = max(0.0, dot(n, v));

  float roughness = clamp(texture2D(u_MetallicRoughnessSampler, v_UV).y, 0.0, 1.0);
  float metallic = clamp(texture2D(u_MetallicRoughnessSampler, v_UV).x, 0.0, 1.0);
  vec3 baseColor = texture2D(u_BaseColorSampler, v_UV).rgb;
  float mipCount = 9.0; // resolution of 512x512
  float lod = (roughness * mipCount);
  vec3 brdf = texture2D(u_brdfLUT, vec2(NoV, 1.0 - roughness)).rgb;
  vec3 diffuseLight = textureCube(u_DiffuseEnvSampler, n).rgb;
  vec3 specularLight = textureCubeLodEXT(u_SpecularEnvSampler, r, lod).rgb;

  vec3 f0 = vec3(0.04);
  vec3 diffuseColor = baseColor * (1.0 - metallic);
  vec3 specularColor = mix(f0, baseColor, metallic);

  vec3 color = (diffuseLight * diffuseColor) + (specularLight * (specularColor * brdf.x + brdf.y));
  
  if (u_hasAO) {
    vec3 ao = texture2D(u_OcclusionSampler, v_UV).rgb;
    color *= ao;
  }

  if (u_isEmissive) {
    vec3 emissive = texture2D(u_EmissiveSampler, v_UV).rgb;
    color += emissive;
  }
 
  gl_FragColor = vec4(color, 1.0);
}


