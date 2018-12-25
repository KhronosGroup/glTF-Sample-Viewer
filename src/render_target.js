import { fromKeys } from "./utils.js";
import { WebGl } from "./webgl.js"

class gltfRenderTarget
{
    constructor(useCanvas = true, width = 0, height = 0, sampler = -1, attachmentPoint = WebGl.context.COLOR_ATTACHMENT0, type = WebGl.context.TEXTURE_2D, level = 0, internalFormat = WebGl.context.RGBA, format = WebGl.context.RGBA, elementType = WebGl.context.UNSIGNED_BYTE)
    {
        this.useCanvas = useCanvas; // ignore other options by default
        this.width = width;
        this.height = height;
        this.sampler = sampler;
        this.attachmentPoint = attachmentPoint;
        this.type = type;
        this.level = level;
        this.internalFormat = internalFormat;
        this.format = format;
        this.elementType = elementType;

        // state tracking
        this.initialized = false;

        this.targetTexture = undefined;
        this.frameBuffer = undefined;

        // TODO: viewport overrides
    }

    fromJson(jsonRenderTarget)
    {
        fromKeys(this, jsonRenderTarget);
    }
};

export { gltfRenderTarget };
