
void volumeRay(
    in vec3 position,
    in vec3 cameraPosition,
    in float backfaceDistance,
    out vec3 rayOrigin,
    out vec3 rayDirection,
    out float maxDistance
) {
    rayOrigin = position;
    rayDirection = normalize(position - cameraPosition);
    maxDistance = backfaceDistance - length(position - cameraPosition);
}

#pragma glslify: export(volumeRay)
