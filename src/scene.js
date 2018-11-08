class gltfScene
{
    constructor(nodes = [], name = undefined)
    {
        this.nodes = nodes;
        this.name = name;
    }

    fromJson(jsonScene)
    {
        if (jsonScene.nodes !== undefined)
        {
            this.nodes = jsonScene.nodes;
        }

        this.name = jsonScene.name;
    }

    // can only be called after gltf as been fully parsed and constructed
    getSceneWithAlphaMode(gltf, mode = 'OPAQUE', not = false)
    {
        let Nodes = [];
        function AddNode (node)
        {
            let mesh = gltf.meshes[node.mesh];
            for (let primitive of mesh.primitives)
            {
                if (primitive.skip === false)
                {
                    const material = gltf.materials[primitive.material];
                    if (material !== undefined && (not ? material.alphaMode !== mode : material.alphaMode === mode))
                    {
                        Nodes.push(n);
                    }
                }
            }

            // recurse into children
            for(let c of node.children)
            {
                AddNode(gltf.nodes[c]);
            }
        }

        for (let n of this.nodes)
        {
            AddNode(gltf.nodes[n])
        }

        return new gltfScene(Nodes, this.name);
    }

    sortSceneByDepth(gltf, cameraPos, rootTransform)
    {
        // vector of {abs position, nodeIndex}
        let posNodes = [];

        function AddPosNode (nodeIndex, parentTransform)
        {
            let node = gltf.nodes[nodeIndex];

            let transform = node.getTransform(); // local transform
            mat4.multiply(transform, parentTransform, transform);

            let pos = jsToGl([0, 0, 0]); // world pos
            mat4.getTranslation(pos, transform);

            // TODO: we could clip objects behind the camera
            posNodes.push({depth: (pos.z - cameraPos.z), idx: nodeIndex});

            // recurse into children
            for(let c of node.children)
            {
                AddNode(gltf.nodes[c], transform);
            }
        }

        for (let n of this.nodes)
        {
            AddPosNode(n, rootTransform);
        }

        // high z far from camera first
        posNodes.sort(function(a,b) {return b.depth - a.depth});

        this.nodes.clear();
        for(let node of posNodes)
        {
            this.nodes.push(node.idx)
        }
    }
};
