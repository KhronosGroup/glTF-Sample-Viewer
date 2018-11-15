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

function extractGlbData(data)
{
    if (getCheckedHeader(data) === undefined)
    {
        return undefined;
    }

    const jsonChunkHeader = getCheckedJsonChunkHeader(data);
    if (jsonChunkHeader === undefined)
    {
        return undefined;
    }

    let json = JSON.parse(getJsonStringFromChunk(data, jsonChunkHeader));

    let buffers = [];
    let chunkStart = jsonChunkHeader.start + jsonChunkHeader.length;
    while (chunkStart < glbLength)
    {
        const chunk = new Uint32Array(data, chunkStart, 2);
        const chunkLength = chunk[0];
        const chunkType = chunk[1];

        // binary
        if (chunkType === 0x004E4942)
        {
            buffers.push(data.slice(chunkStart+2, chunkStart+2+chunkLength));
            console.log("binary chunk of length " + chunkLength);
        }

        chunkStart += chunkLength + 2 * 4;
    }

    return { json: json, buffers: buffers };
}

function getCheckedHeader(data)
{
    const header = new Uint32Array(data, 0, glbHeaderInts);
    const magic = header[0];
    const version = header[1];
    const length = header[2];

    if (magic !== 0x46546C67)
    {
        console.error("Invalid glb magic " + magic);
        return undefined;
    }

    if (version !== 2)
    {
        console.error("Unsupported glb header version " + version);
        return undefined;
    }

    if (data.byteLength != length)
    {
        console.error("Invalid glb byte length " + length + " expected " + data.byteLength);
        return undefined;
    }

    return { "magic": magic, "version": version, "length": length };
}

function getCheckedJsonChunkHeader(data)
{
    const chunkStart = glbHeaderInts * 4;
    const chunk = new Uint32Array(data, chunkStart, glbChunkHeaderInts);
    const chunkLength = chunk[0];
    const chunkType = chunk[1];

    if (jsonType !== 0x4E4F534A)
    {
        console.error("Invalid chunk type " + jsonType + " expected JSON");
        return undefined;
    }

    return { "start": chunkStart, "length": chunkLength, "type": chunkType };
}

function getJsonStringFromChunk(data, chunkHeader)
{
    const chunkLength = chunkHeader.length;
    const jsonStart = (glbHeaderInts + glbChunkHeaderInts) * 4;
    const jsonSlice = new Uint8Array(data, jsonStart, chunkLength);
    return String.fromCharCode.apply(null, jsonSlice);
}

// marker interface used to for parsing the uniforms
class UniformStruct { }
