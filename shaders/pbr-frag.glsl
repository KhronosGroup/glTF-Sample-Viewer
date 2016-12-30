precision mediump float;
uniform vec3 u_LightPosition;
uniform samplerCube u_EnvSampler;
uniform vec3 u_Camera;
uniform vec3 u_BaseColor;
uniform float u_Metallic;
uniform float u_Roughness;
varying vec4 v_Color;
varying vec3 v_Normal; 
varying vec3 v_Position;

const float M_PI = 3.141592653589793;

void main(){
  vec3 diffuseColor = u_BaseColor;
  vec3 specularColor = vec3(0.8, 0.8, 0.8);
  //vec3 ambientColor = vec3(0.1, 0.1, 0.1);
  vec3 n = normalize(v_Normal);
  vec3 l = normalize(u_LightPosition - v_Position);
  vec3 v = normalize(u_Camera - v_Position);
  vec3 h = normalize(l + v);
  float nDotV = max(0.0, dot(n,v));
  float nDotL = max(0.0, dot(n,l));
  float nDotH = max(0.0, dot(n,h));
  float vDotH = max(0.0, dot(v,h));

// Fresnel Term: Schlick's Approximation
  float r0 = u_Metallic;
  float f = r0 + ((1.0 - r0) * pow(1.0 - nDotV, 5.0));

// Geometric Attenuation Term: Schlick-Beckmann
  float roughness = u_Roughness;
  float a = roughness * roughness; // UE4 definition
  float k = ((roughness + 1.0) * (roughness + 1.0)) / 8.0;
  float g1L = nDotL / ((nDotL * (1.0 - k)) + k);
  float g1V = nDotV / ((nDotV * (1.0 - k)) + k);
  float g = g1L * g1V;

// Normal Distribution Function: GGX (Trowbridge-Reitz)
  float a2 = a * a;
  float nDotH2 = nDotH * nDotH;
  float denom = M_PI * (nDotH * nDotH * (a2 - 1.0) + 1.0) * (nDotH * nDotH * (a2 - 1.0) + 1.0);
  float d = a2 / denom;

// BRDF
  float brdf = (d * f * g) / (4.0 * nDotL * nDotV);

  vec3 diffuse = 0.8 * diffuseColor * nDotL;
  vec3 specular = specularColor * brdf;
  //vec3 camera = normalize(u_Camera);
  //vec3 camToPos = normalize(v_Position - camera);
  //vec3 reflected = normalize(reflect(camToPos, n));
  //vec3 testDir = vec3(1.0, 0.0, 0.0);
  //float weight = max(dot(testDir, normal), 0.0);
  //gl_FragColor = vec4(v_Color.xyz * weight, 1.0); 
  //gl_FragColor = textureCube(u_EnvSampler, reflected);
  gl_FragColor = vec4(diffuse + specular, v_Color.a);
}


