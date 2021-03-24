import { gltfShader } from './shader.js';
import { stringHash } from '../gltf/utils.js';

// THis class generates and caches the shader source text for a given permutation
class ShaderCache
{
    constructor(sources, gl)
    {
        this.sources  = sources; // shader name -> source code
        this.shaders  = new Map(); // name & permutations hashed -> compiled shader
        this.programs = new Map(); // (vertex shader, fragment shader) -> program
        this.gl = gl;

        // resovle / expande sources (TODO: break include cycles)
        for (let [key, src] of this.sources)
        {
            let changed = false;
            for (let [includeName, includeSource] of this.sources)
            {
                //var pattern = RegExp(/#include</ + includeName + />/);
                const pattern = "#include <" + includeName + ">";

                if(src.includes(pattern))
                {
                    // only replace the first occurance
                    src = src.replace(pattern, includeSource);

                    // remove the others
                    while (src.includes(pattern))
                    {
                        src = src.replace(pattern, "");
                    }

                    changed = true;
                }
            }

            if(changed)
            {
                this.sources.set(key, src);
            }
        }
    }

    destroy()
    {
        for (let [, shader] of this.shaders.entries())
        {
            this.gl.context.deleteShader(shader);
            shader = undefined;
        }

        this.shaders.clear();

        for (let [, program] of this.programs)
        {
            program.destroy();
        }

        this.programs.clear();
    }

    // example args: "pbr.vert", ["NORMALS", "TANGENTS"]
    selectShader(shaderIdentifier, permutationDefines)
    {
        // first check shaders for the exact permutation
        // if not present, check sources and compile it
        // if not present, return null object

        const src = this.sources.get(shaderIdentifier);
        if(src === undefined)
        {
            console.log("Shader source for " + shaderIdentifier + " not found");
            return null;
        }

        const isVert = shaderIdentifier.endsWith(".vert");
        let hash = stringHash(shaderIdentifier);

        // console.log(shaderIdentifier);

        let defines = "#version 300 es\n";
        for(let define of permutationDefines)
        {
            // console.log(define);
            hash ^= stringHash(define);
            defines += "#define " + define + "\n";
        }

        let shader = this.shaders.get(hash);

        if(shader === undefined)
        {
            // console.log(defines);
            // compile this variant
            shader = this.gl.compileShader(shaderIdentifier, isVert, defines + src);
            this.shaders.set(hash, shader);
        }

        return hash;
    }

    getShaderProgram(vertexShaderHash, fragmentShaderHash)
    {
        // just use a long string for this (the javascript engine should be fast enough with comparing this)
        const hash = String(vertexShaderHash) + "," + String(fragmentShaderHash);

        let program = this.programs.get(hash);

        if (program) // program already linked
        {
            return program;
        }
        else // link this shader program type!
        {
            let linkedProg = this.gl.linkProgram(this.shaders.get(vertexShaderHash), this.shaders.get(fragmentShaderHash));
            if(linkedProg)
            {
                let program = new gltfShader(linkedProg, hash, this.gl);
                this.programs.set(hash, program);
                return program;
            }
        }

        return undefined;
    }
}

export { ShaderCache };
