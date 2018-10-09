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
    }

    // addPointLight, addTexture, addSampler, addMesh
};
