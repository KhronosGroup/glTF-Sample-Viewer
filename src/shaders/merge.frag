precision highp float;

in vec2 v_UV;
out vec4 g_finalColor;

#ifndef NUM_VIEWS
#define NUM_VIEWS 1
#endif

uniform sampler2D u_Views[NUM_VIEWS];

// https://stackoverflow.com/questions/19592850/how-to-bind-an-array-of-textures-to-a-webgl-shader-uniform
// samplers have to be indexed with a constant value
vec4 sampleView(int Index, vec2 uv)
{
    vec4 color = vec4(0);

    for(int i = 0; i < NUM_VIEWS; ++i)
    {
        if(i == Index)
        {
            return texture(u_Views[i], uv);
        }
    }

    return color;
}

void main()
{
    g_finalColor = sampleView(0, v_UV);
}
