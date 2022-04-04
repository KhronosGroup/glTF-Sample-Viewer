// KHR_displaymapping_pq

vec3 BRDF_SCALE(vec3 color) {
  float factor = min(1.0, (10000.0 / max(color.r, max(color.g, color.b))));
  return factor * color;
}

// Reference PQ OETF of ITU BT.2100: https://www.itu.int/rec/R-REC-BT.2100/en
vec3 BT_2100_OETF(vec3 color) 
{
    float m1 = 2610.0/16384.0;
    float m2 = 2523.0/4096.0 * 128.0;
    float c1 = 3424.0/4096.0;
    float c2 = 2413.0/4096.0 * 32.0;
    float c3 = 2392.0/4096.0 * 32.0;

    vec3 Ypow = pow(color / 10000.0, vec3(m1));
    return pow((c1 + c2 * Ypow) / (1.0 + c3 * Ypow), vec3(m2)); 
}


// Called by pbr.fraq
vec3 displaymapping(vec3 brdfColor) 
{   
    vec3 displayColor = BRDF_SCALE(brdfColor);
    vec3 outputColor = BT_2100_OETF(displayColor);
    return outputColor;
}