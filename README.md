glTF Sample Viewer Web App
==============================

[![](../assets/images/BoomBox.jpg)](https://github.khronos.org/glTF-Sample-Viewer-Release/)

This is the official [Khronos glTF 2.0](https://www.khronos.org/gltf/) Sample Viewer using [WebGL](https://www.khronos.org/webgl/): [glTF 2.0 Sample Viewer](https://github.khronos.org/glTF-Sample-Viewer-Release/)


Viewer
======

Link to the live [glTF 2.0 Sample Viewer](https://github.khronos.org/glTF-Sample-Viewer-Release/).

Usage
-----

### Controls

`click + drag` : Rotate model

`scroll` : Zoom camera

`GUI` : Use to change models and settings

### Change glTF model

* Choose one of the glTF models in the selection list
* Drag and drop glTF files into viewer

### Change the environment map
* Drag and drop a .hdr panorama file

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