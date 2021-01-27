precision highp float;

#include <tonemapping.glsl>

uniform samplerCube u_specularEnvSampler;

out vec4 FragColor;
in vec3 TexCoords;

void main()
{
    vec4 color = texture(u_specularEnvSampler, TexCoords);
    FragColor = vec4(linearTosRGB(color.rgb), color.a);
    //FragColor.rgb = TexCoords;
    //FragColor = vec4(0.0, 1.0, 0.0, 1.0);
}
