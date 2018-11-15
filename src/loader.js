class gltfLoader
{
    static load(gltf, buffers = undefined)
    {
        let promises = [];

        for (let image of gltf.images)
        {
            image.load(promises, gltf);
        }

        if(buffers) // copy buffers from glb
        {
            const count = Math.min(buffers.length, gltf.buffers.length);
            for(let i = 0; i < count; ++i)
            {
                gltf.buffers[i].buffer = buffers[i];
            }
        }
        else
        {
            for (let buffer of gltf.buffers)
            {
                buffer.load(gltf.path, promises);
            }
        }

        return promises;
    }

    static unload(gltf)
    {
        for (let image of gltf.images)
        {
            image.image = undefined;
        }

        for (let texture of gltf.textures)
        {
            texture.destroy();
        }

        for (let accessor of gltf.accessors)
        {
            accessor.destroy();
        }
    }
};
