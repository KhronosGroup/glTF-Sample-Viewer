in vec3 a_position;
out vec3 TexCoords;

uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;
uniform mat3 u_envRotation = mat3(1.f);

void main()
{
    TexCoords = u_envRotation * a_position;
    mat4 view = mat4(mat3(u_ViewMatrix));
    vec4 pos = u_ProjectionMatrix * view * vec4(a_position, 1.0);
    gl_Position = pos.xyww;
}
