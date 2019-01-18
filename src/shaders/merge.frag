precision highp float;

in vec2 v_UV;
out vec4 g_finalColor;

#ifndef NUM_VIEWS
#define NUM_VIEWS 1
#endif

struct CamInfo
{
    mat4 invViewProj;
    vec3 pos;
    float near;
    float far;
};

uniform sampler2D u_colorViews[NUM_VIEWS];
uniform sampler2D u_depthViews[NUM_VIEWS];
uniform CamInfo u_CamInfo[NUM_VIEWS+1]; // first index contains original view

// https://stackoverflow.com/questions/19592850/how-to-bind-an-array-of-textures-to-a-webgl-shader-uniform
// samplers have to be indexed with a constant value
// vec4 sampleColor(int Index, vec2 uv)
// {
//     for(int i = 0; i < NUM_VIEWS; ++i)
//     {
//         if(i == Index)
//         {
//             return texture(u_colorViews[i], uv);
//         }
//     }

//     return vec4(0);
// }

float sampleDepth(int Index, vec2 uv)
{
    for(int i = 0; i < NUM_VIEWS; ++i)
    {
        if(i == Index)
        {
            return texture(u_depthViews[i], uv).x;
        }
    }

    return 0.f;
}

float ray_intersect(vec2 dp, vec2 ds)
{
    const int linear_search_steps = 10;
    const int binary_search_steps = 5;

    float depth_step = 1.f / float(linear_search_steps);
    float size = depth_step;
    float depth = 0.f;

    float best_depth = 1.0;
    for(int i = 0; i < linear_search_steps; ++i)
    {
        depth += size;
        float z = texture(u_depthViews[0], dp + ds*depth).x;
        if(best_depth > 0.996 && depth >= z)
        {
            best_depth = depth;
        }
    }

    depth = best_depth;

    for(int i = 0; i < binary_search_steps; ++i)
    {
        size *= 0.5f;
        float z = texture(u_depthViews[0], dp + ds*depth).x;
        if( depth >= z)
        {
            best_depth = depth;
            depth -= 2.f * size;
        }
        depth += size;
    }

    return best_depth;
}

void main()
{
    ivec2 res = textureSize(u_colorViews[0], 0);

    //float z = texture(u_depthViews[0], v_UV).x;

    float view = mod(v_UV.x * float(res.x), float(NUM_VIEWS));
    CamInfo c = u_CamInfo[1 + int(view)];

    vec4 fragPos = c.invViewProj * vec4(v_UV.x, v_UV.y, c.near, 1.f);
    vec3 viewRay = normalize(fragPos.xyz - c.pos); // in world space

    //vec2 dS = vec2(1.f / float(res.x), 1.f / float(res.y));
    //vec2 dP = v_UV;

    vec2 ds = viewRay.xy; // direction
    vec2 dp = fragPos.xy; // start point

    float d = ray_intersect(dp, ds);
    vec2 uv = dp + ds * d;

    g_finalColor = texture(u_colorViews[0], uv);
    //g_finalColor = vec4(d);

    // for(int i = 0; i < NUM_VIEWS; ++i)
    // {
    //     //g_finalColor += vec4(texture(u_depthViews[i], v_UV).x);
    //     g_finalColor += texture(u_colorViews[i], v_UV) / (float(NUM_VIEWS));
    //     //g_finalColor += texture(u_colorViews[i], v_UV) / (float(NUM_VIEWS) * 1000.f);
    // }

    // for(int i = 0; i < NUM_VIEWS; ++i)
    // {
    //     g_finalColor.x += texture(u_depthViews[i], v_UV).x / float(NUM_VIEWS);
    // }
}
