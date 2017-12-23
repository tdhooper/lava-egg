precision mediump float;

uniform sampler2D backfaceDistances;
uniform vec2 resolution;
uniform vec3 cameraPosition;
varying vec3 vPosition;

#pragma glslify: volumeRay = require(./lib/volume-ray.glsl)

void main () {
    vec2 uv = gl_FragCoord.xy / resolution;
    float backfaceDistance = texture2D(backfaceDistances, uv).r;

    vec3 rayOrigin;
    vec3 rayDirection;
    float maxDist;

    volumeRay(
        vPosition,
        cameraPosition,
        backfaceDistance,
        rayOrigin,
        rayDirection,
        maxDist
    );

    gl_FragColor = vec4(vec3(maxDist / 2.), 1);
}
