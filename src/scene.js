import { mat4, vec3 } from 'gl-matrix';
import { jsToGl } from './utils.js';

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

    sortSceneByDepth(gltf, viewProjectionMatrix)
    {
        // vector of {abs position, nodeIndex}
        const posNodes = [];

        function addPosNode(nodeIndex)
        {
            const node = gltf.nodes[nodeIndex];

            const modelView = mat4.create();
            mat4.multiply(modelView, viewProjectionMatrix, node.worldTransform);

            const pos = vec3.create();
            mat4.getTranslation(pos, modelView);

            // TODO: we could clip objects behind the camera
            posNodes.push({ depth: pos[2], idx: nodeIndex });

            // recurse into children
            for(const c of node.children)
            {
                addPosNode(gltf.nodes[c]);
            }
        }

        for (const n of this.nodes)
        {
            addPosNode(n);
        }

        // high z far from camera first
        posNodes.sort((a, b) => b.depth - a.depth);

        this.nodes = [];
        for(const node of posNodes)
        {
            this.nodes.push(node.idx)
        }
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
