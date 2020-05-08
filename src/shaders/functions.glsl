// textures.glsl needs to be included

const float M_PI = 3.141592653589793;

in vec3 v_Position;

#ifdef HAS_NORMALS
#ifdef HAS_TANGENTS
in mat3 v_TBN;
#else
in vec3 v_Normal;
#endif
#endif

#ifdef HAS_VERTEX_COLOR_VEC3
in vec3 v_Color;
#endif
#ifdef HAS_VERTEX_COLOR_VEC4
in vec4 v_Color;
#endif

struct AngularInfo
{
    float NdotL;                  // cos angle between normal and light direction
    float NdotV;                  // cos angle between normal and view direction
    float NdotH;                  // cos angle between normal and half vector
    float LdotH;                  // cos angle between light direction and half vector

    float VdotH;                  // cos angle between view direction and half vector

    vec3 padding;
};

vec4 getVertexColor()
{
   vec4 color = vec4(1.0, 1.0, 1.0, 1.0);

#ifdef HAS_VERTEX_COLOR_VEC3
    color.rgb = v_Color;
#endif
#ifdef HAS_VERTEX_COLOR_VEC4
    color = v_Color;
#endif

   return color;
}

struct NormalInfo {
    vec3 n;  // Normal
    vec3 t;  // Tangent
    vec3 b;  // Bitangent
    vec3 ng; // Geometric normal
    vec3 tg; // Geometric tangent
    vec3 bg; // Geometric bitangent
};

// Get normal, tangent and bitangent vectors.
NormalInfo getNormalInfo(vec3 v)
{
    vec2 UV = getNormalUV();

    // Retrieve the tangent space matrix
#ifdef HAS_TANGENTS
    mat3 tbn = v_TBN;
#else
    vec3 pos_dx = dFdx(v_Position);
    vec3 pos_dy = dFdy(v_Position);

#ifdef HAS_NORMALS
    vec3 ng = normalize(v_Normal);
#else
    vec3 ng = cross(pos_dx, pos_dy);
#endif // !HAS_NORMALS

    vec3 tex_dx = dFdx(vec3(UV, 0.0));
    vec3 tex_dy = dFdy(vec3(UV, 0.0));
    vec3 t = (tex_dy.t * pos_dx - tex_dx.t * pos_dy) / (tex_dx.s * tex_dy.t - tex_dy.s * tex_dx.t);
    t = normalize(t - ng * dot(ng, t));
    vec3 b = normalize(cross(ng, t));
    mat3 tbn = mat3(t, b, ng);
#endif // !HAS_TANGENTS

    // For a back-facing surface, the tangential basis is inverted.
    if (dot(v, tbn[2]) < 0.0) {
        tbn *= -1.0;
    }

    NormalInfo info;
    info.tg = normalize(tbn[0].xyz);
    info.bg = normalize(tbn[1].xyz);
    info.ng = normalize(tbn[2].xyz);

#ifdef HAS_NORMAL_MAP
    vec3 n = texture(u_NormalSampler, UV).rgb;
    n = 2.0 * n - 1.0; // Map normal range from [0.0, 1.0] to [-1.0, 1.0].
    n *= vec3(u_NormalScale, u_NormalScale, 1.0); // Scale normal according to normal texture info.
    info.n = normalize(tbn * n); // Re-normalized because the tbn matrix is linearly interpolated.
    info.t = info.tg;
    info.b = info.bg;
#else
    info.t = info.tg;
    info.b = info.bg;
    info.n = info.ng;
#endif

    return info;
}

AngularInfo getAngularInfo(vec3 pointToLight, vec3 normal, vec3 view)
{
    // Standard one-letter names
    vec3 n = normalize(normal);           // Outward direction of surface point
    vec3 v = normalize(view);             // Direction from surface point to view
    vec3 l = normalize(pointToLight);     // Direction from surface point to light
    vec3 h = normalize(l + v);            // Direction of the vector between l and v

    float NdotL = clamp(dot(n, l), 0.0, 1.0);
    float NdotV = clamp(dot(n, v), 0.0, 1.0);
    float NdotH = clamp(dot(n, h), 0.0, 1.0);
    float LdotH = clamp(dot(l, h), 0.0, 1.0);
    float VdotH = clamp(dot(v, h), 0.0, 1.0);

    return AngularInfo(
        NdotL,
        NdotV,
        NdotH,
        LdotH,
        VdotH,
        vec3(0, 0, 0)
    );
}

float clampedDot(vec3 x, vec3 y)
{
    return clamp(dot(x, y), 0.0, 1.0);
}

float sq(float t)
{
    return t * t;
}

vec2 sq(vec2 t)
{
    return t * t;
}

vec3 sq(vec3 t)
{
    return t * t;
}

vec4 sq(vec4 t)
{
    return t * t;
}

vec3 transmissionAbsorption(vec3 v, vec3 n, float ior, float thickness, vec3 absorptionColor)
{
    vec3 r = refract(-v, n, 1.0 / ior);
    return exp(-absorptionColor * thickness * dot(-n, r));
}
