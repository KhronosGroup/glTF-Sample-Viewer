
//https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Constants
function SetSampler(gltfSamplerObj, type) // TEXTURE_2D
{
    gl.texParameteri(type, gl.TEXTURE_WRAP_S, gltfSamplerObj.wrapS);
    gl.texParameteri(type, gl.TEXTURE_WRAP_T, gltfSamplerObj.wrapT);
    gl.texParameteri(type, gl.TEXTURE_MIN_FILTER, gltfSamplerObj.minFilter);
    gl.texParameteri(type, gl.TEXTURE_MAG_FILTER, gltfSamplerObj.magFilter);
}

function SetTexture(program, gltf, textureInfo, texSlot)
{
    let gltfTex = gltf.textures[textureInfo.index];

    if(gltfTex === undefined)
    {
        console.warn("Texture is undefined: " + textureInfo.index);
        return false;
    }

    if(gltfTex.texture === undefined)
    {
        gltfTex.texture = gl.createTexture();
    }

    const loc = gl.getUniformLocation(program, textureInfo.samplerName);

    if(loc === undefined)
    {
        console.warn("Sampler location not found: " + textureInfo.samplerName);
        return false;
    }

    // TODO: get sampler location
    gl.activeTexture(gl.TEXTURE0 + texSlot);
    gl.bindTexture(textureInfo.type, gltfTex.texture);

    gl.uniform1i(loc, texSlot);

    if(!gltfTex.initialized)
    {
        const gltfSampler = gltf.samplers[gltfTex.sampler];

        if(gltfSampler === undefined)
        {
            console.warn("Sampler is undefined for texture: " + gltfTex.source);
            return false;
        }

        // In WebGL SRGB textures can't generate mipmapsmipmaps, so we
        // need to convert the sampler to the "correct" format here:
        if (gl.hasSRGBExtension && textureInfo.colorSpace == gl.SRGB)
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

        SetSampler(gltfSampler, textureInfo.type);

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        let gltfImage =  gltf.images[gltfTex.source];

        if (gltfImage === undefined)
        {
            console.warn("Image is undefined for texture: " + gltfTex.source);
            return false;
        }

        // TODO: cubemaps
        gl.texImage2D(textureInfo.type, 0, textureInfo.colorSpace, textureInfo.colorSpace, gl.UNSIGNED_BYTE, gltfImage.image);

        if ((gl.hasSRGBExtension && textureInfo.colorSpace != gl.SRGB) || !gl.hasSRGBExtension)
        {
            // TODO: check for power-of-two
            switch (gltfSampler.minFilter) {
                case gl.NEAREST_MIPMAP_NEAREST:
                case gl.NEAREST_MIPMAP_LINEAR:
                case gl.LINEAR_MIPMAP_NEAREST:
                case gl.LINEAR_MIPMAP_LINEAR:
                    gl.generateMipmap(textureInfo.type);
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

function EnableAttribute(gltf, shaderProgram, attributeName, gltfAccessor)
{
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

    let attributeLocation = gl.getAttribLocation(shaderProgram, attributeName);

    if (attributeLocation == -1)
    {
        console.log("Attribute name '" + attributeName + "' doesn't exist!");
        return false;
    }

    gl.vertexAttribPointer(attributeLocation, gltfAccessor.getComponentCount(), gltfAccessor.componentType,
                           gltfAccessor.normalized, gltfBufferView.byteStride, 0);
    gl.enableVertexAttribArray(attributeLocation);

    return true;
}

function DisableAttribute(shaderProgram, attributeName)
{
    let attributeLocation = gl.getAttribLocation(shaderProgram, attributeName);

    if (attributeLocation == -1)
    {
        console.log("Attribute name '" + attributeName + "' doesn't exist!");
        return;
    }

    gl.disableVertexAttribArray(attributeLocation);
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
