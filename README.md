glTF Sample Viewer Web App
==============================

[![](../assets/images/BoomBox.jpg)](https://github.khronos.org/glTF-Sample-Viewer-Release/)

This is the official [Khronos glTF 2.0](https://www.khronos.org/gltf/) Sample Viewer using [WebGL 2.0](https://www.khronos.org/webgl/):


Viewer
======

Link to the live [glTF 2.0 Sample Viewer](https://github.khronos.org/glTF-Sample-Viewer-Release/).

Features
--------

### glTF
- [x] glTF 2.0
- [x] [KHR_animation_pointer](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_animation_pointer)
- [x] [KHR_draco_mesh_compression](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_draco_mesh_compression)
- [x] [KHR_lights_punctual](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_lights_punctual)
- [x] [KHR_materials_anisotropy](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_anisotropy)
- [x] [KHR_materials_clearcoat](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_clearcoat)
- [x] [KHR_materials_diffuse_transmission](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_diffuse_transmission/README.md)
- [x] [KHR_materials_dispersion](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_dispersion)
- [x] [KHR_materials_emissive_strength](https://github.com/KhronosGroup/glTF/tree/KHR_materials_emissive_strength/extensions/2.0/Khronos/KHR_materials_emissive_strength)
- [x] [KHR_materials_ior](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_ior)
- [x] [KHR_materials_iridescence](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_iridescence)
- [x] [KHR_materials_pbrSpecularGlossiness](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_pbrSpecularGlossiness)
- [x] [KHR_materials_sheen](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_sheen)
- [x] [KHR_materials_specular](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_specular)
- [x] [KHR_materials_transmission](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_transmission)
- [x] [KHR_materials_unlit](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_unlit)
- [x] [KHR_materials_variants](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_variants)
- [x] [KHR_materials_volume](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_volume)
- [x] [KHR_mesh_quantization](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_mesh_quantization)
- [x] [KHR_texture_basisu](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_texture_basisu)
- [x] [KHR_texture_transform](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_texture_transform)
- [x] [KHR_xmp_json_ld](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_xmp_json_ld)
- [x] [EXT_mesh_gpu_instancing](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Vendor/EXT_mesh_gpu_instancing)
- [x] [EXT_texture_webp](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Vendor/EXT_texture_webp)

### UI
- Select all [glTF-Sample-Assets](https://github.com/KhronosGroup/glTF-Sample-Assets) directly via UI
- Load your own glTF/glb and HDR files via drag and drop
- Customize lighting and tone mapping
- Check validation errors with the integrated [glTF-Validator](https://github.com/KhronosGroup/glTF-Validator)
- Select different material variants
- Enable/disable specific animations
- Enable/disable glTF features/extensions and view debug channels
- Download renderings and current camera properties
- Show statistics about the currently loaded file
- Specify URL parameters to modify behavior on load


Usage
-----

### Controls

`click + drag` : Rotate model

`shift + drag` \
`middle mouse button + drag` : Pan camera

`scroll` \
`right click + drag` : Zoom camera

`GUI` : Use to change models and settings

### Change glTF model

* Choose one of the glTF models in the selection list
* Drag and drop glTF files into viewer

### Change the environment map
* Drag and drop a .hdr panorama file

### URL parameters
URL parameters are added at the end of the sample viewer URL: \
`?key=value&another_key=another_value`

Possible parameters:
- `model=URL_to_file`: Load glTF/glb from specified URL
- `noUI`: Disable UI 
- `yaw=90`: Orbit the camera around the model along the Y-axis in degrees. With 90 degrees you look at the model from the left side.
- `pitch=90`: Orbit the camera around the model along the X-axis in degrees. With 90 degrees you look at the model from the top. Value range: -90 to 90
- `distance=5`: The models gets smaller with positive and bigger with negative numbers. Relative to the initial camera position.

Setup
-----

For local usage and debugging, please follow these instructions:

1. Checkout the [`main`](../../tree/main) branch

2. Pull the submodule for the required [glTF-Sample-Renderer](https://github.com/KhronosGroup/glTF-Sample-Renderer)  `git submodule update  --init --recursive`

3. Build the web app
	- run `npm install`
	- start a demo in the browser with `npm run dev`, and open http://localhost:8000.

When making changes, the project is automatically rebuilt and the `./dist` directory is populated with the web app. This directory contains all files necessary for deployment to a webserver.

Debugging
---------

* Requirements
  * [Visual Studio Code](https://code.visualstudio.com/) or [vscodium](https://github.com/VSCodium/vscodium)
  * [Chrome](https://www.google.com/chrome/) or [Firefox](https://www.mozilla.org/en-US/firefox/new/)
* Install the [Debugger for Chrome](https://marketplace.visualstudio.com/items?itemName=msjsdiag.debugger-for-chrome) or [Debugger for Firefox](https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-firefox-debug) extension for Visual Studio Code
* Open the project directory in Visual Studio Code and select `Debug->Add Configuration->Chrome` or `Debug->Add Configuration->Firefox` so the `.vscode/launch.json` file is created.
* For chrome: Append `/dist` to `${workspaceFolder}` in the `launch.json` file
* `Debug->Start Debugging` should now launch a Chrome or Firefox window with the sample viewer and VS Code breakpoints should be hit.

### Known Issues
npm install / npm run dev give the following warnings:

The following warning comes from a thirdparty and does not affect sample viewer since the mentioned line 179 is never executed.

```
(!) "this" has been rewritten to "undefined"
https://rollupjs.org/troubleshooting/#error-this-is-undefined
node_modules/iobuffer/lib-esm/text-encoding-polyfill.js
177:     : typeof self !== 'undefined'
178:         ? self
179:         : this);
               ^
180: //# sourceMappingURL=text-encoding-polyfill.js.map
```

The following warning is caused by an old bulma version, which buefy-next currently depends on.
This should be fixed in an upcoming release: https://github.com/ntohq/buefy-next/issues/208

```
[0] [build] DEPRECATION WARNING: Sass's behavior for declarations that appear after nested
[0] rules will be changing to match the behavior specified by CSS in an upcoming
[0] version. To keep the existing behavior, move the declaration above the nested
[0] rule. To opt into the new behavior, wrap the declaration in `& {}`.
[0]
[0] More info: https://sass-lang.com/d/mixed-decls
[0]
[0]    ╷
[0] 51 │ ┌   &:not(.is-rounded)
[0] 52 │ │     border-radius: $radius-small
[0]    │ └─── nested rule
[0] 53 │     font-size: $size-small
[0]    │     ^^^^^^^^^^^^^^^^^^^^^^ declaration
[0]    ╵
[0]     node_modules\bulma\sass\elements\button.sass 53:3   button-small()
[0]     node_modules\bulma\sass\elements\button.sass 252:5  @import
[0]     node_modules\bulma\sass\elements\_all.sass 5:9      @import
[0]     node_modules\bulma\bulma.sass 5:9                   @import
[0]     stdin 60:9                                          root stylesheet
```

The following warnings stem from the rollup copy plugin, which is only used for development to copy files to the dist folder.

```
npm WARN deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
npm WARN deprecated source-map-resolve@0.6.0: See https://github.com/lydell/source-map-resolve#deprecated
npm WARN deprecated rimraf@2.7.1: Rimraf versions prior to v4 are no longer supported
npm WARN deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
npm WARN deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
npm WARN deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
npm WARN deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
```