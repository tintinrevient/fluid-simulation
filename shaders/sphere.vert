precision highp float;

attribute vec3 a_vertexPosition;
attribute vec2 a_textureCoordinates;

uniform mat4 u_projectionMatrix;
uniform mat4 u_viewMatrix;
uniform sampler2D u_positionsTexture;
uniform float u_sphereRadius;

varying vec3 v_viewSpacePosition;

void main () {
    vec3 spherePosition = texture2D(u_positionsTexture, a_textureCoordinates).rgb;
    vec3 position = a_vertexPosition * u_sphereRadius + spherePosition;
    v_viewSpacePosition = vec3(u_viewMatrix * vec4(position, 1.0));

    gl_Position = u_projectionMatrix * vec4(v_viewSpacePosition, 1.0);
}
