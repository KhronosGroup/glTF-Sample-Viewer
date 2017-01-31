precision mediump float;
uniform vec3 u_LightPosition;
uniform samplerCube u_DiffuseEnvSampler;
uniform samplerCube u_SpecularEnvSampler;
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
  vec4 baseColor = texture2D(u_BaseColorSampler, v_UV);

  // Normal Map
  vec3 n = normalize(v_Normal);
  vec3 t = normalize(v_Tangent);
  vec3 b = cross(n, t);
  mat3 tbn = mat3(t, b, n);
  n = texture2D(u_NormalSampler, v_UV).rgb;
  n = normalize(n * 2.0 - 1.0);
  n = normalize(tbn * n);

  vec3 l = normalize(u_LightPosition - v_Position);
  vec3 v = normalize(u_Camera - v_Position);
  vec3 h = normalize(l + v);
  float nDotV = max(0.0, dot(n,v));
  float nDotL = max(0.0, dot(n,l));
  float nDotH = max(0.0, dot(n,h));
  float vDotH = max(0.0, dot(v,h));

  // Fresnel Term: Schlick's Approximation
  float metallic = texture2D(u_MetallicSampler, v_UV).x;
  vec3 specularColor = (baseColor.rgb * metallic) + (vec3(0.04) * (1.0 - metallic));
  vec3 f = specularColor + ((1.0 - specularColor) * pow(1.0 - vDotH, 5.0));

  // Geometric Attenuation Term: Schlick-Beckmann
  float roughness = texture2D(u_RoughnessSampler, v_UV).x;
  float a = roughness * roughness; // UE4 definition
  float k = ((roughness + 1.0) * (roughness + 1.0)) / 8.0;
  float g1L = nDotL / ((nDotL * (1.0 - k)) + k);
  float g1V = nDotV / ((nDotV * (1.0 - k)) + k);
  float g = g1L * g1V;

  // Normal Distribution Function: GGX (Trowbridge-Reitz)
  float a2 = a * a;
  float nDotH2 = nDotH * nDotH;
  float denom = M_PI * (nDotH2 * (a2 - 1.0) + 1.0) * (nDotH2 * (a2 - 1.0) + 1.0);
  float d = a2 / denom;

  // Specular BRDF
  vec3 specBRDF = (d * f * g) / (4.0 * nDotL * nDotV);

  metallic = max(0.5, u_Metallic); // Hack to look good before environment maps
  vec3 diffuseColor = baseColor.rgb * (1.0 - metallic);
  vec4 diffuse = vec4(diffuseColor * nDotL, 1.0);
  vec4 specular = vec4(specularColor * specBRDF, 1.0);
  gl_FragColor = clamp(diffuse + specular, 0.0, 1.0);
}


