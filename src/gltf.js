class glTF
{
    constructor(file) {
        this.nodes = [];
        this.scenes = [];
        this.cameras = [];
        this.textures = [];
        this.images = [];
        this.samplers = [];
        this.meshes = [];
        this.path = file.substr(0, file.lastIndexOf("/"));
    }

    fromJsonNodes(jsonNodes)
    {
        for (let i = 0; i < jsonNodes.length; ++i)
        {
            let node = new gltfNode();
            node.fromJson(jsonNodes[i]);
            this.nodes.push(node);
        }
    }

    fromJsonCameras(jsonCameras)
    {
        for (let i = 0; i < jsonCameras.length; ++i)
        {
            let camera = new gltfCamera();
            camera.fromJson(jsonCameras[i]);
            this.cameras.push(camera);
        }
    }

    fromJsonMeshes(jsonMeshes)
    {
        for (let i = 0; i < jsonMeshes.length; ++i)
        {
            let mesh = new gltfMesh();
            mesh.fromJson(jsonMeshes[i]);
            this.meshes.push(mesh);
        }
    }

    fromJsonSamplers(jsonSamplers)
    {
        for (let i = 0; i < jsonSamplers.length; ++i)
        {
            let sampler = new gltfSampler();
            sampler.fromJson(jsonSamplers[i]);
            this.samplers.push(sampler);
        }
    }

    fromJsonImages(jsonImages)
    {
        for (let i = 0; i < jsonImages.length; ++i)
        {
            let image = new gltfImage();
            image.fromJson(jsonImages[i]);
            this.images.push(image);
        }
    }

    fromJsonTextures(jsonTextures)
    {
        for (let i = 0; i < jsonTextures.length; ++i)
        {
            let texture = new gltfTexture();
            texture.fromJson(jsonTextures[i]);
            this.textures.push(texture);
        }
    }

    fromJson(json)
    {
        if(json.nodes !== undefined)
        {
            this.fromJsonNodes(json.nodes);
        }

        if(json.cameras !== undefined)
        {
            this.fromJsonCameras(json.cameras);
        }

        if (json.meshes !== undefined)
        {
            this.fromJsonMeshes(json.meshes);
        }

        if(json.samplers !== undefined)
        {
            this.fromJsonSamplers(json.samplers);
        }

        if(json.textures !== undefined)
        {
            this.fromJsonTextures(json.textures);
        }

        if(json.images !== undefined)
        {
            this.fromJsonImages(json.images);
        }
    }

    // addPointLight, addTexture, addSampler, addMesh
};
