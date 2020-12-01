
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

        if (gltfTex.glTexture === undefined)
        {
            gltfTex.glTexture = WebGl.context.createTexture();
        }

        WebGl.context.activeTexture(WebGL2RenderingContext.TEXTURE0 + texSlot);
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

            WebGl.context.pixelStorei(WebGL2RenderingContext.UNPACK_FLIP_Y_WEBGL, false);

            let images = [];

            if (gltfTex.source.length !== undefined)
            {
                // assume we have an array of images (this is an unofficial extension to what glTF json can represent)
                images = gltfTex.source;
            }
            else
            {
                images = [gltfTex.source];
            }

            let generateMips = true;

            for (const src of images)
            {
                const image = gltf.images[src];

                if (image === undefined)
                {
                    console.warn("Image is undefined for texture: " + gltfTex.source);
                    return false;
                }

                if (image.type === WebGL2RenderingContext.TEXTURE_CUBE_MAP)
                {
                    const ktxImage = image.image;

                    for (const level of ktxImage.levels)
                    {
                        let faceType = WebGL2RenderingContext.TEXTURE_CUBE_MAP_POSITIVE_X;
                        for (const face of level.faces)
                        {
                            WebGl.context.texImage2D(faceType, level.miplevel, ktxImage.glInternalFormat, level.width, level.height, 0, ktxImage.glFormat, ktxImage.glType, face.data);

                            faceType++;
                        }
                    }
                }
                else
                {
                    WebGl.context.texImage2D(image.type, image.miplevel, WebGL2RenderingContext.RGBA, WebGL2RenderingContext.RGBA, WebGL2RenderingContext.UNSIGNED_BYTE, image.image);
                }

                generateMips = image.shouldGenerateMips();
            }

            this.setSampler(gltfSampler, gltfTex.type, generateMips);

            if (textureInfo.generateMips && generateMips)
            {
                // Until this point, images can be assumed to be power of two.
                switch (gltfSampler.minFilter)
                {
                case WebGL2RenderingContext.NEAREST_MIPMAP_NEAREST:
                case WebGL2RenderingContext.NEAREST_MIPMAP_LINEAR:
                case WebGL2RenderingContext.LINEAR_MIPMAP_NEAREST:
                case WebGL2RenderingContext.LINEAR_MIPMAP_LINEAR:
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

            WebGl.context.bindBuffer(WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER, gltfAccessor.glBuffer);
            WebGl.context.bufferData(WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER, data, WebGL2RenderingContext.STATIC_DRAW);
        }
        else
        {
            WebGl.context.bindBuffer(WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER, gltfAccessor.glBuffer);
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
            gltfAccessor.glBuffer = WebGl.context.createBuffer();

            let data = gltfAccessor.getTypedView(gltf);

            if (data === undefined)
            {
                return false;
            }

            WebGl.context.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, gltfAccessor.glBuffer);
            WebGl.context.bufferData(WebGL2RenderingContext.ARRAY_BUFFER, data, WebGL2RenderingContext.STATIC_DRAW);
        }
        else
        {
            WebGl.context.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, gltfAccessor.glBuffer);
        }

        WebGl.context.vertexAttribPointer(attributeLocation, gltfAccessor.getComponentCount(gltfAccessor.type), gltfAccessor.componentType, gltfAccessor.normalized, gltfBufferView.byteStride, 0);
        WebGl.context.enableVertexAttribArray(attributeLocation);

        return true;
    }

    compileShader(shaderIdentifier, isVert, shaderSource)
    {
        const shader = WebGl.context.createShader(isVert ? WebGL2RenderingContext.VERTEX_SHADER : WebGL2RenderingContext.FRAGMENT_SHADER);
        WebGl.context.shaderSource(shader, shaderSource);
        WebGl.context.compileShader(shader);
        const compiled = WebGl.context.getShaderParameter(shader, WebGL2RenderingContext.COMPILE_STATUS);

        if (!compiled)
        {
            // output surrounding source code
            let info = "";
            const messages = WebGl.context.getShaderInfoLog(shader).split("\n");
            for(const message of messages)
            {
                info += message + "\n";
                const matches = message.match(/(?:(?:WARNING)|(?:ERROR)): [0-9]*:([0-9]*).*/i);
                if (matches && matches.length > 1)
                {
                    const lineNumber = parseInt(matches[1]) - 1;
                    const lines = shaderSource.split("\n");

                    for(let i = Math.max(0, lineNumber - 2); i < Math.min(lines.length, lineNumber + 3); i++)
                    {
                        if (lineNumber === i)
                        {
                            info += "->";
                        }
                        info += "\t" + lines[i] + "\n";
                    }
                }
            }

            throw new Error("Could not compile WebGL program '" + shaderIdentifier + "'. \n\n" + info);
        }

        return shader;
    }

    linkProgram(vertex, fragment)
    {
        let program = WebGl.context.createProgram();
        WebGl.context.attachShader(program, vertex);
        WebGl.context.attachShader(program, fragment);
        WebGl.context.linkProgram(program);

        if (!WebGl.context.getProgramParameter(program, WebGL2RenderingContext.LINK_STATUS))
        {
            var info = WebGl.context.getProgramInfoLog(program);
            throw new Error('Could not link WebGL program. \n\n' + info);
        }

        return program;
    }

    //https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Constants
    setSampler(gltfSamplerObj, type, generateMipmaps) // TEXTURE_2D
    {
        if (generateMipmaps)
        {
            WebGl.context.texParameteri(type, WebGL2RenderingContext.TEXTURE_WRAP_S, gltfSamplerObj.wrapS);
            WebGl.context.texParameteri(type, WebGL2RenderingContext.TEXTURE_WRAP_T, gltfSamplerObj.wrapT);
        }
        else
        {
            WebGl.context.texParameteri(type, WebGL2RenderingContext.TEXTURE_WRAP_S, WebGL2RenderingContext.CLAMP_TO_EDGE);
            WebGl.context.texParameteri(type, WebGL2RenderingContext.TEXTURE_WRAP_T, WebGL2RenderingContext.CLAMP_TO_EDGE);
        }

        // If not mip-mapped, force to non-mip-mapped sampler.
        if (!generateMipmaps && (gltfSamplerObj.minFilter != WebGL2RenderingContext.NEAREST) && (gltfSamplerObj.minFilter != WebGL2RenderingContext.LINEAR))
        {
            if ((gltfSamplerObj.minFilter == WebGL2RenderingContext.NEAREST_MIPMAP_NEAREST) || (gltfSamplerObj.minFilter == WebGL2RenderingContext.NEAREST_MIPMAP_LINEAR))
            {
                WebGl.context.texParameteri(type, WebGL2RenderingContext.TEXTURE_MIN_FILTER, WebGL2RenderingContext.NEAREST);
            }
            else
            {
                WebGl.context.texParameteri(type, WebGL2RenderingContext.TEXTURE_MIN_FILTER, WebGL2RenderingContext.LINEAR);
            }
        }
        else
        {
            WebGl.context.texParameteri(type, WebGL2RenderingContext.TEXTURE_MIN_FILTER, gltfSamplerObj.minFilter);
        }
        WebGl.context.texParameteri(type, WebGL2RenderingContext.TEXTURE_MAG_FILTER, gltfSamplerObj.magFilter);

        if (WebGl.context.supports_EXT_texture_filter_anisotropic)
        {
            WebGl.context.texParameterf(type, WebGl.context.anisotropy, WebGl.context.maxAnisotropy); // => 16xAF
        }
    }
}

const WebGl = new gltfWebGl();

export { WebGl };
