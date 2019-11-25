class Ktx2Image
{
    initialize(arrayBuffer)
    {
        if (! this.checkVersion(arrayBuffer))
        {
            console.error("Invalid Ktx2 version identifier");
            return;
        }
    }

    checkVersion(arrayBuffer)
    {
        const expectedVersion = [ 0xAB, 0x4B, 0x54, 0x58, 0x20, 0x32, 0x30, 0xBB, 0x0D, 0x0A, 0x1A, 0x0A ];
        const versionOffset = 0;
        const versionLength = expectedVersion.length;

        if (arrayBuffer.length < versionLength)
        {
            return false;
        }

        const version = new Uint8Array(arrayBuffer, versionOffset, versionLength);

        for (let i = 0; i < versionLength; i++)
        {
            if (version[i] != expectedVersion[i])
            {
                return false;
            }
        }

        return true;
    }
}

export { Ktx2Image };
