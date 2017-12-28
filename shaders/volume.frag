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
    float diffuse = abs(dot(vNormal, lightPosition));
    diffuse = pow(diffuse, 2.) * .25;

    vec4 lightCol = vec4(.6, .5, 1, 1);

    vec4 color = volume;
    // color = mix(volume, vec4(lightCol, 1), diffuse * .5);
    color = pow(color + lightCol * diffuse, vec4(1. + diffuse));

    // color = mix(color, albedo, .5) + color;
    // color = albedo;

    // color = vNormal * .5 + .5;
    // color = min(color, vec3(1));

    color.rgb = mix(color.rgb, vec3(33./255.,9./255.,40./255.), depth);

    // gl_FragColor = vec4(vec3(), 1);

    // gl_FragColor = vec4(color.rgb, 1.);
    gl_FragColor = color;

    // gl_FragColor = vec4(vec3(maxDist / 2.), 1);
}
