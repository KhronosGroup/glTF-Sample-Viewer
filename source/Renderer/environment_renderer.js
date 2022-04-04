import { mat4, mat3, vec3 } from 'gl-matrix';


class EnvironmentRenderer
{
    constructor(webgl)
    {
        const gl = webgl.context;

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

    drawEnvironmentMap(webGl, viewProjectionMatrix, state, shaderCache, fragDefines)
    {
        if (state.environment == undefined || state.renderingParameters.renderEnvironmentMap == false)
        {
            return;
        }

        const gl = webGl.context;

        const vertShader = shaderCache.selectShader("cubemap.vert", []);
        const fragShader = shaderCache.selectShader("cubemap.frag", fragDefines);
        const shader = shaderCache.getShaderProgram(vertShader, fragShader);

        gl.useProgram(shader.program);
        webGl.setTexture(shader.getUniformLocation("u_GGXEnvSampler"), state.environment, state.environment.specularEnvMap, 0);
        shader.updateUniform("u_MipCount", state.environment.mipCount);
        shader.updateUniform("u_EnvBlurNormalized", state.renderingParameters.blurEnvironmentMap ? 0.6 : 0.0);
        shader.updateUniform("u_EnvIntensity", state.renderingParameters.iblIntensity);

        shader.updateUniform("u_ViewProjectionMatrix", viewProjectionMatrix);
        shader.updateUniform("u_Exposure", state.renderingParameters.exposure, false);

        let rotMatrix4 = mat4.create();
        mat4.rotateY(rotMatrix4, rotMatrix4,  state.renderingParameters.environmentRotation / 180.0 * Math.PI);
        let rotMatrix3 = mat3.create();
        mat3.fromMat4(rotMatrix3, rotMatrix4);
        shader.updateUniform("u_EnvRotation", rotMatrix3);

        gl.frontFace(gl.CCW);
        gl.enable(gl.CULL_FACE);
        gl.disable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);

        const positionAttributeLocation = shader.getAttributeLocation("a_position");
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

        gl.enable(gl.DEPTH_TEST);
    }
}

export { EnvironmentRenderer }
