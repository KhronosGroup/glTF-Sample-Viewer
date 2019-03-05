#ifdef HAS_TARGET_POSITION0
attribute vec3 a_Target_Position0;
#endif

#ifdef HAS_TARGET_POSITION1
attribute vec3 a_Target_Position1;
#endif

#ifdef HAS_TARGET_POSITION2
attribute vec3 a_Target_Position2;
#endif

#ifdef HAS_TARGET_POSITION3
attribute vec3 a_Target_Position3;
#endif

#ifdef HAS_TARGET_POSITION4
attribute vec3 a_Target_Position4;
#endif

#ifdef HAS_TARGET_POSITION5
attribute vec3 a_Target_Position5;
#endif

#ifdef HAS_TARGET_POSITION6
attribute vec3 a_Target_Position6;
#endif

#ifdef HAS_TARGET_POSITION7
attribute vec3 a_Target_Position7;
#endif

#ifdef HAS_TARGET_NORMAL0
attribute vec3 a_Target_Normal0;
#endif

#ifdef HAS_TARGET_NORMAL1
attribute vec3 a_Target_Normal1;
#endif

#ifdef HAS_TARGET_NORMAL2
attribute vec3 a_Target_Normal2;
#endif

#ifdef HAS_TARGET_NORMAL3
attribute vec3 a_Target_Normal3;
#endif

#ifdef HAS_TARGET_TANGENT0
attribute vec3 a_Target_Tangent0;
#endif

#ifdef HAS_TARGET_TANGENT1
attribute vec3 a_Target_Tangent1;
#endif

#ifdef HAS_TARGET_TANGENT2
attribute vec3 a_Target_Tangent2;
#endif

#ifdef HAS_TARGET_TANGENT3
attribute vec3 a_Target_Tangent3;
#endif

#ifdef USE_MORPHING
uniform float u_morphWeights[WEIGHT_COUNT];
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

#ifdef USE_MORPHING
vec4 getTargetPosition()
{
    vec4 pos = vec4(0);

#ifdef HAS_TARGET_POSITION0
    pos.xyz += u_morphWeights[0] * a_Target_Position0;
#endif

#ifdef HAS_TARGET_POSITION1
    pos.xyz += u_morphWeights[1] * a_Target_Position1;
#endif

#ifdef HAS_TARGET_POSITION2
    pos.xyz += u_morphWeights[2] * a_Target_Position2;
#endif

#ifdef HAS_TARGET_POSITION3
    pos.xyz += u_morphWeights[3] * a_Target_Position3;
#endif

#ifdef HAS_TARGET_POSITION4
    pos.xyz += u_morphWeights[4] * a_Target_Position4;
#endif

    return pos;
}

vec4 getTargetNormal()
{
    vec4 normal = vec4(0);

#ifdef HAS_TARGET_NORMAL0
    normal.xyz += u_morphWeights[0] * a_Target_Normal0;
#endif

#ifdef HAS_TARGET_NORMAL1
    normal.xyz += u_morphWeights[1] * a_Target_Normal1;
#endif

#ifdef HAS_TARGET_NORMAL2
    normal.xyz += u_morphWeights[2] * a_Target_Normal2;
#endif

#ifdef HAS_TARGET_NORMAL3
    normal.xyz += u_morphWeights[3] * a_Target_Normal3;
#endif

#ifdef HAS_TARGET_NORMAL4
    normal.xyz += u_morphWeights[4] * a_Target_Normal4;
#endif

    return normal;
}

vec4 getTargetTangent()
{
    vec4 tangent = vec4(0);

#ifdef HAS_TARGET_TANGENT0
    tangent.xyz += u_morphWeights[0] * a_Target_Tangent0;
#endif

#ifdef HAS_TARGET_TANGENT1
    tangent.xyz += u_morphWeights[1] * a_Target_Tangent1;
#endif

#ifdef HAS_TARGET_TANGENT2
    tangent.xyz += u_morphWeights[2] * a_Target_Tangent2;
#endif

#ifdef HAS_TARGET_TANGENT3
    tangent.xyz += u_morphWeights[3] * a_Target_Tangent3;
#endif

#ifdef HAS_TARGET_TANGENT4
    tangent.xyz += u_morphWeights[4] * a_Target_Tangent4;
#endif

    return tangent;
}

#endif // !USE_MORPHING
