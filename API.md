## Classes

<dl>
<dt><a href="#GltfView">GltfView</a></dt>
<dd><p>GltfView represents a view on a gltf, e.g. in a canvas</p>
</dd>
<dt><a href="#GltfState">GltfState</a></dt>
<dd><p>GltfState containing a state for visualization in GltfView</p>
</dd>
<dt><a href="#ResourceLoader">ResourceLoader</a></dt>
<dd><p>ResourceLoader can be used to load resources for the GltfState
that are then used to display the loaded data with GltfView</p>
</dd>
<dt><a href="#UserCamera">UserCamera</a></dt>
<dd></dd>
</dl>

<a name="GltfView"></a>

## GltfView
GltfView represents a view on a gltf, e.g. in a canvas

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
| [externalDracoLib] | <code>Object</code> | optional object of an external Draco library, e.g. from a CDN |
| [externalKtxLib] | <code>Object</code> | optional object of an external KTX library, e.g. from a CDN |

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
    * _instance_
        * [.gltf](#GltfState+gltf)
        * [.environment](#GltfState+environment)
        * [.userCamera](#GltfState+userCamera)
        * [.sceneIndex](#GltfState+sceneIndex)
        * [.cameraIndex](#GltfState+cameraIndex)
        * [.animationIndices](#GltfState+animationIndices)
        * [.animationTimer](#GltfState+animationTimer)
        * [.variant](#GltfState+variant)
        * [.renderingParameters](#GltfState+renderingParameters)
            * [.morphing](#GltfState+renderingParameters.morphing)
            * [.skinning](#GltfState+renderingParameters.skinning)
            * [.clearColor](#GltfState+renderingParameters.clearColor)
            * [.exposure](#GltfState+renderingParameters.exposure)
            * [.usePunctual](#GltfState+renderingParameters.usePunctual)
            * [.useIBL](#GltfState+renderingParameters.useIBL)
            * [.renderEnvironmentMap](#GltfState+renderingParameters.renderEnvironmentMap)
            * [.blurEnvironmentMap](#GltfState+renderingParameters.blurEnvironmentMap)
            * [.toneMap](#GltfState+renderingParameters.toneMap)
            * [.debugOutput](#GltfState+renderingParameters.debugOutput)
            * [.environmentRotation](#GltfState+renderingParameters.environmentRotation)
            * [.useDirectionalLightsWithDisabledIBL](#GltfState+renderingParameters.useDirectionalLightsWithDisabledIBL)
            * [.internalMSAA](#GltfState+renderingParameters.internalMSAA)
    * _static_
        * [.ToneMaps](#GltfState.ToneMaps)
            * [.NONE](#GltfState.ToneMaps.NONE)
            * [.ACES_HILL_EXPOSURE_BOOST](#GltfState.ToneMaps.ACES_HILL_EXPOSURE_BOOST)
            * [.ACES_NARKOWICZ](#GltfState.ToneMaps.ACES_NARKOWICZ)
            * [.ACES_HILL](#GltfState.ToneMaps.ACES_HILL)
        * [.DebugOutput](#GltfState.DebugOutput)
            * [.NONE](#GltfState.DebugOutput.NONE)
            * [.METALLIC](#GltfState.DebugOutput.METALLIC)
            * [.ROUGHNESS](#GltfState.DebugOutput.ROUGHNESS)
            * [.NORMAL](#GltfState.DebugOutput.NORMAL)
            * [.WORLDSPACENORMAL](#GltfState.DebugOutput.WORLDSPACENORMAL)
            * [.GEOMETRYNORMAL](#GltfState.DebugOutput.GEOMETRYNORMAL)
            * [.TANGENT](#GltfState.DebugOutput.TANGENT)
            * [.BITANGENT](#GltfState.DebugOutput.BITANGENT)
            * [.BASECOLOR](#GltfState.DebugOutput.BASECOLOR)
            * [.OCCLUSION](#GltfState.DebugOutput.OCCLUSION)
            * [.EMISSIVE](#GltfState.DebugOutput.EMISSIVE)
            * [.DIFFUSE](#GltfState.DebugOutput.DIFFUSE)
            * [.SPECULAR](#GltfState.DebugOutput.SPECULAR)
            * [.CLEARCOAT](#GltfState.DebugOutput.CLEARCOAT)
            * [.SHEEN](#GltfState.DebugOutput.SHEEN)
            * [.TRANSMISSION](#GltfState.DebugOutput.TRANSMISSION)
            * [.ALPHA](#GltfState.DebugOutput.ALPHA)
            * [.F0](#GltfState.DebugOutput.F0)

<a name="new_GltfState_new"></a>

### new GltfState(view)
GltfState represents all state that can be visualized in a view. You could have
multiple GltfStates configured and switch between them on demand.


| Param | Type | Description |
| --- | --- | --- |
| view | <code>\*</code> | GltfView to which this state belongs |

<a name="GltfState+gltf"></a>

### gltfState.gltf
loaded gltf data @see ResourceLoader.loadGltf

**Kind**: instance property of [<code>GltfState</code>](#GltfState)  
<a name="GltfState+environment"></a>

### gltfState.environment
loaded environment data @see ResourceLoader.loadEnvironment

**Kind**: instance property of [<code>GltfState</code>](#GltfState)  
<a name="GltfState+userCamera"></a>

### gltfState.userCamera
user camera @see UserCamera, convenient camera controls

**Kind**: instance property of [<code>GltfState</code>](#GltfState)  
<a name="GltfState+sceneIndex"></a>

### gltfState.sceneIndex
gltf scene that is visible in the view

**Kind**: instance property of [<code>GltfState</code>](#GltfState)  
<a name="GltfState+cameraIndex"></a>

### gltfState.cameraIndex
index of the camera that is used to render the view. a
value of 'undefined' enables the user camera

**Kind**: instance property of [<code>GltfState</code>](#GltfState)  
<a name="GltfState+animationIndices"></a>

### gltfState.animationIndices
indices of active animations

**Kind**: instance property of [<code>GltfState</code>](#GltfState)  
<a name="GltfState+animationTimer"></a>

### gltfState.animationTimer
animation timer allows to control the animation time

**Kind**: instance property of [<code>GltfState</code>](#GltfState)  
<a name="GltfState+variant"></a>

### gltfState.variant
KHR_materials_variants

**Kind**: instance property of [<code>GltfState</code>](#GltfState)  
<a name="GltfState+renderingParameters"></a>

### gltfState.renderingParameters
parameters used to configure the rendering

**Kind**: instance property of [<code>GltfState</code>](#GltfState)  

* [.renderingParameters](#GltfState+renderingParameters)
    * [.morphing](#GltfState+renderingParameters.morphing)
    * [.skinning](#GltfState+renderingParameters.skinning)
    * [.clearColor](#GltfState+renderingParameters.clearColor)
    * [.exposure](#GltfState+renderingParameters.exposure)
    * [.usePunctual](#GltfState+renderingParameters.usePunctual)
    * [.useIBL](#GltfState+renderingParameters.useIBL)
    * [.renderEnvironmentMap](#GltfState+renderingParameters.renderEnvironmentMap)
    * [.blurEnvironmentMap](#GltfState+renderingParameters.blurEnvironmentMap)
    * [.toneMap](#GltfState+renderingParameters.toneMap)
    * [.debugOutput](#GltfState+renderingParameters.debugOutput)
    * [.environmentRotation](#GltfState+renderingParameters.environmentRotation)
    * [.useDirectionalLightsWithDisabledIBL](#GltfState+renderingParameters.useDirectionalLightsWithDisabledIBL)
    * [.internalMSAA](#GltfState+renderingParameters.internalMSAA)

<a name="GltfState+renderingParameters.morphing"></a>

#### renderingParameters.morphing
morphing between vertices

**Kind**: static property of [<code>renderingParameters</code>](#GltfState+renderingParameters)  
<a name="GltfState+renderingParameters.skinning"></a>

#### renderingParameters.skinning
skin / skeleton

**Kind**: static property of [<code>renderingParameters</code>](#GltfState+renderingParameters)  
<a name="GltfState+renderingParameters.clearColor"></a>

#### renderingParameters.clearColor
clear color expressed as list of ints in the range [0, 255]

**Kind**: static property of [<code>renderingParameters</code>](#GltfState+renderingParameters)  
<a name="GltfState+renderingParameters.exposure"></a>

#### renderingParameters.exposure
exposure factor

**Kind**: static property of [<code>renderingParameters</code>](#GltfState+renderingParameters)  
<a name="GltfState+renderingParameters.usePunctual"></a>

#### renderingParameters.usePunctual
KHR_lights_punctual

**Kind**: static property of [<code>renderingParameters</code>](#GltfState+renderingParameters)  
<a name="GltfState+renderingParameters.useIBL"></a>

#### renderingParameters.useIBL
image based lighting

**Kind**: static property of [<code>renderingParameters</code>](#GltfState+renderingParameters)  
<a name="GltfState+renderingParameters.renderEnvironmentMap"></a>

#### renderingParameters.renderEnvironmentMap
render the environment map in the background

**Kind**: static property of [<code>renderingParameters</code>](#GltfState+renderingParameters)  
<a name="GltfState+renderingParameters.blurEnvironmentMap"></a>

#### renderingParameters.blurEnvironmentMap
apply blur to the background environment map

**Kind**: static property of [<code>renderingParameters</code>](#GltfState+renderingParameters)  
<a name="GltfState+renderingParameters.toneMap"></a>

#### renderingParameters.toneMap
which tonemap to use, use ACES for a filmic effect

**Kind**: static property of [<code>renderingParameters</code>](#GltfState+renderingParameters)  
<a name="GltfState+renderingParameters.debugOutput"></a>

#### renderingParameters.debugOutput
render some debug output channes, such as for example the normals

**Kind**: static property of [<code>renderingParameters</code>](#GltfState+renderingParameters)  
<a name="GltfState+renderingParameters.environmentRotation"></a>

#### renderingParameters.environmentRotation
By default the front face of the environment is +Z (90)
Front faces:
+X = 0 
+Z = 90 
-X = 180 
-Z = 270

**Kind**: static property of [<code>renderingParameters</code>](#GltfState+renderingParameters)  
<a name="GltfState+renderingParameters.useDirectionalLightsWithDisabledIBL"></a>

#### renderingParameters.useDirectionalLightsWithDisabledIBL
If this is set to true, directional lights will be generated if IBL is disabled

**Kind**: static property of [<code>renderingParameters</code>](#GltfState+renderingParameters)  
<a name="GltfState+renderingParameters.internalMSAA"></a>

#### renderingParameters.internalMSAA
MSAA used for cases which are not handled by the browser (e.g. Transmission)

**Kind**: static property of [<code>renderingParameters</code>](#GltfState+renderingParameters)  
<a name="GltfState.ToneMaps"></a>

### GltfState.ToneMaps
ToneMaps enum for the different tonemappings that are supported 
by gltf sample viewer

**Kind**: static property of [<code>GltfState</code>](#GltfState)  

* [.ToneMaps](#GltfState.ToneMaps)
    * [.NONE](#GltfState.ToneMaps.NONE)
    * [.ACES_HILL_EXPOSURE_BOOST](#GltfState.ToneMaps.ACES_HILL_EXPOSURE_BOOST)
    * [.ACES_NARKOWICZ](#GltfState.ToneMaps.ACES_NARKOWICZ)
    * [.ACES_HILL](#GltfState.ToneMaps.ACES_HILL)

<a name="GltfState.ToneMaps.NONE"></a>

#### ToneMaps.NONE
don't apply tone mapping

**Kind**: static property of [<code>ToneMaps</code>](#GltfState.ToneMaps)  
<a name="GltfState.ToneMaps.ACES_HILL_EXPOSURE_BOOST"></a>

#### ToneMaps.ACES\_HILL\_EXPOSURE\_BOOST
ACES sRGB RRT+ODT implementation for 3D Commerce based on Stephen Hill's implementation with a exposure factor of 1.0 / 0.6

**Kind**: static property of [<code>ToneMaps</code>](#GltfState.ToneMaps)  
<a name="GltfState.ToneMaps.ACES_NARKOWICZ"></a>

#### ToneMaps.ACES\_NARKOWICZ
fast implementation of the ACES sRGB RRT+ODT based on Krzysztof Narkowicz' implementation

**Kind**: static property of [<code>ToneMaps</code>](#GltfState.ToneMaps)  
<a name="GltfState.ToneMaps.ACES_HILL"></a>

#### ToneMaps.ACES\_HILL
more accurate implementation of the ACES sRGB RRT+ODT based on Stephen Hill's implementation

**Kind**: static property of [<code>ToneMaps</code>](#GltfState.ToneMaps)  
<a name="GltfState.DebugOutput"></a>

### GltfState.DebugOutput
DebugOutput enum for selecting debug output channels
such as "NORMAL"

**Kind**: static property of [<code>GltfState</code>](#GltfState)  

* [.DebugOutput](#GltfState.DebugOutput)
    * [.NONE](#GltfState.DebugOutput.NONE)
    * [.METALLIC](#GltfState.DebugOutput.METALLIC)
    * [.ROUGHNESS](#GltfState.DebugOutput.ROUGHNESS)
    * [.NORMAL](#GltfState.DebugOutput.NORMAL)
    * [.WORLDSPACENORMAL](#GltfState.DebugOutput.WORLDSPACENORMAL)
    * [.GEOMETRYNORMAL](#GltfState.DebugOutput.GEOMETRYNORMAL)
    * [.TANGENT](#GltfState.DebugOutput.TANGENT)
    * [.BITANGENT](#GltfState.DebugOutput.BITANGENT)
    * [.BASECOLOR](#GltfState.DebugOutput.BASECOLOR)
    * [.OCCLUSION](#GltfState.DebugOutput.OCCLUSION)
    * [.EMISSIVE](#GltfState.DebugOutput.EMISSIVE)
    * [.DIFFUSE](#GltfState.DebugOutput.DIFFUSE)
    * [.SPECULAR](#GltfState.DebugOutput.SPECULAR)
    * [.CLEARCOAT](#GltfState.DebugOutput.CLEARCOAT)
    * [.SHEEN](#GltfState.DebugOutput.SHEEN)
    * [.TRANSMISSION](#GltfState.DebugOutput.TRANSMISSION)
    * [.ALPHA](#GltfState.DebugOutput.ALPHA)
    * [.F0](#GltfState.DebugOutput.F0)

<a name="GltfState.DebugOutput.NONE"></a>

#### DebugOutput.NONE
standard rendering - debug output is disabled

**Kind**: static property of [<code>DebugOutput</code>](#GltfState.DebugOutput)  
<a name="GltfState.DebugOutput.METALLIC"></a>

#### DebugOutput.METALLIC
output the metallic value from pbr metallic roughness

**Kind**: static property of [<code>DebugOutput</code>](#GltfState.DebugOutput)  
<a name="GltfState.DebugOutput.ROUGHNESS"></a>

#### DebugOutput.ROUGHNESS
output the roughness value from pbr metallic roughness

**Kind**: static property of [<code>DebugOutput</code>](#GltfState.DebugOutput)  
<a name="GltfState.DebugOutput.NORMAL"></a>

#### DebugOutput.NORMAL
output the normal map value in TBN space

**Kind**: static property of [<code>DebugOutput</code>](#GltfState.DebugOutput)  
<a name="GltfState.DebugOutput.WORLDSPACENORMAL"></a>

#### DebugOutput.WORLDSPACENORMAL
output the world space normals (i.e. with TBN applied)

**Kind**: static property of [<code>DebugOutput</code>](#GltfState.DebugOutput)  
<a name="GltfState.DebugOutput.GEOMETRYNORMAL"></a>

#### DebugOutput.GEOMETRYNORMAL
output the normal from the TBN

**Kind**: static property of [<code>DebugOutput</code>](#GltfState.DebugOutput)  
<a name="GltfState.DebugOutput.TANGENT"></a>

#### DebugOutput.TANGENT
output the tangent from the TBN

**Kind**: static property of [<code>DebugOutput</code>](#GltfState.DebugOutput)  
<a name="GltfState.DebugOutput.BITANGENT"></a>

#### DebugOutput.BITANGENT
output the bitangent from the TBN

**Kind**: static property of [<code>DebugOutput</code>](#GltfState.DebugOutput)  
<a name="GltfState.DebugOutput.BASECOLOR"></a>

#### DebugOutput.BASECOLOR
output the base color value

**Kind**: static property of [<code>DebugOutput</code>](#GltfState.DebugOutput)  
<a name="GltfState.DebugOutput.OCCLUSION"></a>

#### DebugOutput.OCCLUSION
output the occlusion value

**Kind**: static property of [<code>DebugOutput</code>](#GltfState.DebugOutput)  
<a name="GltfState.DebugOutput.EMISSIVE"></a>

#### DebugOutput.EMISSIVE
output the emissive value

**Kind**: static property of [<code>DebugOutput</code>](#GltfState.DebugOutput)  
<a name="GltfState.DebugOutput.DIFFUSE"></a>

#### DebugOutput.DIFFUSE
output diffuse lighting

**Kind**: static property of [<code>DebugOutput</code>](#GltfState.DebugOutput)  
<a name="GltfState.DebugOutput.SPECULAR"></a>

#### DebugOutput.SPECULAR
output specular lighting

**Kind**: static property of [<code>DebugOutput</code>](#GltfState.DebugOutput)  
<a name="GltfState.DebugOutput.CLEARCOAT"></a>

#### DebugOutput.CLEARCOAT
output clearcoat lighting

**Kind**: static property of [<code>DebugOutput</code>](#GltfState.DebugOutput)  
<a name="GltfState.DebugOutput.SHEEN"></a>

#### DebugOutput.SHEEN
output sheen lighting

**Kind**: static property of [<code>DebugOutput</code>](#GltfState.DebugOutput)  
<a name="GltfState.DebugOutput.TRANSMISSION"></a>

#### DebugOutput.TRANSMISSION
output tranmission lighting

**Kind**: static property of [<code>DebugOutput</code>](#GltfState.DebugOutput)  
<a name="GltfState.DebugOutput.ALPHA"></a>

#### DebugOutput.ALPHA
output the alpha value

**Kind**: static property of [<code>DebugOutput</code>](#GltfState.DebugOutput)  
<a name="GltfState.DebugOutput.F0"></a>

#### DebugOutput.F0
output computed F0

**Kind**: static property of [<code>DebugOutput</code>](#GltfState.DebugOutput)  
<a name="ResourceLoader"></a>

## ResourceLoader
ResourceLoader can be used to load resources for the GltfState
that are then used to display the loaded data with GltfView

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
| [externalKtxLib] | <code>Object</code> | external ktx library (for example from a CDN) |

<a name="ResourceLoader+initDracoLib"></a>

### resourceLoader.initDracoLib([externalDracoLib])
initDracoLib must be called before loading gltf files with draco meshes

**Kind**: instance method of [<code>ResourceLoader</code>](#ResourceLoader)  

| Param | Type | Description |
| --- | --- | --- |
| [externalDracoLib] | <code>\*</code> | external draco library (for example from a CDN) |

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
    * [.zoomBy(value)](#UserCamera+zoomBy)
    * [.orbit(x, y)](#UserCamera+orbit)
    * [.pan(x, y)](#UserCamera+pan)
    * [.fitViewToScene(gltf, sceneIndex)](#UserCamera+fitViewToScene)

<a name="new_UserCamera_new"></a>

### new UserCamera()
Create a new user camera.

<a name="UserCamera+setVerticalFoV"></a>

### userCamera.setVerticalFoV(yfov)
Sets the vertical FoV of the user camera.

**Kind**: instance method of [<code>UserCamera</code>](#UserCamera)  

| Param | Type |
| --- | --- |
| yfov | <code>number</code> | 

<a name="UserCamera+getPosition"></a>

### userCamera.getPosition()
Returns the current position of the user camera as a vec3.

**Kind**: instance method of [<code>UserCamera</code>](#UserCamera)  
<a name="UserCamera+getRotation"></a>

### userCamera.getRotation()
Returns the current rotation of the user camera as quat.

**Kind**: instance method of [<code>UserCamera</code>](#UserCamera)  
<a name="UserCamera+getLookDirection"></a>

### userCamera.getLookDirection()
Returns the normalized direction the user camera looks at as vec3.

**Kind**: instance method of [<code>UserCamera</code>](#UserCamera)  
<a name="UserCamera+getTarget"></a>

### userCamera.getTarget()
Returns the current target the camera looks at as vec3.
This multiplies the viewing direction with the distance.
For distance 0 the normalized viewing direction is used.

**Kind**: instance method of [<code>UserCamera</code>](#UserCamera)  
<a name="UserCamera+lookAt"></a>

### userCamera.lookAt(from, to)
Look from user camera to target.
This changes the transformation of the user camera.

**Kind**: instance method of [<code>UserCamera</code>](#UserCamera)  

| Param | Type |
| --- | --- |
| from | <code>vec3</code> | 
| to | <code>vec3</code> | 

<a name="UserCamera+setPosition"></a>

### userCamera.setPosition(position)
Sets the position of the user camera.

**Kind**: instance method of [<code>UserCamera</code>](#UserCamera)  

| Param | Type |
| --- | --- |
| position | <code>vec3</code> | 

<a name="UserCamera+setTarget"></a>

### userCamera.setTarget(target)
This rotates the user camera towards the target and sets the position of the user camera
according to the current distance.

**Kind**: instance method of [<code>UserCamera</code>](#UserCamera)  

| Param | Type |
| --- | --- |
| target | <code>vec3</code> | 

<a name="UserCamera+setRotation"></a>

### userCamera.setRotation(yaw, pitch)
Sets the rotation of the camera.
Yaw and pitch in euler angles (degrees).

**Kind**: instance method of [<code>UserCamera</code>](#UserCamera)  

| Param | Type |
| --- | --- |
| yaw | <code>number</code> | 
| pitch | <code>number</code> | 

<a name="UserCamera+setDistanceFromTarget"></a>

### userCamera.setDistanceFromTarget(distance, target)
Transforms the user camera to look at a target from a specfic distance using the current rotation.
This will only change the position of the user camera, not the rotation.
Use this function to set the distance.

**Kind**: instance method of [<code>UserCamera</code>](#UserCamera)  

| Param | Type |
| --- | --- |
| distance | <code>number</code> | 
| target | <code>vec3</code> | 

<a name="UserCamera+zoomBy"></a>

### userCamera.zoomBy(value)
Zoom exponentially according to this.zoomFactor and this.zoomExponent.
The default zoomFactor provides good zoom speed for values from [-1,1].

**Kind**: instance method of [<code>UserCamera</code>](#UserCamera)  

| Param | Type |
| --- | --- |
| value | <code>number</code> | 

<a name="UserCamera+orbit"></a>

### userCamera.orbit(x, y)
Orbit around the target.
x and y should be in radient and are added to the current rotation.
The rotation around the x-axis is limited to 180 degree.
The axes are inverted: e.g. if y is positive the camera will look further down.

**Kind**: instance method of [<code>UserCamera</code>](#UserCamera)  

| Param | Type |
| --- | --- |
| x | <code>number</code> | 
| y | <code>number</code> | 

<a name="UserCamera+pan"></a>

### userCamera.pan(x, y)
Pan the user camera.
The axes are inverted: e.g. if y is positive the camera will move down.

**Kind**: instance method of [<code>UserCamera</code>](#UserCamera)  

| Param | Type |
| --- | --- |
| x | <code>number</code> | 
| y | <code>number</code> | 

<a name="UserCamera+fitViewToScene"></a>

### userCamera.fitViewToScene(gltf, sceneIndex)
Calculates a camera position which looks at the center of the scene from an appropriate distance.
This calculates near and far plane as well.

**Kind**: instance method of [<code>UserCamera</code>](#UserCamera)  

| Param | Type |
| --- | --- |
| gltf | <code>Gltf</code> | 
| sceneIndex | <code>number</code> | 

