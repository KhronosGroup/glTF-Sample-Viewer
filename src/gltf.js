class glTF
{
    constructor() {
        this.nodes = [];
        this.scenes = [];
        this.textures = [];
        this.samplers = [];
        this.meshes = [];
    }

    addNode(node)
    {
        this.nodes.push(node);
    }

    addScene(scene)
    {
        this.scenes.push(scene);
    }

    addCamera(camera)
    {
        this.cameras.push(camera);
    }

    fromJsonNodes(jsonNodes)
    {
        for (let i in jsonNodes)
        {
            let node = new Node();
            node.fromJson(jsonNodes[i]);
            this.addNode(node);
        }
    }

    fromJson(json)
    {
        this.fromJsonNodes(json.nodes);
    }

    // addPointLight, addTexture, addSampler, addMesh
};
