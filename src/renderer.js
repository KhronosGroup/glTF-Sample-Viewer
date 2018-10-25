class gltfRenderer
{
    constructor(canvas)
    {
        this.canvas = canvas;
        this.shader = undefined; // current shader

        this.currentWidth  = this.canvas.width;
        this.currentHeight = this.canvas.height;

        this.extensions = [
            "EXT_shader_texture_lod",
            "OES_standard_derivatives",
            "OES_element_index_uint",
            "EXT_SRGB"
        ];

        for (let extension of this.extensions)
        {
            if(gl.getExtension(extension) === null)
            {
                console.warn("Extension " + extension + " not supported");
            }
        }

        this.shaderCache = new ShaderCache("src/shaders/", [
            "primitive.vert",
            "metallic-roughness.frag"
        ]);

        this.modelMatrix = mat4.create();
        this.viewMatrix = mat4.create();
        this.projMatrix = mat4.create();
        this.viewProjMatrix = mat4.create();
        this.mvpMatrix = mat4.create();
        this.modelInverse = mat4.create();
        this.normalMatrix = mat4.create();

        this.defaultCamera = new gltfCamera();
        let eye = vec3.fromValues(2.0, 2.0, -4.0);
        let at  = vec3.fromValues(0.0, 0.0,  0.0);
        let up  = vec3.fromValues(0.0, 1.0,  0.0);
        mat4.lookAt(this.viewMatrix, eye, at, up);
        this.currentCameraPosition = at;
    }

    /////////////////////////////////////////////////////////////////////
    // Render glTF scene graph
    /////////////////////////////////////////////////////////////////////

    // app state
    init()
    {
        //TODO: To achieve correct rendering, WebGL runtimes must disable such conversions by setting UNPACK_COLORSPACE_CONVERSION_WEBGL flag to NONE
        gl.enable(gl.DEPTH_TEST);
        gl.clearColor(0.392, 0.584, 0.929, 1.0);
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

            let aspectRatio = width / height;
            gl.viewport(0, 0, width, height);

            this.defaultCamera.aspectRatio = aspectRatio;
            for (let i = 0; i < gltf.cameras.length; ++i)
            {
                gltf.cameras[i].aspectRatio = aspectRatio;
            }
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
            currentCamera = gltf.cameras[cameraIndex];
        }
        else
        {
            currentCamera = this.defaultCamera;
        }

        this.projMatrix = currentCamera.getProjectionMatrix();

        if(currentCamera.node !== undefined)
        {
            const view = gltf.nodes[currentCamera.node];
            this.currentCameraPosition = view.translation;
            this.viewMatrix = view.getTransform();
        }

        mat4.multiply(this.viewProjMatrix, this.projMatrix, this.viewMatrix);

        // TODO: pass a scene transfrom to be able to translate & rotate using the mouse

        let transform = mat4.create();
        let scene = gltf.scenes[sceneIndex];

        for (var i = 0; i < scene.nodes.length; i++)
        {
            this.drawNode(gltf, scene, i, transform, recursive);
        }
    }

    // same transform, recursive
    drawNode(gltf, scene, nodeIndex, parentTransform, recursive)
    {
        let node = gltf.nodes[scene.nodes[nodeIndex]];

        // update model & mvp & normal matrix
        let nodeTransform = node.getTransform();
        mat4.multiply(this.modelMatrix, nodeTransform, parentTransform);
        mat4.multiply(this.mvpMatrix, this.viewProjMatrix, this.modelMatrix);
        mat4.invert(this.modelInverse, this.modelMatrix);
        mat4.transpose(this.normalMatrix, this.modelInverse);

        // draw primitive:
        let mesh = gltf.meshes[node.mesh];
        if(mesh !== undefined)
        {
            for (var i = 0; i < mesh.primitives.length; i++) {
                this.drawPrimitive(gltf, mesh.primitives[i], i == 0);
            }
        }

        for (var i = 0; i < node.children.length && recursive; i++) {
            this.drawNode(gltf, scene, i, this.modelMatrix, recursive);
        }
    }

    // vertices with given material
    drawPrimitive(gltf, primitive, firstPrimitive)
    {
        if (primitive.skip) return;

        const material = gltf.materials[primitive.material];

        //select shader permutation, compile and link program.

        const fragmentHash = this.shaderCache.selectShader(material.getShaderIdentifier(),  material.getDefines());
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

        if(firstPrimitive) // TODO:check for changed vertex shader permutation
        {
            // update model dependant matrices once per node
            this.shader.updateUniform("u_MVPMatrix", this.mvpMatrix);
            this.shader.updateUniform("u_ModelMatrix", this.modelMatrix);
            this.shader.updateUniform("u_NormalMatrix", this.normalMatrix);
            this.shader.updateUniform("u_Camera", this.currentCameraPosition);
        }

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

            if (!EnableAttribute(gltf, this.shader.program, attrib.name, gltfAccessor))
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
            if (!SetTexture(this.shader.program, gltf, material.textures[i], i)) // binds texture and sampler
            {
                return;
            }
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
            DisableAttribute(this.shader.program, attrib.name);
        }
    }
};
