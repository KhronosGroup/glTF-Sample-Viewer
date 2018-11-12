Physically-Based Rendering in glTF 2.0 using WebGL
==================================================

[![](images/BoomBox.JPG)](http://github.khronos.org/glTF-WebGL-PBR/)

This is a raw WebGL demo application for the introduction of physically-based materials to the core glTF 2.0 spec. This project is meant to be a barebones reference for developers looking to explore the widespread and robust capabilities of these materials within a WebGL project that isn't tied to any external graphics libraries. For a DirectX sample please head over to [this repo](https://github.com/Microsoft/glTF-DXViewer) instead.

If you would like to see this in action, [view the live demo](http://github.khronos.org/glTF-WebGL-PBR/).

> **Controls**
>
> `click + drag` : Rotate model
>
> `scroll` : Zoom camera
>
> `GUI` : Use to change models

Physically-Based Materials in glTF 2.0
--------------------------------------

With the change from glTF 1.0 to glTF 2.0, one of the largest changes included core support for materials that could be used for physically-based shading. Part of this process involved choosing technically accurate, yet user-friendly, parameters for which developers and artists could use intuitively. This resulted in the introduction of the **Metallic-Roughness Material** to glTF. If you would like to read more about glTF, you can find the content at its [GitHub page](https://github.com/KhronosGroup/glTF), but I will take a bit of time to explain how this new material works.

A surface using the Metallic-Roughness material is governed by three parameters:
* `baseColor` - The inherent color attribute of a surface
* `metallic` -  A float describing how metallic the surface is
* `roughness` - A float describing how rough the surface is

These parameters can be provided to the material in two ways. Either the parameters can be given constant values, which would dictate the shading of an entire mesh uniformly, or textures can be provided that map varying values over a mesh. In this project, all of the glTF files followed the latter case. It is important to note here that although `metallic` and `roughness` are separate parameters, they are provided as a single texture in which the `metallic` values are in the blue channel and the `roughness` values are in the green channel to save on space.

**Base Color of a Boombox**

<img src="models/BoomBox/glTF/BoomBox_baseColor.png" width="300" height="300"/> -> <img src="images/BoomBox-baseColor.JPG" width="300" height="300"/>

**Metallic-Roughness of a Boombox**

<img src="models/BoomBox/glTF/BoomBox_occlusionRoughnessMetallic.png" width="300" height="300"/> -> <img src="images/BoomBox-metallicRoughness.JPG" width="300" height="300"/>

Although these are the core parameters of the Metallic-Roughness material, often a user will want to provide additional maps for features such as normals, ambient occlusion, or emissiveness. Similarly to above, these are usually provided as a texture that corresponds to the parts of the mesh that have shifted normals, are occluded and/or are emissive, respectively. However, since these are not a part of the Metallic-Roughness material itself, they are provided as a separate portion to the material.

The overall structure of a material would then look something like this in glTF 2.0:

```
"materials": [
  {
    "pbrMetallicRoughness": {
      "baseColorTexture": {...},
      "metallicRoughnessTexture": {...}
    },
    "normalTexture": {...},
    "occlusionTexture": {...},
    "anyOtherAttribute": {...},
    "name": "myMetallicRoughnessMaterial"
  }
]
```

Using Metallic-Roughness to Shade
----------------------------------

Once we have read in these values and passed them into the fragment shader correctly, we need to compute the final color of each fragment. Without going too far into the theory behind PBR, this is how this demo application computes the color.

It is first important to choose a microfacet model to describe how light interacts with a surface. In this project, I use the [Cook-Torrance Model](https://web.archive.org/web/20160826022208/https://renderman.pixar.com/view/cook-torrance-shader) to compute lighting. However, there is a large difference between doing this based on lights within a scene versus an environment map. With discrete lights, we could just evaluate the BRDF with respect to each light and average the results to obtain the overall color, but this is not ideal if you want a scene to have complex lighting that comes from many sources.

### Environment Maps

This is where environment maps come in! Environment maps can be thought of as a light source that surrounds the entire scene (usually as an encompassing cube or sphere) and contributes to the lighting based on the color and brightness across the entire image. As you might guess, it is extremely inefficient to assess the light contribution to a single point on a surface from every visible point on the environment map. In offline applications, we would typically resort to using importance sampling within the render and just choose a predefined number of samples. However, as described in [Unreal Engine's course notes on real-time PBR](http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf), we can reduce this to a single texture lookup by baking the diffuse and specular irradiance contributions of the environment map into textures. You could do this yourself as described in the course notes, but there is also a resource called [IBL Baker](http://www.derkreature.com/iblbaker/) that will create these textures for you. The diffuse irradiance can be stored in a cube map, however, we expect the sharpness of specular reflection to diminish as the roughness of the object increases. Because of this, the different amounts of specular irradiance can be stored in the mip levels of the specular cube map and accessed in the fragment shader based on roughness.

**Diffuse Front Face**

![](textures/papermill/diffuse/diffuse_front_0.jpg)

**Specular Front Face**

![](textures/papermill/specular/specular_front_0.jpg) ![](textures/papermill/specular/specular_front_1.jpg) ![](textures/papermill/specular/specular_front_2.jpg) ![](textures/papermill/specular/specular_front_3.jpg) ![](textures/papermill/specular/specular_front_4.jpg) ![](textures/papermill/specular/specular_front_5.jpg) ![](textures/papermill/specular/specular_front_6.jpg) ![](textures/papermill/specular/specular_front_7.jpg) ![](textures/papermill/specular/specular_front_8.jpg) ![](textures/papermill/specular/specular_front_9.jpg)

### BRDF

At this point, we can pick out the diffuse and specular incoming light from our environment map, but we still need to evaluate the BRDF at this point. Instead of doing this computation explicitly, we use a BRDF lookup table to find the BRDF value based on roughness and the viewing angle. It is important to note that this lookup table changes depending on which microfacet model we use! Since this project uses the Cook-Torrance model, we use the following texture in which the y-axis corresponds to the roughness and the x-axis corresponds to the dot product between the surface normal and viewing vector.

![](textures/brdfLUT.png)

### Diffuse and Specular Color

We now have the diffuse and specular incoming light and the BRDF, but we need to use all the information we have gathered thus far to actually compute the lighting. Here is where the `metallic` and `baseColor` values come into play. Although the `baseColor` dictates the inherent color of a point on a surface, the `metallic` value tells us how much of the `baseColor` is represented in the final color as diffuse versus specular. For the diffuse color, we do this by interpolating between black and the base color based on the `metallic` value such that the diffuse color is closer to black the more metallic it is. Conversely, for the specular color, we interpolate such that the surface holds more of the `baseColor` the more metallic it is.

### Final Color

Finally, we can compute the final color by summing the contributions of diffuse and specular components the color in the following manner:

`finalColor = (diffuseLight * diffuseColor) + (specularLight * (specularColor * brdf.x + brdf.y))`

Appendix
------------

The core lighting equation this sample uses is the Schlick BRDF model from [An Inexpensive BRDF Model for Physically-based Rendering](https://www.cs.virginia.edu/~jdl/bib/appearance/analytic%20models/schlick94b.pdf)

```
vec3 specContrib = F * G * D / (4.0 * NdotL * NdotV);
vec3 diffuseContrib = (1.0 - F) * diffuse;
```

If you're familiar with implementing the phong model, you may think that the diffuse and specular contributions simply need to be summed up to obtain the final lighting. However, in the context of a BRDF, the diffuse and specular components are not accounting for the *energy* of the incident light, which can cause some confusion.
Using a BRDF, the diffuse and specular parts describe the *bidirectional reflectance*, which we have to scale by the *energy* received from the light in order to obtain the final intensity that reaches the eye of the viewer (as outlined in the respective [paper by Cook and Torrance](http://graphics.pixar.com/library/ReflectanceModel/).
According to the basic cosine law (as described by [Lambert](https://archive.org/details/lambertsphotome00lambgoog)), the energy is computed using the dot product between the light's direction and the surface normal. Therefore, the final intensity that will be used for shading is computed as follows:
```
vec3 color = NdotL * u_LightColor * (diffuseContrib + specContrib);
```

Below here you'll find common implementations for the various terms found in the lighting equation.
These functions may be swapped into pbr-frag.glsl to tune your desired rendering performance and presentation.

### Surface Reflection Ratio (F)

**Fresnel Schlick**
Simplified implementation of fresnel from [An Inexpensive BRDF Model for Physically based Rendering](https://www.cs.virginia.edu/~jdl/bib/appearance/analytic%20models/schlick94b.pdf) by Christophe Schlick.

```
vec3 specularReflection(PBRInfo pbrInputs)
{
    return pbrInputs.metalness + (vec3(1.0) - pbrInputs.metalness) * pow(1.0 - pbrInputs.VdotH, 5.0);
}
```

### Geometric Occlusion (G)

**Cook Torrance**
Implementation from [A Reflectance Model for Computer Graphics](http://graphics.pixar.com/library/ReflectanceModel/) by Robert Cook and Kenneth Torrance,

```
float geometricOcclusion(PBRInfo pbrInputs)
{
    return min(min(2.0 * pbrInputs.NdotV * pbrInputs.NdotH / pbrInputs.VdotH, 2.0 * pbrInputs.NdotL * pbrInputs.NdotH / pbrInputs.VdotH), 1.0);
}
```

**Schlick**
Implementation of microfacet occlusion from [An Inexpensive BRDF Model for Physically based Rendering](https://www.cs.virginia.edu/~jdl/bib/appearance/analytic%20models/schlick94b.pdf) by Christophe Schlick.

```
float geometricOcclusion(PBRInfo pbrInputs)
{
    float k = pbrInputs.perceptualRoughness * 0.79788; // 0.79788 = sqrt(2.0/3.1415); perceptualRoughness = sqrt(alphaRoughness);
    // alternately, k can be defined with
    // float k = (pbrInputs.perceptualRoughness + 1) * (pbrInputs.perceptualRoughness + 1) / 8;

    float l = pbrInputs.LdotH / (pbrInputs.LdotH * (1.0 - k) + k);
    float n = pbrInputs.NdotH / (pbrInputs.NdotH * (1.0 - k) + k);
    return l * n;
}
```

**Smith**
The following implementation is from "Geometrical Shadowing of a Random Rough Surface" by Bruce G. Smith

```
float geometricOcclusion(PBRInfo pbrInputs)
{
  float NdotL2 = pbrInputs.NdotL * pbrInputs.NdotL;
  float NdotV2 = pbrInputs.NdotV * pbrInputs.NdotV;
  float v = ( -1.0 + sqrt ( pbrInputs.alphaRoughness * (1.0 - NdotL2 ) / NdotL2 + 1.)) * 0.5;
  float l = ( -1.0 + sqrt ( pbrInputs.alphaRoughness * (1.0 - NdotV2 ) / NdotV2 + 1.)) * 0.5;
  return (1.0 / max((1.0 + v + l ), 0.000001));
}
```

### Microfaced Distribution (D)

**Trowbridge-Reitz**
Implementation of microfaced distrubtion from [Average Irregularity Representation of a Roughened Surface for Ray Reflection](https://www.osapublishing.org/josa/abstract.cfm?uri=josa-65-5-531) by T. S. Trowbridge, and K. P. Reitz

```
float microfacetDistribution(PBRInfo pbrInputs)
{
    float roughnessSq = pbrInputs.alphaRoughness * pbrInputs.alphaRoughness;
    float f = (pbrInputs.NdotH * roughnessSq - pbrInputs.NdotH) * pbrInputs.NdotH + 1.0;
    return roughnessSq / (M_PI * f * f);
}
```

### Diffuse Term
The following equations are commonly used models of the diffuse term of the lighting equation.

**Lambert**
Implementation of diffuse from [Lambert's Photometria](https://archive.org/details/lambertsphotome00lambgoog) by Johann Heinrich Lambert

```
vec3 diffuse(PBRInfo pbrInputs)
{
    return pbrInputs.diffuseColor / M_PI;
}
```

**Disney**
Implementation of diffuse from [Physically-Based Shading at Disney](http://blog.selfshadow.com/publications/s2012-shading-course/burley/s2012_pbs_disney_brdf_notes_v3.pdf) by Brent Burley.  See Section 5.3.

```
vec3 diffuse(PBRInfo pbrInputs)
{
    float f90 = 2.0 * pbrInputs.LdotH * pbrInputs.LdotH * pbrInputs.alphaRoughness - 0.5;

    return (pbrInputs.diffuseColor / M_PI) * (1.0 + f90 * pow((1.0 - pbrInputs.NdotL), 5.0)) * (1.0 + f90 * pow((1.0 - pbrInputs.NdotV), 5.0));
}
```
