
class gltfLoader
{
    static async load(gltf, webGlContext, appendix = undefined)
    {
        const buffers = gltfLoader.getBuffers(appendix);
        const additionalFiles = gltfLoader.getAdditionalFiles(appendix);

        const buffersPromise = gltfLoader.loadBuffers(gltf, buffers, additionalFiles);

        await buffersPromise; // images might be stored in the buffers
        const imagesPromise = gltfLoader.loadImages(gltf, additionalFiles);

        return await Promise.all([buffersPromise, imagesPromise])
            .then(() => gltf.initGl(webGlContext));
    }

    static unload(gltf)
    {
        for (let image of gltf.images)
        {
            image.image = undefined;
        }
        gltf.images = [];

        for (let texture of gltf.textures)
        {
            texture.destroy();
        }
        gltf.textures = [];

        for (let accessor of gltf.accessors)
        {
            accessor.destroy();
        }
        gltf.accessors = [];
    }

    static getBuffers(appendix)
    {
        return gltfLoader.getTypedAppendix(appendix, ArrayBuffer);
    }

    static getAdditionalFiles(appendix)
    {
        if(typeof(File) !== 'undefined')
        {
            return gltfLoader.getTypedAppendix(appendix, File);
        }
        else
        {
            return;
        }
    }

    static getTypedAppendix(appendix, Type)
    {
        if (appendix && appendix.length > 0)
        {
            if (appendix[0] instanceof Type)
            {
                return appendix;
            }
        }
    }

    static loadBuffers(gltf, buffers, additionalFiles)
    {
        const promises = [];

        if (buffers !== undefined && buffers[0] !== undefined) //GLB
        {
            //There is only one buffer for the glb binary data 
            //see https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#glb-file-format-specification
            if (buffers.length > 1)
            {
                console.warn("Too many buffer chunks in GLB file. Only one or zero allowed");
            }

            gltf.buffers[0].buffer = buffers[0];
            for (let i = 1; i < gltf.buffers.length; ++i)
            {
                promises.push(gltf.buffers[i].load(gltf, additionalFiles));
            }
        }
        else
        {
            for (const buffer of gltf.buffers)
            {
                promises.push(buffer.load(gltf, additionalFiles));
            }
        }
        return Promise.all(promises);
    }

    static loadImages(gltf, additionalFiles)
    {
        const imagePromises = [];
        for (let image of gltf.images)
        {
            imagePromises.push(image.load(gltf, additionalFiles));
        }
        return Promise.all(imagePromises);
    }
}

export { gltfLoader };
