precision highp float;

in vec2 v_UV;
out vec4 g_finalColor;

#ifndef NUM_VIEWS
#define NUM_VIEWS 1
#endif

uniform sampler2D u_colorViews[NUM_VIEWS];
uniform sampler2D u_depthViews[NUM_VIEWS];

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

void main()
{
    //g_finalColor = mix(sampleView(0, v_UV * 0.25), sampleView(1, v_UV), 0.5);
    //g_finalColor = sampleView(0, v_UV);

    //g_finalColor = vec4(sampleDepth(0, v_UV), 0, 0 ,0);

    for(int i = 0; i < NUM_VIEWS; ++i)
    {
        g_finalColor += texture(u_colorViews[i], v_UV) / (float(NUM_VIEWS));
        //g_finalColor += texture(u_colorViews[i], v_UV) / (float(NUM_VIEWS) * 1000.f);
    }

    // for(int i = 0; i < NUM_VIEWS; ++i)
    // {
    //     g_finalColor.x += texture(u_depthViews[i], v_UV).x / float(NUM_VIEWS);
    // }
}
