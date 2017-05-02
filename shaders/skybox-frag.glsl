precision highp float;

uniform samplerCube u_EnvSampler;
uniform vec3 u_Camera;
varying vec3 v_Position;

const float M_PI = 3.141592653589793;

void main(){
  // this doesn't really have to happen in the pixel shader
  vec3 v = normalize(u_Camera - v_Position);

  vec3 color = textureCube(u_EnvSampler, v).rgb;
 
  gl_FragColor = vec4(color, 1.0);
}
