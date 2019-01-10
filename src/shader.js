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

    getAttribLocation(name)
    {
        const loc = this.attributes.get(name);

        if(loc !== undefined)
        {
            return loc;
        }
        else
        {
            console.log("Attribute name '" + name + "' doesn't exist!");
            return -1;
        }
    }

    getUniformLocation(name)
    {
        const uniform = this.uniforms.get(name);

        if(uniform !== undefined)
        {
            return uniform.loc;
        }
        else
        {
            console.log("Uniform name '" + name + "' doesn't exist!");
            return -1;
        }
    }


    updateUniform(objectName, object, log = true)
    {
        if (Array.isArray(object))
        {
            this.updateUniformArray(objectName, object, log);
        }
        else if (object instanceof UniformStruct)
        {
            this.updateUniformStruct(objectName, object, log);
        }
        else
        {
            this.updateUniformValue(objectName, object, log);
        }
    }

    updateUniformArray(arrayName, array, log)
    {
        for (let i = 0; i < array.length; ++i)
        {
            let element = array[i];
            let uniformName = arrayName + "[" + i + "]";
            this.updateUniform(uniformName, element, log);
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
    // vec3 => WebGl.context.uniform3f(value)
    updateUniformValue(uniformName, value, log)
    {
        const uniform = this.uniforms.get(uniformName);

        if(uniform !== undefined)
        {
            switch (uniform.type) {
            case WebGl.context.FLOAT: WebGl.context.uniform1f(uniform.loc, value); break;
            case WebGl.context.FLOAT_VEC2: WebGl.context.uniform2fv(uniform.loc, value); break;
            case WebGl.context.FLOAT_VEC3: WebGl.context.uniform3fv(uniform.loc, value); break;
            case WebGl.context.FLOAT_VEC4: WebGl.context.uniform4fv(uniform.loc, value); break;

            case WebGl.context.INT: WebGl.context.uniform1i(uniform.loc, value); break;
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
