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
    mat4 proj;

    mat4 viewProj;
    mat4 invViewProj;

    vec3 pos;
    float near;
    float far;
};

uniform int u_viewShift; // view start offset
uniform float u_LenticularSlope; // 2 / 3 or 4 / 5 or 40 / 51
uniform float u_PixelOffset;
uniform float u_HorizontalScale;

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
        float z = sampleDepth(viewIndex, dp + ds*depth);
        if(depth >= z)
        {
            best_depth = depth;
            break;
        }
        depth += size;
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

    vec2 targetUV = 2.0 * inUV - 1.0;

    //vec4 fragNearPos = virtualCam.invViewProj *  vec4(targetUV.x, targetUV.y, virtualCam.near, 1);
    vec4 fragNearPos = renderCam.invViewProj * vec4(virtualCam.pos, 1.0);
    //fragNearPos.xyz /= fragNearPos.w;

    //vec3 viewRay = fragNearPos.xyz - virtualCam.pos;

    //vec4 renderViewRay = renderCam.viewProj * vec4(viewRay, 0);
    //renderViewRay = (renderViewRay + 1.0) * 0.5;

    //vec4 renderNearPos = renderCam.viewProj * fragNearPos;

    //vec2 ds = renderViewRay.xy * u_HeightMapScale;

    //float z = intersectRay(start, ds, renderViewIndex);

    //float lambda = virtualCam.proj[0][0] * renderViewRay.x / renderViewRay.w;
    //float lambda = -virtualCam.proj[0][0] * u_HorizontalScale * float(textureSize(u_depthViews[0], 0).x) * 0.5  * (fragNearPos.x);
    float lambda = -virtualCam.proj[0][0] * u_HorizontalScale * (fragNearPos.x);

    float offset = u_PixelOffset / float(textureSize(u_depthViews[0], 0).x);

    vec2 start = inUV;

    for(int i = 0; i < NUM_ITERATIONS; ++i)
    {
        float z = sampleDepth(renderViewIndex, vec2(start.x + offset, start.y));
        offset = lambda / z;
    }

    start.x += offset;

    //targetUV = (targetUV + 1.0) * 0.5;

    return start;
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
#if 0

    vec4 color = sampleColor(0, v_UV);

    //vec2 disp = reconstructUV(1, v_UV) - v_UV;
    //g_finalColor = vec4(disp.x,disp.x,disp.x, 1.0);

    color += reconstructColor(1, v_UV);
    g_finalColor += color;

    return;
#else
    ivec3 subPixelIndices = getSubPixelViewIndices();
    g_finalColor = sampleColorFromSubPixels(subPixelIndices, v_UV);

    return;
#endif
}
