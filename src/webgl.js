function LoadWebGLExtensions(webglExtensions)
{
    for (let extension of webglExtensions)
    {
        if(gl.getExtension(extension) === null)
        {
            console.warn("Extension " + extension + " not supported!");
        }
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
function SetSampler(gltfSamplerObj, type, rectangleImage) // TEXTURE_2D
{
	if (rectangleImage)
	{
		gl.texParameteri(type, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(type, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	}
	else
	{
		gl.texParameteri(type, gl.TEXTURE_WRAP_S, gltfSamplerObj.wrapS);
		gl.texParameteri(type, gl.TEXTURE_WRAP_T, gltfSamplerObj.wrapT);
	}

    // Rectangle images are not mip-mapped, so force to non-mip-mapped sampler.
    if (rectangleImage && (gltfSamplerObj.minFilter != gl.NEAREST) && (gltfSamplerObj.minFilter != gl.LINEAR))
    {
        if ((gltfSamplerObj.minFilter == gl.NEAREST_MIPMAP_NEAREST) || (gltfSamplerObj.minFilter == gl.NEAREST_MIPMAP_LINEAR))
    	{
    		gl.texParameteri(type, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    	}
    	else
    	{
    		gl.texParameteri(type, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    	}
    }
    else
    {
    	gl.texParameteri(type, gl.TEXTURE_MIN_FILTER, gltfSamplerObj.minFilter);
    }
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

        let generateMips = true;
        let rectangleImage = false;

        for(const src of images)
        {
            const image =  gltf.images[src];

            if (image === undefined)
            {
                console.warn("Image is undefined for texture: " + gltfTex.source);
                return false;
            }

            if (image.image.dataRGBE !== undefined)
            {
                gl.texImage2D(image.type, image.miplevel, gl.RGB, image.image.width, image.image.height, 0, gl.RGB, gl.FLOAT, image.image.dataFloat);
                generateMips = false;
            }
            else
            {
                gl.texImage2D(image.type, image.miplevel, textureInfo.colorSpace, textureInfo.colorSpace, gl.UNSIGNED_BYTE, image.image);
            }

            if (image.image.width != image.image.height)
            {
            	rectangleImage = true;
            	generateMips = false;
            }
        }
        
        SetSampler(gltfSampler, gltfTex.type, rectangleImage);

        if (textureInfo.generateMips && generateMips)
        {
            // Until this point, images can be assumed to be power of two.
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
        
        
        // Release the complete image buffer after usage.
        gl.finish();
        for(const src of images)
        {
        	gltf.images[src].image = undefined;
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
                           gltfAccessor.normalized, gltfBufferView.byteStride, gltfAccessor.byteOffset);
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
