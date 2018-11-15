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

        const jsonChunkInfo = this.getChunkInfo(this.glbHeaderInts * 4, this.jsonChunkType);
        if (jsonChunkInfo === undefined)
        {
            return undefined;
        }
        let json = this.getJsonFromChunk(jsonChunkInfo);

        let buffers = [];
        let chunkStart = jsonChunkInfo.start + jsonChunkInfo.length;
        while (chunkStart < glbInfo.length)
        {
            const chunkInfo = this.getChunkInfo(chunkStart);

            if (chunkInfo.type === this.binaryChunkType)
            {
                buffers.push(this.data.slice(chunkInfo.start, chunkInfo.start + chunkInfo.length));
            }

            chunkStart += chunkInfo.length + 2 * 4;
        }

        return { json: json, buffers: buffers };
    }

    getCheckedGlbInfo()
    {
        const header = new Uint32Array(this.data, 0, this.glbHeaderInts);
        const magic = header[0];
        const version = header[1];
        const length = header[2];

        if (magic !== this.glbMagic)
        {
            console.error("Invalid glb magic: " + magic + ", expected: " + this.glbMagic);
            return undefined;
        }

        if (version !== this.glbVersion)
        {
            console.error("Unsupported glb header version: " + version + ", expected: " + this.glbVersion);
            return undefined;
        }

        if (length != this.data.byteLength)
        {
            console.error("Invalid glb byte length: " + length + ", expected: " + this.data.byteLength);
            return undefined;
        }

        return { "magic": magic, "version": version, "length": length };
    }

    getChunkInfo(headerStart, expectedType = undefined)
    {
        const header = new Uint32Array(this.data, headerStart, this.glbChunkHeaderInts);
        const chunkStart = headerStart + this.glbChunkHeaderInts * 4;
        const chunkLength = header[0];
        const chunkType = header[1];

        if (expectedType !== undefined && chunkType !== expectedType)
        {
            console.error("Invalid chunk type " + chunkType + " expected " + expectedType);
            return undefined;
        }

        return { "start": chunkStart, "length": chunkLength, "type": chunkType };
    }

    getJsonFromChunk(chunkHeader)
    {
        const chunkLength = chunkHeader.length;
        const jsonStart = (this.glbHeaderInts + this.glbChunkHeaderInts) * 4;
        const jsonSlice = new Uint8Array(this.data, jsonStart, chunkLength);
        return JSON.parse(String.fromCharCode.apply(null, jsonSlice));
    }
};
