precision mediump float;

attribute vec3 position;
attribute vec3 normal;
uniform mat4 proj;
uniform mat4 model;
uniform mat4 view;
uniform mat3 normalMatrix;
varying vec3 vPosition;
varying vec3 vNormal;

void main () {
    vPosition = (model * vec4(position, 1)).xyz;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = proj * view * model * vec4(position, 1);
}
