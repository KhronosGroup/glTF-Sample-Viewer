function LoadWebGLExtensions(webglExtensions)
{
    for (let extension of webglExtensions)
    {
        if(gl.getExtension(extension) === null)
        {
            console.warn("Extension " + extension + " not supported!");
        }
    }

    let EXT_SRGB = gl.getExtension("EXT_SRGB");

    if (EXT_SRGB)
    {
        gl.SRGB = EXT_SRGB.SRGB_ALPHA_EXT;
        gl.supports_EXT_SRGB = true;
    }
    else
    {
        gl.SRGB = gl.RGBA;
        gl.supports_EXT_SRGB = false;
    }

    let EXT_texture_filter_anisotropic = gl.getExtension("EXT_texture_filter_anisotropic");

    if (EXT_texture_filter_anisotropic)
    {
        gl.anisotropy = EXT_texture_filter_anisotropic.TEXTURE_MAX_ANISOTROPY_EXT;
        gl.maxAnisotropy = gl.getParameter(EXT_texture_filter_anisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
        gl.supports_EXT_texture_filter_anisotropic = true;
    }
    else
    {
        gl.supports_EXT_texture_filter_anisotropic = false;
    }
}

//https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Constants
function SetSampler(gltfSamplerObj, type) // TEXTURE_2D
{
    gl.texParameteri(type, gl.TEXTURE_WRAP_S, gltfSamplerObj.wrapS);
    gl.texParameteri(type, gl.TEXTURE_WRAP_T, gltfSamplerObj.wrapT);
    gl.texParameteri(type, gl.TEXTURE_MIN_FILTER, gltfSamplerObj.minFilter);
    gl.texParameteri(type, gl.TEXTURE_MAG_FILTER, gltfSamplerObj.magFilter);

    if (gl.supports_EXT_texture_filter_anisotropic)
    {
        gl.texParameterf(type, gl.anisotropy, gl.maxAnisotropy); // => 16xAF
    }
}

function SetTexture(loc, gltf, textureInfo, texSlot)
{
    if(loc == -1)
    {
        return false;
    }

    let gltfTex = gltf.textures[textureInfo.index];

    if(gltfTex === undefined)
    {
        console.warn("Texture is undefined: " + textureInfo.index);
        return false;
    }

    if(gltfTex.glTexture === undefined)
    {
        gltfTex.glTexture = gl.createTexture();
    }

    gl.activeTexture(gl.TEXTURE0 + texSlot);
    gl.bindTexture(gltfTex.type, gltfTex.glTexture);

    gl.uniform1i(loc, texSlot);

    if(!gltfTex.initialized)
    {
        const gltfSampler = gltf.samplers[gltfTex.sampler];

        if(gltfSampler === undefined)
        {
            console.warn("Sampler is undefined for texture: " + textureInfo.index);
            return false;
        }

        // In WebGL SRGB textures can't generate mipmaps, so we
        // need to convert the sampler to the "correct" format here:
        if (gl.supports_EXT_SRGB && textureInfo.colorSpace == gl.SRGB)
        {
            switch (gltfSampler.minFilter) {
                case gl.NEAREST_MIPMAP_NEAREST:
                case gl.NEAREST_MIPMAP_LINEAR:
                    gltfSampler.minFilter = gl.NEAREST;
                    break;
                case gl.LINEAR_MIPMAP_NEAREST:
                case gl.LINEAR_MIPMAP_LINEAR:
                    gltfSampler.minFilter = gl.LINEAR;
                    break;
                default:  break;
            }
        }

        SetSampler(gltfSampler, gltfTex.type);

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

        let images = [];

        if(gltfTex.source.length !== undefined)
        {
            // assume we have an array of textures (this is an unofficial extension to what glTF json can represent)
            images = gltfTex.source;
        }
        else
        {
            images = [gltfTex.source];
        }

        for(let src of images)
        {
            let image =  gltf.images[src];

            if (image === undefined)
            {
                console.warn("Image is undefined for texture: " + gltfTex.source);
                return false;
            }

            gl.texImage2D(image.type, image.miplevel, textureInfo.colorSpace, textureInfo.colorSpace, gl.UNSIGNED_BYTE, image.image);
        }

        if (textureInfo.generateMips && ((gl.supports_EXT_SRGB && textureInfo.colorSpace != gl.SRGB) || !gl.supports_EXT_SRGB))
        {
            // TODO: check for power-of-two
            switch (gltfSampler.minFilter) {
                case gl.NEAREST_MIPMAP_NEAREST:
                case gl.NEAREST_MIPMAP_LINEAR:
                case gl.LINEAR_MIPMAP_NEAREST:
                case gl.LINEAR_MIPMAP_LINEAR:
                    gl.generateMipmap(gltfTex.type);
                    break;
                default:
                    break;
            }
        }

        gltfTex.initialized = true;
    }

    return gltfTex.initialized;
}

function SetIndices(gltf, accessorIndex)
{
    let gltfAccessor = gltf.accessors[accessorIndex];

    if (gltfAccessor.glBuffer === undefined)
    {
        gltfAccessor.glBuffer = gl.createBuffer();

        let data = gltfAccessor.getTypedView(gltf);

        if (data === undefined)
        {
            return false;
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gltfAccessor.glBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
    }
    else
    {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gltfAccessor.glBuffer);
    }

    return true;
}

function EnableAttribute(gltf, attributeLocation, gltfAccessor)
{
    if(attributeLocation == -1)
    {
        return false;
    }

    let gltfBufferView = gltf.bufferViews[gltfAccessor.bufferView];

    if (gltfAccessor.glBuffer === undefined)
    {
        gltfAccessor.glBuffer = gl.createBuffer();

        let data = gltfAccessor.getTypedView(gltf);

        if (data === undefined)
        {
            return false;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, gltfAccessor.glBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    }
    else
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, gltfAccessor.glBuffer);
    }

    gl.vertexAttribPointer(attributeLocation, gltfAccessor.getComponentCount(), gltfAccessor.componentType,
                           gltfAccessor.normalized, gltfBufferView.byteStride, 0);
    gl.enableVertexAttribArray(attributeLocation);

    return true;
}

function CompileShader(isVert, shaderSource)
{
    let shader = gl.createShader(isVert ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);
    let compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

    if (!compiled) {

        console.warn(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function LinkProgram(vertex, fragment)
{
    let program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);

    return program;
}
