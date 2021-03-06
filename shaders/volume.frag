precision mediump float;

uniform sampler2D backfaceDistances;
uniform vec2 resolution;
uniform float time;
uniform vec3 cameraPosition;
uniform mat4 modelInverse;
uniform vec4 volumeId;
uniform float volumeScale;
uniform vec3 volumeOffset;
uniform float dotScale;
uniform float instanceIndex;
uniform float brightness;
uniform bool loop;
uniform float loopDuration;
uniform float loopSize;
varying vec3 vPosition;
varying vec3 vNormal;
varying float depth;

#pragma glslify: volumeRay = require(./lib/volume-ray.glsl)
#pragma glslify: renderVolume = require(./lib/render-volume.glsl, time=time, dotScale=dotScale, brightness=brightness, loop=loop, loopDuration=loopDuration, loopSize=loopSize, scale=volumeScale)
#pragma glslify: sceneLighting = require(./lib/scene-lighting.glsl, vNormal=vNormal, cameraPosition=cameraPosition, vPosition=vPosition)


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

    vec3 offset = volumeOffset + vec3(0, 0, 0);

    vec4 volume = renderVolume(
        rayOrigin,
        rayDirection,
        maxDistance,
        volumeId,
        offset
    );

    volume = min(volume, vec4(1));

    vec3 color = volume.rgb + sceneLighting(.2);

    gl_FragColor = vec4(color,1);
}
