// All WebGL calls are in this class

class Renderer
{
    constructor(gl, frontBuffer, backBuffer)
    {
        this.gl = gl;
        this.frontBuffer = frontBuffer;
        this.backBuffer = backBuffer;
        this.width = 1600;
        this.height = 900;

        this.uniformTypes[this.gl.FLOAT] = 'uniform1f';
        this.uniformTypes[this.gl.FLOAT_VEC2] = 'uniform2f';
        this.uniformTypes[this.gl.FLOAT_VEC3] = 'uniform3f';
        this.uniformTypes[this.gl.FLOAT_VEC4] = 'uniform4f';

        this.uniformTypes[this.gl.INT] = 'uniform1i';
        this.uniformTypes[this.gl.INT_VEC2] = 'uniform2i';
        this.uniformTypes[this.gl.INT_VEC3] = 'uniform3i';
        this.uniformTypes[this.gl.INT_VEC4] = 'uniform4i';

        this.uniformTypes[this.gl.FLOAT_MAT2] = 'uniformMatrix2fv';
        this.uniformTypes[this.gl.FLOAT_MAT3] = 'uniformMatrix3fv';
        this.uniformTypes[this.gl.FLOAT_MAT4] = 'uniformMatrix4fv';
    }

    updateUniform(name, values)
    {
        const loc = gl.getUniformLocation(name);
        if(loc)
        {
            const info = gl.getActiveUniform(this.program, loc);
            gl[this.uniformTypes[info.type]](...values);
        }
    }

    // app state
    init()
    {
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
        var camera = gltf.cameras[cameraIndex];

        // TODO: pass a scene transfrom to be able to translate & rotate using the mouse
        var transform = mat4.create();
        var scene = gltf.scenes[sceneIndex];

        for (var i = 0; i < scene.nodes.length; i++) {
            drawNode(gltf, scene, i, transform, recursive);
        }
    }

    // same transform, recursive
    drawNode(gltf, scene, nodeIndex, parentTransform, recursive)
    {
        var node = gltf.nodes[scene.nodes[nodeIndex]];

        // upload model matrix
        var transform = node.getTransform();
        mat4.multiply(transform, transform, parentTransform);

        // TODO:
        // - normal matrix
        // - set uniforms

        // draw primitive:
        // TODO: index into gltf shared meshes & textures etc
        for (var i = 0; i < node.primitives.length; i++) {
            this.drawPrimitive(gltf, node.primitives[i]);
        }

        // draw children (TODO: cycles must be detected)
        for (var i = 0; i < node.children.length && recursive; i++) {
            this.drawNode(gltf, scene, i, transform, recursive);
        }
    }

    // vertices with given material
    drawPrimitive(gltf, primitive)
    {
        // TODO:
        // - select shader permutation & compile and link (need shader cache/lookup)
        // - set textures & transforms
        // - set samplers
    }

    // draw final image to frontbuffer
    drawImage()
    {
        this.frontBuffer.drawImage(this.backBuffer, 0, 0);
    }
};
