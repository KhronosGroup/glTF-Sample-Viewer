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
    mat3 TBNg; // Geometric orthonormal tangent space
    vec3 ng;   // Geometric normal
    vec3 tg;   // Geometric tangent
    vec3 bg;   // Geometric bitangent

    mat3 TBN;  // Pertubed orthonormal tangent space
    vec3 n;    // Pertubed normal
    vec3 t;    // Pertubed tangent
    vec3 b;    // Pertubed bitangent
};

// Get normal, tangent and bitangent vectors.
NormalInfo getNormalInfo(vec3 v)
{
    vec2 UV = getNormalUV();
    vec3 uv_dx = dFdx(vec3(UV, 0.0));
    vec3 uv_dy = dFdy(vec3(UV, 0.0));

    vec3 t_ = (uv_dy.t * dFdx(v_Position) - uv_dx.t * dFdy(v_Position)) / (uv_dx.s * uv_dy.t - uv_dy.s * uv_dx.t);

    vec3 n, t, b, ng, tg, bg;
    mat3 TBN, TBNg;

    // Compute geometrical TBN:

    #ifdef HAS_TANGENTS
        // Trivial TBN computation, present as vertex attribute.
        // Normalize eigenvectors as matrix is linearly interpolated.
        tg = normalize(v_TBN[0]);
        bg = normalize(v_TBN[1]);
        ng = normalize(v_TBN[2]);
        TBNg = mat3(tg, bg, ng);
    #else
        // Normals are either present as vertex attributes or approximated.
        #ifdef HAS_NORMALS
            ng = normalize(v_Normal);
        #else
            ng = normalize(cross(dFdx(v_Position), dFdy(v_Position)));
        #endif

        tg = normalize(t_ - ng * dot(ng, t_));
        bg = cross(ng, tg);
        TBNg = mat3(tg, bg, ng);
    #endif

    // For a back-facing surface, the tangential basis vectors are negated.
    if (dot(v, ng) < 0.0) {
        TBNg *= -1.0;
        tg *= -1.0;
        bg *= -1.0;
        ng *= -1.0;
    }

    // Compute pertubed normals:

    #ifdef HAS_NORMAL_MAP
        n = texture(u_NormalSampler, UV).rgb * 2.0 - vec3(1.0);
        n *= vec3(u_NormalScale, u_NormalScale, 1.0);
        n = normalize(TBNg * n);
        t = normalize(tg - n * dot(n, tg));
        b = cross(n, t);
        TBN = mat3(t, b, n);
    #else
        t = tg;
        b = bg;
        n = ng;
    #endif

    NormalInfo info;
    info.tg = tg;
    info.bg = bg;
    info.ng = ng;
    info.TBNg = TBNg;
    info.t = t;
    info.b = b;
    info.n = n;
    info.TBN = TBN;
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
