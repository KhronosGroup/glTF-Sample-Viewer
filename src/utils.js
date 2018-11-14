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
        if(ignore && ignore.find(function(elem){return elem == k}) !== undefined)
        {
            continue; // skip
        }
        if(jsonObj[k] !== undefined)
        {
            target[k] = jsonObj[k];
        }
    }
}

function fromParams(parameters, target, jsonObj)
{
    for(let p of parameters)
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

function CombineHashes(hash1, hash2)
{
    return hash1 ^ (hash1 + 0x9e3779b9 + (hash2 << 6) + (hash2 >> 2));
}

function extractJson(data)
{
    if (data instanceof Object)
    {
        return data;
    }
    // we are in binary land
    const headerLength = 3;

    let lengthIndex = headerLength;
    let typeIndex = lengthIndex + 1;

    // TODO get chunk length and chunk type :(

    let chunkLength = undefined;
    let chunkType = undefined;

    console.log("chunk length: " + chunkLength);
    console.log("chunk type: " + chunkType);

    return undefined;
}

// marker interface used to for parsing the uniforms
class UniformStruct { }
