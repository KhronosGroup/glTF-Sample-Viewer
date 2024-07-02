import { mat4, vec3, quat } from 'gl-matrix';
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

    applyTransformHierarchy(state, rootTransform = mat4.create())
    {
        function applyTransform(state, node, parent, parentTransform)
        {
            if (node.parentNode === undefined) {
                node.parentNode = parent;
            }
            mat4.multiply(node.worldTransform, parentTransform, node.getLocalTransform());
            if (node.extensions?.KHR_billboard) {
                const lookAtCamera = mat4.create();

                let currentCamera = undefined;
                if (state.cameraIndex === undefined)
                {
                    currentCamera = state.userCamera;
                }
                else
                {
                    currentCamera = state.gltf.cameras[state.cameraIndex].clone();
                }
                
                const viewMatrix = currentCamera.getViewMatrix(state.gltf);

                const worldTranslation = vec3.create();
                mat4.getTranslation(worldTranslation, node.worldTransform);
        
                const modelScale = mat4.getScaling(vec3.create(), node.worldTransform);
        
                const inverseView = mat4.create();
                mat4.invert(inverseView, viewMatrix);
        
                let cameraTranslation = currentCamera.getPosition(state.gltf);
                vec3.subtract(cameraTranslation, cameraTranslation, worldTranslation);
                if (node.extensions.KHR_billboard.rotationAxis) {
                    if (node.extensions.KHR_billboard.rotationAxis === 'x') {
                        cameraTranslation[0] = 0;
                    } else if (node.extensions.KHR_billboard.rotationAxis === 'y') {
                        cameraTranslation[1] = 0;
                    } else if (node.extensions.KHR_billboard.rotationAxis === 'z') {    
                        cameraTranslation[2] = 0;
                    }
                }
                vec3.normalize(cameraTranslation, cameraTranslation);
    
                
                const cameraUp = vec3.fromValues(inverseView[4], inverseView[5], inverseView[6]);
                vec3.normalize(cameraUp, cameraUp);
                const cameraRight = vec3.fromValues(inverseView[0], inverseView[1], inverseView[2]);
                vec3.normalize(cameraRight, cameraRight);
    
                let modelForward = vec3.fromValues(0, 0, 1);
    
                let modelUp = vec3.fromValues(0, 1, 0);
                if (node.extensions.KHR_billboard.viewDirection) {
                    modelForward = vec3.fromValues(...node.extensions.KHR_billboard.viewDirection);
                }
                if (node.extensions.KHR_billboard.up) {
                    modelUp = vec3.fromValues(...node.extensions.KHR_billboard.up);
                }
                vec3.normalize(modelForward, modelForward);
                vec3.normalize(modelUp, modelUp);
    
                // Fix up vector if not orthogonal
                const modelRight = vec3.cross(vec3.create(), modelForward, modelUp);
                vec3.normalize(modelRight, modelRight);
                vec3.cross(modelUp, modelRight, modelForward);
    
    
                const targetRotation = quat.create();
                const rot1 = quat.rotationTo(quat.create(), modelForward, cameraTranslation);
    
                // Calculate up vector based on camera right vector
                const camToObj = vec3.negate(vec3.create(), cameraTranslation);
                const desiredUp = vec3.cross(vec3.create(), cameraRight, camToObj);
                vec3.normalize(desiredUp, desiredUp);
    
                const newUp = vec3.transformQuat(vec3.create(), modelUp, rot1);
    
                const rot2 = quat.rotationTo(quat.create(), newUp, desiredUp);
                quat.multiply(targetRotation, rot2, rot1);
    
                const modelMatrix = mat4.create();
        
                mat4.scale(modelMatrix, modelMatrix, modelScale);
                if (node.extensions.KHR_billboard.scaleWithDistance && state.cameraIndex === undefined) {
                    const currentCamera = state.userCamera;
                    const initialPos = vec3.transformMat4(vec3.create(), worldTranslation, currentCamera.initialViewMatrix);
                    const currentPos = vec3.transformMat4(vec3.create(), worldTranslation, viewMatrix);
                    const scaleFactor = currentPos[2] / initialPos[2];
                    mat4.scale(modelMatrix, modelMatrix, vec3.fromValues(scaleFactor,scaleFactor,scaleFactor));
                }
    
    
                mat4.fromQuat(lookAtCamera, targetRotation);
                mat4.multiply(modelMatrix, modelMatrix, lookAtCamera);
        
                modelMatrix[12] = worldTranslation[0];
                modelMatrix[13] = worldTranslation[1];
                modelMatrix[14] = worldTranslation[2];
                node.worldTransform = modelMatrix;
            }

            mat4.invert(node.inverseWorldTransform, node.worldTransform);
            mat4.transpose(node.normalMatrix, node.inverseWorldTransform);

            for (const child of node.children)
            {
                applyTransform(state, state.gltf.nodes[child], node, node.worldTransform);
            }
        }

        for (const node of this.nodes)
        {
            applyTransform(state, state.gltf.nodes[node], undefined, rootTransform);
        }
    }

    gatherNodeIDs(gltf)
    {
        const nodeIDs = [];

        function gatherNode(nodeIndex)
        {
            nodeIDs.push(nodeIndex);

            const node = gltf.nodes[nodeIndex];
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

        return nodeIDs;
    }

    gatherNodes(gltf)
    {
        const nodeIDs = this.gatherNodeIDs(gltf);
        const nodes = [];

        for (const nodeIndex of nodeIDs)
        {  
            const node = gltf.nodes[nodeIndex];
            nodes.push(node); 
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
