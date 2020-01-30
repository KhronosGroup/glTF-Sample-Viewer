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
        this.supercompressionScheme = 0;

        this.dfdByteOffset = 0;
        this.dfdByteLength = 0;
        this.kvdByteOffset = 0;
        this.kvdByteLength = 0;
        this.sgdByteOffset = 0;
        this.sgdByteLength = 0;

        this.levels = [];

        // for usage in GL
        this.glInternalFormat = 0;
        this.glFormat = 0;
        this.glType = 0;

        this.onload = () => { };
        this.onerror = () => { };
    }

    initialize(arrayBuffer)
    {
        const version = new DataView(arrayBuffer, VERSION_OFFSET, VERSION_LENGTH);
        if (! this.checkVersion(version))
        {
            console.error("Invalid KTX2 version identifier");
            this.onerror();
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

        this.onload();
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
        this.supercompressionScheme = getNext();

        if (Object.values(VK_FORMAT).includes(this.vkFormat))
        {
            this.glInternalFormat = VK_TO_GL[this.vkFormat].glInternalFormat;
            this.glFormat = VK_TO_GL[this.vkFormat].glFormat;
            this.glType = VK_TO_GL[this.vkFormat].glType;
        }
        else
        {
            console.error("Unsupported vkFormat: " + this.vkFormat + ". Pixel data will not be parsed.");
        }
        if (this.supercompressionScheme > 0)
        {
            console.error("Supercompression currently not supported. Image data will not be parsed.");
        }
        if (this.layerCount > 0)
        {
            console.error("Layers currently not supported. Image data will not be parsed.");
        }
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
        if (this.layerCount > 0 || this.supercompressionScheme > 0)
        {
            return;
        }

        let miplevel = 0;
        for (let level of this.levels)
        {
            const divisor = Math.pow(2, miplevel);

            level.miplevel = miplevel++;
            level.width = this.width / divisor;
            level.height = this.height / divisor;

            level.faces = [];
            for (let i = 0; i < this.faceCount; i++)
            {
                const face = {};

                const faceLength = level.byteLength / this.faceCount;
                const faceOffset = level.byteOffset + faceLength * i;

                if (this.vkFormat == VK_FORMAT.R16G16B16A16_SFLOAT)
                {
                    face.data = new Uint16Array(arrayBuffer, faceOffset, faceLength / this.typeSize);
                }
                else if (this.vkFormat == VK_FORMAT.R32G32B32A32_SFLOAT)
                {
                    face.data = new Float32Array(arrayBuffer, faceOffset, faceLength / this.typeSize);
                }

                level.faces.push(face);
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
    R16G16B16A16_SFLOAT: 97,
    R32G32B32A32_SFLOAT: 109
};

const GL_INTERNAL_FORMAT =
{
    RGBA16F: 34842,
    RGBA32F: 34836
};

const GL_FORMAT =
{
    RGBA: 6408
};

const GL_TYPE =
{
    HALF_FLOAT: 5131,
    FLOAT: 5126
};

const VK_TO_GL = {};
VK_TO_GL[VK_FORMAT.R16G16B16A16_SFLOAT] =
{
    glInternalFormat: GL_INTERNAL_FORMAT.RGBA16F,
    glFormat: GL_FORMAT.RGBA,
    glType: GL_TYPE.HALF_FLOAT
};
VK_TO_GL[VK_FORMAT.R32G32B32A32_SFLOAT] =
{
    glInternalFormat: GL_INTERNAL_FORMAT.RGBA32F,
    glFormat: GL_FORMAT.RGBA,
    glType: GL_TYPE.FLOAT
};

export { Ktx2Image };
