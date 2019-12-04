#include <animation.glsl>

in vec3 a_Position;
out vec3 v_Position;

#ifdef HAS_NORMALS
in vec3 a_Normal;
#endif

#ifdef HAS_TANGENTS
in vec4 a_Tangent;
#endif

#ifdef HAS_NORMALS
#ifdef HAS_TANGENTS
out mat3 v_TBN;
#else
out vec3 v_Normal;
#endif
#endif

#ifdef HAS_UV_SET1
in vec2 a_UV1;
#endif

#ifdef HAS_UV_SET2
in vec2 a_UV2;
#endif

out vec2 v_UVCoord1;
out vec2 v_UVCoord2;

#ifdef HAS_VERTEX_COLOR_VEC3
in vec3 a_Color;
out vec3 v_Color;
#endif

#ifdef HAS_VERTEX_COLOR_VEC4
in vec4 a_Color;
out vec4 v_Color;
#endif

uniform mat4 u_ViewProjectionMatrix;
uniform mat4 u_ModelMatrix;
uniform mat4 u_NormalMatrix;

vec4 getPosition()
{
    vec4 pos = vec4(a_Position, 1.0);

#ifdef USE_MORPHING
    pos += getTargetPosition();
#endif

#ifdef USE_SKINNING
    pos = getSkinningMatrix() * pos;
#endif

    return pos;
}

#ifdef HAS_NORMALS
vec3 getNormal()
{
    vec3 normal = a_Normal;

#ifdef USE_MORPHING
    normal += getTargetNormal();
#endif

#ifdef USE_SKINNING
    normal = mat3(getSkinningNormalMatrix()) * normal;
#endif

    return normalize(normal);
}
#endif

#ifdef HAS_TANGENTS
vec3 getTangent()
{
    vec3 tangent = a_Tangent.xyz;

#ifdef USE_MORPHING
    tangent += getTargetTangent();
#endif

#ifdef USE_SKINNING
    tangent = mat3(getSkinningMatrix()) * tangent;
#endif

    return normalize(tangent);
}
#endif

void main()
{
    vec4 pos = u_ModelMatrix * getPosition();
    v_Position = vec3(pos.xyz) / pos.w;

    #ifdef HAS_NORMALS
    #ifdef HAS_TANGENTS
        vec3 tangent = getTangent();
        vec3 normalW = normalize(vec3(u_NormalMatrix * vec4(getNormal(), 0.0)));
        vec3 tangentW = normalize(vec3(u_ModelMatrix * vec4(tangent, 0.0)));
        vec3 bitangentW = cross(normalW, tangentW) * a_Tangent.w;
        v_TBN = mat3(tangentW, bitangentW, normalW);
    #else // !HAS_TANGENTS
        v_Normal = normalize(vec3(u_NormalMatrix * vec4(getNormal(), 0.0)));
    #endif
    #endif // !HAS_NORMALS

    v_UVCoord1 = vec2(0.0, 0.0);
    v_UVCoord2 = vec2(0.0, 0.0);

    #ifdef HAS_UV_SET1
        v_UVCoord1 = a_UV1;
    #endif

    #ifdef HAS_UV_SET2
        v_UVCoord2 = a_UV2;
    #endif

    #if defined(HAS_VERTEX_COLOR_VEC3) || defined(HAS_VERTEX_COLOR_VEC4)
        v_Color = a_Color;
    #endif

    gl_Position = u_ViewProjectionMatrix * pos;
}
