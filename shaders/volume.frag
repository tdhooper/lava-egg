precision mediump float;

uniform sampler2D backfaceDistances;
uniform vec2 resolution;
uniform float time;
uniform vec3 cameraPosition;
uniform mat4 modelInverse;
uniform sampler2D iChannel0;
uniform vec4 volumeId;
uniform float volumeScale;
uniform vec3 volumeOffset;
uniform float dotScale;
uniform float instanceIndex;
uniform float brightness;
varying vec3 vPosition;
varying vec3 vNormal;
varying float depth;

#pragma glslify: lambert = require(glsl-diffuse-lambert)
#pragma glslify: phong = require(glsl-specular-gaussian)
#pragma glslify: volumeRay = require(./lib/volume-ray.glsl)
#pragma glslify: renderVolume = require(./lib/render-volume.glsl, iChannel0=iChannel0, time=time, dotScale=dotScale, brightness=brightness)

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
        volumeScale,
        offset
    );
    // volume *= 5.;
    volume = min(volume, vec4(1));

    vec3 normal = normalize(vNormal);

    vec3 lightPosition = vec3(-1, 1, .25)* 10.;
    vec3 lightDirection = normalize(lightPosition - vPosition);
    vec3 eyeDirection = normalize(cameraPosition - vPosition);

    float diffuse = lambert(lightDirection, normal);
    float specular = phong(lightDirection, eyeDirection, normal, .2);

    vec3 light = vec3(.6, .5, 1) * .3;
    vec3 color = volume.rgb + light * (diffuse + specular);

    gl_FragColor = vec4(color,1);
}
