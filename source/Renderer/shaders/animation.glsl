#ifdef HAS_MORPH_TARGETS
uniform sampler2D u_MorphTargetsSampler;
#endif

#ifdef USE_MORPHING
uniform float u_morphWeights[WEIGHT_COUNT];
#endif

#ifdef HAS_JOINTS_0_VEC4
in vec4 a_joints_0;
#endif

#ifdef HAS_JOINTS_1_VEC4
in vec4 a_joints_1;
#endif

#ifdef HAS_WEIGHTS_0_VEC4
in vec4 a_weights_0;
#endif

#ifdef HAS_WEIGHTS_1_VEC4
in vec4 a_weights_1;
#endif

#ifdef USE_SKINNING
uniform mat4 u_jointMatrix[JOINT_COUNT];
uniform mat4 u_jointNormalMatrix[JOINT_COUNT];
#endif

#ifdef USE_SKINNING

mat4 getSkinningMatrix()
{
    mat4 skin = mat4(0);

#if defined(HAS_WEIGHTS_0_VEC4) && defined(HAS_JOINTS_0_VEC4)
    skin +=
        a_weights_0.x * u_jointMatrix[int(a_joints_0.x)] +
        a_weights_0.y * u_jointMatrix[int(a_joints_0.y)] +
        a_weights_0.z * u_jointMatrix[int(a_joints_0.z)] +
        a_weights_0.w * u_jointMatrix[int(a_joints_0.w)];
#endif

#if defined(HAS_WEIGHTS_1_VEC4) && defined(HAS_JOINTS_1_VEC4)
    skin +=
        a_weights_1.x * u_jointMatrix[int(a_joints_1.x)] +
        a_weights_1.y * u_jointMatrix[int(a_joints_1.y)] +
        a_weights_1.z * u_jointMatrix[int(a_joints_1.z)] +
        a_weights_1.w * u_jointMatrix[int(a_joints_1.w)];
#endif

    return skin;
}


mat4 getSkinningNormalMatrix()
{
    mat4 skin = mat4(0);

#if defined(HAS_WEIGHTS_0_VEC4) && defined(HAS_JOINTS_0_VEC4)
    skin +=
        a_weights_0.x * u_jointNormalMatrix[int(a_joints_0.x)] +
        a_weights_0.y * u_jointNormalMatrix[int(a_joints_0.y)] +
        a_weights_0.z * u_jointNormalMatrix[int(a_joints_0.z)] +
        a_weights_0.w * u_jointNormalMatrix[int(a_joints_0.w)];
#endif

#if defined(HAS_WEIGHTS_1_VEC4) && defined(HAS_JOINTS_1_VEC4)
    skin +=
        a_weights_1.x * u_jointNormalMatrix[int(a_joints_1.x)] +
        a_weights_1.y * u_jointNormalMatrix[int(a_joints_1.y)] +
        a_weights_1.z * u_jointNormalMatrix[int(a_joints_1.z)] +
        a_weights_1.w * u_jointNormalMatrix[int(a_joints_1.w)];
#endif

    return skin;
}

#endif // !USE_SKINNING


#ifdef USE_MORPHING

vec4 getTargetPosition()
{
    vec4 pos = vec4(0);

    #ifdef HAS_MORPH_TARGETS
    for(int i = 0; i < NUM_MORPH_TARGETS; i++)
    {
        ivec2 mophTargetCoordinate = ivec2(i, 0);
        vec3 displacement = texelFetch(u_MorphTargetsSampler, mophTargetCoordinate, 0).xyz;
        pos.xyz += u_morphWeights[i] * displacement;
    }

    #endif

    return pos;
}

vec3 getTargetNormal()
{
    vec3 normal = vec3(0);

#ifdef HAS_TARGET_NORMAL0_VEC3
    normal += u_morphWeights[0] * a_target_normal0;
#endif

#ifdef HAS_TARGET_NORMAL1_VEC3
    normal += u_morphWeights[1] * a_target_normal1;
#endif

#ifdef HAS_TARGET_NORMAL2_VEC3
    normal += u_morphWeights[2] * a_target_normal2;
#endif

#ifdef HAS_TARGET_NORMAL3_VEC3
    normal += u_morphWeights[3] * a_target_normal3;
#endif

#ifdef HAS_TARGET_NORMAL4_VEC3
    normal += u_morphWeights[4] * a_target_normal4;
#endif

#ifdef HAS_TARGET_NORMAL5_VEC3
    normal += u_morphWeights[5] * a_target_normal5;
#endif

#ifdef HAS_TARGET_NORMAL6_VEC3
    normal += u_morphWeights[6] * a_target_normal6;
#endif

#ifdef HAS_TARGET_NORMAL7_VEC3
    normal += u_morphWeights[7] * a_target_normal7;
#endif

    return normal;
}


vec3 getTargetTangent()
{
    vec3 tangent = vec3(0);

#ifdef HAS_TARGET_TANGENT0_VEC3
    tangent += u_morphWeights[0] * a_target_tangent0;
#endif

#ifdef HAS_TARGET_TANGENT1_VEC3
    tangent += u_morphWeights[1] * a_target_tangent1;
#endif

#ifdef HAS_TARGET_TANGENT2_VEC3
    tangent += u_morphWeights[2] * a_target_tangent2;
#endif

#ifdef HAS_TARGET_TANGENT3_VEC3
    tangent += u_morphWeights[3] * a_target_tangent3;
#endif

#ifdef HAS_TARGET_TANGENT4_VEC3
    tangent += u_morphWeights[4] * a_target_tangent4;
#endif

#ifdef HAS_TARGET_TANGENT5_VEC3
    tangent += u_morphWeights[5] * a_target_tangent5;
#endif

#ifdef HAS_TARGET_TANGENT6_VEC3
    tangent += u_morphWeights[6] * a_target_tangent6;
#endif

#ifdef HAS_TARGET_TANGENT7_VEC3
    tangent += u_morphWeights[7] * a_target_tangent7;
#endif

    return tangent;
}

#endif // !USE_MORPHING
