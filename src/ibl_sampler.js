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

        this.currentWidth = view.canvas.width;
        this.currentHeight = view.canvas.height;

        this.textureSize = 1024;
        this.sampleCount = 1024;
        this.lodBias = 0.0;
        this.mipmapCount = undefined;


        this.lambertianTextureID = undefined;
        this.ggxTextureID = undefined;
        this.sheenTextureID = undefined;


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

        this.gl.bindTexture( this.gl.TEXTURE_2D, texture); // as this function is asynchronus, another texture could be set in between


        var internalFormat = this.gl.RGB32F;
        var format = this.gl.RGB;
        var type = this.gl.FLOAT;
        var data = undefined;

        if (image.dataFloat instanceof Float32Array)
        {
            internalFormat = this.gl.RGB32F;
            format = this.gl.RGB;
            type = this.gl.FLOAT;
            data = image.dataFloat;
        }

        if (image instanceof Image)
        {
            internalFormat = this.gl.RGBA;
            format = this.gl.RGBA;
            type = this.gl.UNSIGNED_BYTE;
            data = image;
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
        this.gl.texParameteri( this.gl.TEXTURE_CUBE_MAP,  this.gl.TEXTURE_WRAP_R,  this.gl.CLAMP_TO_EDGE);


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

        this.mipmapLevels = Math.floor(Math.log2(this.textureSize))+1;
    }

    filterAll()
    {
        this.panoramaToCubeMap();
        this.cubeMapToLambertian();
        this.cubeMapToGGX();
        this.cubeMapToSheen();

        this.gl.bindFramebuffer(  this.gl.FRAMEBUFFER, null);
        this.gl.viewport(0, 0, this.currentWidth, this.currentHeight);//ToDo
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
        targetTexture)
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
            shader.updateUniform("u_sampleCount", this.sampleCount);
            shader.updateUniform("u_currentMipLevel", targetMipLevel);
            shader.updateUniform("u_width", this.textureSize);
            shader.updateUniform("u_lodBias", this.lodBias);
            shader.updateUniform("u_distribution", distribution);
            shader.updateUniform("u_currentFace", i);


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
            this.lambertianTextureID);
    }


    cubeMapToGGX()
    {
        for(var currentMipLevel = 0; currentMipLevel < this.mipmapLevels; ++currentMipLevel)
        {
            const roughness =  (currentMipLevel) /  (this.mipmapLevels - 1);
            this.applyFilter(
                1,
                roughness,
                currentMipLevel,
                this.ggxTextureID);
        }
    }

    cubeMapToSheen()
    {
        for(var currentMipLevel = 0; currentMipLevel < this.mipmapLevels; ++currentMipLevel)
        {
            const roughness =  (currentMipLevel) /  (this.mipmapLevels - 1);
            this.applyFilter(
                2,
                roughness,
                currentMipLevel,
                this.sheenTextureID);
        }
    }


    destroy()
    {
        this.shaderCache.destroy();
    }
}

export { iblSampler };
