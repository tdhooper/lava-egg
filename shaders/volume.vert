precision mediump float;

attribute vec3 position;
uniform mat4 proj;
uniform mat4 model;
uniform mat4 view;
varying vec3 vPosition;

void main () {
    vPosition = position;
    gl_Position = proj * view * model * vec4(position, 1.0);
}
