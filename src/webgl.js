class gltfWebGl
{
    constructor()
    {
        this.context = undefined;
    }

    loadWebGlExtensions(webglExtensions)
    {
        for (let extension of webglExtensions)
        {
            if (WebGl.context.getExtension(extension) === null)
            {
                console.warn("Extension " + extension + " not supported!");
            }
        }

        let EXT_texture_filter_anisotropic = WebGl.context.getExtension("EXT_texture_filter_anisotropic");

        if (EXT_texture_filter_anisotropic)
        {
            WebGl.context.anisotropy = EXT_texture_filter_anisotropic.TEXTURE_MAX_ANISOTROPY_EXT;
            WebGl.context.maxAnisotropy = WebGl.context.getParameter(EXT_texture_filter_anisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
            WebGl.context.supports_EXT_texture_filter_anisotropic = true;
        }
        else
        {
            WebGl.context.supports_EXT_texture_filter_anisotropic = false;
        }
    }

    setTexture(loc, gltf, textureInfo, texSlot)
    {
        if (loc == -1)
        {
            return false;
        }

        let gltfTex = gltf.textures[textureInfo.index];

        if (gltfTex === undefined)
        {
            console.warn("Texture is undefined: " + textureInfo.index);
            return false;
        }

        if (gltfTex.glTexture === undefined)
        {
            gltfTex.glTexture = WebGl.context.createTexture();
        }

        WebGl.context.activeTexture(WebGl.context.TEXTURE0 + texSlot);
        WebGl.context.bindTexture(gltfTex.type, gltfTex.glTexture);

        WebGl.context.uniform1i(loc, texSlot);

        if (!gltfTex.initialized)
        {
            const gltfSampler = gltf.samplers[gltfTex.sampler];

            if (gltfSampler === undefined)
            {
                console.warn("Sampler is undefined for texture: " + textureInfo.index);
                return false;
            }

            WebGl.context.pixelStorei(WebGl.context.UNPACK_FLIP_Y_WEBGL, false);

            let images = [];

            if (gltfTex.source.length !== undefined)
            {
                // assume we have an array of textures (this is an unofficial extension to what glTF json can represent)
                images = gltfTex.source;
            }
            else
            {
                images = [gltfTex.source];
            }

            let generateMips = true;
            let rectangleImage = false;

            for (const src of images)
            {
                const image = gltf.images[src];

                if (image === undefined)
                {
                    console.warn("Image is undefined for texture: " + gltfTex.source);
                    return false;
                }

                if (image.image.dataRGBE !== undefined)
                {
                    WebGl.context.texImage2D(image.type, image.miplevel, WebGl.context.RGB, image.image.width, image.image.height, 0, WebGl.context.RGB, WebGl.context.FLOAT, image.image.dataFloat);
                    generateMips = false;
                }
                else
                {
                    WebGl.context.texImage2D(image.type, image.miplevel, textureInfo.colorSpace, textureInfo.colorSpace, WebGl.context.UNSIGNED_BYTE, image.image);
                }

                if (image.image.width != image.image.height)
                {
                    rectangleImage = true;
                    generateMips = false;
                }
            }

            this.setSampler(gltfSampler, gltfTex.type, rectangleImage);

            if (textureInfo.generateMips && generateMips)
            {
                // Until this point, images can be assumed to be power of two and having a square size.
                switch (gltfSampler.minFilter)
                {
                    case WebGl.context.NEAREST_MIPMAP_NEAREST:
                    case WebGl.context.NEAREST_MIPMAP_LINEAR:
                    case WebGl.context.LINEAR_MIPMAP_NEAREST:
                    case WebGl.context.LINEAR_MIPMAP_LINEAR:
                        WebGl.context.generateMipmap(gltfTex.type);
                        break;
                    default:
                        break;
                }
            }

            gltfTex.initialized = true;
        }

        return gltfTex.initialized;
    }

    setRenderTarget(gltf, renderTarget)
    {
        if(renderTarget.initialized)
        {
            return true;
        }

        if(renderTarget.useCanvas === false)
        {
            if(renderTarget.targetTexture === undefined)
            {
                renderTarget.targetTexture = WebGl.context.createTexture();
                WebGl.context.bindTexture(renderTarget.type, renderTarget.targetTexture);
                WebGl.context.texImage2D(renderTarget.type, renderTarget.level, renderTarget.internalFormat, renderTarget.width, renderTarget.height, 0, renderTarget.format, renderTarget.elementType, null);
            }

            if(renderTarget.frameBuffer === undefined)
            {
                renderTarget.frameBuffer = WebGl.context.createFramebuffer();
                WebGl.context.bindFramebuffer(WebGl.context.FRAMEBUFFER, renderTarget.frameBuffer);
                gl.framebufferTexture2D(WebGl.context.FRAMEBUFFER, renderTarget.attachmentPoint, renderTarget.type, renderTarget.targetTexture, renderTarget.level);
            }
        }

        const gltfSampler = gltf.samplers[renderTarget.sampler];

        if (gltfSampler === undefined)
        {
            console.warn("Sampler is undefined for rendertarget: " + renderTarget.attachmentPoint);
            return false;
        }

        this.setSampler(gltfSampler, renderTarget.type, renderTarget.width !== renderTarget.height);

        renderTarget.initialized = true;

        return renderTarget.initialized;
    }

    setIndices(gltf, accessorIndex)
    {
        let gltfAccessor = gltf.accessors[accessorIndex];

        if (gltfAccessor.glBuffer === undefined)
        {
            gltfAccessor.glBuffer = WebGl.context.createBuffer();

            let data = gltfAccessor.getTypedView(gltf);

            if (data === undefined)
            {
                return false;
            }

            WebGl.context.bindBuffer(WebGl.context.ELEMENT_ARRAY_BUFFER, gltfAccessor.glBuffer);
            WebGl.context.bufferData(WebGl.context.ELEMENT_ARRAY_BUFFER, data, WebGl.context.STATIC_DRAW);
        }
        else
        {
            WebGl.context.bindBuffer(WebGl.context.ELEMENT_ARRAY_BUFFER, gltfAccessor.glBuffer);
        }

        return true;
    }

    enableAttribute(gltf, attributeLocation, gltfAccessor)
    {
        if (attributeLocation == -1)
        {
            return false;
        }

        let gltfBufferView = gltf.bufferViews[gltfAccessor.bufferView];

        if (gltfAccessor.glBuffer === undefined)
        {
            gltfAccessor.glBuffer = WebGl.context.createBuffer();

            let data = gltfAccessor.getTypedView(gltf);

            if (data === undefined)
            {
                return false;
            }

            WebGl.context.bindBuffer(WebGl.context.ARRAY_BUFFER, gltfAccessor.glBuffer);
            WebGl.context.bufferData(WebGl.context.ARRAY_BUFFER, data, WebGl.context.STATIC_DRAW);
        }
        else
        {
            WebGl.context.bindBuffer(WebGl.context.ARRAY_BUFFER, gltfAccessor.glBuffer);
        }

        WebGl.context.vertexAttribPointer(attributeLocation, gltfAccessor.getComponentCount(), gltfAccessor.componentType,
            gltfAccessor.normalized, gltfBufferView.byteStride, gltfAccessor.byteOffset);
        WebGl.context.enableVertexAttribArray(attributeLocation);

        return true;
    }

    compileShader(isVert, shaderSource)
    {
        let shader = WebGl.context.createShader(isVert ? WebGl.context.VERTEX_SHADER : WebGl.context.FRAGMENT_SHADER);
        WebGl.context.shaderSource(shader, shaderSource);
        WebGl.context.compileShader(shader);
        let compiled = WebGl.context.getShaderParameter(shader, WebGl.context.COMPILE_STATUS);

        if (!compiled)
        {

            console.warn(WebGl.context.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    }

    linkProgram(vertex, fragment)
    {
        let program = WebGl.context.createProgram();
        WebGl.context.attachShader(program, vertex);
        WebGl.context.attachShader(program, fragment);
        WebGl.context.linkProgram(program);

        return program;
    }

    //https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Constants
    setSampler(gltfSamplerObj, type, rectangleImage) // TEXTURE_2D
    {
        if (rectangleImage)
        {
            WebGl.context.texParameteri(type, WebGl.context.TEXTURE_WRAP_S, WebGl.context.CLAMP_TO_EDGE);
            WebGl.context.texParameteri(type, WebGl.context.TEXTURE_WRAP_T, WebGl.context.CLAMP_TO_EDGE);
        }
        else
        {
            WebGl.context.texParameteri(type, WebGl.context.TEXTURE_WRAP_S, gltfSamplerObj.wrapS);
            WebGl.context.texParameteri(type, WebGl.context.TEXTURE_WRAP_T, gltfSamplerObj.wrapT);
        }

        // Rectangle images are not mip-mapped, so force to non-mip-mapped sampler.
        if (rectangleImage && (gltfSamplerObj.minFilter != WebGl.context.NEAREST) && (gltfSamplerObj.minFilter != WebGl.context.LINEAR))
        {
            if ((gltfSamplerObj.minFilter == WebGl.context.NEAREST_MIPMAP_NEAREST) || (gltfSamplerObj.minFilter == WebGl.context.NEAREST_MIPMAP_LINEAR))
            {
                WebGl.context.texParameteri(type, WebGl.context.TEXTURE_MIN_FILTER, WebGl.context.NEAREST);
            }
            else
            {
                WebGl.context.texParameteri(type, WebGl.context.TEXTURE_MIN_FILTER, WebGl.context.LINEAR);
            }
        }
        else
        {
            WebGl.context.texParameteri(type, WebGl.context.TEXTURE_MIN_FILTER, gltfSamplerObj.minFilter);
        }
        WebGl.context.texParameteri(type, WebGl.context.TEXTURE_MAG_FILTER, gltfSamplerObj.magFilter);

        if (WebGl.context.supports_EXT_texture_filter_anisotropic)
        {
            WebGl.context.texParameterf(type, WebGl.context.anisotropy, WebGl.context.maxAnisotropy); // => 16xAF
        }
    }
}

const WebGl = new gltfWebGl();

export { WebGl };
