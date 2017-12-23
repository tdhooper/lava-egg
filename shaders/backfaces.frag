precision mediump float;

uniform vec3 cameraPosition;
varying vec3 vPosition;

void main () {
    float distance = length(vPosition - cameraPosition);
    gl_FragColor = vec4(distance, 0, 0, 1);
}
