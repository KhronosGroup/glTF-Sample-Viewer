// lightIn = max(max(light.r, light.g), light.b)
float u_MaxSceneIntensity = 10000.0;  // Measured in the scene

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
    if (any(lessThanEqual (color ,vec3(0.0003024f)))) 
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

    bool framebufferFormatIsSRGB = true;
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
        color = BT_2100_OOTF(apertureAjustedColor, rangeExponent, GAMMA);
    }
    return color;
}

// Called by pbr.fraq
vec3 displaymapping(vec3 color) 
{   
    float lightIn=u_MaxSceneIntensity;
    vec3 apertureAdjustedColor = aperture(lightIn, color);
    vec3 ootf = OOTF(apertureAdjustedColor);

    return ootf;
}