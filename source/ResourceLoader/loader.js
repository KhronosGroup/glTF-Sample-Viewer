
class gltfLoader
{
    static async load(gltf, webGlContext, uri, appendix = undefined)
    {
        const buffers = gltfLoader.getBuffers(appendix);
        const additionalFiles = gltfLoader.getAdditionalFiles(appendix);

        const buffersPromise = gltfLoader.loadBuffers(gltf, buffers, additionalFiles, uri);

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
        const bufferAppendix = appendix.filter( (res) => res.hasOwnProperty("uri"));
        return bufferAppendix
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
            //  if (appendix[0] instanceof Type || appendix[0][1] instanceof Type)
            const typedAppendix = appendix.filter( (res) => res instanceof Type);
            return typedAppendix

        }
        return undefined
    }

    static loadBuffers(gltf, buffers, additionalFiles)
    {
        const promises = []; 

        if (buffers !== undefined && buffers[0] !== undefined) //GLB
        {
            //There is only one buffer for the glb binary data 
            //see https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#glb-file-format-specification
         
            for (let i = 0; i < gltf.buffers.length; ++i)
            {   
                let glb_uri = "undefined"
                if(gltf.buffers[i].hasOwnProperty("extras") && 
                    gltf.buffers[i]["extras"] !== undefined && 
                    gltf.buffers[i]["extras"].hasOwnProperty("glb"))
                {
                    glb_uri = gltf.buffers[i]["extras"]["glb"]
                }

                const glb_buffer = buffers.filter( (res) => res.hasOwnProperty("uri") && res["uri"]===glb_uri);

                if(glb_buffer.length > 0)
                {
                    // set glb directly to gltf buffer.buffer instead of loading from file
                    gltf.buffers[i].buffer = glb_buffer[0].data;
                }
                else
                {
                    promises.push(gltf.buffers[i].load(gltf, additionalFiles));
                }
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
