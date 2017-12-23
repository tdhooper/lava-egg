
void volumeRay(
    in vec3 position,
    in vec3 cameraPosition,
    in float backfaceDistance,
    out vec3 rayOrigin,
    out vec3 rayDirection,
    out float maxDist
) {
    rayOrigin = position;
    rayDirection = normalize(position - cameraPosition);
    maxDist = backfaceDistance - length(position - cameraPosition);
}

#pragma glslify: export(volumeRay)
