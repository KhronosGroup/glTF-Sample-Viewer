attribute vec4 a_Position;
attribute vec4 a_Normal;
attribute vec4 a_Tangent;
attribute vec2 a_UV;
attribute vec4 a_Color;
uniform mat4 u_mvpMatrix;
uniform mat4 u_NormalMatrix;
varying vec4 v_Color;
varying vec2 v_UV;
#ifdef GENERATE_DERIVATIVE_TANGENTS
varying vec3 v_Normal;
#endif
#ifdef USE_SAVED_TANGENTS
varying mat3 v_TBN;
#endif
varying vec3 v_Position;
void main(){
  vec4 pos = u_mvpMatrix * a_Position;
  v_Position = vec3(pos.xyz) / pos.w;

  //v_UV = a_UV;
  gl_Position = pos;
}


