import { mat4, vec3 } from 'gl-matrix';

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
            mat4.multiply(node.worldTransform, parentTransform, node.getLocalTransform());
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
        function AddNode(nodeIndex)
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

    gatherNodes(gltf)
    {
        const nodes = [];

        function gatherNode(nodeIndex)
        {
            const node = gltf.nodes[nodeIndex];
            nodes.push(node);

            // recurse into children
            for(const child of node.children)
            {
                gatherNode(child);
            }
        }

        for (const node of this.nodes)
        {
            gatherNode(node);
        }

        return nodes;
    }

    includesNode(gltf, nodeIndex)
    {
        let children = [...this.nodes];
        while(children.length > 0)
        {
            const childIndex = children.pop();

            if (childIndex === nodeIndex)
            {
                return true;
            }

            children = children.concat(gltf.nodes[childIndex].children);
        }

        return false;
    }
};

export { gltfScene };
