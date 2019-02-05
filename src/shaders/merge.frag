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

//#define BGR_DISPLAY
// switch between rendering all views and 'virtual' reconstruction
//#define RECONSTRUCT_VIEWS

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
    float interpolatedView = float(virtualViewIndex) / float(NUM_VIRTUAL_VIEWS-1);
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

vec3 intersectPlane(vec3 rayDirection, vec3 rayOrigin, vec3 planeNormal, vec3 planeOrigin)
{
    float d = -dot(planeOrigin, planeNormal);
    float v = dot(rayDirection, planeNormal);
    float t = -(dot(rayOrigin, planeNormal) + d) / v;
    if(t > 0.0f)
    {
        return rayOrigin + t * rayDirection;
    }
    return vec3(1, 0, 0);
}

float intersectPlaneDist(vec3 rayDirection, vec3 rayOrigin, vec3 planeNormal, vec3 planeOrigin)
{
    float d = -dot(planeOrigin, planeNormal);
    float v = dot(rayDirection, planeNormal);
    return -(dot(rayOrigin, planeNormal) + d) / v;
}

// vec3 intersect(int virtualViewIndex, vec2 inUV)
// {
//     CamInfo virtualCam = u_VirtualCams[virtualViewIndex];
//     int renderViewIndex = virtualToRenderView(virtualViewIndex);
//     CamInfo renderCam = u_RenderCams[renderViewIndex];

//     vec4 fragNearPos = vec4(inUV.x, inUV.y, 0, 1.f) * virtualCam.invViewProj;
//     //vec4 fragFarPos = virtualCam.invViewProj * vec4(inUV.x, inUV.y, -virtualCam.far, 1.f);
//     vec3 viewRay = virtualCam.target - virtualCam.pos; // in world space

//     vec3 planeNormal = normalize(renderCam.target - renderCam.pos);
//     vec3 planeOrigin = renderCam.pos + planeNormal * renderCam.near;

//     return intersectPlane(viewRay.xyz, virtualCam.pos - (viewRay.xyz), planeNormal, planeOrigin);
// }

// float intersectDepth(int virtualViewIndex, vec2 inUV)
// {
//     CamInfo virtualCam = u_VirtualCams[virtualViewIndex];
//     int renderViewIndex = virtualToRenderView(virtualViewIndex);
//     CamInfo renderCam = u_RenderCams[renderViewIndex];

//     vec2 clipSpaceCoords = vec2((inUV.x - 0.5) * 2.0, (inUV.y - 0.5) * 2.0);

//     vec4 fragNearPos = virtualCam.invViewProj * vec4(clipSpaceCoords.x, clipSpaceCoords.y, virtualCam.near, 1.f);
//     vec4 fragFarPos = virtualCam.invViewProj * vec4(clipSpaceCoords.x, clipSpaceCoords.y, virtualCam.far, 1.f);
//     vec4 viewRay = fragFarPos - fragNearPos; // in world space

//     vec3 planeNormal = normalize(renderCam.target - renderCam.pos);
//     vec3 planeOrigin = renderCam.pos + planeNormal * renderCam.near;

//     return intersectPlaneDist(viewRay.xyz, virtualCam.pos - (viewRay.xyz), planeNormal, planeOrigin);
// }

vec2 reconstructUV(int virtualViewIndex, vec2 inUV)
{
    CamInfo virtualCam = u_VirtualCams[virtualViewIndex];
    int renderViewIndex = virtualToRenderView(virtualViewIndex);
    CamInfo renderCam = u_RenderCams[renderViewIndex];

#if 0
    mat3 K2R2 = virtualCam.intrinsic * mat3(virtualCam.view);
    mat3 K1R1 = renderCam.intrinsic * mat3(renderCam.view);
    //mat3 K2R2 = mat3(virtualCam.view) * virtualCam.intrinsic;

    mat3 invK1R1 = inverse(K1R1);

    float z = sampleDepth(renderViewIndex, inUV);

    //vec2 res = vec2(textureSize(u_colorViews[0], 0).xy);

    vec3 p1 = vec3(inUV * z, z);

    vec3 repRenderPos = (K2R2 * invK1R1) * (p1 + K1R1 * renderCam.pos) - K2R2 * virtualCam.pos;

    //repRenderPos.xy /= repRenderPos.z;
    repRenderPos /= u_HeightMapScale;

    // floor(repRenderPos.xy + 0.5)

    // vec2 ds = viewRayProj.xy; // direction
    // float d = intersectRay(startPointProj.xy, ds, renderViewIndex);
    // uv = startPointProj.xy + ds * d;
    return clamp(repRenderPos.xy, 0.f, 1.f);

#else
    inUV = 2.0 * inUV - 1.0;

    vec3 fragNearPos = transpose(mat3(virtualCam.view)) *  vec3(inUV.x, inUV.y, 1);
    //fragNearPos.xyz /= fragNearPos.w;

    vec3 viewRay = fragNearPos.xyz - virtualCam.pos;

    vec3 renderViewRay = mat3(renderCam.view) * viewRay;

    //start point
    vec3 renderNearPos =  mat3(renderCam.view) * fragNearPos;
    //renderNearPos.xyz /= renderNearPos.w;

    vec2 start = (renderNearPos.xy + 1.0) * 0.5;

    vec2 ds = renderViewRay.xy * u_HeightMapScale;

    float d = intersectRay(start, ds, renderViewIndex);

    return start + ds*d;
#endif
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
#ifdef RECONSTRUCT_VIEWS

    int view = virtualToRenderView(viewIndex);
    inUV = reconstructUV(viewIndex, inUV);
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
    // float d = intersectDepth(3, v_UV) * 0.75;
    // //d -= float(int(d));
    // g_finalColor = vec4(d, d, d, 1);

    // return;

#if 0
    int view = int(v_UV.x * float(NUM_VIRTUAL_VIEWS));
    vec2 uv = vec2(v_UV * float(NUM_VIRTUAL_VIEWS) - float(view));
    g_finalColor = sampleColor(view, uv);

    return;
#else
    ivec3 subPixelIndices = getSubPixelViewIndices();
    g_finalColor = sampleColorFromSubPixels(subPixelIndices, v_UV);

    return;
#endif
    // int virtView = 7 % NUM_RENDER_VIEWS;
    // CamInfo virtualCam = u_VirtualCams[virtView];
    // int renderViewIndex = virtualToRenderView(virtView);
    // CamInfo renderCam = u_RenderCams[renderViewIndex];

    // vec4 fragNearPos = virtualCam.invViewProj * vec4(inUV.x, inUV.y, virtualCam.near, 0.f);
    // vec4 fragFarPos = virtualCam.invViewProj * vec4(inUV.x, inUV.y, virtualCam.far, 0.f);

    // vec3 viewRay = fragFarPos.xyz - fragNearPos.xyz; // in world space

    // vec4 viewRayProj = renderCam.viewProj * vec4(viewRay, 1.f); // render camera space [0..1]
    // vec4 startPointProj = renderCam.viewProj * fragNearPos; // frag pos in render camera space

    // vec2 ds = viewRayProj.xy; // direction

    // g_finalColor = vec4(viewRayProj.xy, 0, 1);

    // return;

    // float d = intersectRay(startPointProj.xy, ds, renderViewIndex);

    // g_finalColor = vec4(d,d,d, 1.f);
    //vec2 uv = startPointProj.xy + ds * d; // inUV + ds * d ?
}
