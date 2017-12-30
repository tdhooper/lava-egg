precision mediump float;

uniform vec3 cameraPosition;
varying vec3 vPosition;
varying vec3 vNormal;

#pragma glslify: sceneLighting = require(./lib/scene-lighting.glsl, vNormal=vNormal, cameraPosition=cameraPosition, vPosition=vPosition)


void main () {
    vec3 color = vec3(.025,.01,.04) + sceneLighting(.5);
    gl_FragColor = vec4(color,1);
}
