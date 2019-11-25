const VERSION = [ 0xAB, 0x4B, 0x54, 0x58, 0x20, 0x32, 0x30, 0xBB, 0x0D, 0x0A, 0x1A, 0x0A ];
const VERSION_OFFSET = 0;
const VERSION_LENGTH = VERSION.length;
const HEADER_OFFSET = VERSION_OFFSET + VERSION_LENGTH;
const HEADER_LENGTH = 9 * 4;

class Ktx2Image
{
    initialize(arrayBuffer)
    {
        const version = new DataView(arrayBuffer, VERSION_OFFSET, VERSION_LENGTH);
        if (! this.checkVersion(version))
        {
            console.error("Invalid Ktx2 version identifier");
            return;
        }

        const header = new DataView(arrayBuffer, HEADER_OFFSET, HEADER_LENGTH);
        this.parseHeader(header);
    }

    checkVersion(version)
    {
        const VERSION_OFFSET = 0;

        for (let i = 0; i < VERSION_LENGTH; i++)
        {
            if (version.getUint8(i) != VERSION[i])
            {
                return false;
            }
        }

        return true;
    }

    parseHeader(header)
    {

    }
}

export { Ktx2Image };
