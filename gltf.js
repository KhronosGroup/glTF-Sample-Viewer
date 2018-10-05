class glTF
{
    // constructor(nodes, scenes, textures, samplers, meshes) {
    //     this.nodes = nodes;
    //     this.scenes = scenes;
    //     this.textures = textures;
    //     this.samplers = samplers;
    //     this.meshes = meshes;
    // }

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

    // addPointLight, addTexture, addSampler, addMesh
};
