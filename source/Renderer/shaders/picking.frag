precision highp float;

layout(location = 0) out vec4 id_color;
//layout(location = 1) out vec3 position;
//layout(location = 2) out vec3 normal;
uniform vec4 u_PickingColor;
in vec3 v_Position;

void main() {
    id_color = u_PickingColor;
    //position = v_Position;
    //normal = normalize(cross(dFdx(v_Position), dFdy(v_Position)));
}