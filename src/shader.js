import { UniformStruct } from './utils.js';
import { WebGl } from './webgl.js';

class gltfShader
{
    constructor(program, hash)
    {
        this.program = program;
        this.hash = hash;
        this.uniforms = new Map();
        this.attributes = new Map();
        this.unknownAttributes = [];
        this.unknownUniforms = [];

        if(this.program !== undefined)
        {
            const uniformCount = WebGl.context.getProgramParameter(this.program, WebGl.context.ACTIVE_UNIFORMS);
            for(let i = 0; i < uniformCount; ++i)
            {
                const info = WebGl.context.getActiveUniform(this.program, i);
                const loc = WebGl.context.getUniformLocation(this.program, info.name);
                this.uniforms.set(info.name, {type: info.type, loc: loc});
            }

            const attribCount = WebGl.context.getProgramParameter(this.program, WebGl.context.ACTIVE_ATTRIBUTES);
            for(let i = 0; i < attribCount; ++i)
            {
                const info = WebGl.context.getActiveAttrib(this.program, i);
                const loc = WebGl.context.getAttribLocation(this.program, info.name);
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

    updateUniform(objectName, object, log = true)
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
            case WebGl.context.FLOAT:
            {
                if(Array.isArray(value) || value instanceof Float32Array)
                {
                    WebGl.context.uniform1fv(uniform.loc, value);
                }else{
                    WebGl.context.uniform1f(uniform.loc, value);
                }
                break;
            }
            case WebGl.context.FLOAT_VEC2: WebGl.context.uniform2fv(uniform.loc, value); break;
            case WebGl.context.FLOAT_VEC3: WebGl.context.uniform3fv(uniform.loc, value); break;
            case WebGl.context.FLOAT_VEC4: WebGl.context.uniform4fv(uniform.loc, value); break;

            case WebGl.context.INT:
            {
                if(Array.isArray(value) || value instanceof Uint32Array || value instanceof Int32Array)
                {
                    WebGl.context.uniform1iv(uniform.loc, value);
                }else{
                    WebGl.context.uniform1i(uniform.loc, value);
                }
                break;
            }
            case WebGl.context.INT_VEC2: WebGl.context.uniform2iv(uniform.loc, value); break;
            case WebGl.context.INT_VEC3: WebGl.context.uniform3iv(uniform.loc, value); break;
            case WebGl.context.INT_VEC4: WebGl.context.uniform4iv(uniform.loc, value); break;

            case WebGl.context.FLOAT_MAT2: WebGl.context.uniformMatrix2fv(uniform.loc, false, value); break;
            case WebGl.context.FLOAT_MAT3: WebGl.context.uniformMatrix3fv(uniform.loc, false, value); break;
            case WebGl.context.FLOAT_MAT4: WebGl.context.uniformMatrix4fv(uniform.loc, false, value); break;
            }
        }
        else if(log)
        {
            console.warn("Unkown uniform: " + uniformName);
        }
    }
}

export { gltfShader };
