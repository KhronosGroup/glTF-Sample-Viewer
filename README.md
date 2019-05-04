glTF 2.0 Sample Viewer
======================

[![](assets/images/BoomBox.jpg)](https://github.khronos.org/glTF-Sample-Viewer/)

This is the offical [Khronos](https://www.khronos.org/) [glTF 2.0](https://www.khronos.org/gltf/) sample viewer using [WebGL](https://www.khronos.org/webgl/): [glTF 2.0 Sample Viewer](https://github.khronos.org/glTF-Sample-Viewer/)


**Table of Contents**

- [Version](#version)
- [Credits](#credits)
- [Viewer](#viewer)
  - [Usage](#usage)
  - [Setup](#setup)
  - [Debugging](#debugging)
- [Physically-Based Materials in glTF 2.0](#physically-based-materials-in-gltf-20)
- [Appendix](#appendix)
  - [Specular Term](#specular-term)
    - [Microfaced Distribution (D)](#microfaced-distribution-d)
    - [Surface Reflection Ratio (F)](#surface-reflection-ratio-f)
    - [Geometric Occlusion (G)](#geometric-occlusion-g)
  - [Diffuse Term](#diffuse-term)
- [Features](#features)


Version
-------

Pre-Release

Credits
-------

Developed by [UX3D](https://www.ux3d.io/) and based on the former [glTF-WebGL-PBR](https://github.com/KhronosGroup/glTF-Sample-Viewer/tree/glTF-WebGL-PBR) project.

Viewer
======

Link to the live [glTF 2.0 Sample Viewer](https://github.khronos.org/glTF-Sample-Viewer/).

Usage
-----

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

**(1)** Checkout the [`master`](../../tree/master) branch

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
* `Debug->Start Debugging` should now launch a Firefox window with the sample viewer and VS Code breakpoints should be hit.


Physically-Based Materials in glTF 2.0
======================================

With the change from glTF 1.0 to glTF 2.0, one of the largest changes included core support for materials that could be used for physically-based shading. Part of this process involved chosing technically accurate, yet user-friendly, parameters for which developers and artists could use intuitively. This resulted in the introduction of the **Metallic-Roughness Material** to glTF. If you would like to read more about glTF, you can find the content at its [GitHub page](https://github.com/KhronosGroup/glTF).

A good reference about Physically-Based Materials and its workflow can be found on the [THE PBR GUIDE - PART 1](https://academy.allegorithmic.com/courses/the-pbr-guide-part-1) and [THE PBR GUIDE - PART 2](https://academy.allegorithmic.com/courses/the-pbr-guide-part-2) from [allegorithmic](https://www.allegorithmic.com).

For implementation details and further theory, please find more information in the [Real Shading in Unreal Engine 4](https://blog.selfshadow.com/publications/s2013-shading-course/) presentation from the SIGGRAPH 2013 course.


Appendix
========

For further reference, please read the [glTF 2.0: Appendix B: BRDF Implementation](https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#appendix-b-brdf-implementation)  
The following sections do summarize the important shader code.

```
vec3 specularContribution = D * Vis * F;
vec3 diffuseContribution = (1.0 - F) * diffuse; 
```

Please note: Vis = G / (4 * NdotL * NdotV)

## Specular Term

### Microfaced Distribution (D)

**Trowbridge-Reitz GGX**

```
float microfacetDistribution(MaterialInfo materialInfo, AngularInfo angularInfo)
{
    float alphaRoughnessSq = materialInfo.alphaRoughness * materialInfo.alphaRoughness;
    float f = (angularInfo.NdotH * alphaRoughnessSq - angularInfo.NdotH) * angularInfo.NdotH + 1.0;
    return alphaRoughnessSq / (M_PI * f * f);
}
```

### Surface Reflection Ratio (F)

**Fresnel Schlick**

```
vec3 specularReflection(MaterialInfo materialInfo, AngularInfo angularInfo)
{
    return materialInfo.reflectance0 + (materialInfo.reflectance90 - materialInfo.reflectance0) * pow(clamp(1.0 - angularInfo.VdotH, 0.0, 1.0), 5.0);
}
```

Please note, that the above shader code includes the optimization for "turning off" the Fresnel edge brightening (see "Real-Time Rendering" Fourth Edition on page 325).

### Geometric Occlusion (G)

**Smith Joint GGX**

```
float visibilityOcclusion(MaterialInfo materialInfo, AngularInfo angularInfo)
{
    float NdotL = angularInfo.NdotL;
    float NdotV = angularInfo.NdotV;
    float alphaRoughnessSq = materialInfo.alphaRoughness * materialInfo.alphaRoughness;

    float GGXV = NdotL * sqrt(NdotV * NdotV * (1.0 - alphaRoughnessSq) + alphaRoughnessSq);
    float GGXL = NdotV * sqrt(NdotL * NdotL * (1.0 - alphaRoughnessSq) + alphaRoughnessSq);

    return 0.5 / (GGXV + GGXL);
}
```

## Diffuse Term

**Lambert**

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
