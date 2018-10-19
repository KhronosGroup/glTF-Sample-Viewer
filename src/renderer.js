// All WebGL calls are in this class

class gltfRenderer
{
    constructor(frontBuffer, backBuffer)
    {
        this.frontBuffer = frontBuffer;
        this.backBuffer = backBuffer;
        this.width = 1600;
        this.height = 900;
        this.program = undefined; // current active shader

        this.extensions = ["EXT_shader_texture_lod", "OES_standard_derivatives","EXT_SRGB"];

        for (let extension of this.extensions)
        {
            if(gl.getExtension(extension) === null)
            {
                console.warn("Extension " + extension + " not supported");
            }
        }

        // TODO: change shader folder to src/shaders & add actuall shaders
        this.shaderCache = new ShaderCache("shaders/", ["primitive.vert", "metallic-roughness.frag"]);

        this.modelMatrix = mat4.create();
        this.viewMatrix = mat4.create();
        this.projMatrix = mat4.create();
        this.viewProjMatrix = mat4.create();
        this.mvpMatrix = mat4.create();
        this.modelInverse = mat4.create();
        this.normalMatrix = mat4.create();
    }

    /////////////////////////////////////////////////////////////////////
    // Render glTF scene graph
    /////////////////////////////////////////////////////////////////////

    // app state
    init()
    {
        //TODO: To achieve correct rendering, WebGL runtimes must disable such conversions by setting UNPACK_COLORSPACE_CONVERSION_WEBGL flag to NONE

        gl.enable(gl.DEPTH_TEST);
    }

    // TODO: update camera aspect ratio
    resize(width, height)
    {
        gl.viewport(0, 0, width, height);
        this.width = width;
        this.height = height;
    }

    // frame state
    newFrame()
    {
        gl.clearColor(1.0, 0.2, 0.2, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        this.frontBuffer.clearRect(0, 0, this.width, this.height);
    }

    // render complete gltf scene with given camera
    drawScene(gltf, sceneIndex, cameraIndex, recursive)
    {
        // TODO: upload lights

        // construct camera matrices
        let camera = undefined;

        if(cameraIndex !== -1)
        {
            camera = gltf.cameras[cameraIndex];
        }else
        {
            camera = new gltfCamera(); // default camera
        }

        this.projMatrix = camera.getProjectionMatrix();
        if(camera.node !== undefined)
        {
            const view = gltf.nodes[camera.node];
            this.viewMatrix = view.getTransform();
        }

        mat4.multiply(this.viewProjMatrix, this.projMatrix, this.viewMatrix);

        // TODO: pass a scene transfrom to be able to translate & rotate using the mouse
        let transform = mat4.create();
        let scene = gltf.scenes[sceneIndex];

        for (var i = 0; i < scene.nodes.length; i++) {
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

        // draw children (TODO: cycles must be detected)
        for (var i = 0; i < node.children.length && recursive; i++) {
            this.drawNode(gltf, scene, i, this.modelMatrix, recursive);
        }
    }

    // vertices with given material
    drawPrimitive(gltf, primitive, firstPrimitive)
    {
        if (primitive.skip) return;

        const material = gltf.materials[primitive.material];

        //select shader permutation & compile and link
        let fragmentShader = this.shaderCache.getShader(material.getShaderIdentifier(), material.getDefines());
        let vertexShader = this.shaderCache.getShader(primitive.getShaderIdentifier(), primitive.getDefines());

        if(fragmentShader && vertexShader)
        {
            this.program = LinkProgram(vertexShader, fragmentShader);
        }

        if(this.program === undefined)
        {
            return;
        }

        gl.useProgram(this.program);

        if(firstPrimitive) // TODO:check for changed vertex shader permutation
        {
            // update model dependant matrices once per node
            this.updateUniform("u_MVPMatrix", this.mvpMatrix);
            this.updateUniform("u_ModelMatrix", this.modelMatrix);
            this.updateUniform("u_NormalMatrix", this.normalMatrix);
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

            if (!EnableAttribute(gltf, this.program, attrib.name, gltfAccessor))
            {
                return; // skip this primitive.
            }
        }

        for(let [uniform, val] of material.getProperties().entries())
        {
            this.updateUniform(uniform, val);
        }

        for(let i = 0; i < material.textures.length; ++i)
        {
            if (!SetTexture(this.program, gltf, material.textures[i], i)) // binds texture and sampler
            {
                return;
            }
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
            DisableAttribute(this.program, attrib.name);
        }
    }

    // draw final image to frontbuffer
    drawImage()
    {
        this.frontBuffer.drawImage(this.backBuffer, 0, 0);
    }

    /////////////////////////////////////////////////////////////////////
    // WebGL helpers & implementation detail
    /////////////////////////////////////////////////////////////////////

    // upload the values of a uniform with the given name using type resolve to get correct function call
    // vec3 => gl.uniform3f(value)
    updateUniform(name, value)
    {
        const loc = gl.getUniformLocation(this.program, name);
        if(loc)
        {
            const info = gl.getActiveUniform(this.program, loc);
            switch (info.type) {
                case gl.FLOAT: gl.uniform1f(loc, value); break;
                case gl.FLOAT_VEC2: gl.uniform2f(loc, value); break;
                case gl.FLOAT_VEC3: gl.uniform3f(loc, value); break;
                case gl.FLOAT_VEC4: gl.uniform4f(loc, value); break;

                case gl.INT: gl.uniform1i(loc, value); break;
                case gl.INT_VEC2: gl.uniform2i(loc, value); break;
                case gl.INT_VEC3: gl.uniform3i(loc, value); break;
                case gl.INT_VEC4: gl.uniform4i(loc, value); break;

                case gl.FLOAT_MAT2: gl.uniformMatrix2fv(loc, false, value); break;
                case gl.FLOAT_MAT3: gl.uniformMatrix3fv(loc, false, value); break;
                case gl.FLOAT_MAT4: gl.uniformMatrix4fv(loc, false, value); break;
            }
        }
    }
};
