import { jsToGlSlice } from './utils.js';
import { GltfObject } from './gltf_object.js';
import { mat4 } from 'gl-matrix';

class gltfSkin extends GltfObject
{
    constructor()
    {
        super();

        this.name = "";
        this.inverseBindMatrices = undefined;
        this.joints = [];
        this.skeleton = undefined;

        // not gltf
        this.jointMatrices = [];
        this.jointNormalMatrices = [];
    }

    computeJoints(gltf, parentNode)
    {
        const ibmAccessor = gltf.accessors[this.inverseBindMatrices].getDeinterlacedView(gltf);
        this.jointMatrices = [];
        this.jointNormalMatrices = [];

        let i = 0;
        for(const joint of this.joints)
        {
            const node = gltf.nodes[joint];

            let jointMatrix = mat4.create();
            let ibm = jsToGlSlice(ibmAccessor, i++ * 16, 16);
            mat4.mul(jointMatrix, node.worldTransform, ibm);
            mat4.mul(jointMatrix, parentNode.inverseWorldTransform, jointMatrix);
            this.jointMatrices.push(jointMatrix);

            let normalMatrix = mat4.create();
            mat4.invert(normalMatrix, jointMatrix);
            mat4.transpose(normalMatrix, normalMatrix);
            this.jointNormalMatrices.push(normalMatrix);
        }
    }
}

export { gltfSkin };
