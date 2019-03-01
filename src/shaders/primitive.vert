attribute vec4 a_Position;
varying vec3 v_Position;

#ifdef HAS_NORMALS
attribute vec4 a_Normal;
#endif

#ifdef HAS_TANGENTS
attribute vec4 a_Tangent;
#endif

#ifdef HAS_NORMALS
#ifdef HAS_TANGENTS
varying mat3 v_TBN;
#else
varying vec3 v_Normal;
#endif
#endif

#ifdef HAS_JOINT_SET1
attribute vec4 a_Joint1;
#endif

#ifdef HAS_JOINT_SET2
attribute vec4 a_Joint2;
#endif

#ifdef HAS_WEIGHT_SET1
attribute vec4 a_Weight1;
#endif

#ifdef HAS_WEIGHT_SET2
attribute vec4 a_Weight2;
#endif

#ifdef HAS_UV_SET1
attribute vec2 a_UV1;
#endif

#ifdef HAS_UV_SET2
attribute vec2 a_UV2;
#endif

varying vec2 v_UVCoord1;
varying vec2 v_UVCoord2;

#ifdef HAS_VERTEX_COLOR_VEC3
attribute vec3 a_Color;
varying vec3 v_Color;
#endif

#ifdef HAS_VERTEX_COLOR_VEC4
attribute vec4 a_Color;
varying vec4 v_Color;
#endif

uniform mat4 u_ViewProjectionMatrix;
uniform mat4 u_ModelMatrix;
uniform mat4 u_NormalMatrix;

#ifdef USE_SKINNING
uniform mat4 u_jointMatrix[JOINT_COUNT];
uniform mat4 u_jointNormalMatrix[JOINT_COUNT];
#endif

#ifdef USE_SKINNING
mat4 getSkinningMatrix()
{
    mat4 skin = mat4(0);

    #if defined(HAS_WEIGHT_SET1) && defined(HAS_JOINT_SET1)
    skin +=
        a_Weight1.x * u_jointMatrix[int(a_Joint1.x)] +
        a_Weight1.y * u_jointMatrix[int(a_Joint1.y)] +
        a_Weight1.z * u_jointMatrix[int(a_Joint1.z)] +
        a_Weight1.w * u_jointMatrix[int(a_Joint1.w)];
    #endif

    #if defined(HAS_WEIGHT_SET2) && defined(HAS_JOINT_SET2)
    skin +=
        a_Weight2.x * u_jointMatrix[int(a_Joint2.x)] +
        a_Weight2.y * u_jointMatrix[int(a_Joint2.y)] +
        a_Weight2.z * u_jointMatrix[int(a_Joint2.z)] +
        a_Weight2.w * u_jointMatrix[int(a_Joint2.w)];
    #endif

    return skin;
}

mat4 getSkinningNormalMatrix()
{
    mat4 skin = mat4(0);

    #if defined(HAS_WEIGHT_SET1) && defined(HAS_JOINT_SET1)
    skin +=
        a_Weight1.x * u_jointNormalMatrix[int(a_Joint1.x)] +
        a_Weight1.y * u_jointNormalMatrix[int(a_Joint1.y)] +
        a_Weight1.z * u_jointNormalMatrix[int(a_Joint1.z)] +
        a_Weight1.w * u_jointNormalMatrix[int(a_Joint1.w)];
    #endif

    #if defined(HAS_WEIGHT_SET2) && defined(HAS_JOINT_SET2)
    skin +=
        a_Weight2.x * u_jointNormalMatrix[int(a_Joint2.x)] +
        a_Weight2.y * u_jointNormalMatrix[int(a_Joint2.y)] +
        a_Weight2.z * u_jointNormalMatrix[int(a_Joint2.z)] +
        a_Weight2.w * u_jointNormalMatrix[int(a_Joint2.w)];
    #endif

    return skin;
}
#endif // !USE_SKINNING

vec4 getPosition()
{
    vec4 pos = a_Position;

    // TODO: morph before skinning

#ifdef USE_SKINNING
    pos = getSkinningMatrix() * pos;
#endif

    return pos;
}

#ifdef HAS_NORMALS
vec4 getNormal()
{
    vec4 normal = a_Normal;

#ifdef USE_SKINNING
    normal = getSkinningNormalMatrix() * normal;
#endif

    return normal;
}
#endif

#ifdef HAS_TANGENTS
vec4 getTangent()
{
    vec4 tangent = a_Tangent;

#ifdef USE_SKINNING
    tangent = getSkinningMatrix() * tangent;
#endif

    return tangent;
}
#endif

void main()
{
    vec4 pos = u_ModelMatrix * getPosition();
    v_Position = vec3(pos.xyz) / pos.w;

    #ifdef HAS_NORMALS
    #ifdef HAS_TANGENTS
    vec4 tangent = getTangent();
    vec3 normalW = normalize(vec3(u_NormalMatrix * vec4(getNormal().xyz, 0.0)));
    vec3 tangentW = normalize(vec3(u_ModelMatrix * vec4(tangent.xyz, 0.0)));
    vec3 bitangentW = cross(normalW, tangentW) * tangent.w;
    v_TBN = mat3(tangentW, bitangentW, normalW);
    #else // !HAS_TANGENTS
    v_Normal = normalize(vec3(u_NormalMatrix * vec4(getNormal().xyz, 0.0)));
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
