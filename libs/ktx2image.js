// https://github.khronos.org/KTX-Specification

const VERSION = [ 0xAB, 0x4B, 0x54, 0x58, 0x20, 0x32, 0x30, 0xBB, 0x0D, 0x0A, 0x1A, 0x0A ];
const VERSION_OFFSET = 0;
const VERSION_LENGTH = VERSION.length;
const HEADER_OFFSET = VERSION_OFFSET + VERSION_LENGTH;
const HEADER_LENGTH = 9 * 4; // 9 uint32s
const INDEX_OFFSET = HEADER_OFFSET + HEADER_LENGTH;
const INDEX_LENGTH = 4 * 4 + 2 * 8; // 4 uint32s and 2 uint64s
const LEVEL_INDEX_OFFSET = INDEX_OFFSET + INDEX_LENGTH;

class Ktx2Image
{
    constructor()
    {
        this.vkFormat = 0;
        this.typeSize = 0;
        this.width = 0;
        this.height = 0;
        this.pixelDepth = 0;
        this.layerCount = 0;
        this.faceCount = 0;
        this.levelCount = 0;
        this.suporcompressionScheme = 0;

        this.dfdByteOffset = 0;
        this.dfdByteLength = 0;
        this.kvdByteOffset = 0;
        this.kvdByteLength = 0;
        this.sgdByteOffset = 0;
        this.sgdByteLength = 0;

        this.levels = [];
    }

    initialize(arrayBuffer)
    {
        const version = new DataView(arrayBuffer, VERSION_OFFSET, VERSION_LENGTH);
        if (! this.checkVersion(version))
        {
            console.error("Invalid KTX2 version identifier");
            return;
        }

        const header = new DataView(arrayBuffer, HEADER_OFFSET, HEADER_LENGTH);
        this.parseHeader(header);

        const fileIndex = new DataView(arrayBuffer, INDEX_OFFSET, INDEX_LENGTH);
        this.parseIndex(fileIndex);

        const levelIndexLength = this.levelCount * 3 * 8; // 3 uint64s per level
        const levelIndex = new DataView(arrayBuffer, LEVEL_INDEX_OFFSET, levelIndexLength);
        this.parseLevelIndex(levelIndex);

        this.parseLevelData(arrayBuffer);
    }

    checkVersion(version)
    {
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
        let offset = 0;
        const getNext = () =>
        {
            const result = header.getUint32(offset, true);
            offset += 4;
            return result;
        };

        this.vkFormat = getNext();
        this.typeSize = getNext();
        this.width = getNext();
        this.height = getNext();
        this.pixelDepth = getNext();
        this.layerCount = getNext();
        this.faceCount = getNext();
        this.levelCount = getNext();
        this.suporcompressionScheme = getNext();
    }

    parseIndex(fileIndex)
    {
        let offset = 0;
        const getNext32 = () =>
        {
            const result = fileIndex.getUint32(offset, true);
            offset += 4;
            return result;
        };
        const getNext64 = () =>
        {
            const result = this.getUint64(fileIndex, offset, true);
            offset += 8;
            return result;
        };

        this.dfdByteOffset = getNext32();
        this.dfdByteLength = getNext32();
        this.kvdByteOffset = getNext32();
        this.kvdByteLength = getNext32();
        this.sgdByteOffset = getNext64();
        this.sgdByteLength = getNext64();
    }

    parseLevelIndex(levelIndex)
    {
        let offset = 0;
        const getNext = () =>
        {
            const result = this.getUint64(levelIndex, offset, true);
            offset += 8;
            return result;
        };

        for (let i = 0; i < this.levelCount; i++)
        {
            const level = {};
            level.byteOffset = getNext();
            level.byteLength = getNext();
            level.uncompressedByteLength = getNext();

            this.levels.push(level);
        }
    }

    parseLevelData(arrayBuffer)
    {
        // TODO: take faces into account!

        let miplevel = 0;
        for (let level of this.levels)
        {
            level.miplevel = miplevel++;
            level.width = this.width / (miplevel * miplevel);
            level.height = this.height / (miplevel * miplevel);

            if (this.vkFormat == VK_FORMAT.R16G16B16A16_SFLOAT)
            {
                level.data = new Uint16Array(arrayBuffer, level.byteOffset, level.byteLength / this.typeSize);
            }
        }
    }

    // https://stackoverflow.com/questions/53103695
    getUint64(view, byteOffset, littleEndian)
    {
        // we should actually be able to use BigInt, but we can't create a Uint8Array with BigInt offset/length

        const left =  view.getUint32(byteOffset, littleEndian);
        const right = view.getUint32(byteOffset + 4, littleEndian);
        const combined = littleEndian ? left + (2 ** 32 * right) : (2 ** 32 * left) + right;

        if (! Number.isSafeInteger(combined))
        {
            console.warn("ktx2image: " + combined + " exceeds MAX_SAFE_INTEGER. Precision may be lost.");
        }

        return combined;
    }
}

// https://www.khronos.org/registry/vulkan/specs/1.1-extensions/man/html/VkFormat.html
const VK_FORMAT =
{
    R16G16B16A16_SFLOAT: 97
};

export { Ktx2Image };
