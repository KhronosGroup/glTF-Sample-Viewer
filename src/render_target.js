import { jsToGl, fromKeys } from "./utils";

class gltfRenderTarget
{
    constructor(width = 0, height = 0, sampler = -1, attachmentPoint = gl.COLOR_ATTACHMENT0, type = gl.TEXTURE_2D, level = 0, internalFormat = gl.RGBA, format = gl.RGBA, elementType=gl.UNSIGNED_BYTE)
    {
        this.width = width;
        this.height = height;
        this.sampler = sampler;
        this.attachmentPoint = attachmentPoint;
        this.type = type;
        this.level = level;
        this.internalFormat = internalFormat;
        this.format = format;
        this.elementType = elementType;
    }

    fromJson(jsonRenderTarget)
    {
        fromKeys(this, jsonRenderTarget);
    }
};

export { gltfRenderTarget };
