precision highp float;

varying vec2 v_coordinates;

uniform sampler2D u_velocityTexture;
uniform float u_timeStep;

void main () {
    vec3 velocity = texture2D(u_velocityTexture, v_coordinates).rgb;
    vec3 newVelocity = velocity + vec3(0.0, -40.0 * u_timeStep, 0.0); //add gravity

    gl_FragColor = vec4(newVelocity * 1.0, 0.0);
}
