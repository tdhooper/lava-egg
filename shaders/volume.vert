precision mediump float;

attribute vec3 position;
attribute vec3 normal;
uniform vec3 cameraPosition;
uniform mat4 proj;
uniform mat4 model;
uniform mat4 view;
uniform mat3 normalMatrix;
varying vec3 vPosition;
varying vec3 vNormal;
varying float depth;

void main () {
    vPosition = (model * vec4(position, 1)).xyz;
    vNormal = normalize(normalMatrix * normal);
    vec4 pos = proj * view * model * vec4(position, 1);
    depth = length(normalize(cameraPosition) * 2. - vPosition);
    depth = smoothstep(1., 3.5, depth);
    gl_Position = pos;
}
