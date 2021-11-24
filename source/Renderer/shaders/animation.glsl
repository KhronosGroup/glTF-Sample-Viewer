#ifdef HAS_MORPH_TARGETS
uniform highp sampler2DArray u_MorphTargetsSampler;
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

#ifdef HAS_MORPH_TARGETS
vec4 getDisplacement(int vertexID, int targetIndex, int texSize)
{
    int y = int(floor(float(vertexID) / float(texSize)));
    int x = vertexID - y * texSize;
    return texelFetch(u_MorphTargetsSampler, ivec3(x, y, targetIndex), 0);
}
#endif


vec4 getTargetPosition(int vertexID)
{
    vec4 pos = vec4(0);
#ifdef HAS_MORPH_TARGET_POSITION
    int texSize = textureSize(u_MorphTargetsSampler, 0)[0];
    for(int i = 0; i < WEIGHT_COUNT; i++)
    {
        vec4 displacement = getDisplacement(vertexID, MORPH_TARGET_POSITION_OFFSET + i, texSize);
        pos += u_morphWeights[i] * displacement;
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
        vec3 displacement = getDisplacement(vertexID, MORPH_TARGET_NORMAL_OFFSET + i, texSize).xyz;
        normal += u_morphWeights[i] * displacement;
    }
#endif

    return normal;
}


vec3 getTargetTangent(int vertexID)
{
    vec3 tangent = vec3(0);

#ifdef HAS_MORPH_TARGET_TANGENT
    int texSize = textureSize(u_MorphTargetsSampler, 0)[0];
    for(int i = 0; i < WEIGHT_COUNT; i++)
    {
        vec3 displacement = getDisplacement(vertexID, MORPH_TARGET_TANGENT_OFFSET + i, texSize).xyz;
        tangent += u_morphWeights[i] * displacement;
    }
#endif

    return tangent;
}

vec2 getTargetTexCoord0(int vertexID)
{
    vec2 uv = vec2(0);

#ifdef HAS_MORPH_TARGET_TEXCOORD_0
    int texSize = textureSize(u_MorphTargetsSampler, 0)[0];
    for(int i = 0; i < WEIGHT_COUNT; i++)
    {
        vec2 displacement = getDisplacement(vertexID, MORPH_TARGET_TEXCOORD_0_OFFSET + i, texSize).xy;
        uv += u_morphWeights[i] * displacement;
    }
#endif

    return uv;
}

vec2 getTargetTexCoord1(int vertexID)
{
    vec2 uv = vec2(0);

#ifdef HAS_MORPH_TARGET_TEXCOORD_1
    int texSize = textureSize(u_MorphTargetsSampler, 0)[0];
    for(int i = 0; i < WEIGHT_COUNT; i++)
    {
        vec2 displacement = getDisplacement(vertexID, MORPH_TARGET_TEXCOORD_1_OFFSET + i, texSize).xy;
        uv += u_morphWeights[i] * displacement;
    }
#endif

    return uv;
}

vec4 getTargetColor0(int vertexID)
{
    vec4 color = vec4(0);

#ifdef HAS_MORPH_TARGET_COLOR_0
    int texSize = textureSize(u_MorphTargetsSampler, 0)[0];
    for(int i = 0; i < WEIGHT_COUNT; i++)
    {
        vec4 displacement = getDisplacement(vertexID, MORPH_TARGET_COLOR_0_OFFSET + i, texSize);
        color += u_morphWeights[i] * displacement;
    }
#endif

    return color;
}

#endif // !USE_MORPHING
