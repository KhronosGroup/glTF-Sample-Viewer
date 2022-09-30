import { GltfObject } from './gltf_object.js';
import { isPowerOf2 } from './math_utils.js';
import { AsyncFileReader } from '../ResourceLoader/async_file_reader.js';
import { GL } from "../Renderer/webgl";
import { ImageMimeType } from "./image_mime_type.js";
import * as jpeg  from "jpeg-js";
import * as png from 'fast-png';

class gltfImage extends GltfObject
{
    constructor(
        uri = undefined,
        type = GL.TEXTURE_2D,
        miplevel = 0,
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
        this.name = name;
        this.type = type; // nonstandard
        this.miplevel = miplevel; // nonstandard
    }

    resolveRelativePath(basePath)
    {
        if (typeof this.uri === 'string' || this.uri instanceof String)
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
            if (this.mimeType !== ImageMimeType.GLTEXTURE)
            {
                console.error("image has already been loaded");
            }
            return;
        }

        if (!await this.setImageFromBufferView(gltf) &&
            !await this.setImageFromFiles(additionalFiles, gltf) &&
            !await this.setImageFromUri(gltf))
        {
            console.error("Was not able to resolve image with uri '%s'", this.uri);
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
            image.crossOrigin = "";
        });
    }

    async setImageFromUri(gltf)
    {
        if (this.uri === undefined)
        {
            return false;
        }

        if(this.mimeType === ImageMimeType.KTX2)
        {
            if (gltf.ktxDecoder !== undefined)
            {
                this.image = await gltf.ktxDecoder.loadKtxFromUri(this.uri);
            }
            else
            {
                console.warn('Loading of ktx images failed: KtxDecoder not initalized');
            }
        }
        else if (typeof(Image) !== 'undefined' && (this.mimeType === ImageMimeType.JPEG || this.mimeType === ImageMimeType.PNG))
        {
            this.image = await gltfImage.loadHTMLImage(this.uri).catch( (error) => {
                console.error(error);
            });
        }
        else if(this.mimeType === ImageMimeType.JPEG && this.uri instanceof ArrayBuffer)
        {
            this.image = jpeg.decode(this.uri, {useTArray: true});
        }
        else if(this.mimeType === ImageMimeType.PNG && this.uri instanceof ArrayBuffer)
        {
            this.image = png.decode(this.uri);
        }
        else
        {
            console.error("Unsupported image type " + this.mimeType);
            return false;
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
        if (this.mimeType === ImageMimeType.KTX2)
        {
            if (gltf.ktxDecoder !== undefined)
            {
                this.image = await gltf.ktxDecoder.loadKtxFromBuffer(array);
            }
            else
            {
                console.warn('Loading of ktx images failed: KtxDecoder not initalized');
            }
        }
        else if(typeof(Image) !== 'undefined' && (this.mimeType === ImageMimeType.JPEG || this.mimeType === ImageMimeType.PNG))
        {
            const blob = new Blob([array], { "type": this.mimeType });
            const objectURL = URL.createObjectURL(blob);
            this.image = await gltfImage.loadHTMLImage(objectURL).catch( () => {
                console.error("Could not load image from buffer view");
            });
        }
        else if(this.mimeType === ImageMimeType.JPEG)
        {
            this.image = jpeg.decode(array, {useTArray: true});
        }
        else if(this.mimeType === ImageMimeType.PNG)
        {
            this.image = png.decode(array);
        }
        else
        {
            console.error("Unsupported image type " + this.mimeType);
            return false;
        }

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
            const uriName = this.uri.split('\\').pop().split('/').pop();
            if (file.name === uriName)
            {
                return true;
            }
        }, this);

        if (foundFile === undefined)
        {
            return false;
        }

        if(this.mimeType === ImageMimeType.KTX2)
        {
            if (gltf.ktxDecoder !== undefined)
            {
                const data = new Uint8Array(await foundFile.arrayBuffer());
                this.image = await gltf.ktxDecoder.loadKtxFromBuffer(data);
            }
            else
            {
                console.warn('Loading of ktx images failed: KtxDecoder not initalized');
            }
        }
        else if (typeof(Image) !== 'undefined' && (this.mimeType === ImageMimeType.JPEG || this.mimeType === ImageMimeType.PNG))
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
            console.error("Unsupported image type " + this.mimeType);
            return false;
        }


        return true;
    }
}

export { gltfImage, ImageMimeType };

