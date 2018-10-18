
//https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Constants
function SetSampler(gltfSamplerObj, type) // TEXTURE_2D
{
    gl.texParameteri(type, gl.TEXTURE_WRAP_S, gltfSamplerObj.wrapS);
    gl.texParameteri(type, gl.TEXTURE_WRAP_T, gltfSamplerObj.warpT);
    gl.texParameteri(type, gl.TEXTURE_MIN_FILTER, gltfSamplerObj.minFilter);
    gl.texParameteri(type, gl.TEXTURE_MAG_FILTER, gltfSamplerObj.magFilter);
}

function SetTexture(gltf, textureInfo)
{
    let gltfTexture = gltf.textures[textureInfo.index];

    let init = false;
    if(gltfTexture.texture === undefined)
    {
        gltfTexture.texture = gl.createTexture();
        init = true;
    }

    gl.activateTexture(gl.TEXTURE0 + gltfTexture.sampler);
    gl.bindTexture(gl.TEXTURE_2D, gltfTexture.texture);

    if(init)
    {
        SetSampler(gltf.samplers[gltfTexture.sampler]);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, textureInfo.colorSpace, textureInfo.colorSpace, gl.UNSIGNED_BYTE, gltf.images[gltfTexture.src].image);
    }
}

function SetIndices(gltf, accessorIndex)
{
    let gltfAccessor = gltf.accessors[accessorIndex];

    if (gltfAccessor.glBuffer === undefined)
    {
        gltfAccessor.glBuffer = gl.createBuffer();

        let data = gltfAccessor.getTypedView();

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

        let data = gltfAccessor.getTypedView();

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

        console.log(gl.getShaderInfoLog(shader));
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
