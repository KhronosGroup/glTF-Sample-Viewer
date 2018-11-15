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
    if (!(data instanceof ArrayBuffer))
    {
        return data;
    }

    // we are in binary land
    const headerElemCount = 3;

    const header = new Uint32Array(data, 0, headerElemCount);

    const glbMagic = header[0];
    const glbVersion = header[1];
    const glbLength = header[2];

    if (glbMagic !== 0x46546C67)
    {
        console.error("Invalid glb magic " + glbMagic);
        return undefined;
    }

    if(glbVersion !== 2)
    {
        console.error("Unsupported glb header version " + glbVersion);
        return undefined;
    }

    if(data.byteLength != glbLength)
    {

        console.error("Invalid glb byte length " + glbLength + " expected " + data.byteLength);
        return undefined;
    }

    const chunk = new Uint32Array(data, headerElemCount * 4, 2);

    const chunkLength = chunk[0];
    const chunkType = chunk[1];

    if(chunkType !== 0x4E4F534A)
    {
        console.error("Invalid chunk type " + chunkType + " expected JSON");
        return undefined;
    }

    const jsonStart = headerElemCount * 4 + 2 * 4;
    const jsonSlice = new Uint8Array(data, jsonStart, chunkLength);
    let jsonString = String.fromCharCode.apply(null, jsonSlice);

    return JSON.parse(jsonString);
}

// marker interface used to for parsing the uniforms
class UniformStruct { }
