class gltfPrimitive
{
    constructor(attributes = {}, indices = undefined, material = undefined, mode = 4)
    {
        this.attributes = attributes;
        this.indices = indices;
        this.material = material;
        this.mode = mode;
    }

    fromJson(jsonPrimitive)
    {
        fromKeys(this, jsonPrimitive);
    }

    getShaderIdentifier()
    {
        return "primitive.vert";
    }

    getDefines()
    {
        let defines = [];

        // https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#meshes
        for(let [attrib, accessorIdx] of this.attributes.entries())
        {
            switch (attrib) {
                case "POSITION":
                    defines.push("HAS_VERTEX_POSITION"); // should be mandatory
                    break;
                case "NORMAL":
                    defines.push("HAS_VERTEX_NORMAL");
                    break;
                case "TANGENT":
                    defines.push("HAS_VERTEX_TANGENT");
                    break;
                case "TEXTCOORD_0":
                    defines.push("HAS_VERTEX_UV_SET1");
                    break;
                case "TEXTCOORD_1":
                    defines.push("HAS_VERTEX_UV_SET2");
                    break;
                case "COLOR_0":
                    defines.push("HAS_VERTEX_COLOR");
                    break;
                case "JOINTS_0":
                    defines.push("HAS_VERTEX_JOINT");
                    break;
                case "WEIGHTS_0":
                    defines.push("HAS_VERTEX_WEIGHT");
                    break;
                default:
                    // TODO: error unsupported attribute
                    break;
            }
        }

        return defines;
    }
};
