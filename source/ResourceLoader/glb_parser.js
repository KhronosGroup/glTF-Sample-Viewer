class GlbParser
{
    constructor(data)
    {
        this.data = data;
        this.glbHeaderInts = 3;
        this.glbChunkHeaderInts = 2;
        this.glbMagic = 0x46546C67;
        this.glbVersion = 2;
        this.jsonChunkType = 0x4E4F534A;
        this.binaryChunkType = 0x004E4942;
    }

    extractGlbData()
    {
        const glbInfo = this.getCheckedGlbInfo();
        if (glbInfo === undefined)
        {
            return undefined;
        }

        let json = undefined;
        let buffers = [];
        const chunkInfos = this.getAllChunkInfos();
        for (let chunkInfo of chunkInfos)
        {
            if (chunkInfo.type == this.jsonChunkType && !json)
            {
                json = this.getJsonFromChunk(chunkInfo);
            }
            else if (chunkInfo.type == this.binaryChunkType)
            {
                buffers.push(this.getBufferFromChunk(chunkInfo));
            }
        }

        return { json: json, buffers: buffers };
    }

    getCheckedGlbInfo()
    {
        const header = new Uint32Array(this.data, 0, this.glbHeaderInts);
        const magic = header[0];
        const version = header[1];
        const length = header[2];

        if (!this.checkEquality(magic, this.glbMagic, "glb magic") ||
            !this.checkEquality(version, this.glbVersion, "glb header version") ||
            !this.checkEquality(length, this.data.byteLength, "glb byte length"))
        {
            return undefined;
        }

        return { "magic": magic, "version": version, "length": length };
    }

    getAllChunkInfos()
    {
        let infos = [];
        let chunkStart = this.glbHeaderInts * 4;
        while (chunkStart < this.data.byteLength)
        {
            const chunkInfo = this.getChunkInfo(chunkStart);
            infos.push(chunkInfo);
            chunkStart += chunkInfo.length + this.glbChunkHeaderInts * 4;
        }
        return infos;
    }

    getChunkInfo(headerStart)
    {
        const header = new Uint32Array(this.data, headerStart, this.glbChunkHeaderInts);
        const chunkStart = headerStart + this.glbChunkHeaderInts * 4;
        const chunkLength = header[0];
        const chunkType = header[1];
        return { "start": chunkStart, "length": chunkLength, "type": chunkType };
    }

    getJsonFromChunk(chunkInfo)
    {
        const chunkLength = chunkInfo.length;
        const jsonStart = (this.glbHeaderInts + this.glbChunkHeaderInts) * 4;
        const jsonSlice = new Uint8Array(this.data, jsonStart, chunkLength);
        const stringBuffer = new TextDecoder("utf-8").decode(jsonSlice);
        return JSON.parse(stringBuffer);
    }

    getBufferFromChunk(chunkInfo)
    {
        return this.data.slice(chunkInfo.start, chunkInfo.start + chunkInfo.length);
    }

    checkEquality(actual, expected, name)
    {
        if (actual == expected)
        {
            return true;
        }

        console.error("Found invalid/unsupported " + name + ", expected: " + expected + ", but was: " + actual);
        return false;
    }
}

export { GlbParser };
