class glTF
{
    constructor() {
        this.nodes = [];
        this.scenes = [];
        this.cameras = [];
        this.textures = [];
        this.images = [];
        this.samplers = [];
        this.meshes = [];
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
