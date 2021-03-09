vec3 getDiffuseLight(vec3 n)
{
    return texture(u_LambertianEnvSampler, u_envRotation * n).rgb;
}

vec4 getSpecularSample(vec3 reflection, float lod)
{
    return textureLod(u_GGXEnvSampler, u_envRotation * reflection, lod);
}

vec4 getSheenSample(vec3 reflection, float lod)
{
    return textureLod(u_CharlieEnvSampler, u_envRotation * reflection, lod);
}

vec3 getIBLRadianceGGX(vec3 n, vec3 v, float perceptualRoughness, vec3 specularColor)
{
    float NdotV = clampedDot(n, v);
    float lod = clamp(perceptualRoughness * float(u_MipCount), 0.0, float(u_MipCount));
    vec3 reflection = normalize(reflect(-v, n));

    vec2 brdfSamplePoint = clamp(vec2(NdotV, perceptualRoughness), vec2(0.0, 0.0), vec2(1.0, 1.0));
    vec2 brdf = texture(u_GGXLUT, brdfSamplePoint).rg;
    vec4 specularSample = getSpecularSample(reflection, lod);

    vec3 specularLight = specularSample.rgb;

   return specularLight * (specularColor * brdf.x + brdf.y);
}

vec3 getTransmissionSample(vec2 fragCoord, float perceptualRoughness)
{
    float framebufferLod = log2(float(u_TransmissionFramebufferSize.x)) * perceptualRoughness;

    vec3 transmittedLight = textureLod(u_TransmissionFramebufferSampler, fragCoord.xy, framebufferLod).rgb;

    transmittedLight = sRGBToLinear(transmittedLight);

    return transmittedLight;
}


vec3 getIBLRadianceTransmission(vec3 n, vec3 v, vec2 fragCoord, float perceptualRoughness, vec3 baseColor, vec3 f0, vec3 f90)
{

    // Sample GGX LUT.
    float NdotV = clampedDot(n, v);
    vec2 brdfSamplePoint = clamp(vec2(NdotV, perceptualRoughness), vec2(0.0, 0.0), vec2(1.0, 1.0));
    vec2 brdf = texture(u_GGXLUT, brdfSamplePoint).rg;
    vec3 specularColor = f0 * brdf.x + f90 * brdf.y;

    vec3 transmittedLight = getTransmissionSample(fragCoord.xy, perceptualRoughness);

    return (1.0-specularColor) * transmittedLight * baseColor;
}


vec3 getIBLVolumeRefraction(vec3 normal, vec3 viewDirectionW, float perceptualRoughness, vec3 baseColor, vec3 f0, vec3 f90,
    vec3 worldPos, mat4 modelMatrix, mat4 viewMatrix, mat4 projMatrix)
{
    float ior = 1.5;

    float thickness = 0.0; // default
    //thickness = 2000.0; // underground shelter
    thickness = 0.9; // mosquito in amber

    vec3 attenuationColor = vec3(0.9, 0.1, 0.1);
    float attenuationDistance = 1.0;

    vec3 modelScale;
    modelScale.x = length(vec3(modelMatrix[0].xyz));
    modelScale.y = length(vec3(modelMatrix[1].xyz));
    modelScale.z = length(vec3(modelMatrix[2].xyz));

    vec3 refractionVector = refract(-viewDirectionW, normalize(normal), 1.0 / ior);

    vec3 refractedRayExitW = worldPos + normalize(refractionVector) * thickness * modelScale;
    float transmissionDistance = thickness * length(modelScale);

    vec4 viewPos = viewMatrix * vec4(refractedRayExitW, 1.0);
    vec4 ndcPos = projMatrix * viewPos;

    vec2 refractionCoords = ndcPos.xy / ndcPos.z;
    refractionCoords += 1.0;
    refractionCoords /= 2.0;

    // Sample GGX LUT.
    float NdotV = clampedDot(normal, viewDirectionW);
    vec2 brdfSamplePoint = clamp(vec2(NdotV, perceptualRoughness), vec2(0.0, 0.0), vec2(1.0, 1.0));
    vec2 brdf = texture(u_GGXLUT, brdfSamplePoint).rg;   
    vec3 specularColor = f0 * brdf.x + f90 * brdf.y;

    vec3 transmittedLight = getTransmissionSample(refractionCoords, perceptualRoughness);

    vec3 attenuatedColor;
    if (attenuationDistance == 0.0)
    {
        attenuatedColor = transmittedLight;
    }
    else
    {
        vec3 attenuationCoefficient = -log(attenuationColor) / attenuationDistance;
        vec3 transmittance = exp(-attenuationCoefficient * transmissionDistance); // Beer's law
        attenuatedColor = transmittance * transmittedLight;
    }

    return (1.0 - specularColor) * attenuatedColor * baseColor;
}


vec3 getIBLRadianceLambertian(vec3 n, vec3 diffuseColor)
{
    vec3 diffuseLight = getDiffuseLight(n);
    return diffuseLight * diffuseColor;
}

vec3 getIBLRadianceCharlie(vec3 n, vec3 v, float sheenRoughness, vec3 sheenColor)
{
    float NdotV = clampedDot(n, v);
    float lod = clamp(sheenRoughness * float(u_MipCount), 0.0, float(u_MipCount));
    vec3 reflection = normalize(reflect(-v, n));

    vec2 brdfSamplePoint = clamp(vec2(NdotV, sheenRoughness), vec2(0.0, 0.0), vec2(1.0, 1.0));
    float brdf = texture(u_CharlieLUT, brdfSamplePoint).b;
    vec4 sheenSample = getSheenSample(reflection, lod);

    vec3 sheenLight = sheenSample.rgb;
    return sheenLight * sheenColor * brdf;
}
