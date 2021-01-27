#include <tonemapping.glsl>

uniform float u_envIntensity = 1.0f;
uniform samplerCube u_specularEnvSampler;

out vec4 FragColor;
in vec3 TexCoords;

void main()
{
    vec4 color = texture(u_specularEnvSampler, TexCoords) * u_envIntensity;
    FragColor = vec4(toneMap(color.rgb), color.a);
}
