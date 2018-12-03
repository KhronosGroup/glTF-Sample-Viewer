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

        this.shaderCache = new ShaderCache(basePath + "src/shaders/", [
            "primitive.vert",
            "metallic-roughness.frag",
            "tonemapping.glsl",
            "textures.glsl"
        ]);

        let requiredWebglExtensions = [
            "EXT_shader_texture_lod",
            "OES_standard_derivatives",
            "OES_element_index_uint",
            "EXT_texture_filter_anisotropic",
			"OES_texture_float",
			"OES_texture_float_linear"
        ];

        LoadWebGLExtensions(requiredWebglExtensions);

        this.visibleLights = [];

        this.viewMatrix = mat4.create();
        this.projMatrix = mat4.create();
        this.viewProjMatrix = mat4.create();

        this.currentCameraPosition = vec3.create();

        this.init();
        this.resize(canvas.canvasWidth, canvas.canvasHeight);
    }

    /////////////////////////////////////////////////////////////////////
    // Render glTF scene graph
    /////////////////////////////////////////////////////////////////////

    // app state
    init()
    {
        //TODO: To achieve correct rendering, WebGL runtimes must disable such conversions by setting UNPACK_COLORSPACE_CONVERSION_WEBGL flag to NONE
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.colorMask(true, true, true, true);
        gl.clearDepth(1.0);
    }

    resize(width, height)
    {
        if (this.currentWidth !== width || this.currentHeight !== height)
        {
            this.canvas.width  = width;
            this.canvas.height = height;
            this.currentHeight = height;
            this.currentWidth  = width;
            gl.viewport(0, 0, width, height);
        }
    }

    // frame state
    newFrame()
    {
        gl.clearColor(this.parameters.clearColor[0] / 255.0, this.parameters.clearColor[1] / 255.0, this.parameters.clearColor[2]  / 255.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    // render complete gltf scene with given camera
    drawScene(gltf, scene, cameraIndex, recursive, sortByDepth = false)
    {
        // if (spector !== undefined) {
        //     spector.setMarker("Draw scene alpha " + sortByDepth);
        // }

        let currentCamera = undefined;

        if(cameraIndex !== -1)
        {
            currentCamera = gltf.cameras[cameraIndex].clone();
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

        mat4.multiply(this.viewProjMatrix, this.projMatrix, this.viewMatrix);

        // Optional: pass a scene transfrom to be able to translate & rotate using the mouse

        let transform = mat4.create();

        if(sortByDepth)
        {
            scene.sortSceneByDepth(gltf, this.viewProjMatrix, transform);
        }

        for (let i of scene.nodes)
        {
            this.drawNode(gltf, scene, i, recursive);
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
                if (scene.nodes.includes(light.node))
                {
                    lights.push(light);
                }
            }
        }
        return lights.length > 0 ? lights : [ new gltfLight() ];
    }

    // same transform, recursive
    drawNode(gltf, scene, nodeIndex, recursive)
    {
        let node = gltf.nodes[nodeIndex];

        if(node === undefined)
        {
            console.log("Undefined node " + nodeIndex);
            return;
        }

        let mvpMatrix = mat4.create();

        // update mvp
        const nodeTransform = node.worldTransform;
        mat4.multiply(mvpMatrix, this.viewProjMatrix, nodeTransform);

        // draw primitive:
        let mesh = gltf.meshes[node.mesh];
        if(mesh !== undefined)
        {
            for (let primitive of mesh.primitives) {
                this.drawPrimitive(gltf, primitive, nodeTransform, mvpMatrix, node.normalMatrix);
            }
        }

        if(recursive)
        {
            for (let i of node.children) {
                this.drawNode(gltf, scene, i, recursive);
            }
        }
    }

    // vertices with given material
    drawPrimitive(gltf, primitive, modelMatrix, mvpMatrix, normalMatrix)
    {
        if (primitive.skip) return;

        const material = gltf.materials[primitive.material];

        //select shader permutation, compile and link program.

        let fragDefines = material.getDefines().concat(primitive.getDefines());
        this.pushParameterDefines(fragDefines);

        const fragmentHash = this.shaderCache.selectShader(material.getShaderIdentifier(), fragDefines);
        const vertexHash  = this.shaderCache.selectShader(primitive.getShaderIdentifier(), primitive.getDefines());

        if(fragmentHash && vertexHash)
        {
            this.shader = this.shaderCache.getShaderProgram(fragmentHash, vertexHash);
        }

        if(this.shader === undefined)
        {
            return;
        }

        gl.useProgram(this.shader.program);

        if (this.parameters.usePunctual)
        {
            this.applyLights(gltf);
        }

        // update model dependant matrices once per node
        this.shader.updateUniform("u_MVPMatrix", mvpMatrix);
        this.shader.updateUniform("u_ModelMatrix", modelMatrix);
        this.shader.updateUniform("u_NormalMatrix", normalMatrix, false);
        this.shader.updateUniform("u_Gamma", this.parameters.gamma, false);
        this.shader.updateUniform("u_Exposure", this.parameters.exposure, false);
        this.shader.updateUniform("u_Camera", this.currentCameraPosition, false);

        if (material.doubleSided) {
            gl.disable(gl.CULL_FACE);
        } else {
            gl.enable(gl.CULL_FACE);
        }

        if(material.alphaMode === 'BLEND')
        {
            gl.enable(gl.BLEND);
            //gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
            gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            //gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // non pre mult alpha
            gl.blendEquation(gl.FUNC_ADD);

            // pre multiplied alpha
            // gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
            // gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        }
        else
        {
            gl.disable(gl.BLEND);
        }

        const drawIndexed = primitive.indices !== undefined;
        if (drawIndexed)
        {
            if (!SetIndices(gltf, primitive.indices))
            {
                return;
            }
        }

        let vertexCount = 0;
        for (let attrib of primitive.attributes)
        {
            let gltfAccessor = gltf.accessors[attrib.accessor];
            vertexCount = gltfAccessor.count;

            if (!EnableAttribute(gltf, this.shader.getAttribLocation(attrib.name), gltfAccessor))
            {
                return; // skip this primitive.
            }
        }

        for(let [uniform, val] of material.getProperties().entries())
        {
            this.shader.updateUniform(uniform, val);
        }

        for(let i = 0; i < material.textures.length; ++i)
        {
            let info = material.textures[i];
            if (!SetTexture(this.shader.getUniformLocation(info.samplerName), gltf, info, i)) // binds texture and sampler
            {
                return;
            }
        }

        if (this.parameters.useIBL)
        {
            this.applyEnvironmentMap(gltf, material.textures.length);
        }

        if (drawIndexed)
        {
            let indexAccessor = gltf.accessors[primitive.indices];
            gl.drawElements(primitive.mode, indexAccessor.count, indexAccessor.componentType, 0);
        }
        else
        {
            gl.drawArrays(primitive.mode, 0, vertexCount);
        }

        for (let attrib of primitive.attributes)
        {
            gl.disableVertexAttribArray(this.shader.getAttribLocation(attrib.name));
        }
    }

    pushParameterDefines(fragDefines)
    {
        if (this.parameters.usePunctual)
        {
            fragDefines.push("USE_PUNCTUAL 1");
            fragDefines.push("LIGHT_COUNT " + this.visibleLights.length);
        }

        if (this.parameters.useIBL)
        {
            fragDefines.push("USE_IBL 1");
            fragDefines.push("USE_TEX_LOD 1");
        }

        if (this.parameters.useHdr)
        {
            fragDefines.push("USE_HDR 1");
        }

        switch(this.parameters.toneMap)
        {
            case(ToneMaps.uncharted):
                fragDefines.push("TONEMAP_UNCHARTED 1");
                break;
            case(ToneMaps.hejlRichard):
                fragDefines.push("TONEMAP_HEJLRICHARD 1");
                break;
            case(ToneMaps.linear):
            default:
                break;
        }

        if(this.parameters.debugOutput !== DebugOutput.none)
        {
            fragDefines.push("DEBUG_OUTPUT 1");
        }

        switch(this.parameters.debugOutput)
        {
            case(DebugOutput.metallic):
                fragDefines.push("DEBUG_METALLIC 1");
                break;
            case(DebugOutput.roughness):
                fragDefines.push("DEBUG_ROUGHNESS 1");
                break;
            case(DebugOutput.normal):
                fragDefines.push("DEBUG_NORMAL 1");
                break;
            case(DebugOutput.baseColor):
                fragDefines.push("DEBUG_BASECOLOR 1");
                break;
            case(DebugOutput.occlusion):
                fragDefines.push("DEBUG_OCCLUSION 1");
                break;
            case(DebugOutput.emisive):
                fragDefines.push("DEBUG_EMISSIVE 1");
                break;
            case(DebugOutput.f0):
                fragDefines.push("DEBUG_F0 1");
                break;
            case(DebugOutput.alpha):
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
        let diffuseEnvMap = new gltfTextureInfo(gltf.textures.length - 3, 0);
        let specularEnvMap = new gltfTextureInfo(gltf.textures.length - 2, 0);
        let lut = new gltfTextureInfo(gltf.textures.length - 1);

        specularEnvMap.generateMips = false;
        lut.generateMips = false;

        SetTexture(this.shader.getUniformLocation("u_DiffuseEnvSampler"), gltf, diffuseEnvMap, texSlotOffset);
        SetTexture(this.shader.getUniformLocation("u_SpecularEnvSampler"), gltf, specularEnvMap, texSlotOffset + 1);
        SetTexture(this.shader.getUniformLocation("u_brdfLUT"), gltf, lut, texSlotOffset + 2);

        this.shader.updateUniform("u_ScaleIBLAmbient", jsToGl([1, 1, 0, 0]));
    }

    destroy()
    {
        this.shaderCache.destroy();
    }
};
