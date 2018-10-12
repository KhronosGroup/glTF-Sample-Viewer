
//https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Constants
function SetSampler(gl, gltfSamplerObj, type = 0x0DE1) // TEXTURE_2D
{
    gl.texParameteri(type, gl.TEXTURE_WRAP_S, gltfSamplerObj.wrapS);
    gl.texParameteri(type, gl.TEXTURE_WRAP_T, gltfSamplerObj.warpT);
    gl.texParameteri(type, gl.TEXTURE_MIN_FILTER, gltfSamplerObj.minFilter);
    gl.texParameteri(type, gl.TEXTURE_MAG_FILTER, gltfSamplerObj.magFilter);
}

function SetTexture(gl, gltf, textureIndex, colorSpace)
{
    let gltfTexture = gltf.textures[textureIndex];

    if(gltfTexture.texture === undefined)
    {
        gltfTexture.texture = gl.createTexture();
    }

    gl.activateTexture(gl.TEXTURE0 + gltfTexture.sampler);
    gl.bindTexture(gl.TEXTURE_2D, gltfTexture.texture);

    SetSampler(gl, gltf.samplers[gltfTexture.sampler]);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

    gl.texImage2D(gl.TEXTURE_2D, 0, colorSpace, colorSpace, gl.UNSIGNED_BYTE, gltf.images[gltfTexture.src].image);
}

function BindTexture(gl, gltf, textureIndex)
{
    let gltfTexture = gltf.textures[textureIndex];

    gl.activateTexture(gl.TEXTURE0 + gltfTexture.sampler);
    gl.bindTexture(gl.TEXTURE_2D, gltfTexture.texture);
}

function CompileShader(gl, isVert, shaderSource)
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

function LinkProgram(gl, vertex, fragment)
{
    let program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);

    return program;
}
