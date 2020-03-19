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

// Find the normal for this fragment, pulling either from a predefined normal map
// or from the interpolated mesh normal and tangent attributes.
vec3 getNormal(bool ignoreNormalMap)
{
    vec2 UV = getNormalUV();

    // Retrieve the tangent space matrix
#ifndef HAS_TANGENTS
    vec3 pos_dx = dFdx(v_Position);
    vec3 pos_dy = dFdy(v_Position);
    vec3 tex_dx = dFdx(vec3(UV, 0.0));
    vec3 tex_dy = dFdy(vec3(UV, 0.0));
    vec3 t = (tex_dy.t * pos_dx - tex_dx.t * pos_dy) / (tex_dx.s * tex_dy.t - tex_dy.s * tex_dx.t);

#ifdef HAS_NORMALS
    vec3 ng = normalize(v_Normal);
#else
    vec3 ng = cross(pos_dx, pos_dy);
#endif // !HAS_NORMALS

    t = normalize(t - ng * dot(ng, t));
    vec3 b = normalize(cross(ng, t));
    mat3 tbn = mat3(t, b, ng);
#else // HAS_TANGENTS
    mat3 tbn = v_TBN;
#endif // !HAS_TANGENTS

#ifdef HAS_NORMAL_MAP
    if(ignoreNormalMap == false){
        vec3 n = texture(u_NormalSampler, UV).rgb;
        return normalize(tbn * ((2.0 * n - 1.0) * vec3(u_NormalScale, u_NormalScale, 1.0)));
    }else{
        return normalize(tbn[2].xyz);
    }
#else
    // The tbn matrix is linearly interpolated, so we need to re-normalize
    return normalize(tbn[2].xyz);
#endif
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

/// Computes the intersection between a sphere of radius r and center c with a ray
/// from o with direction l. l should be normalized.
/// The result is undefined if the ray does not intersect the sphere.
vec2 sphereLineIntersection(vec3 o, vec3 l, vec3 c, float r)
{
    float LdotOC = dot(l, o - c);
    float OC = length(o - c);

    float D = LdotOC * LdotOC - (OC * OC -  r * r);
    float S = sqrt(D);

    return vec2(-LdotOC - S, -LdotOC + S);
}

// Refracts the light vector v on a surface with normal n.
vec3 refractionThin(vec3 v, vec3 n, float ior_1, float ior_2)
{
    vec3 p = normalize(refract(-v, n, ior_1 / ior_2)); // Refracted vector
    return p;
}

// Refracts the light vector v on a surface with normal n.
// Assumes that the incident point is tangent to a sphere beneat it with a given diameter.
// Models the exiting refraction that would be caused by this sphere.
vec3 refractionSolidSphere(vec3 v, vec3 n, float ior_1, float ior_2, vec3 n_geom, float diameter)
{
    float r = diameter / 2.0;
    vec3 p = normalize(refract(-v, n, ior_1 / ior_2)); // Refracted vector
    float lambda = sphereLineIntersection(vec3(0), p, -n_geom, r).g;
    vec3 P = lambda * p; // Exit point
    vec3 m = normalize(P + r * n_geom); // Sphere normal of the exit point
    vec3 q = -refract(-p, m, ior_2 / ior_1); // Exit vector
    return normalize(q);
}
