precision mediump float;

uniform sampler2D backfaceDistances;
uniform vec2 resolution;
uniform vec3 cameraPosition;
uniform mat4 modelInverse;
uniform sampler2D iChannel0;
uniform vec4 volumeId;
uniform float volumeScale;
uniform vec3 volumeOffset;
varying vec3 vPosition;
varying vec3 vNormal;

#pragma glslify: volumeRay = require(./lib/volume-ray.glsl)
#pragma glslify: renderVolume = require(./lib/render-volume.glsl, iChannel0=iChannel0)

void main () {
    vec2 uv = gl_FragCoord.xy / resolution;
    float backfaceDistance = texture2D(backfaceDistances, uv).r;

    vec3 rayOrigin;
    vec3 rayDirection;
    float maxDistance;

    volumeRay(
        modelInverse,
        vPosition,
        cameraPosition,
        backfaceDistance,
        rayOrigin,
        rayDirection,
        maxDistance
    );

    vec3 color = renderVolume(
        rayOrigin,
        rayDirection,
        maxDistance,
        volumeId,
        volumeScale,
        volumeOffset
    ).rgb;

    vec3 light = normalize(vec3(-1, 1, .25));
    float highlight = max(0., dot(light, vNormal) * .5);
    color += highlight;

    gl_FragColor = vec4(color, 1);

    // gl_FragColor = vec4(vec3(maxDist / 2.), 1);
}
