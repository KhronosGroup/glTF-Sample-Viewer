class glTF
{
    constructor() {
        this.nodes = [];
        this.scenes = [];
        this.cameras = [];
        this.textures = [];
        this.samplers = [];
        this.meshes = [];
    }

    fromJsonNodes(jsonNodes)
    {
        for (let i in jsonNodes)
        {
            let node = new gltfNode();
            node.fromJson(jsonNodes[i]);
            this.nodes.push(node);
        }
    }

    fromJsonCameras(jsonCameras)
    {
        for (let i in jsonCameras)
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
    }

    // addPointLight, addTexture, addSampler, addMesh
};
