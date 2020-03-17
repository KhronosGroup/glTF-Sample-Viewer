import { HDRImage } from '../libs/hdrpng.js';
import { Ktx2Image } from '../libs/ktx2image.js';
import { WebGl } from './webgl.js';
import { GltfObject } from './gltf_object.js';
import { isPowerOf2 } from './math_utils.js';
import axios from '../libs/axios.min.js';

const ImageMimeType = {JPEG: "image/jpeg", PNG: "image/png", HDR: "image/vnd.radiance", KTX2: "image/ktx2"};

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
            if (this.uri.startsWith('./'))
            {
                // Remove preceding './' from URI.
                this.uri = this.uri.substr(2);
            }
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

        if (this.mimeType === ImageMimeType.HDR)
        {
            this.image = new HDRImage();
        }
        else if (this.mimeType === ImageMimeType.KTX2)
        {
            this.image = new Ktx2Image();
        }
        else
        {
            this.image = new Image();
        }

        this.image.crossOrigin = "";
        const self = this;
        const promise = new Promise(resolve =>
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

        if (this.image instanceof Ktx2Image)
        {
            axios.get(this.uri, { responseType: 'arraybuffer'})
                .then(response =>
                {
                    this.image.initialize(response.data);
                });
        }
        else
        {
            this.image.src = this.uri;
        }

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

        if (this.image instanceof Ktx2Image)
        {
            reader.onloadend = function(event)
            {
                self.image.initialize(event.target.result);
            };
            reader.readAsArrayBuffer(foundFile);
        }
        else
        {
            reader.onloadend = function(event)
            {
                self.image.src = event.target.result;
            };
            reader.readAsDataURL(foundFile);
        }

        return true;
    }

    shouldGenerateMips()
    {
        return (isPowerOf2(this.image.width) && isPowerOf2(this.image.height));
    }
}

export { gltfImage, ImageMimeType };

