import { ImageMimeType } from "../gltf/image_mime_type.js";

let GL = undefined;

class gltfWebGl
{
    constructor(context)
    {
        this.context = context;
        if(GL === undefined)
        {
            GL = context;
        }
    }

    loadWebGlExtensions(webglExtensions)
    {
        for (let extension of webglExtensions)
        {
            if (this.context.getExtension(extension) === null)
            {
                console.warn("Extension " + extension + " not supported!");
            }
        }

        let EXT_texture_filter_anisotropic = this.context.getExtension("EXT_texture_filter_anisotropic");

        if (EXT_texture_filter_anisotropic)
        {
            this.context.anisotropy = EXT_texture_filter_anisotropic.TEXTURE_MAX_ANISOTROPY_EXT;
            this.context.maxAnisotropy = this.context.getParameter(EXT_texture_filter_anisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
            this.context.supports_EXT_texture_filter_anisotropic = true;
        }
        else
        {
            this.context.supports_EXT_texture_filter_anisotropic = false;
        }
    }

    setTexture(loc, gltf, textureInfo, texSlot)
    {
        if (loc === -1)
        {
            return false;
        }

        let gltfTex = gltf.textures[textureInfo.index];

        if (gltfTex === undefined)
        {
            console.warn("Texture is undefined: " + textureInfo.index);
            return false;
        }

        const image = gltf.images[gltfTex.source];
        if (image === undefined)
        {
            console.warn("Image is undefined for texture: " + gltfTex.source);
            return false;
        }

        if (gltfTex.glTexture === undefined)
        {
            if (image.mimeType === ImageMimeType.KTX2 ||
                image.mimeType === ImageMimeType.GLTEXTURE)
            {
                // these image resources are directly loaded to a GPU resource by resource loader
                gltfTex.glTexture = image.image;
            }
            else
            {
                // other images will be uploaded in a later step
                gltfTex.glTexture = this.context.createTexture();
            }
        }

        this.context.activeTexture(GL.TEXTURE0 + texSlot);
        this.context.bindTexture(gltfTex.type, gltfTex.glTexture);

        this.context.uniform1i(loc, texSlot);

        if (!gltfTex.initialized)
        {
            const gltfSampler = gltf.samplers[gltfTex.sampler];

            if (gltfSampler === undefined)
            {
                console.warn("Sampler is undefined for texture: " + textureInfo.index);
                return false;
            }

            this.context.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, false);

            // upload images that are not directly loaded as GPU resource
            if (image.mimeType === ImageMimeType.PNG ||
                image.mimeType === ImageMimeType.JPEG ||
                image.mimeType === ImageMimeType.HDR)
            {
                // the check `GL.SRGB8_ALPHA8 === undefined` is needed as at the moment node-gles does not define the full format enum
                const internalformat = (textureInfo.linear || GL.SRGB8_ALPHA8 === undefined) ? GL.RGBA : GL.SRGB8_ALPHA8;
                this.context.texImage2D(image.type, image.miplevel, internalformat, GL.RGBA, GL.UNSIGNED_BYTE, image.image);
            }

            this.setSampler(gltfSampler, gltfTex.type, textureInfo.generateMips);

            if (textureInfo.generateMips)
            {
                switch (gltfSampler.minFilter)
                {
                case GL.NEAREST_MIPMAP_NEAREST:
                case GL.NEAREST_MIPMAP_LINEAR:
                case GL.LINEAR_MIPMAP_NEAREST:
                case GL.LINEAR_MIPMAP_LINEAR:
                    this.context.generateMipmap(gltfTex.type);
                    break;
                default:
                    break;
                }
            }

            gltfTex.initialized = true;
        }

        return gltfTex.initialized;
    }

    setIndices(gltf, accessorIndex)
    {
        let gltfAccessor = gltf.accessors[accessorIndex];

        if (gltfAccessor.glBuffer === undefined)
        {
            gltfAccessor.glBuffer = this.context.createBuffer();

            let data = gltfAccessor.getTypedView(gltf);

            if (data === undefined)
            {
                return false;
            }

            this.context.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, gltfAccessor.glBuffer);
            this.context.bufferData(GL.ELEMENT_ARRAY_BUFFER, data, GL.STATIC_DRAW);
        }
        else
        {
            this.context.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, gltfAccessor.glBuffer);
        }

        return true;
    }

    enableAttribute(gltf, attributeLocation, gltfAccessor)
    {
        if (attributeLocation === -1)
        {
            console.warn("Tried to access unknown attribute");
            return false;
        }

        if(gltfAccessor.bufferView === undefined)
        {
            console.warn("Tried to access undefined bufferview");
            return true;
        }

        let gltfBufferView = gltf.bufferViews[gltfAccessor.bufferView];

        if (gltfAccessor.glBuffer === undefined)
        {
            gltfAccessor.glBuffer = this.context.createBuffer();

            let data = gltfAccessor.getTypedView(gltf);

            if (data === undefined)
            {
                return false;
            }

            this.context.bindBuffer(GL.ARRAY_BUFFER, gltfAccessor.glBuffer);
            this.context.bufferData(GL.ARRAY_BUFFER, data, GL.STATIC_DRAW);
        }
        else
        {
            this.context.bindBuffer(GL.ARRAY_BUFFER, gltfAccessor.glBuffer);
        }

        this.context.vertexAttribPointer(attributeLocation, gltfAccessor.getComponentCount(gltfAccessor.type), gltfAccessor.componentType, gltfAccessor.normalized, gltfBufferView.byteStride, 0);
        this.context.enableVertexAttribArray(attributeLocation);

        return true;
    }

    compileShader(shaderIdentifier, isVert, shaderSource)
    {
        const shader = this.context.createShader(isVert ? GL.VERTEX_SHADER : GL.FRAGMENT_SHADER);
        this.context.shaderSource(shader, shaderSource);
        this.context.compileShader(shader);
        const compiled = this.context.getShaderParameter(shader, GL.COMPILE_STATUS);

        if (!compiled)
        {
            // output surrounding source code
            let info = "";
            const messages = this.context.getShaderInfoLog(shader).split("\n");
            for(const message of messages)
            {
                
                const matches = message.match(/(WARNING|ERROR): ([0-9]*):([0-9]*):(.*)/i);
                if (matches && matches.length == 5)
                {
                    const lineNumber = parseInt(matches[3]) - 1;
                    const lines = shaderSource.split("\n");

                    info += `${matches[1]}: ${shaderIdentifier}+includes:${lineNumber}: ${matches[4]}`;

                    for(let i = Math.max(0, lineNumber - 2); i < Math.min(lines.length, lineNumber + 3); i++)
                    {
                        if (lineNumber === i)
                        {
                            info += "->";
                        }
                        info += "\t" + lines[i] + "\n";
                    }
                }
                else
                {
                    info += message + "\n";
                }
            }

            throw new Error("Could not compile WebGL program '" + shaderIdentifier + "': " + info);
        }

        return shader;
    }

    linkProgram(vertex, fragment)
    {
        let program = this.context.createProgram();
        this.context.attachShader(program, vertex);
        this.context.attachShader(program, fragment);
        this.context.linkProgram(program);

        if (!this.context.getProgramParameter(program, GL.LINK_STATUS))
        {
            var info = this.context.getProgramInfoLog(program);
            throw new Error('Could not link WebGL program. \n\n' + info);
        }

        return program;
    }

    //https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Constants
    setSampler(gltfSamplerObj, type, generateMipmaps) // TEXTURE_2D
    {
        if (generateMipmaps)
        {
            this.context.texParameteri(type, GL.TEXTURE_WRAP_S, gltfSamplerObj.wrapS);
            this.context.texParameteri(type, GL.TEXTURE_WRAP_T, gltfSamplerObj.wrapT);
        }
        else
        {
            this.context.texParameteri(type, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
            this.context.texParameteri(type, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
        }

        // If not mip-mapped, force to non-mip-mapped sampler.
        if (!generateMipmaps && (gltfSamplerObj.minFilter != GL.NEAREST) && (gltfSamplerObj.minFilter != GL.LINEAR))
        {
            if ((gltfSamplerObj.minFilter == GL.NEAREST_MIPMAP_NEAREST) || (gltfSamplerObj.minFilter == GL.NEAREST_MIPMAP_LINEAR))
            {
                this.context.texParameteri(type, GL.TEXTURE_MIN_FILTER, GL.NEAREST);
            }
            else
            {
                this.context.texParameteri(type, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
            }
        }
        else
        {
            this.context.texParameteri(type, GL.TEXTURE_MIN_FILTER, gltfSamplerObj.minFilter);
        }
        this.context.texParameteri(type, GL.TEXTURE_MAG_FILTER, gltfSamplerObj.magFilter);

        if (this.context.supports_EXT_texture_filter_anisotropic)
        {
            this.context.texParameterf(type, this.context.anisotropy, this.context.maxAnisotropy); // => 16xAF
        }
    }
}

export { gltfWebGl, GL };
