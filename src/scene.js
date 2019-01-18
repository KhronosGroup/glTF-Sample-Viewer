import { mat4 } from 'gl-matrix';
import { initGlForMembers } from './utils';

class gltfScene
{
    constructor(nodes = [], name = undefined)
    {
        this.nodes = nodes;
        this.name = name;
    }

    initGl(gltf)
    {
        initGlForMembers(this, gltf);
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

            for (const child of node.children)
            {
                applyTransform(gltf, gltf.nodes[child], node.worldTransform);
            }
        }

        for (const node of this.nodes)
        {
            applyTransform(gltf, gltf.nodes[node], rootTransform);
        }
    }

    // can only be called after gltf as been fully parsed and constructed
    getSceneWithAlphaMode(gltf, mode = 'OPAQUE', not = false)
    {
        const nodes = [];
        function addNode(nodeIndex)
        {
            const node = gltf.nodes[nodeIndex];
            const mesh = gltf.meshes[node.mesh];

            if (mesh !== undefined)
            {
                for (const primitive of mesh.primitives)
                {
                    if (primitive.skip === false)
                    {
                        const material = gltf.materials[primitive.material];
                        if (material !== undefined && (not ? material.alphaMode !== mode : material.alphaMode === mode))
                        {
                            nodes.push(nodeIndex);
                        }
                    }
                }
            }

            // recurse into children
            for(const child of node.children)
            {
                addNode(child);
            }
        }

        for (const node of this.nodes)
        {
            addNode(node);
        }

        return new gltfScene(nodes, this.name);
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
}

export { gltfScene };
