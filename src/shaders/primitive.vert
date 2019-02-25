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

#ifdef HAS_JOINTS
varying vec4 a_Joints;
#endif

#ifdef HAS_WEIGHTS
varying vec4 a_Weights;
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

#if defined(USE_SKINNING) && defined(HAS_JOINTS) && defined(HAS_WEIGHTS)
mat4 GetSkinningMatrix()
{
    mat4 skin =
        a_Weights.x * u_jointMatrix[int(a_Joints.x)] +
        a_Weights.y * u_jointMatrix[int(a_Joints.y)] +
        a_Weights.z * u_jointMatrix[int(a_Joints.z)] +
        a_Weights.w * u_jointMatrix[int(a_Joints.w)];

    return skin;
}

mat4 GetSkinningNormalMatrix()
{
    mat4 skin =
        a_Weights.x * u_jointNormalMatrix[int(a_Joints.x)] +
        a_Weights.y * u_jointNormalMatrix[int(a_Joints.y)] +
        a_Weights.z * u_jointNormalMatrix[int(a_Joints.z)] +
        a_Weights.w * u_jointNormalMatrix[int(a_Joints.w)];

    return skin;
}
#endif

vec4 getPosition()
{
    vec4 pos = a_Position;

    // TODO: morph before skinning

#if defined(USE_SKINNING) && defined(HAS_JOINTS) && defined(HAS_WEIGHTS)
    pos = GetSkinningMatrix() * pos;
#endif

    return pos;
}

vec4 getNormal()
{
    vec4 normal = a_Normal;

#if defined(USE_SKINNING) && defined(HAS_JOINTS) && defined(HAS_WEIGHTS)
    normal = GetSkinningNormalMatrix() * normal;
#endif

    return normal;
}

vec4 getTangent()
{
    vec4 tangent = a_Tangent;

#if defined(USE_SKINNING) && defined(HAS_JOINTS) && defined(HAS_WEIGHTS)
    tangent = GetSkinningNormalMatrix() * tangent;
#endif

    return tangent;
}

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
