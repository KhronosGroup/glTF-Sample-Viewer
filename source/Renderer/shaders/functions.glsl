const float M_PI = 3.141592653589793;


in vec3 v_Position;


#ifdef HAS_NORMAL_VEC3
#ifdef HAS_TANGENT_VEC4
in mat3 v_TBN;
#else
in vec3 v_Normal;
#endif
#endif


#ifdef HAS_COLOR_0_VEC3
in vec3 v_Color;
#endif
#ifdef HAS_COLOR_0_VEC4
in vec4 v_Color;
#endif


vec4 getVertexColor()
{
   vec4 color = vec4(1.0);

#ifdef HAS_COLOR_0_VEC3
    color.rgb = v_Color.rgb;
#endif
#ifdef HAS_COLOR_0_VEC4
    color = v_Color;
#endif

   return color;
}


struct NormalInfo {
    vec3 ng;   // Geometric normal
    vec3 n;    // Pertubed normal
    vec3 t;    // Pertubed tangent
    vec3 b;    // Pertubed bitangent
};


float clampedDot(vec3 x, vec3 y)
{
    return clamp(dot(x, y), 0.0, 1.0);
}


float max3(vec3 v)
{
    return max(max(v.x, v.y), v.z);
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


float applyIorToRoughness(float roughness, float ior)
{
    // Scale roughness with IOR so that an IOR of 1.0 results in no microfacet refraction and
    // an IOR of 1.5 results in the default amount of microfacet refraction.
    return roughness * clamp(ior * 2.0 - 2.0, 0.0, 1.0);
}

void artisticIor(float reflectivity, float edgeColor, out float ior, out float extinction)
{
    // "Artist Friendly Metallic Fresnel", Ole Gulbrandsen, 2014
    // http://jcgt.org/published/0003/04/03/paper.pdf

    float r = clamp(reflectivity, 0.0, 0.99);
    float r_sqrt = sqrt(r);
    float n_min = (1.0 - r) / (1.0 + r);
    float n_max = (1.0 + r_sqrt) / (1.0 - r_sqrt);
    ior = mix(n_max, n_min, edgeColor);

    float np1 = ior + 1.0;
    float nm1 = ior - 1.0;
    float k2 = (np1*np1 * r - nm1*nm1) / (1.0 - r);
    k2 = max(k2, 0.0);
    extinction = sqrt(k2);
}

void artisticIor(vec3 reflectivity, vec3 edgeColor, out vec3 ior, out vec3 extinction)
{
    artisticIor(reflectivity.x, edgeColor.x, ior.x, extinction.x);
    artisticIor(reflectivity.y, edgeColor.y, ior.y, extinction.y);
    artisticIor(reflectivity.z, edgeColor.z, ior.z, extinction.z);
}
