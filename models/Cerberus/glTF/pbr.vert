attribute vec4 a_position;
attribute vec4 a_normal;
attribute vec4 a_tangent;

attribute vec2 a_baseColorTexCoord;
attribute vec2 a_metallicRoughnessTexCoord;
attribute vec2 a_normalTexCoord;
attribute vec2 a_occlusionTexCoord;
attribute vec2 a_emissionTexCoord;

uniform mat4 u_modelViewMatrix;
uniform mat4 u_projectionMatrix;
uniform mat3 u_normalMatrix;

varying vec3 v_position;
varying vec3 v_normal;
varying vec3 v_tangent;

varying vec3 v_lightPosition;

varying vec2 v_baseColorTexCoord;
varying vec2 v_metallicRoughnessTexCoord;
varying vec2 v_normalTexCoord;
varying vec2 v_occlusionTexCoord;
varying vec2 v_emissionTexCoord;

void main()
{

    vec4 pos = u_modelViewMatrix * a_position;
    v_position = vec3(pos.xyz) / pos.w;
    v_normal = u_normalMatrix * vec3(a_normal);
    v_tangent = u_normalMatrix * vec3(a_tangent);
    
    vec3 lightPosition = vec3(3,3,-5);
    v_lightPosition = vec3(u_modelViewMatrix * vec4(lightPosition, 1.0));
    
    v_baseColorTexCoord = a_baseColorTexCoord;
    v_metallicRoughnessTexCoord = a_metallicRoughnessTexCoord;
    v_normalTexCoord = a_normalTexCoord;
    v_occlusionTexCoord = a_occlusionTexCoord;
    v_emissionTexCoord = a_emissionTexCoord;
    
    gl_Position = u_projectionMatrix * vec4(v_position, 1.0);
}


