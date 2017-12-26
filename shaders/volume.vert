precision mediump float;

attribute vec3 position;
attribute vec3 normal;
uniform mat4 proj;
uniform mat4 model;
uniform mat4 view;
uniform mat4 instance;
uniform mat3 normalMatrix;
varying vec3 vPosition;
varying vec3 vNormal;

void main () {
    vPosition = (model * instance * vec4(position, 1)).xyz;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = proj * view * model * instance * vec4(position, 1);
}
