#pragma glslify: lambert = require(glsl-diffuse-lambert)
#pragma glslify: phong = require(glsl-specular-gaussian)


vec3 calcLight(vec3 pos, vec3 col, float spec) {
    vec3 normal = normalize(vNormal);

    vec3 lightDirection = normalize(pos - vPosition);
    vec3 eyeDirection = normalize(cameraPosition - vPosition);

    float diffuse = lambert(lightDirection, normal);
    float specular = phong(lightDirection, eyeDirection, normal, spec);

    return col * (diffuse + specular) / (length(pos - vPosition) * .05);
}

#pragma glslify: export(calcLight)
