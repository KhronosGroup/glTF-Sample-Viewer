attribute vec4 a_Position;
attribute vec4 a_Normal;
attribute vec4 a_Tangent;
attribute vec2 a_UV;
attribute vec4 a_Color;
uniform mat4 u_mvpMatrix;
uniform mat4 u_NormalMatrix;
varying vec4 v_Color;
varying vec2 v_UV;
varying vec3 v_Tangent;
varying vec3 v_Normal;
varying vec3 v_Position;
void main(){
  vec4 pos = u_mvpMatrix * a_Position;
  v_Position = vec3(pos.xyz) / pos.w;
  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));
  v_Tangent = normalize(vec3(u_NormalMatrix * a_Tangent));
  v_UV = a_UV;
  v_Color = a_Color;
  gl_Position = vec4(v_Position, 1.0);
}


