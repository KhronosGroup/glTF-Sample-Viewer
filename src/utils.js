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

function CombineHashes(hash1, hash2)
{
    return hash1 ^ (hash1 + 0x9e3779b9 + (hash2 << 6) + (hash2 >> 2));
}

const glbHeaderInts = 3;
const glbChunkHeaderInts = 2;
const glbMagic = 0x46546C67;
const glbVersion = 2;
const jsonChunkType = 0x4E4F534A;
const binaryChunkType = 0x004E4942;

function extractGlbData(data)
{
    const glbInfo = getCheckedGlbInfo(data);
    if (glbInfo === undefined)
    {
        return undefined;
    }

    const jsonChunkInfo = getChunkInfo(data, glbHeaderInts * 4, jsonChunkType);
    if (jsonChunkInfo === undefined)
    {
        return undefined;
    }
    let json = getJsonFromChunk(data, jsonChunkInfo);

    let buffers = [];
    let chunkStart = jsonChunkInfo.start + jsonChunkInfo.length;
    while (chunkStart < glbInfo.length)
    {
        const chunkInfo = getChunkInfo(data, chunkStart);

        if (chunkInfo.type === binaryChunkType)
        {
            buffers.push(data.slice(chunkInfo.start, chunkInfo.start + chunkInfo.length));
        }

        chunkStart += chunkInfo.length + 2 * 4;
    }

    return { json: json, buffers: buffers };
}

function getCheckedGlbInfo(data)
{
    const header = new Uint32Array(data, 0, glbHeaderInts);
    const magic = header[0];
    const version = header[1];
    const length = header[2];

    if (magic !== glbMagic)
    {
        console.error("Invalid glb magic: " + magic + ", expected: " + glbMagic);
        return undefined;
    }

    if (version !== glbVersion)
    {
        console.error("Unsupported glb header version: " + version + ", expected: " + glbVersion);
        return undefined;
    }

    if (data.byteLength != length)
    {
        console.error("Invalid glb byte length: " + length + ", expected: " + data.byteLength);
        return undefined;
    }

    return { "magic": magic, "version": version, "length": length };
}

function getChunkInfo(data, headerStart, expectedType = undefined)
{
    const header = new Uint32Array(data, headerStart, glbChunkHeaderInts);
    const chunkStart = headerStart + glbChunkHeaderInts * 4;
    const chunkLength = header[0];
    const chunkType = header[1];

    if (expectedType !== undefined && chunkType !== expectedType)
    {
        console.error("Invalid chunk type " + chunkType + " expected " + expectedType);
        return undefined;
    }

    return { "start": chunkStart, "length": chunkLength, "type": chunkType };
}

function getJsonFromChunk(data, chunkHeader)
{
    const chunkLength = chunkHeader.length;
    const jsonStart = (glbHeaderInts + glbChunkHeaderInts) * 4;
    const jsonSlice = new Uint8Array(data, jsonStart, chunkLength);
    return JSON.parse(String.fromCharCode.apply(null, jsonSlice));
}

// marker interface used to for parsing the uniforms
class UniformStruct { }
