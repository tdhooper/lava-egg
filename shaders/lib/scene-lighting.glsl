#pragma glslify: calcLight = require(./calc-light.glsl, vNormal=vNormal, cameraPosition=cameraPosition, vPosition=vPosition)


vec3 sceneLighting(float spec) {
    vec3 light = calcLight(
        vec3(-1, 1, .25) * 10.,
        vec3(.6, .5, 1) * .3,
        spec
    );

    light += calcLight(
        vec3(-1, 1, .25) * -20.,
        vec3(.0, .5, 1.) * .2,
        spec
    );

    return light;
}

#pragma glslify: export(sceneLighting)
