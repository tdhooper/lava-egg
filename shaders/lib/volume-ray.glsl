
void volumeRay(
    in mat4 modelInverse,
    in vec3 position,
    in vec3 cameraPosition,
    in float backfaceDistance,
    out vec3 rayOrigin,
    out vec3 rayDirection,
    out float maxDistance
) {
    rayOrigin = position;
    rayDirection = normalize(position - cameraPosition);

    rayOrigin = (modelInverse * vec4(rayOrigin, 1)).xyz;
    rayDirection = (modelInverse * vec4(rayDirection, 1)).xyz;

    maxDistance = backfaceDistance - length(position - cameraPosition);
}

#pragma glslify: export(volumeRay)
