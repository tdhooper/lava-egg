precision mediump float;

uniform sampler2D backfaceDistances;
uniform vec2 resolution;
uniform vec3 cameraPosition;
uniform sampler2D iChannel0;
varying vec3 vPosition;

#pragma glslify: volumeRay = require(./lib/volume-ray.glsl)
#pragma glslify: renderVolume = require(./lib/render-volume.glsl, iChannel0=iChannel0)

void main () {
    vec2 uv = gl_FragCoord.xy / resolution;
    float backfaceDistance = texture2D(backfaceDistances, uv).r;

    vec3 rayOrigin;
    vec3 rayDirection;
    float maxDistance;

    volumeRay(
        vPosition,
        cameraPosition,
        backfaceDistance,
        rayOrigin,
        rayDirection,
        maxDistance
    );

    vec4 color = renderVolume(rayOrigin, rayDirection, maxDistance);
    gl_FragColor = vec4(color.rbg * 5., 1);

    // gl_FragColor = vec4(vec3(maxDist / 2.), 1);
}
