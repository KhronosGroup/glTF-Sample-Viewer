import { mat4, mat3, vec3,vec4, quat } from 'gl-matrix';
import { ShaderCache } from './shader_cache.js';
import { GltfState } from '../GltfState/gltf_state.js';
import { gltfWebGl, GL } from './webgl.js';
import { EnvironmentRenderer } from './environment_renderer.js';

import pbrShader from './shaders/pbr.frag';
import brdfShader from './shaders/brdf.glsl';
import iridescenceShader from './shaders/iridescence.glsl';
import materialInfoShader from './shaders/material_info.glsl';
import iblShader from './shaders/ibl.glsl';
import punctualShader from './shaders/punctual.glsl';
import primitiveShader from './shaders/primitive.vert';
import texturesShader from './shaders/textures.glsl';
import tonemappingShader from './shaders/tonemapping.glsl';
import shaderFunctions from './shaders/functions.glsl';
import animationShader from './shaders/animation.glsl';
import cubemapVertShader from './shaders/cubemap.vert';
import cubemapFragShader from './shaders/cubemap.frag';
import { gltfLight } from '../gltf/light.js';

import { getSceneExtents, getBoundingBoxFromMinMax, getNodeBoundingBox} from '../gltf/gltf_utils.js';

class gltfRenderer
{
    constructor(context)
    {
        this.shader = undefined; // current shader

        this.currentWidth = 0;
        this.currentHeight = 0;

        this.webGl = new gltfWebGl(context);
        this.initialized = false;
        this.samples = 4;

        // create render target for non transmission materials
        this.opaqueRenderTexture = 0;
        this.opaqueFramebuffer = 0;
        this.opaqueDepthTexture = 0;
        this.opaqueFramebufferWidth = 1024;
        this.opaqueFramebufferHeight = 1024;

        const shaderSources = new Map();
        shaderSources.set("primitive.vert", primitiveShader);
        shaderSources.set("pbr.frag", pbrShader);
        shaderSources.set("material_info.glsl", materialInfoShader);
        shaderSources.set("brdf.glsl", brdfShader);
        shaderSources.set("iridescence.glsl", iridescenceShader);
        shaderSources.set("ibl.glsl", iblShader);
        shaderSources.set("punctual.glsl", punctualShader);
        shaderSources.set("tonemapping.glsl", tonemappingShader);
        shaderSources.set("textures.glsl", texturesShader);
        shaderSources.set("functions.glsl", shaderFunctions);
        shaderSources.set("animation.glsl", animationShader);
        shaderSources.set("cubemap.vert", cubemapVertShader);
        shaderSources.set("cubemap.frag", cubemapFragShader);

        this.shaderCache = new ShaderCache(shaderSources, this.webGl);

        this.webGl.loadWebGlExtensions();

        this.visibleLights = [];

        this.viewMatrix = mat4.create();
        this.projMatrix = mat4.create();
        this.viewProjectionMatrix = mat4.create();

        this.currentCameraPosition = vec3.create();

        this.lightKey = new gltfLight();
        this.lightFill = new gltfLight();
        this.lightFill.intensity = 0.5;
        const quatKey = quat.fromValues(
            -0.3535534,
            -0.353553385,
            -0.146446586,
            0.8535534);
        const quatFill = quat.fromValues(
            -0.8535534,
            0.146446645,
            -0.353553325,
            -0.353553444);
        this.lightKey.direction = vec3.create();
        this.lightFill.direction = vec3.create();
        vec3.transformQuat(this.lightKey.direction, [0, 0, -1], quatKey);
        vec3.transformQuat(this.lightFill.direction, [0, 0, -1], quatFill);
    }

    /////////////////////////////////////////////////////////////////////
    // Render glTF scene graph
    /////////////////////////////////////////////////////////////////////

    // app state
    init(state)
    {
        const context = this.webGl.context;
        const maxSamples = context.getParameter(context.MAX_SAMPLES);
        const samples = state.internalMSAA < maxSamples ? state.internalMSAA : maxSamples;
        if (!this.initialized){

            context.pixelStorei(GL.UNPACK_COLORSPACE_CONVERSION_WEBGL, GL.NONE);
            context.enable(GL.DEPTH_TEST);
            context.depthFunc(GL.LEQUAL);
            context.colorMask(true, true, true, true);
            context.clearDepth(1.0);

            this.opaqueRenderTexture = context.createTexture();
            context.bindTexture(context.TEXTURE_2D, this.opaqueRenderTexture);
            context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.LINEAR_MIPMAP_LINEAR);
            context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
            context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);
            context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.NEAREST);
            context.texImage2D(context.TEXTURE_2D, 0, context.RGBA, this.opaqueFramebufferWidth, this.opaqueFramebufferHeight, 0, context.RGBA, context.UNSIGNED_BYTE, null);
            context.bindTexture(context.TEXTURE_2D, null);

            this.opaqueDepthTexture = context.createTexture();
            context.bindTexture(context.TEXTURE_2D, this.opaqueDepthTexture);
            context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.NEAREST);
            context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
            context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);
            context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.NEAREST);
            context.texImage2D( context.TEXTURE_2D, 0, context.DEPTH_COMPONENT16, this.opaqueFramebufferWidth, this.opaqueFramebufferHeight, 0, context.DEPTH_COMPONENT, context.UNSIGNED_SHORT, null);
            context.bindTexture(context.TEXTURE_2D, null);


            this.colorRenderBuffer = context.createRenderbuffer();
            context.bindRenderbuffer(context.RENDERBUFFER, this.colorRenderBuffer);
            context.renderbufferStorageMultisample( context.RENDERBUFFER, samples, context.RGBA8,  this.opaqueFramebufferWidth, this.opaqueFramebufferHeight);

            this.depthRenderBuffer = context.createRenderbuffer();
            context.bindRenderbuffer(context.RENDERBUFFER, this.depthRenderBuffer);
            context.renderbufferStorageMultisample( context.RENDERBUFFER,
                samples,
                context.DEPTH_COMPONENT16, 
                this.opaqueFramebufferWidth,
                this.opaqueFramebufferHeight);

            this.samples = samples;

            this.opaqueFramebufferMSAA = context.createFramebuffer();
            context.bindFramebuffer(context.FRAMEBUFFER, this.opaqueFramebufferMSAA);
            context.framebufferRenderbuffer(context.FRAMEBUFFER, context.COLOR_ATTACHMENT0, context.RENDERBUFFER, this.colorRenderBuffer);
            context.framebufferRenderbuffer(context.FRAMEBUFFER, context.DEPTH_ATTACHMENT, context.RENDERBUFFER, this.depthRenderBuffer);


            this.opaqueFramebuffer = context.createFramebuffer();
            context.bindFramebuffer(context.FRAMEBUFFER, this.opaqueFramebuffer);
            context.framebufferTexture2D(context.FRAMEBUFFER, context.COLOR_ATTACHMENT0, context.TEXTURE_2D, this.opaqueRenderTexture, 0);
            context.framebufferTexture2D(context.FRAMEBUFFER, context.DEPTH_ATTACHMENT, context.TEXTURE_2D, this.opaqueDepthTexture, 0);
            context.viewport(0, 0, this.opaqueFramebufferWidth, this.opaqueFramebufferHeight);
            context.bindFramebuffer(context.FRAMEBUFFER, null);

            this.initialized = true;

            this.environmentRenderer = new EnvironmentRenderer(this.webGl);
        }
        else {
            if (this.samples != samples)
            {
                this.samples = samples;
                context.bindRenderbuffer(context.RENDERBUFFER, this.colorRenderBuffer);
                context.renderbufferStorageMultisample( context.RENDERBUFFER,
                    samples,
                    context.RGBA8, 
                    this.opaqueFramebufferWidth,
                    this.opaqueFramebufferHeight);
                
                context.bindRenderbuffer(context.RENDERBUFFER, this.depthRenderBuffer);
                context.renderbufferStorageMultisample( context.RENDERBUFFER,
                    samples,
                    context.DEPTH_COMPONENT16, 
                    this.opaqueFramebufferWidth,
                    this.opaqueFramebufferHeight);
            }
        }
    }

    resize(width, height)
    {
        if (this.currentWidth !== width || this.currentHeight !== height)
        {
            this.currentHeight = height;
            this.currentWidth = width;
            this.webGl.context.viewport(0, 0, width, height);
        }
    }

    // frame state
    clearFrame(clearColor)
    {
        this.webGl.context.bindFramebuffer(this.webGl.context.FRAMEBUFFER, null);
        this.webGl.context.clearColor(...clearColor);
        this.webGl.context.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
        this.webGl.context.bindFramebuffer(this.webGl.context.FRAMEBUFFER, this.opaqueFramebuffer);
        this.webGl.context.clearColor(...clearColor);
        this.webGl.context.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
        this.webGl.context.bindFramebuffer(this.webGl.context.FRAMEBUFFER, null);
        this.webGl.context.bindFramebuffer(this.webGl.context.FRAMEBUFFER, this.opaqueFramebufferMSAA);
        this.webGl.context.clearColor(...clearColor);
        this.webGl.context.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
        this.webGl.context.bindFramebuffer(this.webGl.context.FRAMEBUFFER, null);
    }

    gatherNodeIDs(nodeIdx, gltf)
    {
        const gatheredNodeIDs = [];

        function recursiveGather(nodeIndex)
        {
            const node = gltf.nodes[nodeIndex];
 
            if(!node){return}

            gatheredNodeIDs.push(nodeIndex);

            // recurse into children
            for(const child of node.children)
            {
                recursiveGather(child);
            }
        }
 
        recursiveGather(nodeIdx);

        return gatheredNodeIDs;
    }

    gatherNodes(nodeIdx, gltf)
    {
        const gatheredNodeIDs = gatherNodeIDs(nodeIdx, gltf)
        const nodeArray = [];
        for (const nodeID of gatheredNodeIDs)
        {  
            nodeArray.push(state.gltf.nodes[nodeID]); 
        }
        return nodeArray;
    }

    prepareDrawables(state, nodeIDs) 
    {
       
        // collect drawables by essentially zipping primitives (for geometry and material)
        // and nodes for the transform
        
        const nodeArray = []

        for (const nodeID of nodeIDs)
        {  
            nodeArray.push(state.gltf.nodes[nodeID]); 
        }

        const drawables = nodeArray
            .filter(node => node.mesh !== undefined)
            .reduce((acc, node) => acc.concat(state.gltf.meshes[node.mesh].primitives.map( primitive => {
                return  {node: node, primitive: primitive};
            })), [])
            .filter(({primitive}) => primitive.material !== undefined);

        // opaque drawables don't need sorting
        this.opaqueDrawables = drawables
            .filter(({primitive}) => state.gltf.materials[primitive.material].alphaMode !== "BLEND"
                && (state.gltf.materials[primitive.material].extensions === undefined
                    || state.gltf.materials[primitive.material].extensions.KHR_materials_transmission === undefined));

        // transparent drawables need sorting before they can be drawn
        this.transparentDrawables = drawables
            .filter(({primitive}) => state.gltf.materials[primitive.material].alphaMode === "BLEND"
                && (state.gltf.materials[primitive.material].extensions === undefined
                    || state.gltf.materials[primitive.material].extensions.KHR_materials_transmission === undefined));

        this.transmissionDrawables = drawables
            .filter(({primitive}) => state.gltf.materials[primitive.material].extensions !== undefined
                && state.gltf.materials[primitive.material].extensions.KHR_materials_transmission !== undefined);
    }

    getAssetNodeID(gltf, assetID)
    {
        for (let id = 0; id < gltf["nodes"].length; id++) 
        {
            let node =  gltf["nodes"][id]
            if(node === undefined){
                console.error("node undefined")
                continue;
            }
            if(node.hasOwnProperty("extras") && node["extras"]!==undefined)
            {
                if(node["extras"].hasOwnProperty("asset") && node["extras"]["asset"]!==undefined)
                {
                    if( assetID === node["extras"]["asset"])
                    {
                        return id
                    }
                }
            }
        }
        return undefined
    }

    // render complete gltf scene with given camera
    drawScene(state, scene)
    {            
        this.drawEnvironmentMap(state)

        this.sceneNodeIDs = scene.gatherNodeIDs(state.gltf);

        let splitRenderPass = false
        for (const nodeID of this.sceneNodeIDs)
        {  
            const node = state.gltf.nodes[nodeID]
            if(node.extras !== undefined && node.extras.expectAsset !== undefined ) 
            {
                splitRenderPass = true

                let renderNodeID = this.getAssetNodeID(state.gltf, node.extras.expectAsset)
                
                const stateLODLevel = state.renderingParameters.LoD.slice(1, 2);
                let lodMarker = node.extras.expectAsset + "_lod" + stateLODLevel;
                

                if(state.renderingParameters.LoD === "Highest") {
                    for (const level of [0,1,2]){

                        lodMarker = node.extras.expectAsset + "_lod" + level
                        if(this.getAssetNodeID(state.gltf, lodMarker) !==undefined){
                            break
                        }
                    }
                }

                if(state.renderingParameters.LoD === "Distance") {
                    let origin = vec3.create(); 
                    let assetDistance= vec3.distance (origin, this.currentCameraPosition)
                    console.log(assetDistance)
                    let distanceSuggestion = 0 
                    if(assetDistance>300.0)distanceSuggestion=1
                    if(assetDistance>600.0)distanceSuggestion=2
                    lodMarker = node.extras.expectAsset + "_lod" + distanceSuggestion
                }
                

                let viewProjectionMatrix = this.viewProjectionMatrix
                let viewMatrix = this.viewMatrix


                function transformViewProj(v3_in){
                    let v4_in = vec4.fromValues(v3_in[0],v3_in[1],v3_in[2],1.0)
                    let v4 = vec4.create()
                    vec4.transformMat4(v4, v4_in, viewProjectionMatrix )
 
                    let v3 = vec3.fromValues(v4[0],v4[1],v4[2])  
                    vec3.scale(v3, v3, 1.0/v4[3])
                    // [-1 .. +1]
                    
                    vec3.add(v3, v3, vec3.fromValues(1,1,1))
                    vec3.scale(v3, v3, 0.5) 
                    
                    // [0 .. +1]
                    return v3
                }

                function transformView(v3_in){
                    let v4_in = vec4.fromValues(v3_in[0],v3_in[1],v3_in[2],1.0)
                    let v4 = vec4.create()
                    vec4.transformMat4(v4, v4_in, viewMatrix ) 
                    let v3 = vec3.fromValues(v4[0],v4[1],v4[2])                      
                    return v3
                }


                //calculate size of bounding box in camera space:
                let boxVertices = getNodeBoundingBox(state.gltf, renderNodeID)

                for(let i in boxVertices) { 
                    boxVertices[i] = transformView(boxVertices[i],  this.viewMatrix); 
                }

                const worldMin = vec3.clone(boxVertices[0]); // initialize
                const worldMax = vec3.clone(boxVertices[0]);

                for(let i in boxVertices) {
                    for (const component of [0, 1, 2]) {
                        worldMin[component] = Math.min(worldMin[component], boxVertices[i][component]);
                        worldMax[component] = Math.max(worldMax[component], boxVertices[i][component]);
                    }
                }

                const hMeter = (worldMax[0] - worldMin[0])  
                const vMeter = (worldMax[1] - worldMin[1]) 

                // view-dependent bounding box:
                // let diagonalMeters = Math.sqrt(hMeter*hMeter+ vMeter*vMeter)

                // view-independent / static bounding box of asset:
                let diagonalMeters = vec3.distance(boxVertices[0], boxVertices[7])
                
                console.log("diagonal [meter]: " + diagonalMeters)


                //calculate size of bounding box in pixel space:
                boxVertices = getNodeBoundingBox(state.gltf, renderNodeID)
                for(let i in boxVertices) { 
                    boxVertices[i] = transformViewProj(boxVertices[i], viewProjectionMatrix); 
                }

                const pixelMin = vec3.clone(boxVertices[0]); // initialize
                const pixelMax = vec3.clone(boxVertices[0]);

                for(let i in boxVertices) {
                    for (const component of [0, 1, 2]) {
                        pixelMin[component] = Math.min(pixelMin[component], boxVertices[i][component]);
                        pixelMax[component] = Math.max(pixelMax[component], boxVertices[i][component]);
                    }
                }

                const hPixels = (pixelMax[0] - pixelMin[0]) *  this.currentWidth
                const vPixels = (pixelMax[1] - pixelMin[1]) *  this.currentHeight

                let diagonalPixels = Math.sqrt(hPixels*hPixels+ vPixels*vPixels)
                console.log("diagonal [pixel]: " + diagonalPixels)

                let pqpm = diagonalPixels/diagonalMeters
                console.log("pqpm: " + pqpm)
                
                

                const lodNodeID = this.getAssetNodeID(state.gltf, lodMarker)

                if( lodNodeID !== undefined){
                    renderNodeID=lodNodeID
                    //console.log("switching render node:  "+renderNodeID)
                    //console.log(state.gltf)
                }else{
                    //console.log("lod level unavailable: "+stateLODLevel)
                }

                
                const assetNodes = this.gatherNodeIDs(renderNodeID, state.gltf)


                const assetNode = state.gltf.nodes[renderNodeID]

                if(assetNode["extensions"]["gltfx"]["lightSource"] === "scene"){
                    //collect all nodes from the scene
                    this.visibleLights = this.getVisibleLights(state.gltf, this.sceneNodeIDs);
                }

                if(assetNode["extensions"]["gltfx"]["lightSource"] === "asset"){
                    //collect only nodes from the specific asset
                    this.visibleLights = this.getVisibleLights(state.gltf, assetNodes);
                }

                let nodeEnvironment = undefined
                if(assetNode["extensions"]["gltfx"]["environment"] !== undefined){
                    const environmentID=node["extensions"]["gltfx"]["environment"]

                    const environment=state.gltf.environments[environmentID]
                    nodeEnvironment=environment.filteredEnvironment
                }

                this.drawNodes(state, assetNodes, nodeEnvironment)
            }
        }

        if(!splitRenderPass)
        {    
            this.visibleLights = this.getVisibleLights(state.gltf, this.sceneNodeIDs);
            this.drawNodes(state, this.sceneNodeIDs, state.environment)
        }
    } 

    drawEnvironmentMap(state)
    {
        let currentCamera = undefined;
        if (state.cameraIndex === undefined)
        {
            currentCamera = state.userCamera;
        }
        else
        {
            currentCamera = state.gltf.cameras[state.cameraIndex].clone();
        }
        currentCamera.aspectRatio = this.currentWidth / this.currentHeight;
        if(currentCamera.aspectRatio > 1.0) {
            currentCamera.xmag = currentCamera.ymag * currentCamera.aspectRatio; 
        } else {
            currentCamera.ymag = currentCamera.xmag / currentCamera.aspectRatio; 
        }
        this.projMatrix = currentCamera.getProjectionMatrix();
        this.viewMatrix = currentCamera.getViewMatrix(state.gltf);
        mat4.multiply(this.viewProjectionMatrix, this.projMatrix, this.viewMatrix);

        this.webGl.context.bindFramebuffer(this.webGl.context.FRAMEBUFFER, null);
        this.webGl.context.viewport(0, 0,  this.currentWidth, this.currentHeight);
        const fragDefines = [];
        this.pushFragParameterDefines(fragDefines, state);
        this.environmentRenderer.drawEnvironmentMap(this.webGl, this.viewProjectionMatrix, state, this.shaderCache, fragDefines);
    }

    drawNodes(state, nodeIDs, environment)
    {
        // performance optimization
        // if (this.preparedScene !== scene) {
        //     this.preparedScene = scene;
        // }

        this.prepareDrawables(state, nodeIDs);

        let currentCamera = undefined;

        if (state.cameraIndex === undefined)
        {
            currentCamera = state.userCamera;
        }
        else
        {
            currentCamera = state.gltf.cameras[state.cameraIndex].clone();
        }

        currentCamera.aspectRatio = this.currentWidth / this.currentHeight;
        if(currentCamera.aspectRatio > 1.0) {
            currentCamera.xmag = currentCamera.ymag * currentCamera.aspectRatio; 
        } else {
            currentCamera.ymag = currentCamera.xmag / currentCamera.aspectRatio; 
        }

        this.projMatrix = currentCamera.getProjectionMatrix();
        this.viewMatrix = currentCamera.getViewMatrix(state.gltf);
        mat4.multiply(this.viewProjectionMatrix, this.projMatrix, this.viewMatrix);
        this.currentCameraPosition = currentCamera.getPosition(state.gltf);

        if (this.visibleLights.length === 0 && !state.renderingParameters.useIBL &&
            state.renderingParameters.useDirectionalLightsWithDisabledIBL)
        {
            this.visibleLights.push([null, this.lightKey]);
            this.visibleLights.push([null, this.lightFill]);
        }


        // Update skins.
        for (const nodeID of this.sceneNodeIDs)
        {
            const node = state.gltf.nodes[nodeID]
            if (node.mesh !== undefined && node.skin !== undefined)
            {
                this.updateSkin(state, node);
            }
        }

        // If any transmissive drawables are present, render all opaque and transparent drawables into a separate framebuffer.
        if (this.transmissionDrawables.length > 0) {
            // Render transmission sample texture
            this.webGl.context.bindFramebuffer(this.webGl.context.FRAMEBUFFER, this.opaqueFramebufferMSAA);
            this.webGl.context.viewport(0, 0, this.opaqueFramebufferWidth, this.opaqueFramebufferHeight);

            // Render environment for the transmission background
            this.environmentRenderer.drawEnvironmentMap(this.webGl, this.viewProjectionMatrix, state, this.shaderCache, ["LINEAR_OUTPUT 1"]);

            for (const drawable of this.opaqueDrawables)
            {
                let renderpassConfiguration = {};
                renderpassConfiguration.linearOutput = true;
                this.drawPrimitive(state, renderpassConfiguration, drawable.primitive, drawable.node, this.viewProjectionMatrix);
            }

            this.transparentDrawables = currentCamera.sortPrimitivesByDepth(state.gltf, this.transparentDrawables);
            for (const drawable of this.transparentDrawables)
            {
                let renderpassConfiguration = {};
                renderpassConfiguration.linearOutput = true;
                this.drawPrimitive(state, renderpassConfiguration, drawable.primitive, drawable.node, this.viewProjectionMatrix);
            }

            // "blit" the multisampled opaque texture into the color buffer, which adds antialiasing
            this.webGl.context.bindFramebuffer(this.webGl.context.READ_FRAMEBUFFER, this.opaqueFramebufferMSAA);
            this.webGl.context.bindFramebuffer(this.webGl.context.DRAW_FRAMEBUFFER, this.opaqueFramebuffer);
            this.webGl.context.blitFramebuffer(0, 0, this.opaqueFramebufferWidth, this.opaqueFramebufferHeight, 0, 0, this.opaqueFramebufferWidth, this.opaqueFramebufferHeight, this.webGl.context.COLOR_BUFFER_BIT, this.webGl.context.NEAREST);

            // Create Framebuffer Mipmaps
            this.webGl.context.bindTexture(this.webGl.context.TEXTURE_2D, this.opaqueRenderTexture);

            this.webGl.context.generateMipmap(this.webGl.context.TEXTURE_2D);
        }

        // Render to canvas
        this.webGl.context.bindFramebuffer(this.webGl.context.FRAMEBUFFER, null);
        this.webGl.context.viewport(0, 0,  this.currentWidth, this.currentHeight);

        const fragDefines = [];
        this.pushFragParameterDefines(fragDefines, state);

        for (const drawable of this.opaqueDrawables)
        {  
            let renderpassConfiguration = {};
            renderpassConfiguration.linearOutput = false;
            this.drawPrimitive(state, renderpassConfiguration, drawable.primitive, drawable.node, this.viewProjectionMatrix, undefined, environment);
        }

        // filter materials with transmission extension
        this.transmissionDrawables = currentCamera.sortPrimitivesByDepth(state.gltf, this.transmissionDrawables);
        for (const drawable of this.transmissionDrawables.filter((a) => a.depth <= 0))
        {
            let renderpassConfiguration = {};
            renderpassConfiguration.linearOutput = false;
            this.drawPrimitive(state, renderpassConfiguration, drawable.primitive, drawable.node, this.viewProjectionMatrix, this.opaqueRenderTexture, environment);
        }


        this.transparentDrawables = currentCamera.sortPrimitivesByDepth(state.gltf, this.transparentDrawables);
        for (const drawable of this.transparentDrawables.filter((a) => a.depth <= 0))
        {
            let renderpassConfiguration = {};
            renderpassConfiguration.linearOutput = false;
            this.drawPrimitive(state, renderpassConfiguration, drawable.primitive, drawable.node, this.viewProjectionMatrix, undefined, environment);
        }
    }

    // vertices with given material
    drawPrimitive(state, renderpassConfiguration, primitive, node, viewProjectionMatrix, transmissionSampleTexture, environment=undefined)
    {
        if (primitive.skip) return;

        if(environment === undefined)
        {
            environment = state.environment
        }

        let material;
        if(primitive.mappings !== undefined && state.variant != "default")
        {
            const names = state.gltf.variants.map(obj => obj.name);
            const idx = names.indexOf(state.variant);
            let materialIdx = primitive.material;
            primitive.mappings.forEach(element => {
                if(element.variants.indexOf(idx) >= 0)
                {
                    materialIdx = element.material;
                }
            });
            material = state.gltf.materials[materialIdx];
        }
        else
        {
            material = state.gltf.materials[primitive.material];
        }

        //select shader permutation, compile and link program.

        let vertDefines = [];
        this.pushVertParameterDefines(vertDefines, state.renderingParameters, state.gltf, node, primitive);
        vertDefines = primitive.getDefines().concat(vertDefines);

        let fragDefines = material.getDefines(state.renderingParameters).concat(vertDefines);
        if(renderpassConfiguration.linearOutput === true)
        {
            fragDefines.push("LINEAR_OUTPUT 1");
        }
        this.pushFragParameterDefines(fragDefines, state);
        
        const fragmentHash = this.shaderCache.selectShader(material.getShaderIdentifier(), fragDefines);
        const vertexHash = this.shaderCache.selectShader(primitive.getShaderIdentifier(), vertDefines);

        if (fragmentHash && vertexHash)
        {
            this.shader = this.shaderCache.getShaderProgram(fragmentHash, vertexHash);
        }

        if (this.shader === undefined)
        {
            return;
        }

        this.webGl.context.useProgram(this.shader.program);

        if (state.renderingParameters.usePunctual)
        {
            this.applyLights();
        }

        // update model dependant matrices once per node
        this.shader.updateUniform("u_ViewProjectionMatrix", viewProjectionMatrix);
        this.shader.updateUniform("u_ModelMatrix", node.worldTransform);
        this.shader.updateUniform("u_NormalMatrix", node.normalMatrix, false);
        this.shader.updateUniform("u_Exposure", state.renderingParameters.exposure, false);
        this.shader.updateUniform("u_Camera", this.currentCameraPosition, false);

        this.updateAnimationUniforms(state, node, primitive);

        if (mat4.determinant(node.worldTransform) < 0.0)
        {
            this.webGl.context.frontFace(GL.CW);
        }
        else
        {
            this.webGl.context.frontFace(GL.CCW);
        }

        if (material.doubleSided)
        {
            this.webGl.context.disable(GL.CULL_FACE);
        }
        else
        {
            this.webGl.context.enable(GL.CULL_FACE);
        }

        if (material.alphaMode === 'BLEND')
        {
            this.webGl.context.enable(GL.BLEND);
            this.webGl.context.blendFuncSeparate(GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA, GL.ONE, GL.ONE_MINUS_SRC_ALPHA);
            this.webGl.context.blendEquation(GL.FUNC_ADD);
        }
        else
        {
            this.webGl.context.disable(GL.BLEND);
        }

        const drawIndexed = primitive.indices !== undefined;
        if (drawIndexed)
        {
            if (!this.webGl.setIndices(state.gltf, primitive.indices))
            {
                return;
            }
        }

        let vertexCount = 0;
        for (const attribute of primitive.glAttributes)
        {
            const gltfAccessor = state.gltf.accessors[attribute.accessor];
            vertexCount = gltfAccessor.count;

            const location = this.shader.getAttributeLocation(attribute.name);
            if (location === null)
            {
                continue; // only skip this attribute
            }
            if (!this.webGl.enableAttribute(state.gltf, location, gltfAccessor))
            {
                return; // skip this primitive
            }
        }

        for (let [uniform, val] of material.getProperties().entries())
        {
            this.shader.updateUniform(uniform, val, false);
        }

        let textureIndex = 0;
        for (; textureIndex < material.textures.length; ++textureIndex)
        {
            let info = material.textures[textureIndex];
            const location = this.shader.getUniformLocation(info.samplerName);
            if (!this.webGl.setTexture(location, state.gltf, info, textureIndex))
            {
                continue;
            }
        }

        // set the morph target texture
        if (primitive.morphTargetTextureInfo !== undefined) 
        {
            const location = this.shader.getUniformLocation(primitive.morphTargetTextureInfo.samplerName);
            this.webGl.setTexture(location, state.gltf, primitive.morphTargetTextureInfo, textureIndex); // binds texture and sampler
            textureIndex++;
        }

        // set the joints texture
        if (state.renderingParameters.skinning && node.skin !== undefined && primitive.hasWeights && primitive.hasJoints) 
        {
            const skin = state.gltf.skins[node.skin];
            const location = this.shader.getUniformLocation(skin.jointTextureInfo.samplerName);
            this.webGl.setTexture(location, state.gltf, skin.jointTextureInfo, textureIndex); // binds texture and sampler
            textureIndex++;
        }

        if (state.renderingParameters.useIBL && state.environment !== undefined)
        {
            textureIndex = this.applyEnvironmentMap(state,environment, textureIndex);
        }

        if (state.renderingParameters.useIBL && state.environment !== undefined)
        {
            this.webGl.setTexture(this.shader.getUniformLocation("u_SheenELUT"), state.environment, state.environment.sheenELUT, textureIndex++);
        }

        if(transmissionSampleTexture !== undefined && state.renderingParameters.useIBL
                    && state.environment && state.renderingParameters.enabledExtensions.KHR_materials_transmission)
        {
            this.webGl.context.activeTexture(GL.TEXTURE0 + textureIndex);
            this.webGl.context.bindTexture(this.webGl.context.TEXTURE_2D, this.opaqueRenderTexture);
            this.webGl.context.uniform1i(this.shader.getUniformLocation("u_TransmissionFramebufferSampler"), textureIndex);
            textureIndex++;

            this.webGl.context.uniform2i(this.shader.getUniformLocation("u_TransmissionFramebufferSize"), this.opaqueFramebufferWidth, this.opaqueFramebufferHeight);

            this.webGl.context.uniformMatrix4fv(this.shader.getUniformLocation("u_ModelMatrix"),false, node.worldTransform);
            this.webGl.context.uniformMatrix4fv(this.shader.getUniformLocation("u_ViewMatrix"),false, this.viewMatrix);
            this.webGl.context.uniformMatrix4fv(this.shader.getUniformLocation("u_ProjectionMatrix"),false, this.projMatrix);
        }

        if (drawIndexed)
        {
            const indexAccessor = state.gltf.accessors[primitive.indices];
            this.webGl.context.drawElements(primitive.mode, indexAccessor.count, indexAccessor.componentType, 0);
        }
        else
        {
            this.webGl.context.drawArrays(primitive.mode, 0, vertexCount);
        }

        for (const attribute of primitive.glAttributes)
        {
            const location = this.shader.getAttributeLocation(attribute.name);
            if (location === null)
            {
                continue; // skip this attribute
            }
            this.webGl.context.disableVertexAttribArray(location);
        }
    }

    /// Compute a list of lights instantiated by one or more nodes as a list of node-light tuples.
    getVisibleLights(gltf, nodes)
    {
        let nodeLights = [];

        for (const nodeIndex of nodes) {
            const node = gltf.nodes[nodeIndex];

            if (node.children !== undefined) {
                nodeLights = nodeLights.concat(this.getVisibleLights(gltf, node.children));
            }

            const lightIndex = node.extensions?.KHR_lights_punctual?.light;
            if (lightIndex === undefined) {
                continue;
            }
            const light = gltf.lights[lightIndex];
            nodeLights.push([node, light]);
        }

        return nodeLights;
    }

    updateSkin(state, node)
    {
        if (state.renderingParameters.skinning && state.gltf.skins !== undefined)
        {
            const skin = state.gltf.skins[node.skin];
            skin.computeJoints(state.gltf, node, this.webGl.context);
        }
    }

    pushVertParameterDefines(vertDefines, parameters, gltf, node, primitive)
    {
        // skinning
        if (parameters.skinning && node.skin !== undefined && primitive.hasWeights && primitive.hasJoints)
        {
            vertDefines.push("USE_SKINNING 1");
        }

        // morphing
        if (parameters.morphing && node.mesh !== undefined && primitive.targets.length > 0)
        {
            const mesh = gltf.meshes[node.mesh];
            if (mesh.getWeightsAnimated() !== undefined && mesh.getWeightsAnimated().length > 0)
            {
                vertDefines.push("USE_MORPHING 1");
                vertDefines.push("WEIGHT_COUNT " + mesh.getWeightsAnimated().length);
            }
        }
    }

    updateAnimationUniforms(state, node, primitive)
    {
        if (state.renderingParameters.morphing && node.mesh !== undefined && primitive.targets.length > 0)
        {
            const mesh = state.gltf.meshes[node.mesh];
            const weightsAnimated = mesh.getWeightsAnimated();
            if (weightsAnimated !== undefined && weightsAnimated.length > 0)
            {
                this.shader.updateUniformArray("u_morphWeights", weightsAnimated);
            }
        }
    }

    pushFragParameterDefines(fragDefines, state)
    {
        if (state.renderingParameters.usePunctual)
        {
            fragDefines.push("USE_PUNCTUAL 1");
            fragDefines.push(`LIGHT_COUNT ${this.visibleLights.length}`);
        }

        if (state.renderingParameters.useIBL && state.environment)
        {
            fragDefines.push("USE_IBL 1");
        }

        switch (state.renderingParameters.toneMap)
        {
        case (GltfState.ToneMaps.ACES_NARKOWICZ):
            fragDefines.push("TONEMAP_ACES_NARKOWICZ 1");
            break;
        case (GltfState.ToneMaps.ACES_HILL):
            fragDefines.push("TONEMAP_ACES_HILL 1");
            break;
        case (GltfState.ToneMaps.ACES_HILL_EXPOSURE_BOOST):
            fragDefines.push("TONEMAP_ACES_HILL_EXPOSURE_BOOST 1");
            break;
        case (GltfState.ToneMaps.NONE):
        default:
            break;
        }

        let debugOutputMapping = [
            {debugOutput: GltfState.DebugOutput.NONE, shaderDefine: "DEBUG_NONE"},
            
            {debugOutput: GltfState.DebugOutput.generic.WORLDSPACENORMAL, shaderDefine: "DEBUG_NORMAL_SHADING"},
            {debugOutput: GltfState.DebugOutput.generic.NORMAL, shaderDefine: "DEBUG_NORMAL_TEXTURE"},
            {debugOutput: GltfState.DebugOutput.generic.GEOMETRYNORMAL, shaderDefine: "DEBUG_NORMAL_GEOMETRY"},
            {debugOutput: GltfState.DebugOutput.generic.TANGENT, shaderDefine: "DEBUG_TANGENT"},
            {debugOutput: GltfState.DebugOutput.generic.BITANGENT, shaderDefine: "DEBUG_BITANGENT"},
            {debugOutput: GltfState.DebugOutput.generic.ALPHA, shaderDefine: "DEBUG_ALPHA"},
            {debugOutput: GltfState.DebugOutput.generic.UV_COORDS_0, shaderDefine: "DEBUG_UV_0"},
            {debugOutput: GltfState.DebugOutput.generic.UV_COORDS_1, shaderDefine: "DEBUG_UV_1"},
            {debugOutput: GltfState.DebugOutput.generic.OCCLUSION, shaderDefine: "DEBUG_OCCLUSION"},
            {debugOutput: GltfState.DebugOutput.generic.EMISSIVE, shaderDefine: "DEBUG_EMISSIVE"},

            {debugOutput: GltfState.DebugOutput.mr.METALLIC_ROUGHNESS, shaderDefine: "DEBUG_METALLIC_ROUGHNESS"},
            {debugOutput: GltfState.DebugOutput.mr.BASECOLOR, shaderDefine: "DEBUG_BASE_COLOR"},
            {debugOutput: GltfState.DebugOutput.mr.ROUGHNESS, shaderDefine: "DEBUG_ROUGHNESS"},
            {debugOutput: GltfState.DebugOutput.mr.METALLIC, shaderDefine: "DEBUG_METALLIC"},
            
            {debugOutput: GltfState.DebugOutput.clearcoat.CLEARCOAT, shaderDefine: "DEBUG_CLEARCOAT"},
            {debugOutput: GltfState.DebugOutput.clearcoat.CLEARCOAT_FACTOR, shaderDefine: "DEBUG_CLEARCOAT_FACTOR"},
            {debugOutput: GltfState.DebugOutput.clearcoat.CLEARCOAT_ROUGHNESS, shaderDefine: "DEBUG_CLEARCOAT_ROUGHNESS"},
            {debugOutput: GltfState.DebugOutput.clearcoat.CLEARCOAT_NORMAL, shaderDefine: "DEBUG_CLEARCOAT_NORMAL"},
            
            {debugOutput: GltfState.DebugOutput.sheen.SHEEN, shaderDefine: "DEBUG_SHEEN"},
            {debugOutput: GltfState.DebugOutput.sheen.SHEEN_COLOR, shaderDefine: "DEBUG_SHEEN_COLOR"},
            {debugOutput: GltfState.DebugOutput.sheen.SHEEN_ROUGHNESS, shaderDefine: "DEBUG_SHEEN_ROUGHNESS"},

            {debugOutput: GltfState.DebugOutput.specular.SPECULAR, shaderDefine: "DEBUG_SPECULAR"},
            {debugOutput: GltfState.DebugOutput.specular.SPECULAR_FACTOR, shaderDefine: "DEBUG_SPECULAR_FACTOR"},
            {debugOutput: GltfState.DebugOutput.specular.SPECULAR_COLOR, shaderDefine: "DEBUG_SPECULAR_COLOR"},

            {debugOutput: GltfState.DebugOutput.transmission.TRANSMISSION_VOLUME, shaderDefine: "DEBUG_TRANSMISSION_VOLUME"},
            {debugOutput: GltfState.DebugOutput.transmission.TRANSMISSION_FACTOR, shaderDefine: "DEBUG_TRANSMISSION_FACTOR"},
            {debugOutput: GltfState.DebugOutput.transmission.VOLUME_THICKNESS, shaderDefine: "DEBUG_VOLUME_THICKNESS"},

            {debugOutput: GltfState.DebugOutput.iridescence.IRIDESCENCE, shaderDefine: "DEBUG_IRIDESCENCE"},
            {debugOutput: GltfState.DebugOutput.iridescence.IRIDESCENCE_FACTOR, shaderDefine: "DEBUG_IRIDESCENCE_FACTOR"},
            {debugOutput: GltfState.DebugOutput.iridescence.IRIDESCENCE_THICKNESS, shaderDefine: "DEBUG_IRIDESCENCE_THICKNESS"},

            {debugOutput: GltfState.DebugOutput.anisotropy.ANISOTROPIC_STRENGTH, shaderDefine: "DEBUG_ANISOTROPIC_STRENGTH"},
            {debugOutput: GltfState.DebugOutput.anisotropy.ANISOTROPIC_DIRECTION, shaderDefine: "DEBUG_ANISOTROPIC_DIRECTION"},
        ];

        let mappingCount = 0;
        let mappingFound = false;
        for (let mapping of debugOutputMapping) {
            fragDefines.push(mapping.shaderDefine+" "+mappingCount++);
            if(state.renderingParameters.debugOutput == mapping.debugOutput){
                fragDefines.push("DEBUG "+mapping.shaderDefine);
                mappingFound = true;
            }
        }

        if(mappingFound == false) { // fallback
            fragDefines.push("DEBUG DEBUG_NONE");
        }

    }

    applyLights()
    {
        const uniforms = [];
        for (const [node, light] of this.visibleLights)
        {
            uniforms.push(light.toUniform(node));
        }
        if (uniforms.length > 0)
        {
            this.shader.updateUniform("u_Lights", uniforms);
        }
    }

    applyEnvironmentMap(state, environment, texSlotOffset)
    {
        //const environment = state.environment;
        this.webGl.setTexture(this.shader.getUniformLocation("u_LambertianEnvSampler"), environment, environment.diffuseEnvMap, texSlotOffset++);

        this.webGl.setTexture(this.shader.getUniformLocation("u_GGXEnvSampler"), environment, environment.specularEnvMap, texSlotOffset++);
        this.webGl.setTexture(this.shader.getUniformLocation("u_GGXLUT"), environment, environment.lut, texSlotOffset++);

        this.webGl.setTexture(this.shader.getUniformLocation("u_CharlieEnvSampler"), environment, environment.sheenEnvMap, texSlotOffset++);
        this.webGl.setTexture(this.shader.getUniformLocation("u_CharlieLUT"), environment, environment.sheenLUT, texSlotOffset++);

        this.shader.updateUniform("u_MipCount", environment.mipCount);

        let rotMatrix4 = mat4.create();
        mat4.rotateY(rotMatrix4, rotMatrix4,  state.renderingParameters.environmentRotation / 180.0 * Math.PI);
        let rotMatrix3 = mat3.create();
        mat3.fromMat4(rotMatrix3, rotMatrix4);
        this.shader.updateUniform("u_EnvRotation", rotMatrix3);

        let environmentIntensity = state.renderingParameters.iblIntensity
        if (  environment.intensity)
        {
            environmentIntensity *= environment.intensity
        }
        this.shader.updateUniform("u_EnvIntensity", environmentIntensity);

        return texSlotOffset;
    }

    destroy()
    {
        this.shaderCache.destroy();
    }
}

export { gltfRenderer };
