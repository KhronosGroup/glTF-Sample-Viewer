import { mat4 } from 'gl-matrix';
import { GltfObject } from './gltf_object';

class gltfScene extends GltfObject
{
    constructor(nodes = [], name = undefined)
    {
        super();
        this.nodes = nodes;
        this.name = name;

        // non gltf
        this.imageBasedLight = undefined;
    }

    initGl(gltf, webGlContext)
    {
        super.initGl(gltf, webGlContext);

        if (this.extensions !== undefined &&
            this.extensions.KHR_lights_image_based !== undefined)
        {
            const index = this.extensions.KHR_lights_image_based.imageBasedLight;
            this.imageBasedLight = gltf.imageBasedLights[index];
        }
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
