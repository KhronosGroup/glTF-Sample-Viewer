// KHR_displaymapping_pq

uniform float u_ApertureFactor;  // Calculated by using max light intensity value of the scene

const float maxComponent = 10000.0;
const bool displayIsSDR = true;

// Reference PQ OOTF of ITU BT.2100: https://www.itu.int/rec/R-REC-BT.2100/en
vec3 BT_2100_OOTF(vec3 color, float rangeExponent, float gamma) 
{  
    vec3 nonlinear = 1.099 * pow(rangeExponent * color, vec3(0.45)) - 0.099;  
    return 100.0 * pow(nonlinear, vec3(gamma));
}  


vec3 OOTF(vec3 apertureAjustedColor)
{
    float rangeExponent;

    if(displayIsSDR)
    {
        rangeExponent = 46.42; // SDR Display   
    }
    else
    {
        rangeExponent = 59.5208; // HDR Display
    }

    return BT_2100_OOTF(apertureAjustedColor, rangeExponent, 2.4);
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
vec3 displaymapping(vec3 color) 
{   
    vec3 colorScaled = color / maxComponent; // 10000 cd/m2 is used as maximum output brightness
    vec3 apertureAdjustedColor = colorScaled * u_ApertureFactor;
    vec3 tonemapped = toneMapLinear(apertureAdjustedColor);
    vec3 ootf = OOTF(tonemapped);
    vec3 oetf = BT_2100_OETF(ootf);
    return oetf;
}