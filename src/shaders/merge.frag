precision highp float;

in vec2 v_UV;
out vec4 g_finalColor;

#ifndef NUM_RENDER_VIEWS
    #define NUM_RENDER_VIEWS 1
#endif

#ifndef NUM_VIRTUAL_VIEWS
    #define NUM_VIRTUAL_VIEWS 1
#endif

//#define BGR_DISPLAY
// switch between rendering all views and 'virtual' reconstruction
//#define RECONSTRUCT_VIEWS

struct CamInfo
{
    mat4 invViewProj;
    mat4 viewProj;
    vec3 pos;
    float near;
    float far;
};

const int g_viewShift = 4; // view start offset
const float g_LenticularSlope = 2.f / 3.f; // 4 / 5 or 40 / 51

uniform sampler2D u_colorViews[NUM_RENDER_VIEWS];
uniform sampler2D u_depthViews[NUM_RENDER_VIEWS];

uniform CamInfo u_RenderCams[NUM_RENDER_VIEWS];
uniform CamInfo u_VirtualCams[NUM_VIRTUAL_VIEWS];

int virtualToRenderView(int virtualViewIndex)
{
    float interpolatedView = float(virtualViewIndex) / float(NUM_VIRTUAL_VIEWS);
    return int(interpolatedView * float(NUM_RENDER_VIEWS));
}

// https://stackoverflow.com/questions/19592850/how-to-bind-an-array-of-textures-to-a-webgl-shader-uniform
// samplers have to be indexed with a constant value
float sampleDepth(int Index, vec2 uv)
{
    for(int i = 0; i < NUM_RENDER_VIEWS; ++i)
    {
        if(i == Index)
        {
            return texture(u_depthViews[i], uv).x;
        }
    }

    return 0.f;
}

float intersectRay(vec2 dp, vec2 ds, int viewIndex)
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
        float z = sampleDepth(viewIndex, dp + ds*depth);
        if(best_depth > 0.996 && depth >= z)
        {
            best_depth = depth;
        }
    }

    depth = best_depth;

    for(int i = 0; i < binary_search_steps; ++i)
    {
        size *= 0.5f;
        float z = sampleDepth(viewIndex, dp + ds*depth);
        if( depth >= z)
        {
            best_depth = depth;
            depth -= 2.f * size;
        }
        depth += size;
    }

    return best_depth;
}

vec2 reconstructUV(int virtualViewIndex, vec2 inUV, vec2 stepScale)
{
    CamInfo virtualCam = u_VirtualCams[virtualViewIndex];
    int renderViewIndex = virtualToRenderView(virtualViewIndex);
    CamInfo renderCam = u_RenderCams[renderViewIndex];

    vec4 fragPos = virtualCam.invViewProj * vec4(inUV.x, inUV.y, virtualCam.near, 0.f); // c.near
    vec3 viewRay = normalize(fragPos.xyz - virtualCam.pos); // in world space

    vec4 viewRayProj = renderCam.viewProj * vec4(viewRay, 1.f);
    vec4 startPointProj = renderCam.viewProj * fragPos;

    vec2 delta = abs(inUV - startPointProj.xy) * stepScale;
    vec2 ds = normalize(viewRayProj.xy) * delta; // direction

    float d = intersectRay(startPointProj.xy, ds, renderViewIndex);
    vec2 uv = startPointProj.xy + ds * d; // inUV + ds * d ?

    return clamp(uv, 0.f, 1.f); // mod ?
}

// float reconstructDepth(int virtualViewIndex, vec2 inUV, vec2 stepScale)
// {
//     CamInfo c = u_CamInfo[virtualViewIndex];

//     vec4 fragPos = c.invViewProj * vec4(inUV.x, inUV.y, c.near, 0.f); // c.near
//     vec3 viewRay = normalize(fragPos.xyz - c.pos); // in world space

//     vec4 viewRayProj = u_MainView.viewProj * vec4(viewRay, 1.f);
//     vec4 startPointProj = u_MainView.viewProj * fragPos;

//     vec2 delta = abs(inUV - startPointProj.xy) * stepScale;
//     vec2 ds = normalize(viewRayProj.xy) * delta; // direction

//     return intersectRay(startPointProj.xy, ds, virtualToRenderView(virtualViewIndex));
// }

ivec3 getSubPixelViewIndices()
{
    float yCoord = gl_FragCoord.y;

    #ifdef VIEWPORT_INVERT
        yCoord = textureSize(u_colorViews[0], 0).y - yCoord;
    #endif

    float view = gl_FragCoord.x * 3.f + yCoord * g_LenticularSlope + float(g_viewShift);

    #ifdef BGR_DISPLAY
        return ivec3(mod(view + 2.f, float(NUM_VIRTUAL_VIEWS)), mod(view + 1.f, float(NUM_VIRTUAL_VIEWS)), mod(view, float(NUM_VIRTUAL_VIEWS)));
    #else // RGB
        return ivec3(mod(view, float(NUM_VIRTUAL_VIEWS)), mod(view + 1.f, float(NUM_VIRTUAL_VIEWS)), mod(view + 2.f, float(NUM_VIRTUAL_VIEWS)));
    #endif
}

vec4 sampleColor(int viewIndex, vec2 inUV)
{
#ifdef RECONSTRUCT_VIEWS

    //vec2 stepScale = vec2(0.0005, 0.0005) * 16.f / 9.f;
    vec2 stepScale = vec2(1.f);

    int view = virtualToRenderView(viewIndex);
    inUV = reconstructUV(viewIndex, inUV, stepScale);
    viewIndex = view;

#endif

    for(int i = 0; i < NUM_RENDER_VIEWS; ++i)
    {
        if(i == viewIndex)
        {
            return texture(u_colorViews[i], inUV);
        }
    }

    return vec4(0);
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

    // return;

    // vec2 scale = vec2(0.0005f);
    // float dR = reconstructDepth(0, v_UV, scale);
    // float dO = texture(u_depthViews[0], v_UV).x;

    // float dDelta = abs(dR - dO) * 10.f;
    // g_finalColor = vec4(dDelta, dDelta, dDelta, 1.0);

    // g_finalColor = texture(u_colorViews[0], reconstructUV(0, v_UV, stepScale)) * 0.5;
    // g_finalColor += texture(u_colorViews[0], reconstructUV(1, v_UV, stepScale)) * 0.5;
}
