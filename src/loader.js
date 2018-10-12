class gltfLoader
{
    load(gltf)
    {
        let promises = [];
        for (let image of gltf.images)
        {
            image.load(promises, gltf.bufferViews);
        }

        for (let buffer of gltf.buffers)
        {
            buffer.load(promises);
        }

        Promise.all(promises).then(function (responseArray) {
        });
    }
};
