class EnvironmentRenderer
{
    constructor(shaderCache, webgl)
    {
        // create shader program
        const vertShader = shaderCache.selectShader("cubemap.vert");
        const fragShader = shaderCache.selectShader("cubemap.frag");
        this.shader = selectShader.getShaderProgram(vertShader, fragShader);

        // allocate and write vertex buffers
        const gl = webgl.context;
        const program = this.shader.program

        const positionAttributeLocation = gl.getAttribLocation(program, "a_position");

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        gl.enableVertexAttribArray(positionAttributeLocation);

        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([
            1, 2, 0,
            2, 3, 0,
            6, 2, 1,
            1, 5, 6,
            6, 5, 4,
            4, 7, 6,
            6, 3, 2,
            7, 3, 6,
            3, 7, 0,
            7, 4, 0,
            5, 1, 0,
            4, 5, 0
        ]), gl.STATIC_DRAW);

        gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

        this.vertexBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1, -1,
             1, -1, -1,
             1,  1, -1,
            -1,  1, -1,
            -1, -1,  1,
             1, -1,  1,
             1,  1,  1,
            -1,  1,  1
        ]), gl.STATIC_DRAW);
    }

    drawEnvironmentMap(webGl, viewProjectionMatrix, state)
    {
        const gl = webGl.context;
        gl.bindVertexArray(this.vao);
        gl.useProgram(this.shader.program);
        webGl.setTexture(this.shader.getUniformLocation("u_specularEnvSampler"), state.environment, state.environment.specularEnvMap, 0);

        this.shader.updateUniform("u_ViewProjectionMatrix", viewProjectionMatrix);

        let rotMatrix4 = mat4.create();
        mat4.rotateY(rotMatrix4, rotMatrix4,  state.renderingParameters.environmentRotation / 180.0 * Math.PI);
        let rotMatrix3 = mat3.create();
        mat3.fromMat4(rotMatrix3, rotMatrix4);
        this.shader.updateUniform("u_envRotation", rotMatrix3);

        gl.drawElements(gl.TRIANGLES, 3 * 8, gl.UNSIGNED_SHORT, 0);
    }
}
