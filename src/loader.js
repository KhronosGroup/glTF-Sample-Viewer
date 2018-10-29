class gltfLoader
{
    static load(gltf)
    {
        let promises = [];

        for (let image of gltf.images)
        {
            image.load(promises, gltf.bufferViews);
        }

        for (let buffer of gltf.buffers)
        {
            buffer.load(gltf.path, promises);
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
