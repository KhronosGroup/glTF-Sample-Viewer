#include <animation.glsl>


uniform mat4 u_ViewProjectionMatrix;
uniform mat4 u_ModelMatrix;
uniform mat4 u_NormalMatrix;


in vec3 a_position;
out vec3 v_Position;

#ifdef HAS_NORMAL_VEC3
in vec3 a_normal;
#endif

#ifdef HAS_NORMAL_VEC3
#ifdef HAS_TANGENT_VEC4
in vec4 a_tangent;
out mat3 v_TBN;
#else
out vec3 v_Normal;
#endif
#endif

#ifdef HAS_TEXCOORD_0_VEC2
in vec2 a_texcoord_0;
#endif

#ifdef HAS_TEXCOORD_1_VEC2
in vec2 a_texcoord_1;
#endif

out vec2 v_texcoord_0;
out vec2 v_texcoord_1;

#ifdef HAS_COLOR_0_VEC3
in vec3 a_color_0;
out vec3 v_Color;
#endif

#ifdef HAS_COLOR_0_VEC4
in vec4 a_color_0;
out vec4 v_Color;
#endif


vec4 getPosition()
{
    vec4 pos = vec4(a_position, 1.0);

#ifdef USE_MORPHING
    pos += getTargetPosition(gl_VertexID);
#endif

#ifdef USE_SKINNING
    pos = getSkinningMatrix() * pos;
#endif

    return pos;
}


void main()
{
    gl_PointSize = 1.0f;
    vec4 pos = u_ModelMatrix * getPosition();
    v_Position = vec3(pos.xyz) / pos.w;

    gl_Position = u_ViewProjectionMatrix * pos;
}
