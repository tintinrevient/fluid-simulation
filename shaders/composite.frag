precision highp float;

varying vec2 v_coordinates;

uniform sampler2D u_renderingTexture;


vec3 hsvToRGB(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main () {
    vec4 data = texture2D(u_renderingTexture, v_coordinates);

    float speed = data.b;
    vec3 color = hsvToRGB(vec3(max(0.6 - speed * 0.0025, 0.52), 0.75, 1.0));
    float ambient = 1.0;
    float direct = 1.0;
    color *= ambient * direct;

    if (speed >= 0.0) {
        gl_FragColor = vec4(color, 1.0);
    } else {
        vec3 backgroundColor = vec3(1.0) - length(v_coordinates * 2.0 - 1.0) * 0.1;
        gl_FragColor = vec4(backgroundColor, 1.0);
    }
}
