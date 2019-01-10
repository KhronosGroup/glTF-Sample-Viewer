class gltfLoader
{
    static load(gltf, appendix = undefined)
    {
        let buffers;
        let additionalFiles;
        if (appendix && appendix.length > 0)
        {
            if (appendix[0] instanceof ArrayBuffer)
            {
                buffers = appendix;
            }
            else if (appendix[0] instanceof File)
            {
                additionalFiles = appendix;
            }
        }

        let promises = [];

        if (buffers)
        {
            const count = Math.min(buffers.length, gltf.buffers.length);
            for (let i = 0; i < count; ++i)
            {
                gltf.buffers[i].buffer = buffers[i];
            }
        }
        else
        {
            for (const buffer of gltf.buffers)
            {
                promises.push(buffer.load(gltf, additionalFiles));
            }
        }

        for (let image of gltf.images)
        {
            promises.push(image.load(gltf, additionalFiles));
        }

        return promises;
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
}

export { gltfLoader };
