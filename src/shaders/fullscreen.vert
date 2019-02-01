out vec2 v_UV;
out vec4 v_Position;

void main()
{
    float x = -1.0 + float((gl_VertexID & 1) << 2);
    float y = -1.0 + float((gl_VertexID & 2) << 1);
    v_UV.x = (x+1.0)*0.5;
    v_UV.y = (y+1.0)*0.5;

    v_Position = vec4(x, y, 0.0, 1.0);
    gl_Position = vec4(x, y, 0.0, 1.0);
}
