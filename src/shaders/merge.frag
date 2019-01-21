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
vec4 sampleColor(int Index, vec2 uv)
{
    for(int i = 0; i < NUM_VIEWS; ++i)
    {
        if(i == Index)
        {
            return texture(u_colorViews[i], uv);
        }
    }

    return vec4(0);
}

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

ivec3 getSubPixelViewIndices()
{
    // we are not really sure about the meanings of these constants
    const int yViews = 24;
    const int viewShift = 4;
    const float angle = 2.0 / 3.0;

    ivec2 screenPos = ivec2(gl_FragCoord.xy);

    int angleOffset = int(mod(float(screenPos.y), float(yViews)));
    int startIndex = screenPos.x * 3;
    int startIndexOffset = int(float(angleOffset) * angle);

    int posR = startIndex + startIndexOffset + viewShift;
    int posG = 1 + startIndex + startIndexOffset + viewShift;
    int posB = 2 + startIndex + startIndexOffset + viewShift;

    return ivec3(int(mod(float(posR), float(NUM_VIEWS))), int(mod(float(posG), float(NUM_VIEWS))), int(mod(float(posB), float(NUM_VIEWS))));
}

vec4 sampleColorFromSubPixels(ivec3 subPixelIndices, vec2 uv)
{
    vec4 pixelR = sampleColor(subPixelIndices.x, uv);
    vec4 pixelG = sampleColor(subPixelIndices.y, uv);
    vec4 pixelB = sampleColor(subPixelIndices.z, uv);

    return vec4(pixelR.x, pixelG.y, pixelB.z, 1.0);
}

void main()
{
    ivec3 subPixelIndices = getSubPixelViewIndices();
    g_finalColor = sampleColorFromSubPixels(subPixelIndices, v_UV);

    return;

    // CamInfo c = u_CamInfo[1 + int(NUM_VIEWS)];

    // vec4 fragPos = c.invViewProj * vec4(v_UV.x, v_UV.y, c.near, 0.f); // c.near
    // vec3 viewRay = normalize(fragPos.xyz - c.pos); // in world space

    // //vec2 dS = vec2(1.f / float(res.x), 1.f / float(res.y));
    // //vec2 dP = v_UV;

    // vec2 ds = viewRay.xy; // direction
    // vec2 dp = fragPos.xy; // start point

    // float d = ray_intersect(dp, ds);
    // vec2 uv = dp + ds * d;

    // g_finalColor = texture(u_colorViews[0], uv);
    // //g_finalColor.a = 1.0;
}
