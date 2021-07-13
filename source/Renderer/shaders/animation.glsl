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

vec4 getTargetPosition(int vertexID)
{
    vec4 pos = vec4(0);
#ifdef HAS_MORPH_TARGET_POSITION
    int texSize = textureSize(u_MorphTargetsSampler, 0)[0];
    for(int i = 0; i < WEIGHT_COUNT; i++)
    {
        int offset = MORPH_TARGET_POSITION_OFFSET + i * NUM_VERTICIES + vertexID;
        ivec2 mophTargetCoordinate = ivec2(offset % texSize, offset / texSize);
        vec3 displacement = texelFetch(u_MorphTargetsSampler, mophTargetCoordinate, 0).xyz;
        pos.xyz += u_morphWeights[i] * displacement;
    }
#endif

    return pos;
}

vec3 getTargetNormal(int vertexID)
{
    vec3 normal = vec3(0);

#ifdef HAS_MORPH_TARGET_NORMAL
    int texSize = textureSize(u_MorphTargetsSampler, 0)[0];
    for(int i = 0; i < WEIGHT_COUNT; i++)
    {
        int offset = MORPH_TARGET_NORMAL_OFFSET + i * NUM_VERTICIES + vertexID;
        ivec2 mophTargetCoordinate = ivec2(offset % texSize, offset / texSize);
        vec3 displacement = texelFetch(u_MorphTargetsSampler, mophTargetCoordinate, 0).xyz;
        normal.xyz += u_morphWeights[i] * displacement;
    }
#endif

    return normal;
}


vec3 getTargetTangent(int VertexID)
{
    vec3 tangent = vec3(0);

#ifdef HAS_MORPH_TARGET_TANGENT
    int texSize = textureSize(u_MorphTargetsSampler, 0)[0];
    for(int i = 0; i < WEIGHT_COUNT; i++)
    {
        int offset = MORPH_TARGET_TANGENT_OFFSET + i * NUM_VERTICIES + vertexID;
        ivec2 mophTargetCoordinate = ivec2(offset % texSize, offset / texSize);
        vec3 displacement = texelFetch(u_MorphTargetsSampler, mophTargetCoordinate, 0).xyz;
        tangent.xyz += u_morphWeights[i] * displacement;
    }
#endif

    return tangent;
}

#endif // !USE_MORPHING
