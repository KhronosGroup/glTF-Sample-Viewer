precision highp float;

layout(location = 0) out vec4 id_color;
layout(location = 1) out vec4 position;
layout(location = 2) out vec4 normal;
uniform vec4 u_PickingColor;
in vec3 v_Position;

void main() {
    id_color = u_PickingColor;
    position = vec4(v_Position, 1.0);
    normal = vec4(normalize(cross(dFdx(v_Position), dFdy(v_Position))), 1.0);
}