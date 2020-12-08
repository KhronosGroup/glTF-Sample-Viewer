import { HDRImage } from '../libs/hdrpng.js';
import { KtxDecoder } from './ktx.js';
import { WebGl } from './webgl.js';
import { GltfObject } from './gltf_object.js';
import { isPowerOf2 } from './math_utils.js';
import axios from '../libs/axios.min.js';

import { AsyncFileReader } from './ResourceLoader/async_file_reader.js';

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

    async load(gltf, additionalFiles = undefined)
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
            this.image = {};
        }
        else
        {
            this.image = new Image();
        }

        this.image.crossOrigin = "";
        const self = this;

        if (!await self.setImageFromBufferView(gltf) &&
            !await self.setImageFromFiles(additionalFiles, gltf) &&
            !await self.setImageFromUri(gltf))
        {
            console.error("Was not able to resolve image with uri '%s'", self.uri);
            return;
        }

        return;
    }

    static loadHTMLImage(url)
    {
        return new Promise( (resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image) );
            image.addEventListener('error', reject);
            image.src = url;
        });
    }

    async setImageFromUri(gltf)
    {
        if (this.uri === undefined)
        {
            return false;
        }

        if (this.image instanceof Image)
        {
            this.image = await gltfImage.loadHTMLImage(this.uri).catch( (error) => {
                console.error(error);
            });
        }
        else
        {
            this.image = await gltf.ktxDecoder.loadKtxFromUri(this.uri);
        }

        return true;
    }

    async setImageFromBufferView(gltf)
    {
        const view = gltf.bufferViews[this.bufferView];
        if (view === undefined)
        {
            return false;
        }

        const buffer = gltf.buffers[view.buffer].buffer;
        const array = new Uint8Array(buffer, view.byteOffset, view.byteLength);
        const blob = new Blob([array], { "type": this.mimeType });
        const objectURL = URL.createObjectURL(blob);
        this.image = await gltfImage.loadHTMLImage(objectURL).catch( () => {
            console.error("Could not load image from buffer view");
        });
        return true;
    }

    async setImageFromFiles(files, gltf)
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

        if (this.image instanceof Image)
        {
            const imageData = await AsyncFileReader.readAsDataURL(foundFile).catch( () => {
                console.error("Could not load image with FileReader");
            });
            this.image = await gltfImage.loadHTMLImage(imageData).catch( () => {
                console.error("Could not create image from FileReader image data");
            });
        }
        else
        {
            this.image = await gltf.ktxDecoder.loadKtxFromFile(foundFile);
        }

        return true;
    }

    shouldGenerateMips()
    {
        return (isPowerOf2(this.image.width) && isPowerOf2(this.image.height));
    }
}

export { gltfImage, ImageMimeType };

