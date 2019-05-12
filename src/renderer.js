import { mat4, vec3 } from 'gl-matrix';
import { gltfLight } from './light.js';
import { gltfTextureInfo } from './texture.js';
import { ShaderCache } from './shader_cache.js';
import { WebGl } from './webgl.js';
import { ToneMaps, DebugOutput, Environments } from './rendering_parameters.js';
import { ImageMimeType } from './image.js';
import metallicRoughnessShader from './shaders/metallic-roughness.frag';
import primitiveShader from './shaders/primitive.vert';
import texturesShader from './shaders/textures.glsl';
import tonemappingShader from'./shaders/tonemapping.glsl';
import shaderFunctions from './shaders/functions.glsl';
import animationShader from './shaders/animation.glsl';

class gltfRenderer
{
    constructor(canvas, defaultCamera, parameters, basePath)
    {
        this.canvas = canvas;
        this.defaultCamera = defaultCamera;
        this.parameters = parameters;
        this.basePath = basePath;
        this.shader = undefined; // current shader

        this.currentWidth  = 0;
        this.currentHeight = 0;

        const shaderSources = new Map();
        shaderSources.set("primitive.vert", primitiveShader);
        shaderSources.set("metallic-roughness.frag", metallicRoughnessShader);
        shaderSources.set("tonemapping.glsl", tonemappingShader);
        shaderSources.set("textures.glsl", texturesShader);
        shaderSources.set("functions.glsl", shaderFunctions);
        shaderSources.set("animation.glsl", animationShader);

        this.shaderCache = new ShaderCache(shaderSources);

        let requiredWebglExtensions = [
            "EXT_shader_texture_lod",
            "OES_standard_derivatives",
            "OES_element_index_uint",
            "EXT_texture_filter_anisotropic",
            "OES_texture_float",
            "OES_texture_float_linear"
        ];

        WebGl.loadWebGlExtensions(requiredWebglExtensions);
        // use shader lod ext if requested and supported
        this.parameters.useShaderLoD = this.parameters.useShaderLoD && WebGl.context.getExtension("EXT_shader_texture_lod") !== null;

        this.visibleLights = [];

        this.viewMatrix = mat4.create();
        this.projMatrix = mat4.create();
        this.viewProjectionMatrix = mat4.create();

        this.currentCameraPosition = vec3.create();

        this.init();
        this.resize(canvas.clientWidth, canvas.clientHeight);
    }

    /////////////////////////////////////////////////////////////////////
    // Render glTF scene graph
    /////////////////////////////////////////////////////////////////////

    // app state
    init()
    {
        if (!this.parameters.useShaderLoD)
        {
            this.parameters.useIBL = false;
            this.parameters.usePunctual = true;
        }

        //TODO: To achieve correct rendering, WebGL runtimes must disable such conversions by setting UNPACK_COLORSPACE_CONVERSION_WEBGL flag to NONE
        WebGl.context.enable(WebGl.context.DEPTH_TEST);
        WebGl.context.depthFunc(WebGl.context.LEQUAL);
        WebGl.context.colorMask(true, true, true, true);
        WebGl.context.clearDepth(1.0);
    }

    resize(width, height)
    {
        if (this.currentWidth !== width || this.currentHeight !== height)
        {
            this.canvas.width  = width;
            this.canvas.height = height;
            this.currentHeight = height;
            this.currentWidth  = width;
            WebGl.context.viewport(0, 0, width, height);
        }
    }

    // frame state
    newFrame()
    {
        WebGl.context.clearColor(this.parameters.clearColor[0] / 255.0, this.parameters.clearColor[1] / 255.0, this.parameters.clearColor[2]  / 255.0, 1.0);
        WebGl.context.clear(WebGl.context.COLOR_BUFFER_BIT | WebGl.context.DEPTH_BUFFER_BIT);
    }

    // render complete gltf scene with given camera
    drawScene(gltf, scene, sortByDepth, predicateDrawPrimivitve)
    {
        let currentCamera = undefined;

        if(!this.parameters.userCameraActive())
        {
            currentCamera = gltf.cameras[this.parameters.cameraIndex].clone();
        }
        else
        {
            currentCamera = this.defaultCamera;
        }

        currentCamera.aspectRatio = this.currentWidth / this.currentHeight;

        this.projMatrix = currentCamera.getProjectionMatrix();
        this.viewMatrix = currentCamera.getViewMatrix(gltf);
        this.currentCameraPosition = currentCamera.getPosition(gltf);

        this.visibleLights = this.getVisibleLights(gltf, scene);

        mat4.multiply(this.viewProjectionMatrix, this.projMatrix, this.viewMatrix);

        const nodes = scene.gatherNodes(gltf);

        // Update skins.
        for(const node of nodes)
        {
            if(node.mesh !== undefined && node.skin !== undefined)
            {
                this.updateSkin(gltf, node);
            }
        }

        if(!sortByDepth)
        {
            for (const node of nodes)
            {
                let mesh = gltf.meshes[node.mesh];
                if (mesh !== undefined)
                {
                    for (let primitive of mesh.primitives)
                    {
                        if(predicateDrawPrimivitve ? predicateDrawPrimivitve(primitive) : true)
                        {
                            this.drawPrimitive(gltf, primitive, node, this.viewProjectionMatrix);
                        }
                    }
                }
            }
        }
        else
        {
            const sortedPrimitives = currentCamera.sortPrimitivesByDepth(gltf, nodes);

            for (const sortedPrimitive of sortedPrimitives)
            {
                if(predicateDrawPrimivitve ? predicateDrawPrimivitve(sortedPrimitive.primitive) : true)
                {
                    this.drawPrimitive(gltf, sortedPrimitive.primitive, sortedPrimitive.node, this.viewProjectionMatrix);
                }
            }
        }
    }

    // vertices with given material
    drawPrimitive(gltf, primitive, node, viewProjectionMatrix)
    {
        if (primitive.skip) return;

        const material = gltf.materials[primitive.material];

        //select shader permutation, compile and link program.

        let vertDefines = [];
        this.pushVertParameterDefines(vertDefines, gltf, node, primitive);
        vertDefines = primitive.getDefines().concat(vertDefines);

        let fragDefines = material.getDefines().concat(vertDefines);
        this.pushFragParameterDefines(fragDefines);

        const fragmentHash = this.shaderCache.selectShader(material.getShaderIdentifier(), fragDefines);
        const vertexHash  = this.shaderCache.selectShader(primitive.getShaderIdentifier(), vertDefines);

        if (fragmentHash && vertexHash)
        {
            this.shader = this.shaderCache.getShaderProgram(fragmentHash, vertexHash);
        }

        if (this.shader === undefined)
        {
            return;
        }

        WebGl.context.useProgram(this.shader.program);

        if (this.parameters.usePunctual)
        {
            this.applyLights(gltf);
        }

        // update model dependant matrices once per node
        this.shader.updateUniform("u_ViewProjectionMatrix", viewProjectionMatrix);
        this.shader.updateUniform("u_ModelMatrix", node.worldTransform);
        this.shader.updateUniform("u_NormalMatrix", node.normalMatrix, false);
        this.shader.updateUniform("u_Gamma", this.parameters.gamma, false);
        this.shader.updateUniform("u_Exposure", this.parameters.exposure, false);
        this.shader.updateUniform("u_Camera", this.currentCameraPosition, false);

        this.updateAnimationUniforms(gltf, node, primitive);

        if (material.doubleSided)
        {
            WebGl.context.disable(WebGl.context.CULL_FACE);
        }
        else
        {
            WebGl.context.enable(WebGl.context.CULL_FACE);
        }

        if(material.alphaMode === 'BLEND')
        {
            WebGl.context.enable(WebGl.context.BLEND);
            WebGl.context.blendFuncSeparate(WebGl.context.SRC_ALPHA, WebGl.context.ONE_MINUS_SRC_ALPHA, WebGl.context.ONE, WebGl.context.ONE_MINUS_SRC_ALPHA);
            WebGl.context.blendEquation(WebGl.context.FUNC_ADD);
        }
        else
        {
            WebGl.context.disable(WebGl.context.BLEND);
        }

        const drawIndexed = primitive.indices !== undefined;
        if (drawIndexed)
        {
            if (!WebGl.setIndices(gltf, primitive.indices))
            {
                return;
            }
        }

        let vertexCount = 0;
        for (const attribute of primitive.glAttributes)
        {
            const gltfAccessor = gltf.accessors[attribute.accessor];
            vertexCount = gltfAccessor.count;

            const location = this.shader.getAttributeLocation(attribute.name);
            if (location < 0)
            {
                continue; // only skip this attribute
            }
            if (!WebGl.enableAttribute(gltf, location, gltfAccessor))
            {
                return; // skip this primitive
            }
        }

        for(let [uniform, val] of material.getProperties().entries())
        {
            this.shader.updateUniform(uniform, val);
        }

        for(let i = 0; i < material.textures.length; ++i)
        {
            let info = material.textures[i];
            const location = this.shader.getUniformLocation(info.samplerName);
            if (location < 0)
            {
                continue; // only skip this texture
            }
            if (!WebGl.setTexture(location, gltf, info, i)) // binds texture and sampler
            {
                return; // skip this material
            }
        }

        if (this.parameters.useIBL)
        {
            this.applyEnvironmentMap(gltf, material.textures.length);
        }

        if (drawIndexed)
        {
            const indexAccessor = gltf.accessors[primitive.indices];
            WebGl.context.drawElements(primitive.mode, indexAccessor.count, indexAccessor.componentType, 0);
        }
        else
        {
            WebGl.context.drawArrays(primitive.mode, 0, vertexCount);
        }

        for (const attribute of primitive.glAttributes)
        {
            const location = this.shader.getAttributeLocation(attribute.name);
            if (location < 0)
            {
                continue; // skip this attribute
            }
            WebGl.context.disableVertexAttribArray(location);
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
        return lights.length > 0 ? lights : [ new gltfLight() ];
    }

    updateSkin(gltf, node)
    {
        if(this.parameters.skinning && gltf.skins !== undefined) // && !this.parameters.animationTimer.paused
        {
            const skin = gltf.skins[node.skin];
            skin.computeJoints(gltf, node);
        }
    }

    pushVertParameterDefines(vertDefines, gltf, node, primitive)
    {
        // skinning
        if(this.parameters.skinning && node.skin !== undefined && primitive.hasWeights && primitive.hasJoints)
        {
            const skin = gltf.skins[node.skin];

            vertDefines.push("USE_SKINNING 1");
            vertDefines.push("JOINT_COUNT " + skin.jointMatrices.length);
        }

        // morphing
        if(this.parameters.morphing && node.mesh !== undefined && primitive.targets.length > 0)
        {
            const mesh = gltf.meshes[node.mesh];
            if(mesh.weights !== undefined && mesh.weights.length > 0)
            {
                vertDefines.push("USE_MORPHING 1");
                vertDefines.push("WEIGHT_COUNT " + Math.min(mesh.weights.length, 8));
            }
        }
    }

    updateAnimationUniforms(gltf, node, primitive)
    {
        if(this.parameters.skinning && node.skin !== undefined && primitive.hasWeights && primitive.hasJoints)
        {
            const skin = gltf.skins[node.skin];

            this.shader.updateUniform("u_jointMatrix", skin.jointMatrices);
            this.shader.updateUniform("u_jointNormalMatrix", skin.jointNormalMatrices);
        }

        if(this.parameters.morphing && node.mesh !== undefined && primitive.targets.length > 0)
        {
            const mesh = gltf.meshes[node.mesh];
            if(mesh.weights !== undefined && mesh.weights.length > 0)
            {
                this.shader.updateUniformArray("u_morphWeights", mesh.weights);
            }
        }
    }

    pushFragParameterDefines(fragDefines)
    {
        if (this.parameters.usePunctual)
        {
            fragDefines.push("USE_PUNCTUAL 1");
            fragDefines.push("LIGHT_COUNT " + this.visibleLights.length);
        }

        if (this.parameters.useIBL)
        {
            fragDefines.push("USE_IBL 1");
        }

        if(this.parameters.useShaderLoD)
        {
            fragDefines.push("USE_TEX_LOD 1");
        }

        if (Environments[this.parameters.environmentName].type === ImageMimeType.HDR)
        {
            fragDefines.push("USE_HDR 1");
        }

        switch(this.parameters.toneMap)
        {
        case(ToneMaps.UNCHARTED):
            fragDefines.push("TONEMAP_UNCHARTED 1");
            break;
        case(ToneMaps.HEJL_RICHARD):
            fragDefines.push("TONEMAP_HEJLRICHARD 1");
            break;
        case(ToneMaps.ACES):
            fragDefines.push("TONEMAP_ACES 1");
            break;
        case(ToneMaps.LINEAR):
        default:
            break;
        }

        if(this.parameters.debugOutput !== DebugOutput.NONE)
        {
            fragDefines.push("DEBUG_OUTPUT 1");
        }

        switch(this.parameters.debugOutput)
        {
        case(DebugOutput.METALLIC):
            fragDefines.push("DEBUG_METALLIC 1");
            break;
        case(DebugOutput.ROUGHNESS):
            fragDefines.push("DEBUG_ROUGHNESS 1");
            break;
        case(DebugOutput.NORMAL):
            fragDefines.push("DEBUG_NORMAL 1");
            break;
        case(DebugOutput.BASECOLOR):
            fragDefines.push("DEBUG_BASECOLOR 1");
            break;
        case(DebugOutput.OCCLUSION):
            fragDefines.push("DEBUG_OCCLUSION 1");
            break;
        case(DebugOutput.EMISIVE):
            fragDefines.push("DEBUG_EMISSIVE 1");
            break;
        case(DebugOutput.F0):
            fragDefines.push("DEBUG_F0 1");
            break;
        case(DebugOutput.ALPHA):
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

        this.shader.updateUniform("u_Lights", uniformLights);
    }

    applyEnvironmentMap(gltf, texSlotOffset)
    {
        if (gltf.envData === undefined)
        {
            let linear = true;
            if (Environments[this.parameters.environmentName].type !== ImageMimeType.HDR)
            {
                linear = false;
            }
            
            gltf.envData = {};
            gltf.envData.diffuseEnvMap = new gltfTextureInfo(gltf.textures.length - 3, 0, linear);
            gltf.envData.specularEnvMap = new gltfTextureInfo(gltf.textures.length - 2, 0, linear);
            gltf.envData.lut = new gltfTextureInfo(gltf.textures.length - 1);
            gltf.envData.specularEnvMap.generateMips = false;
            gltf.envData.lut.generateMips = false;
        }

        WebGl.setTexture(this.shader.getUniformLocation("u_DiffuseEnvSampler"), gltf, gltf.envData.diffuseEnvMap, texSlotOffset);
        WebGl.setTexture(this.shader.getUniformLocation("u_SpecularEnvSampler"), gltf, gltf.envData.specularEnvMap, texSlotOffset + 1);
        WebGl.setTexture(this.shader.getUniformLocation("u_brdfLUT"), gltf, gltf.envData.lut, texSlotOffset + 2);

        const mipCount = Environments[this.parameters.environmentName].mipLevel;
        this.shader.updateUniform("u_MipCount", mipCount);
    }

    destroy()
    {
        this.shaderCache.destroy();
    }
}

export { gltfRenderer };
