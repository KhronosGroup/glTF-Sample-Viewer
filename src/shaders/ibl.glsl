
vec3 getIBLRadianceGGX(vec3 n, vec3 v, float perceptualRoughness, vec3 specularColor)
{
    float NdotV = clampedDot(n, v);
    float lod = clamp(perceptualRoughness * float(u_MipCount), 0.0, float(u_MipCount));
    vec3 reflection = normalize(reflect(-v, n));

    vec2 brdfSamplePoint = clamp(vec2(NdotV, perceptualRoughness), vec2(0.0, 0.0), vec2(1.0, 1.0));
    vec2 brdf = texture(u_GGXLUT, brdfSamplePoint).rg;
    vec4 specularSample = textureLod(u_GGXEnvSampler, reflection, lod);

    vec3 specularLight = specularSample.rgb;

#ifndef USE_HDR
    specularLight = sRGBToLinear(specularLight);
#endif

   return specularLight * (specularColor * brdf.x + brdf.y);
}

vec3 getIBLRadianceTransmission(vec3 n, vec3 v, float perceptualRoughness, float ior, vec3 baseColor)
{
    // Sample GGX LUT.
    float NdotV = clampedDot(n, v);
    vec2 brdfSamplePoint = clamp(vec2(NdotV, perceptualRoughness), vec2(0.0, 0.0), vec2(1.0, 1.0));
    vec2 brdf = texture(u_GGXLUT, brdfSamplePoint).rg;

    // Sample GGX environment map.
    float lod = clamp(perceptualRoughness * float(u_MipCount), 0.0, float(u_MipCount));

    // Approximate double refraction by assuming a solid sphere beneath the point.
    vec3 r = refract(-v, n, 1.0 / ior);
    vec3 m = 2.0 * dot(-n, r) * r + n;
    vec3 rr = -refract(-r, m, ior);

    vec4 specularSample = textureLod(u_GGXEnvSampler, rr, lod);
    vec3 specularLight = specularSample.rgb;

#ifndef USE_HDR
    specularLight = sRGBToLinear(specularLight);
#endif

   return specularLight * (brdf.x + brdf.y);
}

vec3 getIBLRadianceLambertian(vec3 n, vec3 diffuseColor)
{
    vec3 diffuseLight = texture(u_LambertianEnvSampler, n).rgb;

    #ifndef USE_HDR
        diffuseLight = sRGBToLinear(diffuseLight);
    #endif

    return diffuseLight * diffuseColor;
}

vec3 getIBLRadianceCharlie(vec3 n, vec3 v, float sheenRoughness, vec3 sheenColor, float sheenIntensity)
{
    float NdotV = clampedDot(n, v);
    float lod = clamp(sheenRoughness * float(u_MipCount), 0.0, float(u_MipCount));
    vec3 reflection = normalize(reflect(-v, n));

    vec2 brdfSamplePoint = clamp(vec2(NdotV, sheenRoughness), vec2(0.0, 0.0), vec2(1.0, 1.0));
    float brdf = texture(u_CharlieLUT, brdfSamplePoint).b;
    vec4 sheenSample = textureLod(u_CharlieEnvSampler, reflection, lod);

    vec3 sheenLight = sheenSample.rgb;

    #ifndef USE_HDR
    sheenLight = sRGBToLinear(sheenLight);
    #endif

    return sheenIntensity * sheenLight * sheenColor * brdf;
}

vec3 getIBLRadianceSubsurface(vec3 n, vec3 v, float scale, float distortion, float power, vec3 color, float thickness)
{
    vec3 diffuseLight = texture(u_LambertianEnvSampler, n).rgb;

    #ifndef USE_HDR
        diffuseLight = sRGBToLinear(diffuseLight);
    #endif

    return diffuseLight * getPunctualRadianceSubsurface(n, v, -v, scale, distortion, power, color, thickness);
}
