// lightIn = max(max(light.r, light.g), light.b)
uniform float u_MaxSceneIntensity;  // Measured in the scene

const float maxComponent = 10000.0;


vec3 aperture(float lightIn, vec3 colorIn) 
{
	float value = min(lightIn, maxComponent); 
	float factor = value / lightIn;
	return colorIn * factor;
}	

vec3 BT_2100_OOTF(vec3 color, float rangeExponent, float gamma) 
{  
    vec3 nonlinear;
    if (all(lessThanEqual(color, vec3(0.0003024f)))) 
    {  
        nonlinear = 267.84 * color;  
    }
    else 
    {  
        nonlinear = 1.099 * pow(rangeExponent * color, vec3(0.45)) - 0.099;  
    }  
    return 100.0 * pow(nonlinear, vec3(gamma));
}  


vec3 OOTF(vec3 apertureAjustedColor)
{

    bool framebufferFormatIsSRGB = false;
    bool displayIsSDR = true;

    vec3 color;
    float rangeExponent;

    if(displayIsSDR)
    {
        rangeExponent = 46.42; // SDR Display   
    }
    else
    {
        rangeExponent = 59.5208; // HDR Display
    }

    //If framebuffer uses sRGB transfer function the gamma does not need to be applied here
    if (framebufferFormatIsSRGB) 
    {
        color = BT_2100_OOTF(apertureAjustedColor, rangeExponent, 1.0);
    } 
    else 
    {
        color = BT_2100_OOTF(apertureAjustedColor, rangeExponent, 2.4);
    }
    return color;
}


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
    float lightIn = u_MaxSceneIntensity;
    vec3 apertureAdjustedColor = aperture(lightIn, colorScaled);
    vec3 ootf = OOTF(apertureAdjustedColor);
    vec3 oetf = BT_2100_OETF(ootf);
    return oetf;
}