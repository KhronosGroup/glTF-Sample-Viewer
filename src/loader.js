class gltfLoader
{
    static load(gltf)
    {
        let promises = [];
        for (let image of gltf.images)
        {
            image.load(gltf.path, promises, gltf.bufferViews);
        }

        for (let buffer of gltf.buffers)
        {
            buffer.load(gltf.path, promises);
        }

        Promise.all(promises).then(function (responseArray) { console.log("Resources loaded :)"); });
    }
};
