class gltfRenderer
{
    constructor(canvas, viewer)
    {
        this.canvas = canvas;
        this.shader = undefined; // current shader

        this.currentWidth  = 0;
        this.currentHeight = 0;

        this.shaderCache = new ShaderCache("src/shaders/", [
            "primitive.vert",
            "metallic-roughness.frag"
        ]);

        this.viewMatrix = mat4.create();
        this.projMatrix = mat4.create();
        this.viewProjMatrix = mat4.create();

        this.viewer = viewer;

        this.defaultCamera = new gltfCamera();
        let eye = vec3.fromValues(0.0, 0.0, -4.0);
        let at  = vec3.fromValues(0.0, 0.0,  0.0);
        let up  = vec3.fromValues(0.0, 1.0,  0.0);
        mat4.lookAt(this.viewMatrix, eye, at, up);
        this.currentCameraPosition = eye;

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
        gl.clearColor(0.2, 0.2, 0.2, 1.0);
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
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    // render complete gltf scene with given camera
    drawScene(gltf, sceneIndex, cameraIndex, recursive)
    {
        // TODO: upload lights

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

        if(currentCamera.node !== undefined)
        {
            const view = gltf.nodes[currentCamera.node];
            this.currentCameraPosition = view.translation;
            this.viewMatrix = view.getTransform();
        }

        if (this.viewer !== undefined)
        {
            // TODO: eventually remove viewer from this call!
            this.viewMatrix = this.viewer.getViewTransform();
            this.currentCameraPosition = this.viewer.getCameraPosition();
        }

        mat4.multiply(this.viewProjMatrix, this.projMatrix, this.viewMatrix);

        // TODO: pass a scene transfrom to be able to translate & rotate using the mouse

        let transform = mat4.create();
        let scene = gltf.scenes[sceneIndex];

        for (let i of scene.nodes)
        {
            this.drawNode(gltf, scene, i, transform, recursive);
        }
    }

    // same transform, recursive
    drawNode(gltf, scene, nodeIndex, parentTransform, recursive)
    {
        let node = gltf.nodes[nodeIndex];

        if(node === undefined)
        {
            console.log("Undefined node " + nodeIndex);
            return;
        }

        let mvpMatrix = mat4.create();
        let modelInverse = mat4.create();
        let normalMatrix = mat4.create();

        // update model & mvp & normal matrix
        let nodeTransform = node.getTransform();
        mat4.multiply(nodeTransform, parentTransform, nodeTransform);
        mat4.multiply(mvpMatrix, this.viewProjMatrix, nodeTransform);
        mat4.invert(modelInverse, nodeTransform);
        mat4.transpose(normalMatrix, modelInverse);

        // draw primitive:
        let mesh = gltf.meshes[node.mesh];
        if(mesh !== undefined)
        {
            for (let primitive of mesh.primitives) {
                this.drawPrimitive(gltf, primitive, nodeTransform, mvpMatrix, normalMatrix);
            }
        }

        if(recursive)
        {
            for (let i of node.children) {
                this.drawNode(gltf, scene, i, nodeTransform, recursive);
            }
        }
    }

    // vertices with given material
    drawPrimitive(gltf, primitive, modelMatrix, mvpMatrix, normalMatrix)
    {
        if (primitive.skip) return;

        const material = gltf.materials[primitive.material];

        //select shader permutation, compile and link program.

        let fragDefines =  material.getDefines().concat(primitive.getDefines());

        if (this.viewer.parameters.useIBL) {
            fragDefines.push("USE_IBL");
            fragDefines.push("USE_TEX_LOD");
        }

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

        // update model dependant matrices once per node
        this.shader.updateUniform("u_MVPMatrix", mvpMatrix);
        this.shader.updateUniform("u_ModelMatrix", modelMatrix);
        this.shader.updateUniform("u_NormalMatrix", normalMatrix, false);
        this.shader.updateUniform("u_Camera", this.currentCameraPosition);

        if (material.doubleSided) {
            gl.disable(gl.CULL_FACE);
        } else {
            gl.enable(gl.CULL_FACE);
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

        if (this.viewer.parameters.useIBL) {
            this.applyEnvironmentMap(gltf, material.textures.length);
        }

        if (drawIndexed)
        {
            let indexAccessor = gltf.accessors[primitive.indices];
            gl.drawElements(primitive.mode, indexAccessor.count, gl.UNSIGNED_SHORT, 0);
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

    applyEnvironmentMap(gltf, texSlotOffset)
    {
        let diffuseEnvMap = new gltfTextureInfo(gltf.textures.length - 3); // TODO: srgb
        let specularEnvMap = new gltfTextureInfo(gltf.textures.length - 2); // TODO: srgb
        let lut = new gltfTextureInfo(gltf.textures.length - 1); // TODO: srgb

        diffuseEnvMap.generateMips = false;
        specularEnvMap.generateMips = false;
        lut.generateMips = false;

        SetTexture(this.shader.getUniformLocation("u_DiffuseEnvSampler"), gltf, diffuseEnvMap, texSlotOffset);
        SetTexture(this.shader.getUniformLocation("u_SpecularEnvSampler"), gltf, specularEnvMap, texSlotOffset + 1);
        SetTexture(this.shader.getUniformLocation("u_brdfLUT"), gltf, lut, texSlotOffset + 2);

        this.shader.updateUniform("u_ScaleDiffBaseMR", jsToGl([0, 0, 0, 0]));
        this.shader.updateUniform("u_ScaleFGDSpec", jsToGl([0, 0, 0, 0]));
        this.shader.updateUniform("u_ScaleIBLAmbient", jsToGl([1, 1, 0, 0]));
    }

    destroy()
    {
        this.shaderCache.destroy();
    }
};
