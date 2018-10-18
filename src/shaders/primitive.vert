attribute vec4 a_Position;

#ifdef HAS_NORMALS
attribute vec4 a_Normal;
#endif

#ifdef HAS_TANGENTS
attribute vec4 a_Tangent;
#endif

#ifdef HAS_UV_SET1
attribute vec2 a_UV1;
#endif

#ifdef HAS_UV_SET2
attribute vec2 a_UV2;
#endif

// inputs
uniform mat4 u_MVPMatrix;
uniform mat4 u_ModelMatrix;
uniform mat4 u_NormalMatrix;

// outputs
varying vec3 v_Position;
varying vec2 v_ColorUV; // vertex color UVs
varying vec2 v_JointWeightUV;

#ifdef HAS_NORMALS
#ifdef HAS_TANGENTS
varying mat3 v_TBN;
#else
varying vec3 v_Normal;
#endif
#endif

void main()
{
    vec4 pos = u_ModelMatrix * a_Position;
    v_Position = vec3(pos.xyz) / pos.w;

    #ifdef HAS_NORMALS
    #ifdef HAS_TANGENTS
    vec3 normalW = normalize(vec3(u_NormalMatrix * vec4(a_Normal.xyz, 0.0)));
    vec3 tangentW = normalize(vec3(u_ModelMatrix * vec4(a_Tangent.xyz, 0.0)));
    vec3 bitangentW = cross(normalW, tangentW) * a_Tangent.w;
    v_TBN = mat3(tangentW, bitangentW, normalW);
    #else // !HAS_TANGENTS
    v_Normal = normalize(vec3(u_ModelMatrix * vec4(a_Normal.xyz, 0.0)));
    #endif
    #endif // !HAS_NORMALS

    v_ColorUV = vec2(0.,0.);
    v_JointWeightUV = vec2(0.,0.);

    #ifdef HAS_UV_SET1
    v_ColorUV = a_UV1;
    #endif

    #ifdef HAS_UV_SET2
    v_JointWeightUV = a_UV1;
    #endif

    // TODO: skinning & morphing

    gl_Position = u_MVPMatrix * a_Position; // needs w for proper perspective correction
}

