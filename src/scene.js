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

    applyTransformHierarchy(gltf, rootTransform = mat4.create())
    {
        function applyTransform(gltf, node, parentTransform)
        {
            mat4.multiply(node.worldTransform, parentTransform, node.getTransform());
            mat4.invert(node.inverseWorldTransform, node.worldTransform);
            mat4.transpose(node.normalMatrix, node.inverseWorldTransform);

            for (let c of node.children)
            {
                applyTransform(gltf, gltf.nodes[c], node.worldTransform);
            }
        }

        for (let n of this.nodes)
        {
            applyTransform(gltf, gltf.nodes[n], rootTransform);
        }
    }

    // can only be called after gltf as been fully parsed and constructed
    getSceneWithAlphaMode(gltf, mode = 'OPAQUE', not = false)
    {
        let Nodes = [];
        function AddNode (nodeIndex)
        {
            let node = gltf.nodes[nodeIndex];
            let mesh = gltf.meshes[node.mesh];

            if (mesh !== undefined)
            {
                for (let primitive of mesh.primitives)
                {
                    if (primitive.skip === false)
                    {
                        const material = gltf.materials[primitive.material];
                        if (material !== undefined && (not ? material.alphaMode !== mode : material.alphaMode === mode))
                        {
                            Nodes.push(nodeIndex);
                        }
                    }
                }
            }

            // recurse into children
            for(let c of node.children)
            {
                AddNode(c);
            }
        }

        for (let n of this.nodes)
        {
            AddNode(n)
        }

        return new gltfScene(Nodes, this.name);
    }

    sortSceneByDepth(gltf, viewProjMatrix, rootTransform)
    {
        // vector of {abs position, nodeIndex}
        let posNodes = [];

        function AddPosNode (nodeIndex, parentTransform)
        {
            let node = gltf.nodes[nodeIndex];

            let transform = node.getTransform(); // local transform
            mat4.multiply(transform, parentTransform, transform);
            mat4.multiply(transform, viewProjMatrix, transform);

            let pos = jsToGl([0, 0, 0]); // world pos
            mat4.getTranslation(pos, transform);

            // TODO: we could clip objects behind the camera
            posNodes.push({depth: pos[2], idx: nodeIndex});

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
        posNodes.sort(function(a,b) {return a.depth - b.depth});

        this.nodes = [];
        for(let node of posNodes)
        {
            this.nodes.push(node.idx)
        }
    }
};
