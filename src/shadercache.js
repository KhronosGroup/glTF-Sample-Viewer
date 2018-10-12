
// THis class generates and caches the shader source text for a given permutation
class ShaderCache
{
    constructor(shaderFolder, shaderFiles)
    {
        let sources = new Map();

        this.shaders = new Map(); // name & permutations hashed -> compiled shader
        this.sources = sources; // shader name -> source coce
        //this.includes = new Map();

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

        // TODO: load all .glsl / glsli files from shaderFolder and store the strings in sources
    }

    getShader(shaderIdentifier, permutationDefines)
    {
        // first check shaders for the exact permutation
        // if not present, check sources and compile it
        // if not present, return null object
    }

};
