precision highp float;

#include <tonemapping.glsl>

uniform samplerCube u_specularEnvSampler;

out vec4 FragColor;
in vec3 TexCoords;

void main()
{
    vec4 color = texture(u_specularEnvSampler, TexCoords);
    FragColor = vec4(toneMap(color.rgb), color.a);
}
