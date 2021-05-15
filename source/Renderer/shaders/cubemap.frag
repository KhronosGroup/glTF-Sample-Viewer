precision highp float;


#include <tonemapping.glsl>


uniform float u_EnvIntensity;
uniform float u_EnvBlurNormalized;
uniform int u_MipCount;
uniform samplerCube u_GGXEnvSampler;

out vec4 FragColor;
in vec3 v_TexCoords;


void main()
{
    vec4 color = textureLod(u_GGXEnvSampler, v_TexCoords, u_EnvBlurNormalized * float(u_MipCount - 1)) * u_EnvIntensity;

#ifdef LINEAR_OUTPUT
    FragColor = color.rgba;
#else
    FragColor = vec4(toneMap(color.rgb), color.a);
#endif
}
