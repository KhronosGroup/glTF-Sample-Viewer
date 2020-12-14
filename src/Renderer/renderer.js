import { mat4, vec3 } from 'gl-matrix';
import { ShaderCache } from './shader_cache.js';
import { ToneMaps, DebugOutput } from './rendering_parameters.js';
import { gltfWebGl } from './webgl';

import pbrShader from './shaders/pbr.frag';
import brdfShader from './shaders/brdf.glsl';
import iblShader from './shaders/ibl.glsl';
import punctualShader from './shaders/punctual.glsl';
import primitiveShader from './shaders/primitive.vert';
import texturesShader from './shaders/textures.glsl';
import tonemappingShader from './shaders/tonemapping.glsl';
import shaderFunctions from './shaders/functions.glsl';
import animationShader from './shaders/animation.glsl';

class gltfRenderer
{
    constructor(context)
    {
        this.shader = undefined; // current shader

        this.currentWidth = 0;
        this.currentHeight = 0;

        this.webGl = new gltfWebGl();
        this.webGl.context = context;

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

        this.init();
    }

    /////////////////////////////////////////////////////////////////////
    // Render glTF scene graph
    /////////////////////////////////////////////////////////////////////

    // app state
    init()
    {
        this.webGl.context.pixelStorei(WebGL2RenderingContext.UNPACK_COLORSPACE_CONVERSION_WEBGL, WebGL2RenderingContext.NONE);
        this.webGl.context.enable(WebGL2RenderingContext.DEPTH_TEST);
        this.webGl.context.depthFunc(WebGL2RenderingContext.LEQUAL);
        this.webGl.context.colorMask(true, true, true, true);
        this.webGl.context.clearDepth(1.0);
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
        this.webGl.context.clearColor(clearColor[0] / 255.0, clearColor[1] / 255.0, clearColor[2] / 255.0, 1.0);
        this.webGl.context.clear(WebGL2RenderingContext.COLOR_BUFFER_BIT | WebGL2RenderingContext.DEPTH_BUFFER_BIT);
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
            .filter(({node, primitive}) => state.gltf.materials[primitive.material].alphaMode !== "BLEND");
        for (const drawable of opaqueDrawables)
        {
            this.drawPrimitive(state, drawable.primitive, drawable.node, this.viewProjectionMatrix);
        }

        // transparent drawables need sorting before they can be drawn
        let transparentDrawables = drawables
            .filter(({node, primitive}) => state.gltf.materials[primitive.material].alphaMode === "BLEND");
        transparentDrawables = currentCamera.sortPrimitivesByDepth(state.gltf, transparentDrawables);
        for (const drawable of transparentDrawables)
        {
            this.drawPrimitive(state, drawable.primitive, drawable.node, this.viewProjectionMatrix);
        }
    }

    // vertices with given material
    drawPrimitive(state, primitive, node, viewProjectionMatrix)
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

        let fragDefines = material.getDefines().concat(vertDefines);
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
            this.webGl.context.frontFace(WebGL2RenderingContext.CW);
        }
        else
        {
            this.webGl.context.frontFace(WebGL2RenderingContext.CCW);
        }

        if (material.doubleSided)
        {
            this.webGl.context.disable(WebGL2RenderingContext.CULL_FACE);
        }
        else
        {
            this.webGl.context.enable(WebGL2RenderingContext.CULL_FACE);
        }

        if (material.alphaMode === 'BLEND')
        {
            this.webGl.context.enable(WebGL2RenderingContext.BLEND);
            this.webGl.context.blendFuncSeparate(WebGL2RenderingContext.SRC_ALPHA, WebGL2RenderingContext.ONE_MINUS_SRC_ALPHA, WebGL2RenderingContext.SRC_ALPHA, WebGL2RenderingContext.ONE_MINUS_SRC_ALPHA);
            this.webGl.context.blendEquation(WebGL2RenderingContext.FUNC_ADD);
        }
        else
        {
            this.webGl.context.disable(WebGL2RenderingContext.BLEND);
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
            this.shader.updateUniform(uniform, val);
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
            textureCount = this.applyEnvironmentMap(state.environment, textureCount);
        }

        if (state.renderingParameters.usePunctual)
        {
            this.webGl.setTexture(this.shader.getUniformLocation("u_SheenELUT"), state.gltf, state.environment.sheenELUT, textureCount++);
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

    static updateSkin(state, node)
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
            if (mesh.weights !== undefined && mesh.weights.length > 0)
            {
                vertDefines.push("USE_MORPHING 1");
                vertDefines.push("WEIGHT_COUNT " + Math.min(mesh.weights.length, 8));
            }
        }
    }

    updateAnimationUniforms(state, node, primitive)
    {
        if (state.renderingParameters.skinning && node.skin !== undefined && primitive.hasWeights && primitive.hasJoints)
        {
            const skin = state.gltf.skins[node.skin];

            this.shader.updateUniform("u_jointMatrix", skin.jointMatrices);
            this.shader.updateUniform("u_jointNormalMatrix", skin.jointNormalMatrices);
        }

        if (state.renderingParameters.morphing && node.mesh !== undefined && primitive.targets.length > 0)
        {
            const mesh = state.gltf.meshes[node.mesh];
            if (mesh.weights !== undefined && mesh.weights.length > 0)
            {
                this.shader.updateUniformArray("u_morphWeights", mesh.weights);
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
            fragDefines.push("USE_HDR 1");
        }

        switch (state.renderingParameters.toneMap)
        {
        case (ToneMaps.UNCHARTED):
            fragDefines.push("TONEMAP_UNCHARTED 1");
            break;
        case (ToneMaps.HEJL_RICHARD):
            fragDefines.push("TONEMAP_HEJLRICHARD 1");
            break;
        case (ToneMaps.ACES):
            fragDefines.push("TONEMAP_ACES 1");
            break;
        case (ToneMaps.LINEAR):
        default:
            break;
        }

        if (state.renderingParameters.debugOutput !== DebugOutput.NONE)
        {
            fragDefines.push("DEBUG_OUTPUT 1");
        }

        switch (state.renderingParameters.debugOutput)
        {
        case (DebugOutput.METALLIC):
            fragDefines.push("DEBUG_METALLIC 1");
            break;
        case (DebugOutput.ROUGHNESS):
            fragDefines.push("DEBUG_ROUGHNESS 1");
            break;
        case (DebugOutput.NORMAL):
            fragDefines.push("DEBUG_NORMAL 1");
            break;
        case (DebugOutput.WORLDSPACENORMAL):
            fragDefines.push("DEBUG_WORLDSPACE_NORMAL 1");
            break;
        case (DebugOutput.GEOMETRYNORMAL):
            fragDefines.push("DEBUG_GEOMETRY_NORMAL 1");
            break;
        case (DebugOutput.TANGENT):
            fragDefines.push("DEBUG_TANGENT 1");
            break;
        case (DebugOutput.BITANGENT):
            fragDefines.push("DEBUG_BITANGENT 1");
            break;
        case (DebugOutput.BASECOLOR):
            fragDefines.push("DEBUG_BASECOLOR 1");
            break;
        case (DebugOutput.OCCLUSION):
            fragDefines.push("DEBUG_OCCLUSION 1");
            break;
        case (DebugOutput.EMISSIVE):
            fragDefines.push("DEBUG_FEMISSIVE 1");
            break;
        case (DebugOutput.SPECULAR):
            fragDefines.push("DEBUG_FSPECULAR 1");
            break;
        case (DebugOutput.DIFFUSE):
            fragDefines.push("DEBUG_FDIFFUSE 1");
            break;
        case (DebugOutput.THICKNESS):
            fragDefines.push("DEBUG_THICKNESS 1");
            break;
        case (DebugOutput.CLEARCOAT):
            fragDefines.push("DEBUG_FCLEARCOAT 1");
            break;
        case (DebugOutput.SHEEN):
            fragDefines.push("DEBUG_FSHEEN 1");
            break;
        case (DebugOutput.SUBSURFACE):
            fragDefines.push("DEBUG_FSUBSURFACE 1");
            break;
        case (DebugOutput.TRANSMISSION):
            fragDefines.push("DEBUG_FTRANSMISSION 1");
            break;
        case (DebugOutput.F0):
            fragDefines.push("DEBUG_F0 1");
            break;
        case (DebugOutput.ALPHA):
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

    applyEnvironmentMap(environment, texSlotOffset)
    {
        this.webGl.setTexture(this.shader.getUniformLocation("u_LambertianEnvSampler"), environment, environment.diffuseEnvMap, texSlotOffset++);

        this.webGl.setTexture(this.shader.getUniformLocation("u_GGXEnvSampler"), environment, environment.specularEnvMap, texSlotOffset++);
        this.webGl.setTexture(this.shader.getUniformLocation("u_GGXLUT"), environment, environment.lut, texSlotOffset++);

        this.webGl.setTexture(this.shader.getUniformLocation("u_CharlieEnvSampler"), environment, environment.sheenEnvMap, texSlotOffset++);
        this.webGl.setTexture(this.shader.getUniformLocation("u_CharlieLUT"), environment, environment.sheenLUT, texSlotOffset++);

        this.shader.updateUniform("u_MipCount", environment.mipCount);

        return texSlotOffset;
    }

    destroy()
    {
        this.shaderCache.destroy();
    }
}

export { gltfRenderer };
