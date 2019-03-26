import { mat4 } from 'gl-matrix';
import { GltfObject } from './gltf_object';

class gltfScene extends GltfObject
{
    constructor(nodes = [], name = undefined)
    {
        super();
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

    /**
     * Returns a scene by selecting all nodes where the following applies:
     * 1. The node has a mesh attached.
     * 2. All primitives have a material.
     * 3. All primitives are opaque or masked.
     *
     * @param {glTF} gltf
     */
    getSceneWithFullyOpaqueNodes(gltf)
    {
        const nodes = [];
        function addNode(nodeIndex)
        {
            const node = gltf.nodes[nodeIndex];
            const mesh = gltf.meshes[node.mesh];

            if (mesh !== undefined)
            {
                // Add node to scene if all primitives which have a material and all primitives are opaque.
                let ok = true;

                for (const primitive of mesh.primitives)
                {
                    if (primitive.skip === false)
                    {
                        const material = gltf.materials[primitive.material];

                        if(material === undefined || material.alphaMode === "BLEND")
                        {
                            ok = false;
                        }
                    }
                }

                if(ok)
                {
                    nodes.push(nodeIndex);
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

    /**
     * Returns a scene by selecting all nodes where the following applies:
     * 1. The node has a mesh attached.
     * 2. All primitives have a material.
     * 3. At least one primitive has blending alpha mode.
     *
     * @param {glTF} gltf
     */
    getSceneWithTransparentNodes(gltf)
    {
        const nodes = [];
        function addNode(nodeIndex)
        {
            const node = gltf.nodes[nodeIndex];
            const mesh = gltf.meshes[node.mesh];

            if (mesh !== undefined)
            {
                // Add node to scene if all primitives which have a material and any primitive is transparent.
                let ok = false;

                for (const primitive of mesh.primitives)
                {
                    if (primitive.skip === false)
                    {
                        const material = gltf.materials[primitive.material];

                        if(material === undefined)
                        {
                            ok = false;
                            break;
                        }

                        if(material.alphaMode === "BLEND")
                        {
                            ok = true;
                        }
                    }
                }

                if(ok)
                {
                    nodes.push(nodeIndex);
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
