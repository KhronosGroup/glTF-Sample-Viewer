function jsToGl(array)
{
    let tensor = new glMatrix.ARRAY_TYPE(array.length);

    for (let i = 0; i < array.length; ++i)
    {
        tensor[i] = array[i];
    }

    return tensor;
}

function fromKeys(target, jsonObj, ignore = [])
{
    for(let k of Object.keys(target))
    {
        if (ignore && ignore.find(function(elem){return elem == k}) !== undefined)
        {
            continue; // skip
        }
        if (jsonObj[k] !== undefined)
        {
            target[k] = jsonObj[k];
        }
    }
}

function fromParams(parameters, target, jsonObj)
{
    for (let p of parameters)
    {
        if(jsonObj[p] !== undefined)
        {
            target[p] = jsonObj[p];
        }
    }
}

function stringHash(str, seed = 0)
{
    for(var i = 0; i < str.length; ++i)
    {
        seed = Math.imul(31, seed) + str.charCodeAt(i) | 0;
    }

    return seed;
}

function combineHashes(hash1, hash2)
{
    return hash1 ^ (hash1 + 0x9e3779b9 + (hash2 << 6) + (hash2 >> 2));
}

function clamp(number, min, max)
{
    return Math.min(Math.max(number, min), max);
}

function getIsGlb(filename)
{
    return getExtension(filename) == "glb";
}

function getIsGltf(filename)
{
    return getExtension(filename) == "gltf";
}

function getExtension(filename)
{
    const split = filename.toLowerCase().split(".");
    if (split.length == 1)
    {
        return undefined
    }
    return split[split.length - 1];
}

function getFileName(filePath)
{
    const split = filePath.split("/");
    return split[split.length - 1];
}

function getFileNameWithoutExtension(filePath)
{
    return getFileName(filePath).split(".")[0];
}

// marker interface used to for parsing the uniforms
class UniformStruct { }
