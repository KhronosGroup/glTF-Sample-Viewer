import { initGlForMembers } from './utils.js';
import { WebGl } from './webgl.js';
import { GltfObject } from './gltf_object.js';

class gltfPrimitive extends GltfObject
{
    constructor()
    {
        super();
        this.attributes = [];
        this.indices = undefined;
        this.material = undefined;
        this.mode = WebGl.context.TRIANGLES;

        // non gltf
        this.glAttributes = [];
        this.defines = [];
        this.skip = true;
    }

    initGl(gltf)
    {
        // Use the default glTF material.
        if (this.material === undefined)
        {
            this.material = gltf.materials.length - 1;
        }

        initGlForMembers(this, gltf);

        // https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#meshes
        for (const attribute of Object.keys(this.attributes))
        {
            const idx = this.attributes[attribute];
            switch (attribute)
            {
            case "POSITION":
                this.skip = false;
                this.glAttributes.push({ attribute: attribute, name: "a_Position", accessor: idx });
                break;
            case "NORMAL":
                this.defines.push("HAS_NORMALS 1");
                this.glAttributes.push({ attribute: attribute, name: "a_Normal", accessor: idx });
                break;
            case "TANGENT":
                this.defines.push("HAS_TANGENTS 1");
                this.glAttributes.push({ attribute: attribute, name: "a_Tangent", accessor: idx });
                break;
            case "TEXCOORD_0":
                this.defines.push("HAS_UV_SET1 1");
                this.glAttributes.push({ attribute: attribute, name: "a_UV1", accessor: idx });
                break;
            case "TEXCOORD_1":
                this.defines.push("HAS_UV_SET2 1");
                this.glAttributes.push({ attribute: attribute, name: "a_UV2", accessor: idx });
                break;
            case "COLOR_0":
                {
                    const accessor = gltf.accessors[idx];
                    this.defines.push("HAS_VERTEX_COLOR_" + accessor.type + " 1");
                    this.glAttributes.push({ attribute: attribute, name: "a_Color", accessor: idx });
                }
                break;
            case "JOINTS_0":
                this.defines.push("HAS_JOINTS 1");
                this.glAttributes.push({ attribute: attribute, name: "a_Joints", accessor: idx });
                break;
            case "WEIGHTS_0":
                this.defines.push("HAS_WEIGHTS 1");
                this.glAttributes.push({ attribute: attribute, name: "a_Weights", accessor: idx });
                break;
            default:
                console.log("Unknown attribute: " + attribute);
            }
        }
    }

    getShaderIdentifier()
    {
        return "primitive.vert";
    }

    getDefines()
    {
        return this.defines;
    }
}

export { gltfPrimitive };
