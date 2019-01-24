precision highp float;

in vec2 v_UV;
out vec4 g_finalColor;

#ifndef NUM_VIEWS
#define NUM_VIEWS 1
#endif

//#define VIRTUAL

struct CamInfo
{
    mat4 invViewProj;
    mat4 viewProj;
    vec3 pos;
    float near;
    float far;
};

// we are not really sure about the meanings of these constants
const int g_yViews = 24;
const int g_viewShift = 4;
const float g_LenticularSlope = 2.f / 3.f;

uniform sampler2D u_colorViews[NUM_VIEWS];
uniform sampler2D u_depthViews[NUM_VIEWS];
uniform CamInfo u_CamInfo[NUM_VIEWS + 1]; // first index contains original view

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

vec2 reconstructUV(int viewIndex, vec2 inUV, vec2 stepScale)
{
    CamInfo cOriginal = u_CamInfo[0];
    CamInfo c = u_CamInfo[1 + viewIndex];

    vec4 fragPos = c.invViewProj * vec4(inUV.x, inUV.y, c.near, 0.f); // c.near
    vec3 viewRay = normalize(fragPos.xyz - c.pos); // in world space

    vec4 viewRayProj = cOriginal.viewProj * vec4(viewRay, 1.f);
    vec4 startPointProj = cOriginal.viewProj * fragPos;

    vec2 delta = abs(inUV - startPointProj.xy) * stepScale;
    vec2 ds = normalize(viewRayProj.xy) * delta; // direction

    float d = ray_intersect(startPointProj.xy, ds);
    vec2 uv = startPointProj.xy + ds * d;

    return clamp(uv, 0.f, 1.f);
}

ivec3 getSubPixelViewIndices()
{
    ivec2 screenPos = ivec2(gl_FragCoord.xy);

    int angleOffset = int(mod(float(screenPos.y), float(g_yViews)));
    int startIndex = screenPos.x * 3;
    int startIndexOffset = int(float(angleOffset) * g_LenticularSlope);

    int posR = startIndex + startIndexOffset + g_viewShift;
    int posG = 1 + startIndex + startIndexOffset + g_viewShift;
    int posB = 2 + startIndex + startIndexOffset + g_viewShift;

    return ivec3(int(mod(float(posR), float(NUM_VIEWS))), int(mod(float(posG), float(NUM_VIEWS))), int(mod(float(posB), float(NUM_VIEWS))));
}

ivec3 getSubPixelViewIndicesSimple()
{
    float view = gl_FragCoord.x * 3.f + gl_FragCoord.y * g_LenticularSlope + float(g_viewShift);
    return ivec3(mod(view, float(NUM_VIEWS)), mod(view + 1.f, float(NUM_VIEWS)), mod(view + 2.f, float(NUM_VIEWS)));
}

// https://stackoverflow.com/questions/19592850/how-to-bind-an-array-of-textures-to-a-webgl-shader-uniform
// samplers have to be indexed with a constant value
vec4 sampleColor(int viewIndex, vec2 inUV)
{

#ifdef VIRTUAL

    vec2 stepScale = vec2(0.0005, 0.0005) * 16.f / 9.f;
    return texture(u_colorViews[0], reconstructUV(viewIndex, inUV, stepScale));

#else

    for(int i = 0; i < NUM_VIEWS; ++i)
    {
        if(i == viewIndex)
        {
            return texture(u_colorViews[i], inUV);
        }
    }

#endif

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

vec4 sampleColorFromSubPixels(ivec3 subPixelIndices, vec2 uv)
{
    vec4 pixelR = sampleColor(subPixelIndices.x, uv);
    vec4 pixelG = sampleColor(subPixelIndices.y, uv);
    vec4 pixelB = sampleColor(subPixelIndices.z, uv);

    return vec4(pixelR.x, pixelG.y, pixelB.z, 1.0);
}


void main()
{
    ivec3 subPixelIndices = getSubPixelViewIndicesSimple();
    g_finalColor = sampleColorFromSubPixels(subPixelIndices, v_UV);

    // g_finalColor = texture(u_colorViews[0], reconstructUV(0, v_UV, stepScale)) * 0.5;
    // g_finalColor += texture(u_colorViews[0], reconstructUV(1, v_UV, stepScale)) * 0.5;
}
