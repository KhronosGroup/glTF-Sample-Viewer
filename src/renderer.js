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

        // TODO: change shader folder to src/shaders & add actuall shaders
        this.shaderCache = new ShaderCache("shaders/", ["primitive.vert", "metallic-roughness.frag"]);

        this.uniformTypes = new Map();
        this.uniformTypes[gl.FLOAT] = 'uniform1f';
        this.uniformTypes[gl.FLOAT_VEC2] = 'uniform2f';
        this.uniformTypes[gl.FLOAT_VEC3] = 'uniform3f';
        this.uniformTypes[gl.FLOAT_VEC4] = 'uniform4f';

        this.uniformTypes[gl.INT] = 'uniform1i';
        this.uniformTypes[gl.INT_VEC2] = 'uniform2i';
        this.uniformTypes[gl.INT_VEC3] = 'uniform3i';
        this.uniformTypes[gl.INT_VEC4] = 'uniform4i';

        this.uniformTypes[gl.FLOAT_MAT2] = 'uniformMatrix2fv';
        this.uniformTypes[gl.FLOAT_MAT3] = 'uniformMatrix3fv';
        this.uniformTypes[gl.FLOAT_MAT4] = 'uniformMatrix4fv';

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
        gl.clearColor(0.2, 0.2, 0.2, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        frontBuffer.clearRect(0, 0, this.width, this.height);
    }

    // render complete gltf scene with given camera
    drawScene(gltf, sceneIndex, cameraIndex, recursive)
    {
        // upload lights

        // upload camera matrices

        if(cameraIndex !== -1)
        {
            const camera = gltf.cameras[cameraIndex];
            this.projMatrix = camera.getProjectionMatrix();
            if(camera.node !== undefined)
            {
                const view = gltf.nodes[camera.node];
                this.viewMatrix = view.getTransform();
            }
        }

        mat4.multiply(this.viewProjMatrix, this.projMatrix, this.viewProjMatrix);

        // TODO: pass a scene transfrom to be able to translate & rotate using the mouse
        let transform = mat4.create();
        let scene = gltf.scenes[sceneIndex];

        for (var i = 0; i < scene.nodes.length; i++) {
            drawNode(gltf, scene, i, transform, recursive);
        }
    }

    // same transform, recursive
    drawNode(gltf, scene, nodeIndex, parentTransform, recursive)
    {
        let node = gltf.nodes[scene.nodes[nodeIndex]];

        // update model & mvp & normal matrix
        mat4.multiply(this.modelMatrix, node.getTransform(), parentTransform);
        mat4.multiply(this.mvpMatrix, this.viewProjMatrix, this.modelMatrix);
        mat4.invert(this.modelInverse, this.modelMatrix);
        mat4.transpose(this.normalMatrix, this.modelInverse);

        // draw primitive:
        for (var i = 0; i < node.primitives.length; i++) {
            this.drawPrimitive(gltf, node.primitives[i], i == 0);
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
        let vertexhader = this.shaderCache.getShader(primitive.getShaderIdentifier(), primitive.getDefines());

        this.program = LinkProgram(vertexhader, fragmentShader);

        if(this.program === undefined)
        {
            return;
        }

        if(firstPrimitive) // TODO:check for changed vertex shader permutation
        {
            // update model dependant matrices once per node
            this.updateUniform("u_MVPMatrix", this.mvpMatrix);
            this.updateUniform("u_ModelMatrix", this.modelMatrix);
            this.updateUniform("u_NormalMatrix", this.mvpMatrix);
        }

        if (material.doubleSided) {
            gl.disable(gl.CULL_FACE);
        } else {
            gl.enable(gl.CULL_FACE);
        }

        const drawIndexed = primitive.indices !== undefined;
        if (drawIndexed)
        {
            if (!SetIndices(gltf, indexAccessor))
            {
                return;
            }
        }

        let vertexCount = 0;
        for (let [attribute, accessorIndex] of primitive.attributes.entries())
        {
            let gltfAccessor = gltf.accessors[accessorIndex];
            vertexCount = gltfAccessor.count;

            if (!EnableAttribute(gltf, this.program, primitive.attributeNames[attribute], gltfAccessor))
            {
                return; // skip this primitive.
            }
        }

        for(let [uniform, val] of material.getProperties().entries())
        {
            updateUniform(uniform, val);
        }

        for(let tex of material.getTextures())
        {
            SetTexture(gltf, tex); // binds texture and sampler
        }

        // TODO:
        // - set transforms

        if (drawIndexed)
        {
            let indexAccessor = gltf.accessors[primitive.indices];
            gl.drawElements(primitive.mode, indexAccessor.count, indexAccessor.componentType, indexAccessor.byteOffset);
        }
        else
        {
            gl.drawArrays(primitive.mode, 0, vertexCount);
        }

        for (let attributeName in primitive.attributes)
        {
            DisableAttribute(this.program, attributeName);
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
    updateUniform(name, values)
    {
        const loc = gl.getUniformLocation(name);
        if(loc)
        {
            const info = gl.getActiveUniform(this.program, loc);
            gl[this.uniformTypes[info.type]](...values);
        }
    }
};
