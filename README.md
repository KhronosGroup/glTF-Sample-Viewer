glTF 2.0 Reference Viewer
=========================

[![](assets/images/BoomBox.jpg)](http://gltf.ux3d.io/)

This is the offical [Khronos](https://www.khronos.org/) [glTF 2.0](https://www.khronos.org/gltf/) reference viewer using [WebGL](https://www.khronos.org/webgl/).


**Table of Contents**

- [Viewer](#viewer)
  - [Usage](#usage)
  - [Setup](#setup)
  - [Debugging](#debugging)
- [Physically-Based Materials in glTF 2.0](#physically-based-materials-in-gltf-20)
- [Appendix](#appendix)
  - [Specular Term](#specular-term)
    - [Surface Reflection Ratio (F)](#surface-reflection-ratio-f)
    - [Geometric Occlusion (G)](#geometric-occlusion-g)
    - [Microfaced Distribution (D)](#microfaced-distribution-d)
  - [Diffuse Term](#diffuse-term)
- [Features](#features)


Viewer
======

Usage
-----

If you would like to see this in action, [view the live demo](http://gltf.ux3d.io/).

**Controls**

`click + drag` : Rotate model

`scroll` : Zoom camera

`GUI` : Use to change models and settings

**Change glTF model**

* Choose one of the glTF models in the selction list

or

* Drag and drop glTF files into viewer

**Offline / Headless Rendering**

**NOTE:** The dimensions of the rendered image are limited by the (virtual) desktop size.

Requirements
  * [NodeJS](https://nodejs.org)
  * [Electron](https://electronjs.org/) (Installed automatically)

Configure environment
- ``npm install`` (also installs Electron)
- ``npm run build`` (“compile” the code)

Run
- ``npm run start-offscreen -- -- -h`` for a list of available options

Example
- ``npm run start-offscreen -- -- assets\models\2.0\FlightHelmet\glTF\FlightHelmet.gltf``

After execution, the screenshot is stored as ``output.png`` on the file system.

Setup
-----

For local usage and debugging, please follow these instructions:

**(1)** Checkout the [`reference-viewer`](../../tree/reference-viewer) branch

**(2)** Install dependencies with `npm install`

**(3)** Pull the submodules for the required [glTF sample models](https://github.com/KhronosGroup/glTF-Sample-Models) and [environments](https://github.com/ux3d/Sample-Environments) `git submodule update  --init --recursive`

**(4a)** Start a demo in the browser with `npm run dev`, and open http://localhost:8000.

**(4b)** Start a demo in Electron with `npm run dev:electron`.

When making changes, the project is automatically rebuilt and the `dist/` folder
is updated. Files in the `dist/` folder should not be included in pull
requests — they will be updated by project maintainers with each new release.

Debugging
---------

* Requirements
  * [Visual Studio Code](https://code.visualstudio.com/)
  * [Mozilla Firefox](https://www.mozilla.org/en-US/firefox/new/)
* Install the [Debugger for Firefox](https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-firefox-debug) extension for Visual Studio Code
* Open the project folder in Visual Studio Code and select `Debug->Add Configuration->Firefox` so the `.vscode/launch.json` file is created.
* `Debug->Start Debugging` should now launch a Firefox window with the reference viewer and VS Code breakpoints should be hit.

**VS Code**

Modified VSCode gltf-vscode plugin:

[gltf-vscode](https://github.com/ux3d/gltf-vscode/tree/features/khronosRV-setup)


Physically-Based Materials in glTF 2.0
======================================

With the change from glTF 1.0 to glTF 2.0, one of the largest changes included core support for materials that could be used for physically-based shading. Part of this process involved chosing technically accurate, yet user-friendly, parameters for which developers and artists could use intuitively. This resulted in the introduction of the **Metallic-Roughness Material** to glTF. If you would like to read more about glTF, you can find the content at its [GitHub page](https://github.com/KhronosGroup/glTF).

A good reference about Physically-Based Materials and its workflow can be found on the [THE PBR GUIDE - PART 1](https://academy.allegorithmic.com/courses/the-pbr-guide-part-1) and [THE PBR GUIDE - PART 2](https://academy.allegorithmic.com/courses/the-pbr-guide-part-2) from [allegorithmic](https://www.allegorithmic.com).

For implementation details and further theory, please find more information in the [Real Shading in Unreal Engine 4](https://blog.selfshadow.com/publications/s2013-shading-course/) presentation from the SIGGRAPH 2013 course.


Appendix
========

The core lighting equation this sample uses is the Schlick BRDF model from [An Inexpensive BRDF Model for Physically-based Rendering](https://www.cs.virginia.edu/~jdl/bib/appearance/analytic%20models/schlick94b.pdf)

```
vec3 specularContribution = F * G * D / (4.0 * NdotL * NdotV);
vec3 diffuseContribution = (1.0 - F) * diffuse;
```

Below here you'll find the recommended implementations for the various terms found in the lighting equation.

## Specular Term

### Surface Reflection Ratio (F)

**Fresnel Schlick**
Simplified implementation of fresnel from [An Inexpensive BRDF Model for Physically based Rendering](https://www.cs.virginia.edu/~jdl/bib/appearance/analytic%20models/schlick94b.pdf) by Christophe Schlick.

```
vec3 specularReflection(MaterialInfo materialInfo, AngularInfo angularInfo)
{
    return materialInfo.reflectance0 + (materialInfo.reflectance90 - materialInfo.reflectance0) * pow(clamp(1.0 - angularInfo.VdotH, 0.0, 1.0), 5.0);
}
```

Please note, that the above shader code includes the optimization for "turning off" the Fresnel edge brithening (see "Real-Time Rendering" Fourth Edition on page 325).

### Geometric Occlusion (G)

**Smith GGX**
The following implementation is from "Geometrical Occlusion of a Random Rough Surface" by Bruce G. Smith

```
float geometricOcclusion(MaterialInfo materialInfo, AngularInfo angularInfo)
{
    float NdotL = angularInfo.NdotL;
    float NdotV = angularInfo.NdotV;
    float r = materialInfo.alphaRoughness;

    float attenuationL = 2.0 * NdotL / (NdotL + sqrt((NdotL * NdotL) + r * r * (1.0 - (NdotL * NdotL))));
    float attenuationV = 2.0 * NdotV / (NdotV + sqrt((NdotV * NdotV) + r * r * (1.0 - (NdotV * NdotV))));

    return attenuationL * attenuationV;
}
```

### Microfaced Distribution (D)

**Trowbridge-Reitz GGX**
Implementation of microfaced distrubtion from [Average Irregularity Representation of a Roughened Surface for Ray Reflection](https://www.osapublishing.org/josa/abstract.cfm?uri=josa-65-5-531) by T. S. Trowbridge, and K. P. Reitz

```
float microfacetDistribution(MaterialInfo materialInfo, AngularInfo angularInfo)
{
    float roughnessSq = materialInfo.alphaRoughness * materialInfo.alphaRoughness;
    float f = (angularInfo.NdotH * roughnessSq - angularInfo.NdotH) * angularInfo.NdotH + 1.0;
    return roughnessSq / (M_PI * f * f);
}
```

## Diffuse Term
The following equation is the used model of the diffuse term of the lighting equation.

**Lambert**
Implementation of diffuse from [Lambert's Photometria](https://archive.org/details/lambertsphotome00lambgoog) by Johann Heinrich Lambert.

```
vec3 diffuse(MaterialInfo materialInfo)
{
    return materialInfo.diffuseColor / M_PI;
}
```


Features
========

- [x] glTF 2.0
- [x] KHR_lights_punctual extension
- [x] KHR_materials_pbrSpecularGlossiness
- [x] KHR_materials_unlit extension
- [x] KHR_texture_transform extension
