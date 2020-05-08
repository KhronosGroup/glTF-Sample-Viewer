import { mat4, vec3 } from 'gl-matrix';
import { gltfLight } from './light.js';
import { gltfTextureInfo } from './texture.js';
import { ShaderCache } from './shader_cache.js';
import { WebGl } from './webgl.js';
import { ToneMaps, DebugOutput, Environments } from './rendering_parameters.js';
import { ImageMimeType } from './image.js';
import pbrShader from './shaders/pbr.frag';
import brdfShader from './shaders/brdf.glsl';
import iblShader from './shaders/ibl.glsl';
import punctualShader from './shaders/punctual.glsl';
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
        shaderSources.set("pbr.frag", pbrShader);
        shaderSources.set("brdf.glsl", brdfShader);
        shaderSources.set("ibl.glsl", iblShader);
        shaderSources.set("punctual.glsl", punctualShader);
        shaderSources.set("tonemapping.glsl", tonemappingShader);
        shaderSources.set("textures.glsl", texturesShader);
        shaderSources.set("functions.glsl", shaderFunctions);
        shaderSources.set("animation.glsl", animationShader);

        this.shaderCache = new ShaderCache(shaderSources);

        let requiredWebglExtensions = [
            "EXT_texture_filter_anisotropic",
            "OES_texture_float_linear"
        ];

        WebGl.loadWebGlExtensions(requiredWebglExtensions);

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
        if (scene.envData === undefined)
        {
            this.initializeEnvironment(gltf, scene);
        }

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
                            this.drawPrimitive(gltf, scene.envData, primitive, node, this.viewProjectionMatrix);
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
                    this.drawPrimitive(gltf, scene.envData, sortedPrimitive.primitive, sortedPrimitive.node, this.viewProjectionMatrix);
                }
            }
        }
    }

    // vertices with given material
    drawPrimitive(gltf, envData, primitive, node, viewProjectionMatrix)
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
        this.shader.updateUniform("u_Exposure", this.parameters.exposure, false);
        this.shader.updateUniform("u_Camera", this.currentCameraPosition, false);

        this.updateAnimationUniforms(gltf, node, primitive);

        if  (mat4.determinant(node.worldTransform) < 0.0)
        {
            WebGl.context.frontFace(WebGl.context.CW);
        }
        else
        {
            WebGl.context.frontFace(WebGl.context.CCW);
        }

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
            WebGl.context.blendFuncSeparate(WebGl.context.SRC_ALPHA, WebGl.context.ONE_MINUS_SRC_ALPHA, WebGl.context.SRC_ALPHA, WebGl.context.ONE_MINUS_SRC_ALPHA);
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

        const hasThinFilm = material.extensions != undefined && material.extensions.KHR_materials_thinfilm !== undefined;
        if (this.parameters.useIBL)
        {
            this.applyEnvironmentMap(gltf, envData, material.textures.length);
        }
        else if (hasThinFilm)
        {
            WebGl.setTexture(this.shader.getUniformLocation("u_ThinFilmLUT"), gltf, envData.thinFilmLUT, material.textures.length);
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

        if (Environments[this.parameters.environmentName].type === ImageMimeType.HDR || Environments[this.parameters.environmentName].type === ImageMimeType.KTX2)
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
        case(DebugOutput.TANGENT):
            fragDefines.push("DEBUG_TANGENT 1");
            break;
        case(DebugOutput.BITANGENT):
            fragDefines.push("DEBUG_BITANGENT 1");
            break;
        case(DebugOutput.BASECOLOR):
            fragDefines.push("DEBUG_BASECOLOR 1");
            break;
        case(DebugOutput.OCCLUSION):
            fragDefines.push("DEBUG_OCCLUSION 1");
            break;
        case(DebugOutput.EMISSIVE):
            fragDefines.push("DEBUG_FEMISSIVE 1");
            break;
        case(DebugOutput.SPECULAR):
            fragDefines.push("DEBUG_FSPECULAR 1");
            break;
        case(DebugOutput.DIFFUSE):
            fragDefines.push("DEBUG_FDIFFUSE 1");
            break;
        case(DebugOutput.THICKNESS):
            fragDefines.push("DEBUG_THICKNESS 1");
            break;
        case(DebugOutput.CLEARCOAT):
            fragDefines.push("DEBUG_FCLEARCOAT 1");
            break;
        case(DebugOutput.SHEEN):
            fragDefines.push("DEBUG_FSHEEN 1");
            break;
        case(DebugOutput.SUBSURFACE):
            fragDefines.push("DEBUG_FSUBSURFACE 1");
            break;
        case(DebugOutput.TRANSMISSION):
            fragDefines.push("DEBUG_FTRANSMISSION 1");
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

    initializeEnvironment(gltf, scene)
    {
        scene.envData = {};

        if (scene !== undefined && scene.imageBasedLight !== undefined)
        {
            const diffuseTextureIndex = scene.imageBasedLight.diffuseEnvironmentTexture;
            const specularTextureIndex = scene.imageBasedLight.specularEnvironmentTexture;
            const sheenCubeMapIndex = scene.imageBasedLight.sheenEnvironmentTexture;

            scene.envData.diffuseEnvMap = new gltfTextureInfo(diffuseTextureIndex);
            scene.envData.specularEnvMap = new gltfTextureInfo(specularTextureIndex);
            scene.envData.sheenEnvMap = new gltfTextureInfo(sheenCubeMapIndex);

            scene.envData.mipCount = scene.imageBasedLight.levelCount;
        }
        else
        {
            const diffuseTextureIndex = gltf.textures.length - 6;
            const specularTextureIndex = gltf.textures.length - 5;
            const sheenTextureIndex = gltf.textures.length - 4;

            scene.envData.diffuseEnvMap = new gltfTextureInfo(diffuseTextureIndex, 0, true);
            scene.envData.specularEnvMap = new gltfTextureInfo(specularTextureIndex, 0, true);
            scene.envData.sheenEnvMap = new gltfTextureInfo(sheenTextureIndex, 0, true);

            scene.envData.mipCount = Environments[this.parameters.environmentName].mipLevel;
        }

        scene.envData.diffuseEnvMap.generateMips = false;
        scene.envData.specularEnvMap.generateMips = false;
        scene.envData.sheenEnvMap.generateMips = false;

        scene.envData.lut = new gltfTextureInfo(gltf.textures.length - 3);
        scene.envData.lut.generateMips = false;

        scene.envData.sheenLUT = new gltfTextureInfo(gltf.textures.length - 2);
        scene.envData.sheenLUT.generateMips = false;

        scene.envData.thinFilmLUT = new gltfTextureInfo(gltf.textures.length - 1);
        scene.envData.thinFilmLUT.generateMips = false;
    }

    applyEnvironmentMap(gltf, envData, texSlotOffset)
    {
        WebGl.setTexture(this.shader.getUniformLocation("u_LambertianEnvSampler"), gltf, envData.diffuseEnvMap, texSlotOffset);

        WebGl.setTexture(this.shader.getUniformLocation("u_GGXEnvSampler"), gltf, envData.specularEnvMap, texSlotOffset + 1);
        WebGl.setTexture(this.shader.getUniformLocation("u_GGXLUT"), gltf, envData.lut, texSlotOffset + 2);

        WebGl.setTexture(this.shader.getUniformLocation("u_CharlieEnvSampler"), gltf, envData.sheenEnvMap, texSlotOffset + 3);
        WebGl.setTexture(this.shader.getUniformLocation("u_CharlieLUT"), gltf, envData.sheenLUT, texSlotOffset + 4);

        WebGl.setTexture(this.shader.getUniformLocation("u_ThinFilmLUT"), gltf, envData.thinFilmLUT, texSlotOffset + 5);

        this.shader.updateUniform("u_MipCount", envData.mipCount);
    }

    destroy()
    {
        this.shaderCache.destroy();
    }
}

export { gltfRenderer };
