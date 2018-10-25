class glTF
{
    constructor(file)
    {
        this.accessors = [];
        this.nodes = [];
        this.scene = undefined; // the default scene to show.
        this.scenes = [];
        this.cameras = [];
        this.textures = [];
        this.images = [];
        this.samplers = [];
        this.meshes = [];
        this.buffers = [];
        this.bufferViews = [];
        this.materials = [];
        this.defaultMaterial = -1;
        this.path = file.substr(0, file.lastIndexOf("/") + 1);
    }

    fromJsonNodes(jsonNodes)
    {
        for (let i = 0; i < jsonNodes.length; ++i)
        {
            let node = new gltfNode();
            node.fromJson(jsonNodes[i]);
            this.nodes.push(node);

            // assign the corresponding camera node
            if(node.camera !== undefined)
            {
                this.cameras[node.camera].node = i;
            }
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
            mesh.fromJson(jsonMeshes[i], this.defaultMaterial);
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
            texture.fromJson(jsonTextures[i], this.defaultSampler);
            this.textures.push(texture);
        }
    }

    fromJsonBuffers(jsonBuffers)
    {
        for (let i = 0; i < jsonBuffers.length; ++i)
        {
            let buffer = new gltfBuffer();
            buffer.fromJson(jsonBuffers[i]);
            this.buffers.push(buffer);
        }
    }

    fromJsonBufferViews(jsonBufferViews)
    {
        for (let i = 0; i < jsonBufferViews.length; ++i)
        {
            let bufferView = new gltfBufferView();
            bufferView.fromJson(jsonBufferViews[i]);
            this.bufferViews.push(bufferView);
        }
    }

    fromJsonAccessors(jsonAccessors)
    {
        for (let i = 0; i < jsonAccessors.length; ++i)
        {
            let accessor = new gltfAccessor();
            accessor.fromJson(jsonAccessors[i]);
            this.accessors.push(accessor);
        }
    }

    fromJsonScenes(jsonScenes)
    {
        for (let i = 0; i < jsonScenes.length; ++i)
        {
            let scene = new gltfScene();
            scene.fromJson(jsonScenes[i]);
            this.scenes.push(scene);
        }
    }

    fromJsonMaterials(jsonMaterials)
    {
        for (let i = 0; i < jsonMaterials.length; ++i)
        {
            let material = new gltfMaterial();
            material.fromJson(jsonMaterials[i]);
            this.materials.push(material);
        }
    }

    fromJson(json)
    {
        if(json.cameras !== undefined)
        {
            this.fromJsonCameras(json.cameras);
        }

        if(json.nodes !== undefined)
        {
            this.fromJsonNodes(json.nodes);
        }

        if (json.materials !== undefined)
        {
            this.fromJsonMaterials(json.materials);
        }

        this.materials.push(gltfMaterial.getDefaults());
        this.defaultMaterial = this.materials.length - 1;

        if (json.meshes !== undefined)
        {
            this.fromJsonMeshes(json.meshes);
        }

        if(json.samplers !== undefined)
        {
            this.fromJsonSamplers(json.samplers);
        }

        this.samplers.push(new gltfSampler());
        this.defaultSampler = this.samplers.length - 1;

        if(json.textures !== undefined)
        {
            this.fromJsonTextures(json.textures);
        }

        if(json.images !== undefined)
        {
            this.fromJsonImages(json.images);
        }

        if(json.buffers !== undefined)
        {
            this.fromJsonBuffers(json.buffers);
        }

        if(json.bufferViews !== undefined)
        {
            this.fromJsonBufferViews(json.bufferViews);
        }

        if (json.accessors !== undefined)
        {
            this.fromJsonAccessors(json.accessors);
        }

        // Load the default scene too.
        if (json.scenes !== undefined)
        {
            if (json.scene === undefined && json.scenes.length > 0)
            {
                this.scene = 0;
            }
            else
            {
                this.scene = json.scene;
            }
        }

        if (json.scenes !== undefined)
        {
            this.fromJsonScenes(json.scenes);
        }
    }
};
