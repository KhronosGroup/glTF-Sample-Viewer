import { ShaderCache } from './Renderer/shader_cache.js';


import iblFiltering from './shaders/ibl_filtering.frag';
import panoramaToCubeMap from './shaders/panorama_to_cubemap.frag';
import debugOutput from './shaders/debug.frag';
import fullscreenShader from './shaders/fullscreen.vert';


// How to use:
// set canvas/context in constructor
// init(input: panorama image)
// filterAll()
// fetch texture IDs

class iblSampler
{
    constructor(view)
    {

        this.gl = view.context;

        this.textureSize = 256;
        this.ggxSampleCount = 1024;
        this.lambertianSampleCount = 2048;
        this.sheenSamplCount = 64;
        this.lodBias = 0.0;
        this.lowestMipLevel = 4;
        this.lutResolution = 1024;

        this.mipmapCount = undefined;

        this.lambertianTextureID = undefined;
        this.ggxTextureID = undefined;
        this.sheenTextureID = undefined;

        this.ggxLutTextureID = undefined;
        this.charlieLutTextureID = undefined;

        this.inputTextureID = undefined;
        this.cubemapTextureID = undefined;
        this.framebuffer = undefined;

        const shaderSources = new Map();

        shaderSources.set("fullscreen.vert", fullscreenShader);
        shaderSources.set("panorama_to_cubemap.frag", panoramaToCubeMap);
        shaderSources.set("ibl_filtering.frag", iblFiltering);
        shaderSources.set("debug.frag", debugOutput);

        this.shaderCache = new ShaderCache(shaderSources, view.renderer.webGl);


    }

    /////////////////////////////////////////////////////////////////////


    loadTextureHDR(image)
    {

        var texture = this.gl.createTexture();

        this.gl.bindTexture( this.gl.TEXTURE_2D,  texture);

        var internalFormat = this.gl.RGB32F;
        var format = this.gl.RGB;
        var type = this.gl.FLOAT;
        var data = undefined;

        if (image.dataFloat instanceof Float32Array && typeof(this.gl.RGB32F) !== 'undefined')
        {
            internalFormat = this.gl.RGB32F;
            format = this.gl.RGB;
            type = this.gl.FLOAT;
            data = image.dataFloat;
        }
        else if(image.dataFloat instanceof Float32Array)
        {
            // workaround for node-gles not supporting RGB32F
            internalFormat = this.gl.RGBA32F;
            format = this.gl.RGBA;
            type = this.gl.FLOAT;

            const numPixels = image.dataFloat.length / 3;
            data = new Float32Array(numPixels * 4);
            for(let i = 0, src = 0, dst = 0; i < numPixels; ++i, src += 3, dst += 4)
            {
                // copy the pixels and pad the alpha channel
                data[dst] = image.dataFloat[src];
                data[dst+1] = image.dataFloat[src+1];
                data[dst+2] = image.dataFloat[src+2];
                data[dst+3] = 0;
            }
        }
        else if (typeof(Image) !== 'undefined' && image instanceof Image)
        {
            internalFormat = this.gl.RGBA;
            format = this.gl.RGBA;
            type = this.gl.UNSIGNED_BYTE;
            data = image;
        }
        else
        {
            console.error("loadTextureHDR failed, unsupported HDR image");
            return;
        }


        this.gl.texImage2D(
            this.gl.TEXTURE_2D,
            0, //level
            internalFormat,
            image.width,
            image.height,
            0, //border
            format,
            type,
            data);

        this.gl.texParameteri( this.gl.TEXTURE_2D,  this.gl.TEXTURE_WRAP_S,  this.gl.MIRRORED_REPEAT);
        this.gl.texParameteri( this.gl.TEXTURE_2D,  this.gl.TEXTURE_WRAP_T,  this.gl.MIRRORED_REPEAT);
        this.gl.texParameteri( this.gl.TEXTURE_2D,  this.gl.TEXTURE_MIN_FILTER,  this.gl.LINEAR);
        this.gl.texParameteri( this.gl.TEXTURE_2D,  this.gl.TEXTURE_MAG_FILTER,  this.gl.LINEAR);

        return texture;
    }



    createCubemapTexture(withMipmaps)
    {
        var targetTexture =  this.gl.createTexture();
        this.gl.bindTexture( this.gl.TEXTURE_CUBE_MAP, targetTexture);


        // define size and format of level 0
        const level = 0;
        const internalFormat = this.use8bit ? this.gl.RGBA8 : this.gl.RGBA32F;
        const border = 0;
        const format = this.gl.RGBA;
        const type = this.use8bit ? this.gl.UNSIGNED_BYTE : this.gl.FLOAT;
        const data = null;

        for(var i = 0; i < 6; ++i)
        {
            this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, level, internalFormat,
                this.textureSize, this.textureSize, border,
                format, type, data);

        }

        if(withMipmaps)
        {
            this.gl.texParameteri( this.gl.TEXTURE_CUBE_MAP,  this.gl.TEXTURE_MIN_FILTER,  this.gl.LINEAR_MIPMAP_LINEAR);
        }
        else
        {
            this.gl.texParameteri( this.gl.TEXTURE_CUBE_MAP,  this.gl.TEXTURE_MIN_FILTER,  this.gl.LINEAR);
        }

        this.gl.texParameteri( this.gl.TEXTURE_CUBE_MAP,  this.gl.TEXTURE_MAG_FILTER,  this.gl.LINEAR);
        this.gl.texParameteri( this.gl.TEXTURE_CUBE_MAP,  this.gl.TEXTURE_WRAP_S,  this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri( this.gl.TEXTURE_CUBE_MAP,  this.gl.TEXTURE_WRAP_T,  this.gl.CLAMP_TO_EDGE);

        return targetTexture;
    }

    createLutTexture()
    {
        const targetTexture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, targetTexture);

        // define size and format of level 0
        const level = 0;
        const internalFormat = this.use8bit ? this.gl.RGBA8 : this.gl.RGBA32F;
        const border = 0;
        const format = this.gl.RGBA;
        const type = this.use8bit ? this.gl.UNSIGNED_BYTE : this.gl.FLOAT;
        const data = null;

        this.gl.texImage2D(this.gl.TEXTURE_2D, level, internalFormat,
            this.lutResolution, this.lutResolution, border,
            format, type, data);

        this.gl.texParameteri( this.gl.TEXTURE_2D,  this.gl.TEXTURE_MIN_FILTER,  this.gl.LINEAR);
        this.gl.texParameteri( this.gl.TEXTURE_2D,  this.gl.TEXTURE_MAG_FILTER,  this.gl.LINEAR);
        this.gl.texParameteri( this.gl.TEXTURE_2D,  this.gl.TEXTURE_WRAP_S,  this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri( this.gl.TEXTURE_2D,  this.gl.TEXTURE_WRAP_T,  this.gl.CLAMP_TO_EDGE);

        return targetTexture;
    }

    init(panoramaImage)
    {
        if (!this.gl.getExtension('EXT_color_buffer_float'))
        {
            this.use8bit = true;
        }

        this.inputTextureID = this.loadTextureHDR(panoramaImage);

        this.cubemapTextureID = this.createCubemapTexture(true);

        this.framebuffer = this.gl.createFramebuffer();

        this.lambertianTextureID = this.createCubemapTexture(false);
        this.ggxTextureID = this.createCubemapTexture(true);
        this.sheenTextureID = this.createCubemapTexture(true);


        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.ggxTextureID);
        this.gl.generateMipmap(this.gl.TEXTURE_CUBE_MAP);

        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.sheenTextureID);
        this.gl.generateMipmap(this.gl.TEXTURE_CUBE_MAP);

        this.mipmapLevels = Math.floor(Math.log2(this.textureSize))+1 - this.lowestMipLevel;
    }

    filterAll()
    {
        this.panoramaToCubeMap();
        this.cubeMapToLambertian();
        this.cubeMapToGGX();
        this.cubeMapToSheen();

        this.sampleGGXLut();
        this.sampleCharlieLut();

        this.gl.bindFramebuffer(  this.gl.FRAMEBUFFER, null);
    }

    panoramaToCubeMap()
    {
        for(var i = 0; i < 6; ++i)
        {
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
            var side = i;
            this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_CUBE_MAP_POSITIVE_X+side, this.cubemapTextureID, 0);

            this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.cubemapTextureID);

            this.gl.viewport(0, 0,  this.textureSize,  this.textureSize);

            this.gl.clearColor(1.0, 0.0, 0.0, 0.0);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT| this.gl.DEPTH_BUFFER_BIT);

            const vertexHash = this.shaderCache.selectShader("fullscreen.vert", []);
            const fragmentHash = this.shaderCache.selectShader("panorama_to_cubemap.frag", []);

            var shader = this.shaderCache.getShaderProgram(fragmentHash, vertexHash);
            this.gl.useProgram(shader.program);

            //  TEXTURE0 = active.
            this.gl.activeTexture(this.gl.TEXTURE0+0);

            // Bind texture ID to active texture
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.inputTextureID);

            // map shader uniform to texture unit (TEXTURE0)
            const location = this.gl.getUniformLocation(shader.program,"u_panorama");
            this.gl.uniform1i(location, 0); // texture unit 0 (TEXTURE0)

            shader.updateUniform("u_currentFace", i);

            //fullscreen triangle
            this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
        }

        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.cubemapTextureID);
        this.gl.generateMipmap(this.gl.TEXTURE_CUBE_MAP);

    }


    applyFilter(
        distribution,
        roughness,
        targetMipLevel,
        targetTexture,
        sampleCount,
        lodBias = 0.0)
    {
        var currentTextureSize =  this.textureSize>>(targetMipLevel);

        for(var i = 0; i < 6; ++i)
        {

            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
            var side = i;
            this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_CUBE_MAP_POSITIVE_X+side, targetTexture, targetMipLevel);

            this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, targetTexture);

            this.gl.viewport(0, 0, currentTextureSize, currentTextureSize);

            this.gl.clearColor(1.0, 0.0, 0.0, 0.0);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT| this.gl.DEPTH_BUFFER_BIT);


            const vertexHash = this.shaderCache.selectShader("fullscreen.vert", []);
            const fragmentHash = this.shaderCache.selectShader("ibl_filtering.frag", []);

            var shader = this.shaderCache.getShaderProgram(fragmentHash, vertexHash);
            this.gl.useProgram(shader.program);


            //  TEXTURE0 = active.
            this.gl.activeTexture(this.gl.TEXTURE0+0);

            // Bind texture ID to active texture
            this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.cubemapTextureID);

            // map shader uniform to texture unit (TEXTURE0)
            const location = this.gl.getUniformLocation(shader.program,"u_cubemapTexture");
            this.gl.uniform1i(location, 0); // texture unit 0


            shader.updateUniform("u_roughness", roughness);
            shader.updateUniform("u_sampleCount", sampleCount);
            shader.updateUniform("u_width", this.textureSize);
            shader.updateUniform("u_lodBias", lodBias);
            shader.updateUniform("u_distribution", distribution);
            shader.updateUniform("u_currentFace", i);
            shader.updateUniform("u_isGeneratingLUT", 0);


            //fullscreen triangle
            this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);

        }

    }

    cubeMapToLambertian()
    {
        this.applyFilter(
            0,
            0.0,
            0,
            this.lambertianTextureID,
            this.lambertianSampleCount);
    }


    cubeMapToGGX()
    {
        for(var currentMipLevel = 0; currentMipLevel <= this.mipmapLevels; ++currentMipLevel)
        {
            const roughness =  (currentMipLevel) /  (this.mipmapLevels - 1);
            this.applyFilter(
                1,
                roughness,
                currentMipLevel,
                this.ggxTextureID,
                this.ggxSampleCount);
        }
    }

    cubeMapToSheen()
    {
        for(var currentMipLevel = 0; currentMipLevel <= this.mipmapLevels; ++currentMipLevel)
        {
            const roughness =  (currentMipLevel) /  (this.mipmapLevels - 1);
            this.applyFilter(
                2,
                roughness,
                currentMipLevel,
                this.sheenTextureID,
                this.sheenSamplCount);
        }
    }

    sampleLut(distribution, targetTexture, currentTextureSize)
    {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, targetTexture, 0);

        this.gl.bindTexture(this.gl.TEXTURE_2D, targetTexture);

        this.gl.viewport(0, 0, currentTextureSize, currentTextureSize);

        this.gl.clearColor(1.0, 0.0, 0.0, 0.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT| this.gl.DEPTH_BUFFER_BIT);


        const vertexHash = this.shaderCache.selectShader("fullscreen.vert", []);
        const fragmentHash = this.shaderCache.selectShader("ibl_filtering.frag", []);

        var shader = this.shaderCache.getShaderProgram(fragmentHash, vertexHash);
        this.gl.useProgram(shader.program);


        //  TEXTURE0 = active.
        this.gl.activeTexture(this.gl.TEXTURE0+0);

        // Bind texture ID to active texture
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.cubemapTextureID);

        // map shader uniform to texture unit (TEXTURE0)
        const location = this.gl.getUniformLocation(shader.program,"u_cubemapTexture");
        this.gl.uniform1i(location, 0); // texture unit 0


        shader.updateUniform("u_roughness", 0.0);
        shader.updateUniform("u_sampleCount", 512);
        shader.updateUniform("u_width", 0.0);
        shader.updateUniform("u_lodBias", 0.0);
        shader.updateUniform("u_distribution", distribution);
        shader.updateUniform("u_currentFace", 0);
        shader.updateUniform("u_isGeneratingLUT", 1);

        //fullscreen triangle
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
    }

    sampleGGXLut()
    {
        this.ggxLutTextureID = this.createLutTexture();
        this.sampleLut(1, this.ggxLutTextureID, this.lutResolution);
    }

    sampleCharlieLut()
    {
        this.charlieLutTextureID = this.createLutTexture();
        this.sampleLut(2, this.charlieLutTextureID, this.lutResolution);
    }

    destroy()
    {
        this.shaderCache.destroy();
    }
}

export { iblSampler };
