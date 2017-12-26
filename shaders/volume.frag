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
varying vec3 vPosition;
varying vec3 vNormal;

#pragma glslify: volumeRay = require(./lib/volume-ray.glsl)
#pragma glslify: renderVolume = require(./lib/render-volume.glsl, iChannel0=iChannel0, time=time, dotScale=dotScale)

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

    vec3 offset = volumeOffset + vec3(0, instanceIndex * 100., 0);

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



    vec3 lightPosition = vec3(-1, 1, .25);
    float diffuse = max(0., dot(vNormal, lightPosition));

    vec3 albedo = vec3(.5,0,.5);
    vec3 lightCol = vec3(.6,1,1);
    albedo += lightCol * diffuse;

    vec4 color = volume;
    color = mix(volume, vec4(lightCol, 1), diffuse * .5);

    // color = mix(color, albedo, .5) + color;
    // color = albedo;

    // color = vNormal * .5 + .5;
    // color = min(color, vec3(1));

    // gl_FragColor = vec4(color.rgb, 1.);
    gl_FragColor = color;

    // gl_FragColor = vec4(vec3(maxDist / 2.), 1);
}
