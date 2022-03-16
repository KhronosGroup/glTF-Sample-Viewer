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
uniform sampler2D u_jointsSampler;
#endif

#ifdef USE_SKINNING

mat4 getMatrixFromTexture(sampler2D s, int index)
{
    mat4 result = mat4(1);
    int texSize = textureSize(s, 0)[0];
    int pixelIndex = index * 4;
    for (int i = 0; i < 4; ++i)
    {
        int x = (pixelIndex + i) % texSize;
        //Rounding mode of integers is undefined:
        //https://www.khronos.org/registry/OpenGL/specs/es/3.0/GLSL_ES_Specification_3.00.pdf (section 12.33)
        int y = (pixelIndex + i - x) / texSize; 
        result[i] = texelFetch(s, ivec2(x,y), 0);
    }
    return result;
}

mat4 getSkinningMatrix()
{
    mat4 skin = mat4(0);

#if defined(HAS_WEIGHTS_0_VEC4) && defined(HAS_JOINTS_0_VEC4)
    skin +=
        a_weights_0.x * getMatrixFromTexture(u_jointsSampler, int(a_joints_0.x) * 2) +
        a_weights_0.y * getMatrixFromTexture(u_jointsSampler, int(a_joints_0.y) * 2) +
        a_weights_0.z * getMatrixFromTexture(u_jointsSampler, int(a_joints_0.z) * 2) +
        a_weights_0.w * getMatrixFromTexture(u_jointsSampler, int(a_joints_0.w) * 2);
#endif

#if defined(HAS_WEIGHTS_1_VEC4) && defined(HAS_JOINTS_1_VEC4)
    skin +=
        a_weights_1.x * getMatrixFromTexture(u_jointsSampler, int(a_joints_1.x) * 2) +
        a_weights_1.y * getMatrixFromTexture(u_jointsSampler, int(a_joints_1.y) * 2) +
        a_weights_1.z * getMatrixFromTexture(u_jointsSampler, int(a_joints_1.z) * 2) +
        a_weights_1.w * getMatrixFromTexture(u_jointsSampler, int(a_joints_1.w) * 2);
#endif
    if (skin == mat4(0)) { 
        return mat4(1); 
    }
    return skin;
}


mat4 getSkinningNormalMatrix()
{
    mat4 skin = mat4(0);

#if defined(HAS_WEIGHTS_0_VEC4) && defined(HAS_JOINTS_0_VEC4)
    skin +=
        a_weights_0.x * getMatrixFromTexture(u_jointsSampler, int(a_joints_0.x) * 2 + 1) +
        a_weights_0.y * getMatrixFromTexture(u_jointsSampler, int(a_joints_0.y) * 2 + 1) +
        a_weights_0.z * getMatrixFromTexture(u_jointsSampler, int(a_joints_0.z) * 2 + 1) +
        a_weights_0.w * getMatrixFromTexture(u_jointsSampler, int(a_joints_0.w) * 2 + 1);
#endif

#if defined(HAS_WEIGHTS_1_VEC4) && defined(HAS_JOINTS_1_VEC4)
    skin +=
        a_weights_1.x * getMatrixFromTexture(u_jointsSampler, int(a_joints_1.x) * 2 + 1) +
        a_weights_1.y * getMatrixFromTexture(u_jointsSampler, int(a_joints_1.y) * 2 + 1) +
        a_weights_1.z * getMatrixFromTexture(u_jointsSampler, int(a_joints_1.z) * 2 + 1) +
        a_weights_1.w * getMatrixFromTexture(u_jointsSampler, int(a_joints_1.w) * 2 + 1);
#endif
    if (skin == mat4(0)) { 
        return mat4(1); 
    }
    return skin;
}

#endif // !USE_SKINNING


#ifdef USE_MORPHING

#ifdef HAS_MORPH_TARGETS
vec4 getDisplacement(int vertexID, int targetIndex, int texSize)
{
    int x = vertexID % texSize;
    //Rounding mode of integers is undefined:
    //https://www.khronos.org/registry/OpenGL/specs/es/3.0/GLSL_ES_Specification_3.00.pdf (section 12.33)
    int y = (vertexID - x) / texSize; 
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
