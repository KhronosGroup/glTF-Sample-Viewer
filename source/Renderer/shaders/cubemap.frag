precision highp float;

#include <tonemapping.glsl>

uniform samplerCube u_specularEnvSampler;
uniform float u_envBlurNormalized;
uniform int u_MipCount;

out vec4 FragColor;
in vec3 TexCoords;

void main()
{
    vec4 color = textureLod(u_specularEnvSampler, TexCoords, u_envBlurNormalized * float(u_MipCount - 1));

    #ifdef LINEAR_OUTPUT
        FragColor = color.rgba;
    #else
        FragColor = vec4(toneMap(color.rgb), color.a);
    #endif
}
