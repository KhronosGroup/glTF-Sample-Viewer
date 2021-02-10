## Classes

<dl>
<dt><a href="#GltfView">GltfView</a></dt>
<dd></dd>
<dt><a href="#GltfState">GltfState</a></dt>
<dd><p>GltfState containing a state for visualization in GltfView</p>
</dd>
<dt><a href="#ResourceLoader">ResourceLoader</a></dt>
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

