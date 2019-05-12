import { HDRImage } from '../libs/hdrpng.js';
import { WebGl } from './webgl.js';
import { GltfObject } from './gltf_object.js';
import { isPowerOf2 } from './math_utils.js';

const ImageMimeType = {JPEG: "image/jpeg", PNG: "image/png", HDR: "image/vnd.radiance"};

class gltfImage extends GltfObject
{
    constructor(
        uri = undefined,
        type = WebGl.context.TEXTURE_2D, miplevel = 0,
        bufferView = undefined,
        name = undefined,
        mimeType = ImageMimeType.JPEG,
        image = undefined)
    {
        super();
        this.uri = uri;
        this.bufferView = bufferView;
        this.mimeType = mimeType;
        this.image = image; // javascript image
        if (this.image !== undefined)
        {
            this.image.crossOrigin = "";
        }
        this.name = name;
        this.type = type; // nonstandard
        this.miplevel = miplevel; // nonstandard
    }

    resolveRelativePath(basePath)
    {
        if (this.uri !== undefined)
        {
            this.uri = basePath + this.uri;
        }
    }

    load(gltf, additionalFiles = undefined)
    {
        if (this.image !== undefined)
        {
            console.error("image has already been loaded");
            return;
        }

        this.image = this.mimeType === ImageMimeType.HDR ? new HDRImage() : new Image();
        this.image.crossOrigin = "";
        const self = this;
        const promise = new Promise(function(resolve)
        {
            self.image.onload = resolve;
            self.image.onerror = resolve;

            if (!self.setImageFromBufferView(gltf) &&
                !self.setImageFromFiles(additionalFiles) &&
                !self.setImageFromUri())
            {
                console.error("Was not able to resolve image with uri '%s'", self.uri);
                resolve();
            }
        });

        return promise;
    }

    setImageFromUri()
    {
        if (this.uri === undefined)
        {
            return false;
        }

        this.image.src = this.uri;
        return true;
    }

    setImageFromBufferView(gltf)
    {
        const view = gltf.bufferViews[this.bufferView];
        if (view === undefined)
        {
            return false;
        }

        const buffer = gltf.buffers[view.buffer].buffer;
        const array = new Uint8Array(buffer, view.byteOffset, view.byteLength);
        const blob = new Blob([array], { "type": this.mimeType });
        this.image.src = URL.createObjectURL(blob);
        return true;
    }

    setImageFromFiles(files)
    {
        if (this.uri === undefined || files === undefined)
        {
            return false;
        }

        let foundFile = files.find(function(file)
        {
            if (file.name === this.uri || file.fullPath === this.uri)
            {
                return true;
            }
        }, this);

        if (foundFile === undefined)
        {
            return false;
        }

        const reader = new FileReader();
        const self = this;
        reader.onloadend = function(event)
        {
            self.image.src = event.target.result;
        };
        reader.readAsDataURL(foundFile);

        return true;
    }

    shouldGenerateMips()
    {
        return (isPowerOf2(this.image.width) && isPowerOf2(this.image.height));
    }
}

export { gltfImage, ImageMimeType };

