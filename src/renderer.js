import { mat4, vec3 } from 'gl-matrix';
import { gltfLight } from './light.js';
import { gltfTextureInfo } from './texture.js';
import { ShaderCache } from './shader_cache.js';
import { jsToGl, UniformStruct } from './utils.js';
import { WebGl } from './webgl.js';
import { ToneMaps, DebugOutput, Environments } from './rendering_parameters.js';
import { ImageMimeType } from './image.js';
import metallicRoughnessShader from './shaders/metallic-roughness.frag';
import primitiveShader from './shaders/primitive.vert';
import texturesShader from './shaders/textures.glsl';
import tonemappingShader from'./shaders/tonemapping.glsl';
import shaderFunctions from './shaders/functions.glsl';
import fullscreenShader from'./shaders/fullscreen.vert';
import mergeShader from './shaders/merge.frag';

class CamInfo extends UniformStruct
{
    constructor(userCamera, gltf, dimX, dimY)
    {
        super();

        //this.target = userCamera.getLookAtTarget();
        this.view = userCamera.getViewMatrix(gltf); // extrinsic
        this.intrinsic = userCamera.getIntrinsicMatrix(dimX, dimY);

        this.viewProj = userCamera.getViewProjectionMatrix(gltf);
        this.invViewProj = userCamera.getInvViewProjectionMatrix(gltf);

        this.pos = userCamera.getPosition(gltf);
        this.target = userCamera.getLookAtTarget(gltf);

        this.near = userCamera.znear;
        this.far = userCamera.zfar;
    }
};

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
        shaderSources.set("fullscreen.vert", fullscreenShader);
        shaderSources.set("merge.frag", mergeShader);
        shaderSources.set("tonemapping.glsl", tonemappingShader);
        shaderSources.set("textures.glsl", texturesShader);
        shaderSources.set("functions.glsl", shaderFunctions);

        this.shaderCache = new ShaderCache(shaderSources);

        let requiredWebglExtensions = [
            //"WEBGL_draw_buffers",
            //"EXT_shader_texture_lod",
            //"OES_standard_derivatives",
            //"OES_element_index_uint",
            "EXT_texture_filter_anisotropic",
            //"OES_texture_float",
            "OES_texture_float_linear"
        ];

        WebGl.loadWebGlExtensions(requiredWebglExtensions);

        this.visibleLights = [];

        this.frameBuffer = undefined;
        this.depthBuffer = undefined;
        this.colorTargetTextures = [];
        this.depthTargetTextures = [];

        this.prevRenderViewNum = this.parameters.numRenderViews;

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

        if(this.frameBuffer === undefined)
        {
            this.frameBuffer = WebGl.context.createFramebuffer();
        }

        //TODO: To achieve correct rendering, WebGL runtimes must disable such conversions by setting UNPACK_COLORSPACE_CONVERSION_WEBGL flag to NONE
        WebGl.context.enable(WebGl.context.DEPTH_TEST);
        WebGl.context.depthFunc(WebGl.context.LEQUAL);
        WebGl.context.colorMask(true, true, true, true);
        WebGl.context.clearDepth(1.0);
    }

    initRenderTargets(width, height)
    {
        // destroy old textures
        for (let i = 0; i < this.colorTargetTextures.length; i++)
        {
            WebGl.context.deleteTexture(this.colorTargetTextures[i]);
        }

        for (let i = 0; i < this.depthTargetTextures.length; i++)
        {
            WebGl.context.deleteTexture(this.depthTargetTextures[i]);
        }

        this.colorTargetTextures = [];
        this.depthTargetTextures = [];

        const maxViews = WebGl.context.getParameter(WebGl.context.MAX_TEXTURE_IMAGE_UNITS) / 2;
        this.parameters.numRenderViews = Math.min(maxViews, this.parameters.numRenderViews);

        // create color and depth targets with resolution
        for (let i = 0; i < this.parameters.numRenderViews; i++)
        {
            let tex = WebGl.context.createTexture();

            WebGl.context.bindTexture(WebGl.context.TEXTURE_2D, tex);
            WebGl.context.texImage2D(WebGl.context.TEXTURE_2D, 0, WebGl.context.RGBA,
                width, height, 0,
                WebGl.context.RGBA, WebGl.context.UNSIGNED_BYTE, null);

            WebGl.context.texParameteri(WebGl.context.TEXTURE_2D, WebGl.context.TEXTURE_MIN_FILTER, WebGl.context.LINEAR);
            WebGl.context.texParameteri(WebGl.context.TEXTURE_2D, WebGl.context.TEXTURE_WRAP_S, WebGl.context.CLAMP_TO_EDGE);
            WebGl.context.texParameteri(WebGl.context.TEXTURE_2D, WebGl.context.TEXTURE_WRAP_T, WebGl.context.CLAMP_TO_EDGE);

            this.colorTargetTextures.push(tex);

            let depth = WebGl.context.createTexture();
            WebGl.context.bindTexture(WebGl.context.TEXTURE_2D, depth);
            WebGl.context.texImage2D(WebGl.context.TEXTURE_2D, 0, WebGl.context.DEPTH_COMPONENT24,
                width, height, 0,
                WebGl.context.DEPTH_COMPONENT, WebGl.context.UNSIGNED_INT, null);

            WebGl.context.texParameteri(WebGl.context.TEXTURE_2D, WebGl.context.TEXTURE_MIN_FILTER, WebGl.context.NEAREST);
            WebGl.context.texParameteri(WebGl.context.TEXTURE_2D, WebGl.context.TEXTURE_MAG_FILTER, WebGl.context.NEAREST);
            WebGl.context.texParameteri(WebGl.context.TEXTURE_2D, WebGl.context.TEXTURE_WRAP_S, WebGl.context.CLAMP_TO_EDGE);
            WebGl.context.texParameteri(WebGl.context.TEXTURE_2D, WebGl.context.TEXTURE_WRAP_T, WebGl.context.CLAMP_TO_EDGE);

            this.depthTargetTextures.push(depth);
        }
    }

    resize(width, height, updateCanvas = true)
    {
        if (this.currentWidth !== width || this.currentHeight !== height)
        {
            this.initRenderTargets(width, height);

            if(updateCanvas)
            {
                this.canvas.width  = width;
                this.canvas.height = height;
            }
            this.currentHeight = height;
            this.currentWidth  = width;
            WebGl.context.viewport(0, 0, width, height);
        }
    }

    // frame state
    newFrame(renderTargetIndex = "backbuffer")
    {
        if(renderTargetIndex !== "backbuffer" && renderTargetIndex < this.parameters.numRenderViews)
        {
            WebGl.context.bindFramebuffer(WebGl.context.FRAMEBUFFER, this.frameBuffer); // DRAW_FRAMEBUFFER ?
            WebGl.context.framebufferTexture2D(WebGl.context.FRAMEBUFFER, WebGl.context.COLOR_ATTACHMENT0, WebGl.context.TEXTURE_2D, this.colorTargetTextures[renderTargetIndex], 0);
            WebGl.context.framebufferTexture2D(WebGl.context.FRAMEBUFFER, WebGl.context.DEPTH_ATTACHMENT, WebGl.context.TEXTURE_2D, this.depthTargetTextures[renderTargetIndex], 0);
        }
        else
        {
            WebGl.context.bindFramebuffer(WebGl.context.FRAMEBUFFER, null);
        }

        WebGl.context.clearColor(this.parameters.clearColor[0] / 255.0, this.parameters.clearColor[1] / 255.0, this.parameters.clearColor[2]  / 255.0, 1.0);
        WebGl.context.clear(WebGl.context.COLOR_BUFFER_BIT | WebGl.context.DEPTH_BUFFER_BIT);
    }

    drawSceneMultiView(gltf, scene, userCamera)
    {
        if(this.prevRenderViewNum !== this.parameters.numRenderViews)
        {
            this.initRenderTargets(this.currentWidth, this.currentHeight);
            this.prevRenderViewNum = this.parameters.numRenderViews;
        }

        let numViews = this.parameters.reconstructViews ? this.parameters.numVirtualViews : this.parameters.numRenderViews;

        let stepAngleRad = Math.sin(this.parameters.viewStepAngle * Math.PI / 180);

        if(this.parameters.leftToRight)
        {
            stepAngleRad = -stepAngleRad;
        }

        const virtualToRenderRatio = numViews / this.parameters.numRenderViews;
        const stepAngleRadRender = stepAngleRad * virtualToRenderRatio;

        let virtualCamInfos = [];
        let renderCamInfos = [];

        // Assuming 'views' are on a equator around the focus object with stepAngleRad between each view.
        let centerRot = userCamera.xRot; // dont want to change original camera

        // start position 'right' of the original view
        userCamera.xRot += ((this.parameters.numRenderViews-1) / 2) * stepAngleRadRender;

        for(let i = 0; i < this.parameters.numRenderViews; ++i)
        {
            userCamera.updatePosition();
            renderCamInfos.push(new CamInfo(userCamera, gltf, this.currentWidth, this.currentHeight));

            this.newFrame(i); // render target
            this.drawScene(gltf, scene, userCamera);

            userCamera.xRot -= stepAngleRadRender;
        }

        // reset for virtual views
        userCamera.xRot = centerRot + ((numViews - 1) / 2) * stepAngleRad;

        for(let i = 0; i < numViews; ++i)
        {
            userCamera.updatePosition();
            virtualCamInfos.push(new CamInfo(userCamera, gltf, this.currentWidth, this.currentHeight));
            userCamera.xRot -= stepAngleRad;
        }

        // reset
        userCamera.xRot = centerRot;
        userCamera.updatePosition();

        this.newFrame(); // backbuffer

        this.mergeViews(renderCamInfos, virtualCamInfos);
    }

    drawScene(gltf, scene, camera)
    {
        let alphaScene = scene.getSceneWithAlphaMode(gltf, 'BLEND'); // get non opaque
        if (alphaScene.nodes.length > 0)
        {
            // first render opaque objects, oder is not important but could improve performance 'early z rejection'
            let opaqueScene = scene.getSceneWithAlphaMode(gltf, 'BLEND', true);
            this.drawSceneWithCamera(gltf, opaqueScene, camera, false);

            // render transparent objects ordered by distance from camera
            this.drawSceneWithCamera(gltf, alphaScene, camera, true);
        }
        else
        {
            // no alpha materials, render as is
            this.drawSceneWithCamera(gltf, scene, camera, false);
        }
    }

    // render complete gltf scene with given camera
    drawSceneWithCamera(gltf, scene, camera, sortByDepth)
    {
        let currentCamera = camera;

        if(currentCamera === undefined)
        {
            currentCamera = this.defaultCamera;
        }

        currentCamera.aspectRatio = this.currentWidth / this.currentHeight;

        this.projMatrix = currentCamera.getProjectionMatrix();
        this.viewMatrix = currentCamera.getViewMatrix(gltf);
        this.currentCameraPosition = currentCamera.getPosition(gltf);

        this.visibleLights = this.getVisibleLights(gltf, scene);

        mat4.multiply(this.viewProjectionMatrix, this.projMatrix, this.viewMatrix);

        let nodes = scene.gatherNodes(gltf);
        if(sortByDepth)
        {
            nodes = currentCamera.sortNodesByDepth(nodes);
        }

        for (const node of nodes)
        {
            this.drawNode(gltf, node);
        }
    }

    mergeViews(renderCamInfos, virtualCamInfos)
    {
        // select shader
        let shaderDefines = ["NUM_RENDER_VIEWS " + this.parameters.numRenderViews];

        if(this.parameters.reconstructViews)
        {
            shaderDefines.push("RECONSTRUCT_VIEWS 1");
            shaderDefines.push("NUM_VIRTUAL_VIEWS " + this.parameters.numVirtualViews);
        } else {
            shaderDefines.push("NUM_VIRTUAL_VIEWS " + this.parameters.numRenderViews);
        }

        if(this.parameters.BGRDisplay)
        {
            shaderDefines.push("BGR_DISPLAY 1");
        }

        if(this.parameters.invertViewport)
        {
            shaderDefines.push("VIEWPORT_INVERT 1");
        }

        const fragmentHash = this.shaderCache.selectShader("merge.frag", shaderDefines);
        const vertexHash  = this.shaderCache.selectShader("fullscreen.vert", shaderDefines);

        if (fragmentHash && vertexHash)
        {
            this.shader = this.shaderCache.getShaderProgram(fragmentHash, vertexHash);
        }

        if (this.shader === undefined)
        {
            return;
        }

        WebGl.context.useProgram(this.shader.program);

        // bind textures
        let colorLoc = this.shader.getUniformLocation("u_colorViews[0]", false);

        let slots = [];
        let s = 0;

        if(colorLoc !== -1)
        {
            for (; s < this.colorTargetTextures.length; s++)
            {
                WebGl.context.activeTexture(WebGl.context.TEXTURE0 + s);
                WebGl.context.bindTexture(WebGl.context.TEXTURE_2D, this.colorTargetTextures[s]);
                slots.push(s);
            }

            WebGl.context.uniform1iv(colorLoc, slots);
        }

        let depthLoc = this.parameters.reconstructViews ? this.shader.getUniformLocation("u_depthViews[0]", false) : -1;
        slots = [];

        if(depthLoc !== -1)
        {
            for (let i = 0; i < this.depthTargetTextures.length; i++, s++)
            {
                WebGl.context.activeTexture(WebGl.context.TEXTURE0 + s);
                WebGl.context.bindTexture(WebGl.context.TEXTURE_2D, this.depthTargetTextures[i]);
                slots.push(s);
            }

            WebGl.context.uniform1iv(depthLoc, slots);
        }

        this.shader.updateUniform("u_RenderCams", renderCamInfos, false);
        this.shader.updateUniform("u_VirtualCams", virtualCamInfos, false);
        this.shader.updateUniform("u_viewShift", this.parameters.viewShift, false);
        this.shader.updateUniform("u_LenticularSlope", this.parameters.lenticularSlopeY / this.parameters.lenticularSlopeX, false);
        this.shader.updateUniform("u_HeightMapScale", this.parameters.depthScale, false);

        //WebGl.context.disable(WebGl.context.DEPTH_TEST);
        WebGl.context.enable(WebGl.context.CULL_FACE);
        WebGl.context.disable(WebGl.context.BLEND);

        // render fullscreen triangle
        WebGl.context.drawArrays(WebGl.context.TRIANGLES, 0, 3);
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

    // same transform, recursive
    drawNode(gltf, node)
    {
        // draw primitive:
        let mesh = gltf.meshes[node.mesh];
        if (mesh !== undefined)
        {
            for (let primitive of mesh.primitives)
            {
                this.drawPrimitive(gltf, primitive, node.worldTransform, this.viewProjectionMatrix, node.normalMatrix);
            }
        }
    }

    // vertices with given material
    drawPrimitive(gltf, primitive, modelMatrix, viewProjectionMatrix, normalMatrix)
    {
        if (primitive.skip) return;

        const material = gltf.materials[primitive.material];

        //select shader permutation, compile and link program.

        let fragDefines = material.getDefines().concat(primitive.getDefines());
        this.pushParameterDefines(gltf, fragDefines);

        const fragmentHash = this.shaderCache.selectShader(material.getShaderIdentifier(), fragDefines);
        const vertexHash  = this.shaderCache.selectShader(primitive.getShaderIdentifier(), primitive.getDefines());

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
        this.shader.updateUniform("u_ModelMatrix", modelMatrix);
        this.shader.updateUniform("u_NormalMatrix", normalMatrix, false);
        this.shader.updateUniform("u_Gamma", this.parameters.gamma, false);
        this.shader.updateUniform("u_Exposure", this.parameters.exposure, false);
        this.shader.updateUniform("u_Camera", this.currentCameraPosition, false);

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
            WebGl.context.drawElements(primitive.mode, indexAccessor.count, indexAccessor.componentType, indexAccessor.byteOffset);
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

    pushParameterDefines(gltf, fragDefines)
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
            gltf.envData = {};
            gltf.envData.diffuseEnvMap = new gltfTextureInfo(gltf.textures.length - 3, 0);
            gltf.envData.specularEnvMap = new gltfTextureInfo(gltf.textures.length - 2, 0);
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
