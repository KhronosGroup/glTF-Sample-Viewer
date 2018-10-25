class gltfShader
{
    constructor(program, hash)
    {
        this.program = program;
        this.hash = hash;
        this.uniforms = new Map();

        if(this.program !== undefined)
        {
            const uniformCount = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
            for(let i = 0; i < uniformCount; ++i)
            {
                const info = gl.getActiveUniform(this.program, i);
                const loc = gl.getUniformLocation(this.program, info.name);
                this.uniforms.set(info.name, {type: info.type, loc: loc});
            }
        }
    }

    // upload the values of a uniform with the given name using type resolve to get correct function call
    // vec3 => gl.uniform3f(value)
    updateUniform(uniformName, value, log = true)
    {
        const uniform = this.uniforms.get(uniformName);

        if(uniform !== undefined)
        {
            switch (uniform.type) {
                case gl.FLOAT: gl.uniform1f(uniform.loc, value); break;
                case gl.FLOAT_VEC2: gl.uniform2fv(uniform.loc, value); break;
                case gl.FLOAT_VEC3: gl.uniform3fv(uniform.loc, value); break;
                case gl.FLOAT_VEC4: gl.uniform4fv(uniform.loc, value); break;

                case gl.INT: gl.uniform1i(uniform.loc, value); break;
                case gl.INT_VEC2: gl.uniform2iv(uniform.loc, value); break;
                case gl.INT_VEC3: gl.uniform3iv(uniform.loc, value); break;
                case gl.INT_VEC4: gl.uniform4iv(uniform.loc, value); break;

                case gl.FLOAT_MAT2: gl.uniformMatrix2fv(uniform.loc, false, value); break;
                case gl.FLOAT_MAT3: gl.uniformMatrix3fv(uniform.loc, false, value); break;
                case gl.FLOAT_MAT4: gl.uniformMatrix4fv(uniform.loc, false, value); break;
            }
        }
        else if(log)
        {
            console.warn("Unkown uniform: " + uniformName);
        }
    }
};
