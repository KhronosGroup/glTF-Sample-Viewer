precision mediump float;

#extension GL_EXT_shader_texture_lod: enable

uniform vec3 u_LightPosition;
uniform samplerCube u_DiffuseEnvSampler;
uniform samplerCube u_SpecularEnvSampler;
uniform samplerCube u_EnvSampler;
uniform sampler2D u_brdfLUT;
uniform sampler2D u_BaseColorSampler;
uniform sampler2D u_MetallicSampler;
uniform sampler2D u_RoughnessSampler;
uniform sampler2D u_NormalSampler;
uniform vec3 u_Camera;
uniform vec3 u_BaseColor;
uniform float u_Metallic;
uniform float u_Roughness;
varying vec4 v_Color;
varying vec2 v_UV;
varying vec3 v_Tangent;
varying vec3 v_Normal; 
varying vec3 v_Position;

const float M_PI = 3.141592653589793;

void main(){
  // Normal Map
  vec3 n = normalize(v_Normal);
  vec3 t = normalize(v_Tangent);
  vec3 b = cross(n, t);
  mat3 tbn = mat3(t, b, n);
  n = texture2D(u_NormalSampler, v_UV).rgb;
  n = normalize(n * 2.0 - 1.0);
  n = normalize(tbn * n);
  vec3 v = normalize(u_Camera - v_Position);
  vec3 r = -normalize(reflect(v, n));
  float NoV = max(0.0, dot(n, v));

  float roughness = texture2D(u_RoughnessSampler, v_UV).x;
  float metallic = texture2D(u_MetallicSampler, v_UV).x;
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

  gl_FragColor = vec4(color, 1.0);
}


