
// THis class generates and caches the shader source text for a given permutation
class ShaderCache
{
    constructor(shaderFolder, shaderFiles)
    {
        this.shaders  = new Map(); // name & permutations hashed -> compiled shader
        this.sources  = new Map();; // shader name -> source code
        this.programs = new Map(); // (vertex shader, fragment shader) -> program
        this.loaded   = false;

        let self = this;
        let loadPromises = [];
        for (let file of shaderFiles)
        {
            const url = shaderFolder + file;
            loadPromises.push(axios.get(url, { responseType: 'text' }));
        }

        Promise.all(loadPromises).then(function (responseArray) {
            for (let fileIdx in shaderFiles)
            {
                let name = shaderFiles[fileIdx];
                let response = responseArray[fileIdx];
                self.sources.set(name, response.data);
            }

            // TODO: remove any // or /* style comments

            // resovle / expande sources (TODO: break include cycles)
            for (let src in self.sources.entries()) {
                for (let includeName of shaderFiles) {
                    //var pattern = RegExp(/#include</ + includeName + />/);
                    let pattern = "#include<" + includeName + ">";

                    // only replace the first occurance
                    src = src.replace(pattern, self.sources[includeName]);

                    // remove the others
                    while (src.search(pattern) != -1) {
                        src = src.replace(pattern, "");
                    }
                }
            }

            self.loaded = true;
        })
        .catch(function(err) {
            console.log(err);
        });

    }

    // example args: "pbr.vert", ["NORMALS", "TANGENTS"]
    getShader(shaderIdentifier, permutationDefines)
    {
        // first check shaders for the exact permutation
        // if not present, check sources and compile it
        // if not present, return null object

        const src = this.sources.get(shaderIdentifier);
        if(src === undefined)
        {
            if(this.loaded)
            {
                console.log("Shader source for " + shaderIdentifier + " not found");
            }
            return null;
        }

        const isVert = shaderIdentifier.endsWith(".vert");
        let hash = stringHash(shaderIdentifier);

        let defines = "";
        for(let define of permutationDefines)
        {
            hash ^= stringHash(define);
            defines += "#define " + define + " 1\n";
        }

        let shader = this.shaders.get(hash);

        if(shader) // shader already compiled
        {
            return hash;
        }
        else // compile this variant
        {
            shader = CompileShader(isVert, defines + src);
            if(shader)
            {
                this.shaders.set(hash, shader);
            }
        }

        return hash;
    }

    getProgram(vertexShaderHash, fragmentShaderHash)
    {
        let hash = vertexShaderHash ^ fragmentShaderHash;

        let program = this.programs.get(hash);

        if (program) // program already linked
        {
            return program;
        }
        else // link this shader program type!
        {
            let vertexShader = this.shaders.get(vertexShaderHash);
            let fragmentShader = this.shaders.get(fragmentShaderHash);
            program = LinkProgram(vertexShader, fragmentShader);
        }

        return program;
    }
};
