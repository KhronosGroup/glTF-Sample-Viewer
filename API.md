## Classes

<dl>
<dt><a href="#GltfView">GltfView</a></dt>
<dd></dd>
<dt><a href="#GltfState">GltfState</a></dt>
<dd><p>GltfState containing a state for visualization in GltfView</p>
</dd>
<dt><a href="#ResourceLoader">ResourceLoader</a></dt>
<dd></dd>
<dt><a href="#UserCamera">UserCamera</a></dt>
<dd></dd>
</dl>

<a name="GltfView"></a>

## GltfView
**Kind**: global class  

* [GltfView](#GltfView)
    * [new GltfView(context)](#new_GltfView_new)
    * [.createState()](#GltfView+createState) ⇒ [<code>GltfState</code>](#GltfState)
    * [.createResourceLoader([externalDracoLib], [externalKtxLib])](#GltfView+createResourceLoader) ⇒ [<code>ResourceLoader</code>](#ResourceLoader)
    * [.renderFrame(state, width, height)](#GltfView+renderFrame)
    * [.gatherStatistics(state)](#GltfView+gatherStatistics) ⇒ <code>Object</code>

<a name="new_GltfView_new"></a>

### new GltfView(context)
GltfView representing one WebGl 2.0 context or in other words one
3D rendering of the Gltf.
You can create multiple views for example when multiple canvases should
be shown on the same webpage.


| Param | Type | Description |
| --- | --- | --- |
| context | <code>\*</code> | WebGl 2.0 context. Get it from a canvas with `canvas.getContext("webgl2")` |

<a name="GltfView+createState"></a>

### gltfView.createState() ⇒ [<code>GltfState</code>](#GltfState)
createState constructs a new GltfState for the GltfView. The resources
referenced in a gltf state can directly be stored as resources on the WebGL
context of GltfView, therefore GltfStates cannot not be shared between
GltfViews.

**Kind**: instance method of [<code>GltfView</code>](#GltfView)  
**Returns**: [<code>GltfState</code>](#GltfState) - GltfState  
<a name="GltfView+createResourceLoader"></a>

### gltfView.createResourceLoader([externalDracoLib], [externalKtxLib]) ⇒ [<code>ResourceLoader</code>](#ResourceLoader)
createResourceLoader creates a resource loader with which glTFs and
environments can be loaded for the view

**Kind**: instance method of [<code>GltfView</code>](#GltfView)  
**Returns**: [<code>ResourceLoader</code>](#ResourceLoader) - ResourceLoader  

| Param | Type | Description |
| --- | --- | --- |
| [externalDracoLib] | <code>String</code> | optional URI of an external Draco library, e.g. from a CDN |
| [externalKtxLib] | <code>String</code> | optional URI of an external KTX library, e.g. from a CDN |

<a name="GltfView+renderFrame"></a>

### gltfView.renderFrame(state, width, height)
renderFrame to the context's default frame buffer
Call this function in the javascript animation update loop for continuous rendering to a canvas

**Kind**: instance method of [<code>GltfView</code>](#GltfView)  

| Param | Type | Description |
| --- | --- | --- |
| state | <code>\*</code> | GltfState that is be used for rendering |
| width | <code>\*</code> | of the viewport |
| height | <code>\*</code> | of the viewport |

<a name="GltfView+gatherStatistics"></a>

### gltfView.gatherStatistics(state) ⇒ <code>Object</code>
gatherStatistics collects information about the GltfState such as the number of
rendered meshes or triangles

**Kind**: instance method of [<code>GltfView</code>](#GltfView)  
**Returns**: <code>Object</code> - an object containing statistics information  

| Param | Type | Description |
| --- | --- | --- |
| state | <code>\*</code> | GltfState about which the statistics should be collected |

<a name="GltfState"></a>

## GltfState
GltfState containing a state for visualization in GltfView

**Kind**: global class  

* [GltfState](#GltfState)
    * [new GltfState(view)](#new_GltfState_new)
    * [.ToneMaps](#GltfState.ToneMaps)
    * [.DebugOutput](#GltfState.DebugOutput)

<a name="new_GltfState_new"></a>

### new GltfState(view)
GltfState represents all state that can be visualized in a view. You could have
multiple GltfStates configured and switch between them on demand.


| Param | Type | Description |
| --- | --- | --- |
| view | <code>\*</code> | GltfView to which this state belongs |

<a name="GltfState.ToneMaps"></a>

### GltfState.ToneMaps
Enum for tone maps

**Kind**: static property of [<code>GltfState</code>](#GltfState)  
<a name="GltfState.DebugOutput"></a>

### GltfState.DebugOutput
Enum for debug output channels

**Kind**: static property of [<code>GltfState</code>](#GltfState)  
<a name="ResourceLoader"></a>

## ResourceLoader
**Kind**: global class  

* [ResourceLoader](#ResourceLoader)
    * [new ResourceLoader(view)](#new_ResourceLoader_new)
    * [.loadGltf(gltfFile, [externalFiles])](#ResourceLoader+loadGltf) ⇒ <code>Promise</code>
    * [.loadEnvironment(environmentFile, [lutFiles])](#ResourceLoader+loadEnvironment) ⇒ <code>Promise</code>
    * [.initKtxLib([externalKtxLib])](#ResourceLoader+initKtxLib)
    * [.initDracoLib([externalDracoLib])](#ResourceLoader+initDracoLib)

<a name="new_ResourceLoader_new"></a>

### new ResourceLoader(view)
ResourceLoader class that provides an interface to load resources into
the view. Typically this is created with GltfView.createResourceLoader()
You cannot share resource loaders between GltfViews as some of the resources
are allocated directly on the WebGl2 Context


| Param | Type | Description |
| --- | --- | --- |
| view | <code>Object</code> | the GltfView for which the resources are loaded |

<a name="ResourceLoader+loadGltf"></a>

### resourceLoader.loadGltf(gltfFile, [externalFiles]) ⇒ <code>Promise</code>
loadGltf asynchroneously and create resources for rendering

**Kind**: instance method of [<code>ResourceLoader</code>](#ResourceLoader)  
**Returns**: <code>Promise</code> - a promise that fulfills when the gltf file was loaded  

| Param | Type | Description |
| --- | --- | --- |
| gltfFile | <code>String</code> \| <code>ArrayBuffer</code> \| <code>File</code> | the .gltf or .glb file either as path or as preloaded resource. In node.js environments, only ArrayBuffer types are accepted. |
| [externalFiles] | <code>Array.&lt;File&gt;</code> | additional files containing resources that are referenced in the gltf |

<a name="ResourceLoader+loadEnvironment"></a>

### resourceLoader.loadEnvironment(environmentFile, [lutFiles]) ⇒ <code>Promise</code>
loadEnvironment asynchroneously, run IBL sampling and create resources for rendering

**Kind**: instance method of [<code>ResourceLoader</code>](#ResourceLoader)  
**Returns**: <code>Promise</code> - a promise that fulfills when the environment file was loaded  

| Param | Type | Description |
| --- | --- | --- |
| environmentFile | <code>String</code> \| <code>ArrayBuffer</code> \| <code>File</code> | the .hdr file either as path or resource |
| [lutFiles] | <code>Object</code> | object containing paths or resources for the environment look up textures. Keys are lut_ggx_file, lut_charlie_file and lut_sheen_E_file |

<a name="ResourceLoader+initKtxLib"></a>

### resourceLoader.initKtxLib([externalKtxLib])
initKtxLib must be called before loading gltf files with ktx2 assets

**Kind**: instance method of [<code>ResourceLoader</code>](#ResourceLoader)  

| Param | Type | Description |
| --- | --- | --- |
| [externalKtxLib] | <code>String</code> | path to an external ktx library (for example from a CDN) |

<a name="ResourceLoader+initDracoLib"></a>

### resourceLoader.initDracoLib([externalDracoLib])
initDracoLib must be called before loading gltf files with draco meshes. It is sufficient to call this only once

**Kind**: instance method of [<code>ResourceLoader</code>](#ResourceLoader)  

| Param | Type | Description |
| --- | --- | --- |
| [externalDracoLib] | <code>\*</code> | path to an external draco library (for example from a CDN) |

<a name="UserCamera"></a>

## UserCamera
**Kind**: global class  

* [UserCamera](#UserCamera)
    * [new UserCamera()](#new_UserCamera_new)
    * [.setVerticalFoV(yfov)](#UserCamera+setVerticalFoV)
    * [.getPosition()](#UserCamera+getPosition)
    * [.getRotation()](#UserCamera+getRotation)
    * [.getLookDirection()](#UserCamera+getLookDirection)
    * [.getTarget()](#UserCamera+getTarget)
    * [.lookAt(from, to)](#UserCamera+lookAt)
    * [.setPosition(position)](#UserCamera+setPosition)
    * [.setTarget(target)](#UserCamera+setTarget)
    * [.setRotation(yaw, pitch)](#UserCamera+setRotation)
    * [.setDistanceFromTarget(distance, target)](#UserCamera+setDistanceFromTarget)
    * [.zoomStep(sign)](#UserCamera+zoomStep)
    * [.orbit(x, y)](#UserCamera+orbit)
    * [.pan(x, y)](#UserCamera+pan)
    * [.fitViewToScene(gltf, sceneIndex)](#UserCamera+fitViewToScene)

<a name="new_UserCamera_new"></a>

### new UserCamera()
Create a new user camera

<a name="UserCamera+setVerticalFoV"></a>

### userCamera.setVerticalFoV(yfov)
Sets the vertical FoV of the user camera

**Kind**: instance method of [<code>UserCamera</code>](#UserCamera)  

| Param | Type |
| --- | --- |
| yfov | <code>number</code> | 

<a name="UserCamera+getPosition"></a>

### userCamera.getPosition()
Returns the current position of the user camera as a vec3

**Kind**: instance method of [<code>UserCamera</code>](#UserCamera)  
<a name="UserCamera+getRotation"></a>

### userCamera.getRotation()
Returns the current rotation of the user camera as quat

**Kind**: instance method of [<code>UserCamera</code>](#UserCamera)  
<a name="UserCamera+getLookDirection"></a>

### userCamera.getLookDirection()
Returns the normalized direction the user camera looks at as vec3

**Kind**: instance method of [<code>UserCamera</code>](#UserCamera)  
<a name="UserCamera+getTarget"></a>

### userCamera.getTarget()
Returns the current target the camera looks at as vec3
This multiplies the viewing direction with the distance.
For distance 0 the normalized viewing direction is used.

**Kind**: instance method of [<code>UserCamera</code>](#UserCamera)  
<a name="UserCamera+lookAt"></a>

### userCamera.lookAt(from, to)
Look from user camera to target
This changes the transformation of the user camera

**Kind**: instance method of [<code>UserCamera</code>](#UserCamera)  

| Param | Type |
| --- | --- |
| from | <code>vec3</code> | 
| to | <code>vec3</code> | 

<a name="UserCamera+setPosition"></a>

### userCamera.setPosition(position)
Sets the position of the user camera

**Kind**: instance method of [<code>UserCamera</code>](#UserCamera)  

| Param | Type |
| --- | --- |
| position | <code>vec3</code> | 

<a name="UserCamera+setTarget"></a>

### userCamera.setTarget(target)
This rotates the user camera towards the target and sets the position of the user camera 
according to the current distance

**Kind**: instance method of [<code>UserCamera</code>](#UserCamera)  

| Param | Type |
| --- | --- |
| target | <code>vec3</code> | 

<a name="UserCamera+setRotation"></a>

### userCamera.setRotation(yaw, pitch)
Sets the rotation of the camera
Yaw and pitch should be in gradient

**Kind**: instance method of [<code>UserCamera</code>](#UserCamera)  

| Param | Type |
| --- | --- |
| yaw | <code>number</code> | 
| pitch | <code>number</code> | 

<a name="UserCamera+setDistanceFromTarget"></a>

### userCamera.setDistanceFromTarget(distance, target)
Transforms the user camera to look at a target from a specfic distance using the current rotation
This will only change the position of the user camera, not the rotation
Use this function to set the distance

**Kind**: instance method of [<code>UserCamera</code>](#UserCamera)  

| Param | Type |
| --- | --- |
| distance | <code>number</code> | 
| target | <code>vec3</code> | 

<a name="UserCamera+zoomStep"></a>

### userCamera.zoomStep(sign)
Does a logarithmic zoom step according to this.zoomFactor
sign determines the direction of the zoom

**Kind**: instance method of [<code>UserCamera</code>](#UserCamera)  

| Param | Type |
| --- | --- |
| sign | <code>number</code> | 

<a name="UserCamera+orbit"></a>

### userCamera.orbit(x, y)
Orbit around the target
x and y should be in radient and are added to the current rotation
The rotation around the x-axis is limited to 180 degree

**Kind**: instance method of [<code>UserCamera</code>](#UserCamera)  

| Param | Type |
| --- | --- |
| x | <code>number</code> | 
| y | <code>number</code> | 

<a name="UserCamera+pan"></a>

### userCamera.pan(x, y)
Pan the user camera
x and y are added to the position

**Kind**: instance method of [<code>UserCamera</code>](#UserCamera)  

| Param | Type |
| --- | --- |
| x | <code>number</code> | 
| y | <code>number</code> | 

<a name="UserCamera+fitViewToScene"></a>

### userCamera.fitViewToScene(gltf, sceneIndex)
Calculates a camera position which looks at the center of the scene from an appropriate distance
This calculates near and far plane as well

**Kind**: instance method of [<code>UserCamera</code>](#UserCamera)  

| Param | Type |
| --- | --- |
| gltf | <code>Gltf</code> | 
| sceneIndex | <code>number</code> | 

