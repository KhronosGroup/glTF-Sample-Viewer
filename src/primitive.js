import { fromKeys } from './utils.js';
import { WebGl } from './webgl.js';

class gltfPrimitive
{
    constructor(attributes = [], indices = undefined, material = undefined, mode = WebGl.context.TRIANGLES)
    {
        this.attributes = attributes;
        this.indices = indices;
        this.material = material;
        this.mode = mode;
        this.defines = [];
        this.skip = true;
    }

    fromJson(jsonPrimitive, defaultMaterial, gltf)
    {
        fromKeys(this, jsonPrimitive, ["attributes"]);

        // Use the default glTF material.
        if (this.material === undefined)
        {
            this.material = defaultMaterial;
        }

        // https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#meshes
        for(let attrib of Object.keys(jsonPrimitive.attributes))
        {
            const idx = jsonPrimitive.attributes[attrib];
            switch (attrib) {
            case "POSITION":
                this.skip = false;
                this.attributes.push({attribute: attrib, name:"a_Position", accessor: idx});
                break;
            case "NORMAL":
                this.defines.push("HAS_NORMALS 1");
                this.attributes.push({attribute: attrib, name:"a_Normal", accessor: idx});
                break;
            case "TANGENT":
                this.defines.push("HAS_TANGENTS 1");
                this.attributes.push({attribute: attrib, name:"a_Tangent", accessor: idx});
                break;
            case "TEXCOORD_0":
                this.defines.push("HAS_UV_SET1 1");
                this.attributes.push({attribute: attrib, name:"a_UV1", accessor: idx});
                break;
            case "TEXCOORD_1":
                this.defines.push("HAS_UV_SET2 1");
                this.attributes.push({attribute: attrib, name:"a_UV2", accessor: idx});
                break;
            case "COLOR_0":
                {
                    const accessor = gltf.accessors[idx];
                    this.defines.push("HAS_VERTEX_COLOR_" + accessor.type + " 1");
                    this.attributes.push({attribute: attrib, name:"a_Color", accessor: idx});
                }
                break;
            case "JOINTS_0":
                this.defines.push("HAS_JOINTS 1");
                // TODO: implement when we do animations later
                break;
            case "WEIGHTS_0":
                this.defines.push("HAS_WEIGHTS 1");
                // TODO: implement when we do animations later

                break;
            default:
                console.log("Unknown attrib: " + attrib);
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
