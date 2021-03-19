import { mat4, mat3, vec3, quat } from 'gl-matrix';
import { ShaderCache } from './shader_cache.js';
import { GltfState } from '../GltfState/gltf_state.js';
import { gltfWebGl, GL } from './webgl.js';
import { EnvironmentRenderer } from './environment_renderer.js'

import pbrShader from './shaders/pbr.frag';
import brdfShader from './shaders/brdf.glsl';
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

class gltfRenderer
{
    constructor(context)
    {
        this.shader = undefined; // current shader

        this.currentWidth = 0;
        this.currentHeight = 0;

        this.webGl = new gltfWebGl(context);

        // create render target for non transmission materials
        this.opaqueRenderTexture = 0;
        this.opaqueFramebuffer = 0;
        this.opaqueDepthTexture = 0;
        this.opaqueFramebufferWidth = 1024;
        this.opaqueFramebufferHeight = 1024;

        const shaderSources = new Map();
        shaderSources.set("primitive.vert", primitiveShader);
        shaderSources.set("pbr.frag", pbrShader);
        shaderSources.set("brdf.glsl", brdfShader);
        shaderSources.set("ibl.glsl", iblShader);
        shaderSources.set("punctual.glsl", punctualShader);
        shaderSources.set("tonemapping.glsl", tonemappingShader);
        shaderSources.set("textures.glsl", texturesShader);
        shaderSources.set("functions.glsl", shaderFunctions);
        shaderSources.set("animation.glsl", animationShader);
        shaderSources.set("cubemap.vert", cubemapVertShader);
        shaderSources.set("cubemap.frag", cubemapFragShader);

        this.shaderCache = new ShaderCache(shaderSources, this.webGl);

        let requiredWebglExtensions = [
            "EXT_texture_filter_anisotropic",
            "OES_texture_float_linear"
        ];

        this.webGl.loadWebGlExtensions(requiredWebglExtensions);

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

        this.init();

        this.environmentRenderer = new EnvironmentRenderer(this.webGl);
    }

    /////////////////////////////////////////////////////////////////////
    // Render glTF scene graph
    /////////////////////////////////////////////////////////////////////

    // app state
    init()
    {
        const context = this.webGl.context;
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
        context.texImage2D( context.TEXTURE_2D,
                            0,
                            context.RGBA,
                            this.opaqueFramebufferWidth,
                            this.opaqueFramebufferHeight,
                            0,
                            context.RGBA,
                            context.UNSIGNED_BYTE,
                            null);
        context.bindTexture(context.TEXTURE_2D, null);

        this.opaqueDepthTexture = context.createTexture();
        context.bindTexture(context.TEXTURE_2D, this.opaqueDepthTexture);
        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.NEAREST);
        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);
        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.NEAREST);
        context.texImage2D( context.TEXTURE_2D,
                            0,
                            context.DEPTH_COMPONENT16,
                            this.opaqueFramebufferWidth,
                            this.opaqueFramebufferHeight,
                            0,
                            context.DEPTH_COMPONENT,
                            context.UNSIGNED_SHORT,
                            null);
        context.bindTexture(context.TEXTURE_2D, null);

        this.opaqueFramebuffer = context.createFramebuffer();
        context.bindFramebuffer(context.FRAMEBUFFER, this.opaqueFramebuffer);
        context.framebufferTexture2D(context.FRAMEBUFFER, context.COLOR_ATTACHMENT0, context.TEXTURE_2D, this.opaqueRenderTexture, 0);
        context.framebufferTexture2D(context.FRAMEBUFFER, context.DEPTH_ATTACHMENT, context.TEXTURE_2D, this.opaqueDepthTexture, 0);
        context.viewport(0, 0, this.currentWidth, this.currentHeight);
        context.bindFramebuffer(context.FRAMEBUFFER, null);

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
        this.webGl.context.clearColor(clearColor[0] / 255.0, clearColor[1] / 255.0, clearColor[2] / 255.0, clearColor[3] / 255.0);
        this.webGl.context.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
        this.webGl.context.bindFramebuffer(this.webGl.context.FRAMEBUFFER, this.opaqueFramebuffer);
        this.webGl.context.clearColor(clearColor[0] / 255.0, clearColor[1] / 255.0, clearColor[2] / 255.0, clearColor[3] / 255.0);
        this.webGl.context.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
        this.webGl.context.bindFramebuffer(this.webGl.context.FRAMEBUFFER, null);
    }

    // render complete gltf scene with given camera
    drawScene(state, scene)
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

        this.projMatrix = currentCamera.getProjectionMatrix();
        this.viewMatrix = currentCamera.getViewMatrix(state.gltf);
        this.currentCameraPosition = currentCamera.getPosition(state.gltf);

        this.visibleLights = this.getVisibleLights(state.gltf, scene);
        if (this.visibleLights.length === 0 && !state.renderingParameters.useIBL &&
            state.renderingParameters.useDirectionalLightsWithDisabledIBL)
        {
            this.visibleLights.push(this.lightKey);
            this.visibleLights.push(this.lightFill);
        }

        mat4.multiply(this.viewProjectionMatrix, this.projMatrix, this.viewMatrix);

        const nodes = scene.gatherNodes(state.gltf);

        // Update skins.
        for (const node of nodes)
        {
            if (node.mesh !== undefined && node.skin !== undefined)
            {
                this.updateSkin(state, node);
            }
        }

        // collect drawables by essentially zipping primitives (for geometry and material)
        // and nodes for the transform
        const drawables = nodes
            .filter(node => node.mesh !== undefined)
            .reduce((acc, node) => acc.concat(state.gltf.meshes[node.mesh].primitives.map( primitive => {
                return  {node: node, primitive: primitive};
            })), [])
            .filter(({node, primitive}) => primitive.material !== undefined);

        // opaque drawables don't need sorting
        const opaqueDrawables = drawables
            .filter(({node, primitive}) => state.gltf.materials[primitive.material].alphaMode !== "BLEND"
                && (state.gltf.materials[primitive.material].extensions === undefined
                    || state.gltf.materials[primitive.material].extensions.KHR_materials_transmission === undefined));

        // transparent drawables need sorting before they can be drawn
        let transparentDrawables = drawables
            .filter(({node, primitive}) => state.gltf.materials[primitive.material].alphaMode === "BLEND"
                && (state.gltf.materials[primitive.material].extensions === undefined
                    || state.gltf.materials[primitive.material].extensions.KHR_materials_transmission === undefined));
        transparentDrawables = currentCamera.sortPrimitivesByDepth(state.gltf, transparentDrawables);

        // Render transmission sample texture
        this.webGl.context.bindFramebuffer(this.webGl.context.FRAMEBUFFER, this.opaqueFramebuffer);
        this.webGl.context.viewport(0, 0, this.opaqueFramebufferWidth, this.opaqueFramebufferHeight);

        // Render environment for the transmission background
        this.pushFragParameterDefines([], state);
        this.environmentRenderer.drawEnvironmentMap(this.webGl, this.viewProjectionMatrix, state, this.shaderCache, []);

        for (const drawable of opaqueDrawables)
        {
            this.drawPrimitive(state, drawable.primitive, drawable.node, this.viewProjectionMatrix);
        }
        for (const drawable of transparentDrawables)
        {
            this.drawPrimitive(state, drawable.primitive, drawable.node, this.viewProjectionMatrix);
        }

        //Reset Viewport
        this.webGl.context.viewport(0, 0,  this.currentWidth, this.currentHeight);

        //Create Framebuffer Mipmaps
        this.webGl.context.bindTexture(this.webGl.context.TEXTURE_2D, this.opaqueRenderTexture);
        this.webGl.context.generateMipmap(this.webGl.context.TEXTURE_2D);

        // Render to canvas
        this.webGl.context.bindFramebuffer(this.webGl.context.FRAMEBUFFER, null);
        this.webGl.context.viewport(0, 0,  this.currentWidth, this.currentHeight);

        // Render environment
        const fragDefines = [];
        this.pushFragParameterDefines(fragDefines, state);
        this.environmentRenderer.drawEnvironmentMap(this.webGl, this.viewProjectionMatrix, state, this.shaderCache, fragDefines);

        for (const drawable of opaqueDrawables)
        {
            this.drawPrimitive(state, drawable.primitive, drawable.node, this.viewProjectionMatrix);
        }

        // filter materials with transmission extension
        let transmissionDrawables = drawables
            .filter(({node, primitive}) => state.gltf.materials[primitive.material].extensions !== undefined
                && state.gltf.materials[primitive.material].extensions.KHR_materials_transmission !== undefined);
        transmissionDrawables = currentCamera.sortPrimitivesByDepth(state.gltf, transmissionDrawables);
        for (const drawable of transmissionDrawables)
        {
            this.drawPrimitive(state, drawable.primitive, drawable.node, this.viewProjectionMatrix, this.opaqueRenderTexture);
        }

        for (const drawable of transparentDrawables)
        {
            this.drawPrimitive(state, drawable.primitive, drawable.node, this.viewProjectionMatrix);
        }
    }

    // vertices with given material
    drawPrimitive(state, primitive, node, viewProjectionMatrix, transmissionSampleTexture)
    {
        if (primitive.skip) return;

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
            this.applyLights(state.gltf);
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
            if (location < 0)
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

        for (let i = 0; i < material.textures.length; ++i)
        {
            let info = material.textures[i];
            const location = this.shader.getUniformLocation(info.samplerName);
            if (location < 0)
            {
                continue; // only skip this texture
            }
            if (!this.webGl.setTexture(location, state.gltf, info, i)) // binds texture and sampler
            {
                return; // skip this material
            }
        }

        let textureCount = material.textures.length;
        if (state.renderingParameters.useIBL && state.environment !== undefined)
        {
            textureCount = this.applyEnvironmentMap(state, textureCount);
        }

        if (state.renderingParameters.usePunctual && state.environment !== undefined)
        {
            this.webGl.setTexture(this.shader.getUniformLocation("u_SheenELUT"), state.environment, state.environment.sheenELUT, textureCount++);
        }

        if(transmissionSampleTexture !== undefined && (state.renderingParameters.useIBL || state.renderingParameters.usePunctual)
                    && state.environment && state.renderingParameters.transmission)
        {
            this.webGl.context.activeTexture(GL.TEXTURE0 + textureCount);
            this.webGl.context.bindTexture(this.webGl.context.TEXTURE_2D, this.opaqueRenderTexture);
            this.webGl.context.uniform1i(this.shader.getUniformLocation("u_TransmissionFramebufferSampler"), textureCount);
            textureCount++;

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
            if (location < 0)
            {
                continue; // skip this attribute
            }
            this.webGl.context.disableVertexAttribArray(location);
        }
    }

    // returns all lights that are relevant for rendering or the default light if there are none
    getVisibleLights(gltf, scene)
    {
        let lights = [];
        for (let light of gltf.lights)
        {
            if (light.node !== undefined)
            {
                if (scene.includesNode(gltf, light.node))
                {
                    lights.push(light);
                }
            }
        }
        return lights;
    }

    updateSkin(state, node)
    {
        if (state.renderingParameters.skinning && state.gltf.skins !== undefined)
        {
            const skin = state.gltf.skins[node.skin];
            skin.computeJoints(state.gltf, node);
        }
    }

    pushVertParameterDefines(vertDefines, parameters, gltf, node, primitive)
    {
        // skinning
        if (parameters.skinning && node.skin !== undefined && primitive.hasWeights && primitive.hasJoints)
        {
            const skin = gltf.skins[node.skin];

            vertDefines.push("USE_SKINNING 1");
            vertDefines.push("JOINT_COUNT " + skin.jointMatrices.length);
        }

        // morphing
        if (parameters.morphing && node.mesh !== undefined && primitive.targets.length > 0)
        {
            const mesh = gltf.meshes[node.mesh];
            if (mesh.getWeightsAnimated() !== undefined && mesh.getWeightsAnimated().length > 0)
            {
                vertDefines.push("USE_MORPHING 1");
                vertDefines.push("WEIGHT_COUNT " + Math.min(mesh.getWeightsAnimated().length, 8));
            }
        }
    }

    updateAnimationUniforms(state, node, primitive)
    {
        if (state.renderingParameters.skinning && node.skin !== undefined && primitive.hasWeights && primitive.hasJoints)
        {
            const skin = state.gltf.skins[node.skin];

            this.shader.updateUniform("u_jointMatrix", skin.jointMatrices);
            if(primitive.hasNormals)
            {
                this.shader.updateUniform("u_jointNormalMatrix", skin.jointNormalMatrices);
            }
        }

        if (state.renderingParameters.morphing && node.mesh !== undefined && primitive.targets.length > 0)
        {
            const mesh = state.gltf.meshes[node.mesh];
            if (mesh.getWeightsAnimated() !== undefined && mesh.getWeightsAnimated().length > 0)
            {
                this.shader.updateUniformArray("u_morphWeights", mesh.getWeightsAnimated());
            }
        }
    }

    pushFragParameterDefines(fragDefines, state)
    {
        if (state.renderingParameters.usePunctual)
        {
            fragDefines.push("USE_PUNCTUAL 1");
            fragDefines.push("LIGHT_COUNT " + this.visibleLights.length);
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
        case (GltfState.ToneMaps.ACES_3D_COMMERCE):
            fragDefines.push("TONEMAP_ACES_3D_COMMERCE 1");
            break;
        case (GltfState.ToneMaps.NONE):
        default:
            break;
        }

        if (state.renderingParameters.debugOutput !== GltfState.DebugOutput.NONE)
        {
            fragDefines.push("DEBUG_OUTPUT 1");
        }

        switch (state.renderingParameters.debugOutput)
        {
        case (GltfState.DebugOutput.METALLIC):
            fragDefines.push("DEBUG_METALLIC 1");
            break;
        case (GltfState.DebugOutput.ROUGHNESS):
            fragDefines.push("DEBUG_ROUGHNESS 1");
            break;
        case (GltfState.DebugOutput.NORMAL):
            fragDefines.push("DEBUG_NORMAL 1");
            break;
        case (GltfState.DebugOutput.WORLDSPACENORMAL):
            fragDefines.push("DEBUG_WORLDSPACE_NORMAL 1");
            break;
        case (GltfState.DebugOutput.GEOMETRYNORMAL):
            fragDefines.push("DEBUG_GEOMETRY_NORMAL 1");
            break;
        case (GltfState.DebugOutput.TANGENT):
            fragDefines.push("DEBUG_TANGENT 1");
            break;
        case (GltfState.DebugOutput.BITANGENT):
            fragDefines.push("DEBUG_BITANGENT 1");
            break;
        case (GltfState.DebugOutput.BASECOLOR):
            fragDefines.push("DEBUG_BASECOLOR 1");
            break;
        case (GltfState.DebugOutput.OCCLUSION):
            fragDefines.push("DEBUG_OCCLUSION 1");
            break;
        case (GltfState.DebugOutput.EMISSIVE):
            fragDefines.push("DEBUG_FEMISSIVE 1");
            break;
        case (GltfState.DebugOutput.SPECULAR):
            fragDefines.push("DEBUG_FSPECULAR 1");
            break;
        case (GltfState.DebugOutput.DIFFUSE):
            fragDefines.push("DEBUG_FDIFFUSE 1");
            break;
        case (GltfState.DebugOutput.THICKNESS):
            fragDefines.push("DEBUG_THICKNESS 1");
            break;
        case (GltfState.DebugOutput.CLEARCOAT):
            fragDefines.push("DEBUG_FCLEARCOAT 1");
            break;
        case (GltfState.DebugOutput.SHEEN):
            fragDefines.push("DEBUG_FSHEEN 1");
            break;
        case (GltfState.DebugOutput.SUBSURFACE):
            fragDefines.push("DEBUG_FSUBSURFACE 1");
            break;
        case (GltfState.DebugOutput.TRANSMISSION):
            fragDefines.push("DEBUG_FTRANSMISSION 1");
            break;
        case (GltfState.DebugOutput.F0):
            fragDefines.push("DEBUG_F0 1");
            break;
        case (GltfState.DebugOutput.ALPHA):
            fragDefines.push("DEBUG_ALPHA 1");
            break;
        }
    }

    applyLights(gltf)
    {
        let uniformLights = [];
        for (let light of this.visibleLights)
        {
            uniformLights.push(light.toUniform(gltf));
        }

        if (uniformLights.length > 0)
        {
            this.shader.updateUniform("u_Lights", uniformLights);
        }
    }

    applyEnvironmentMap(state, texSlotOffset)
    {
        const environment = state.environment;
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
        this.shader.updateUniform("u_envRotation", rotMatrix3);

        return texSlotOffset;
    }

    destroy()
    {
        this.shaderCache.destroy();
    }
}

export { gltfRenderer };
