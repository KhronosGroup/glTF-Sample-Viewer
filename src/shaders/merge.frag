precision highp float;

in vec2 v_UV;
in vec4 v_Position;

out vec4 g_finalColor;

#ifndef NUM_RENDER_VIEWS
    #define NUM_RENDER_VIEWS 1
#endif

#ifndef NUM_VIRTUAL_VIEWS
    #define NUM_VIRTUAL_VIEWS 1
#endif

#define LINEAR_DEPTH

struct CamInfo
{
    mat4 view;

    mat4 viewProj;
    mat4 invViewProj;

    vec3 pos;
    float near;
    float far;
};

uniform int u_viewShift; // view start offset
uniform float u_LenticularSlope; // 2 / 3 or 4 / 5 or 40 / 51
uniform float u_HeightMapScale;

uniform sampler2D u_colorViews[NUM_RENDER_VIEWS];
uniform sampler2D u_depthViews[NUM_RENDER_VIEWS];

uniform CamInfo u_RenderCams[NUM_RENDER_VIEWS];
uniform CamInfo u_VirtualCams[NUM_VIRTUAL_VIEWS];

int virtualToRenderView(int virtualViewIndex)
{
    float interpolatedView = float(virtualViewIndex) / max(float(NUM_VIRTUAL_VIEWS-1), 1.f);
    return int(round(interpolatedView * float(NUM_RENDER_VIEWS-1)));
}

// https://stackoverflow.com/questions/19592850/how-to-bind-an-array-of-textures-to-a-webgl-shader-uniform
// samplers have to be indexed with a constant value
float sampleDepth(int Index, vec2 uv)
{
    float z = 0.f;

    for(int i = 0; i < NUM_RENDER_VIEWS; ++i)
    {
        if(i == Index)
        {
            z = texture(u_depthViews[i], uv).x;
            break;
        }
    }

#ifdef LINEAR_DEPTH
    CamInfo renderCam = u_RenderCams[Index];
    z = 2.f * z - 1.f;
    z = 2.0 * renderCam.near * renderCam.far / (renderCam.far + renderCam.near - z * (renderCam.far - renderCam.near));
#endif

    return z;
}

float sampleDepthGrad(int Index, vec2 uv, vec2 dx, vec2 dy)
{
    float z = 0.f;

    for(int i = 0; i < NUM_RENDER_VIEWS; ++i)
    {
        if(i == Index)
        {
            z = textureGrad(u_depthViews[i], uv, dx, dy).x;
            break;
        }
    }

#ifdef LINEAR_DEPTH
    CamInfo renderCam = u_RenderCams[Index];
    z = 2.f * z - 1.f;
    z = 2.0 * renderCam.near * renderCam.far / (renderCam.far + renderCam.near - z * (renderCam.far - renderCam.near));
#endif

    return z;
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
            break;
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

vec2 reconstructUV(int virtualViewIndex, vec2 inUV)
{
    CamInfo virtualCam = u_VirtualCams[virtualViewIndex];
    int renderViewIndex = virtualToRenderView(virtualViewIndex);
    CamInfo renderCam = u_RenderCams[renderViewIndex];

    inUV = 2.0 * inUV - 1.0;

    vec4 fragNearPos = virtualCam.invViewProj *  vec4(inUV.x, inUV.y, virtualCam.near, 1);
    //fragNearPos.xyz /= fragNearPos.w;
    //fragNearPos.xyz /= fragNearPos.z;

    vec3 viewRay = fragNearPos.xyz - virtualCam.pos;

    vec4 renderViewRay = renderCam.viewProj * vec4(viewRay, 0);

    //start point
    vec4 renderNearPos = renderCam.viewProj * fragNearPos;

    vec2 start = (renderNearPos.xy + 1.0) * 0.5;

    vec2 ds = renderViewRay.xy * u_HeightMapScale;

    float d = intersectRay(start, ds, renderViewIndex);

    return start + ds*d;
}

ivec3 getSubPixelViewIndices()
{
    float yCoord = gl_FragCoord.y;

    #ifdef VIEWPORT_INVERT
        yCoord = float(textureSize(u_colorViews[0], 0).x) - yCoord;
    #endif

    float view = gl_FragCoord.x * 3.f + yCoord * u_LenticularSlope + float(u_viewShift);

    #ifdef BGR_DISPLAY
        return ivec3(mod(view + 2.f, float(NUM_VIRTUAL_VIEWS)), mod(view + 1.f, float(NUM_VIRTUAL_VIEWS)), mod(view, float(NUM_VIRTUAL_VIEWS)));
    #else // RGB
        return ivec3(mod(view, float(NUM_VIRTUAL_VIEWS)), mod(view + 1.f, float(NUM_VIRTUAL_VIEWS)), mod(view + 2.f, float(NUM_VIRTUAL_VIEWS)));
    #endif
}

vec4 sampleColor(int viewIndex, vec2 inUV)
{
    for(int i = 0; i < NUM_RENDER_VIEWS; ++i)
    {
        if(i == viewIndex)
        {
            return texture(u_colorViews[i], inUV);
        }
    }

    return vec4(0);
}

vec4 reconstructColor(int viewIndex, vec2 inUV)
{
#ifdef RECONSTRUCT_VIEWS

    int view = virtualToRenderView(viewIndex);
    inUV = reconstructUV(viewIndex, inUV);
    viewIndex = view;

#endif

    return sampleColor(viewIndex, inUV);
}

vec4 sampleColorFromSubPixels(ivec3 subPixelIndices, vec2 uv)
{
    vec4 pixelR = reconstructColor(subPixelIndices.x, uv);
    vec4 pixelG = reconstructColor(subPixelIndices.y, uv);
    vec4 pixelB = reconstructColor(subPixelIndices.z, uv);

    return vec4(pixelR.x, pixelG.y, pixelB.z, 1.0);
}

void main()
{
#if 1
    // int view = int(v_UV.x * float(NUM_VIRTUAL_VIEWS));
    // vec2 uv = vec2(v_UV * float(NUM_VIRTUAL_VIEWS) - float(view));
    // g_finalColor = sampleColor(view, uv);

    vec4 color = sampleColor(0, v_UV);
    vec2 uv = reconstructUV(0, v_UV);

    color += sampleColor(0, uv);
    g_finalColor = color;

    return;
#else
    ivec3 subPixelIndices = getSubPixelViewIndices();
    g_finalColor = sampleColorFromSubPixels(subPixelIndices, v_UV);

    return;
#endif
}
