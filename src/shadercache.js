
// THis class generates and caches the shader source text for a given permutation
class ShaderCache
{
    constructor(shaderFolder, shaderFiles)
    {
        let sources = new Map();

        this.shaders = new Map(); // name & permutations hashed -> compiled shader
        this.sources = sources; // shader name -> source coce
        this.programs = [];

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
                sources[name] = response.data;
            }
        })
        .catch(function(err) {
            console.log(err);
        });

        // TODO: remove any // or /* style comments

        // resovle / expande sources (TODO: break include cycles)
        for(let src of sources)
        {
            //let inclMap = new Map();
            for(let includeName of shaderFiles)
            {
                //var pattern = RegExp(/#include</ + includeName + />/);
                let pattern = "#include<" + includeName + ">";

                // only replace the first occurance
                src = src.replace(pattern, sources[includeName]);

                // remove the others
                while(src.search(pattern) != -1)
                {
                    src = src.replace(pattern, "");
                }

                //inclMap[includeName] = true;
            }
        }
    }

    // example args: "pbr.vert", ["NORMALS", "TANGENTS"]
    getShader(shaderIdentifier, permutationDefines)
    {
        // first check shaders for the exact permutation
        // if not present, check sources and compile it
        // if not present, return null object

        const src = this.sources[shaderIdentifier];
        if(src === undefined)
        {
            console.log("Shader source for " + shaderIdentifier + " not found");
            return null;
        }

        const isVert = shaderIdentifier.endsWith(".vert");
        let hash = stringHash(shaderIdentifier);

        let defines = "";
        for(let define of permutationDefines)
        {
            hash ^= stringHash(define);
            defines += "#define " + define + "1\n";
        }

        let shader = this.shaders.get(hash);

        if(shader) // shader already compiled
        {
            return shader;
        }
        else // compile this variant
        {
            shader = CompileShader(isVert, defines + src);
            if(shader)
            {
                this.shaders[hash] = shader;
            }
        }

        return shader;
    }

};
