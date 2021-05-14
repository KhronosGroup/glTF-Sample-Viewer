import { UniformStruct } from '../gltf/utils.js';
import { GL } from './webgl.js';

class gltfShader
{
    constructor(program, hash, gl)
    {
        this.program = program;
        this.hash = hash;
        this.uniforms = new Map();
        this.attributes = new Map();
        this.unknownAttributes = [];
        this.unknownUniforms = [];
        this.gl = gl;

        if(this.program !== undefined)
        {
            const uniformCount = this.gl.context.getProgramParameter(this.program, GL.ACTIVE_UNIFORMS);
            for(let i = 0; i < uniformCount; ++i)
            {
                const info = this.gl.context.getActiveUniform(this.program, i);
                const loc = this.gl.context.getUniformLocation(this.program, info.name);
                this.uniforms.set(info.name, {type: info.type, loc: loc});
            }

            const attribCount = this.gl.context.getProgramParameter(this.program, GL.ACTIVE_ATTRIBUTES);
            for(let i = 0; i < attribCount; ++i)
            {
                const info = this.gl.context.getActiveAttrib(this.program, i);
                const loc = this.gl.context.getAttribLocation(this.program, info.name);
                this.attributes.set(info.name, loc);
            }
        }
    }

    destroy()
    {
        if (this.program !== undefined)
        {
            this.deleteProgram(this.program);
        }

        this.program = undefined;
    }

    getAttributeLocation(name)
    {
        const loc = this.attributes.get(name);
        if (loc === undefined)
        {
            if (this.unknownAttributes.find(n => n === name) === undefined)
            {
                console.log("Attribute '%s' does not exist", name);
                this.unknownAttributes.push(name);
            }
            return -1;
        }
        return loc;
    }

    getUniformLocation(name)
    {
        const uniform = this.uniforms.get(name);
        if (uniform === undefined)
        {
            if (this.unknownUniforms.find(n => n === name) === undefined)
            {
                this.unknownUniforms.push(name);
            }
            return -1;
        }
        return uniform.loc;
    }

    updateUniform(objectName, object, log = false)
    {
        if (object instanceof UniformStruct)
        {
            this.updateUniformStruct(objectName, object, log);
        }
        else if (Array.isArray(object))
        {
            this.updateUniformArray(objectName, object, log);
        }
        else
        {
            this.updateUniformValue(objectName, object, log);
        }
    }

    updateUniformArray(arrayName, array, log)
    {
        if(array[0] instanceof UniformStruct)
        {
            for (let i = 0; i < array.length; ++i)
            {
                let element = array[i];
                let uniformName = arrayName + "[" + i + "]";
                this.updateUniform(uniformName, element, log);
            }
        }else{
            let uniformName = arrayName + "[0]";

            let flat = [];

            if(Array.isArray(array[0]) || array[0].length !== undefined)
            {
                for (let i = 0; i < array.length; ++i)
                {
                    flat.push.apply(flat, Array.from(array[i]));
                }
            }
            else
            {
                flat = array;
            }

            if(flat.length === 0)
            {
                console.error("Failed to flatten uniform array " + uniformName);
                return;
            }

            this.updateUniformValue(uniformName, flat, log);
        }
    }

    updateUniformStruct(structName, object, log)
    {
        let memberNames = Object.keys(object);
        for (let memberName of memberNames)
        {
            let uniformName = structName + "." + memberName;
            this.updateUniform(uniformName, object[memberName], log);
        }
    }

    // upload the values of a uniform with the given name using type resolve to get correct function call
    updateUniformValue(uniformName, value, log)
    {
        const uniform = this.uniforms.get(uniformName);

        if(uniform !== undefined)
        {
            switch (uniform.type) {
            case GL.FLOAT:
            {
                if(Array.isArray(value) || value instanceof Float32Array)
                {
                    this.gl.context.uniform1fv(uniform.loc, value);
                }else{
                    this.gl.context.uniform1f(uniform.loc, value);
                }
                break;
            }
            case GL.FLOAT_VEC2: this.gl.context.uniform2fv(uniform.loc, value); break;
            case GL.FLOAT_VEC3: this.gl.context.uniform3fv(uniform.loc, value); break;
            case GL.FLOAT_VEC4: this.gl.context.uniform4fv(uniform.loc, value); break;

            case GL.INT:
            {
                if(Array.isArray(value) || value instanceof Uint32Array || value instanceof Int32Array)
                {
                    this.gl.context.uniform1iv(uniform.loc, value);
                }else{
                    this.gl.context.uniform1i(uniform.loc, value);
                }
                break;
            }
            case GL.INT_VEC2: this.gl.context.uniform2iv(uniform.loc, value); break;
            case GL.INT_VEC3: this.gl.context.uniform3iv(uniform.loc, value); break;
            case GL.INT_VEC4: this.gl.context.uniform4iv(uniform.loc, value); break;

            case GL.FLOAT_MAT2: this.gl.context.uniformMatrix2fv(uniform.loc, false, value); break;
            case GL.FLOAT_MAT3: this.gl.context.uniformMatrix3fv(uniform.loc, false, value); break;
            case GL.FLOAT_MAT4: this.gl.context.uniformMatrix4fv(uniform.loc, false, value); break;
            }
        }
        else if(log)
        {
            console.warn("Unkown uniform: " + uniformName);
        }
    }
}

export { gltfShader };
