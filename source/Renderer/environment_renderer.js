import { mat4, mat3, vec3 } from 'gl-matrix';


class EnvironmentRenderer
{
    constructor(shaderCache, webgl)
    {
        // create shader program
        const vertShader = shaderCache.selectShader("cubemap.vert", []);
        const fragShader = shaderCache.selectShader("cubemap.frag", []);
        this.shader = shaderCache.getShaderProgram(vertShader, fragShader);

        // allocate and write vertex buffers
        const gl = webgl.context;
        const program = this.shader.program

        this.positionAttributeLocation = gl.getAttribLocation(program, "a_position");

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
        if (state.environment == undefined)
        {
            return
        }

        const gl = webGl.context;
        gl.useProgram(this.shader.program);
        webGl.setTexture(this.shader.getUniformLocation("u_specularEnvSampler"), state.environment, state.environment.specularEnvMap, 0);

        this.shader.updateUniform("u_ViewProjectionMatrix", viewProjectionMatrix);
        this.shader.updateUniform("u_Exposure", state.renderingParameters.exposure, false);

        let rotMatrix4 = mat4.create();
        mat4.rotateY(rotMatrix4, rotMatrix4,  state.renderingParameters.environmentRotation / 180.0 * Math.PI);
        let rotMatrix3 = mat3.create();
        mat3.fromMat4(rotMatrix3, rotMatrix4);
        this.shader.updateUniform("u_envRotation", rotMatrix3);


        gl.enableVertexAttribArray(this.positionAttributeLocation);
        gl.vertexAttribPointer(this.positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
    }
}

export { EnvironmentRenderer }
