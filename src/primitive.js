class gltfPrimitive
{
    constructor(attributes = new Map(), indices = undefined, material = undefined, mode = gl.TRIANGLES)
    {
        this.attributes = attributes;
        this.indices = indices;
        this.material = material;
        this.mode = mode;
        this.defines = [];
        this.attributeNames = new Map();
        this.skip = true;
    }

    fromJson(jsonPrimitive)
    {
        fromKeys(this, jsonPrimitive);

        // https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#meshes
        for(let attrib in this.attributes)
        {
            switch (attrib) {
                case "POSITION":
                    this.skip = false;
                    this.attributeNames[attrib] = "a_Position";
                    break;
                case "NORMAL":
                    this.defines.push("HAS_NORMALS");
                    this.attributeNames[attrib] = "a_Normal";
                    break;
                case "TANGENT":
                    this.defines.push("HAS_TANGENTS");
                    this.attributeNames[attrib] = "a_Tangent";
                    break;
                case "TEXCOORD_0":
                    this.defines.push("HAS_UV_SET1");
                    this.attributeNames[attrib] = "a_UV1";
                    break;
                case "TEXCOORD_1":
                    this.defines.push("HAS_UV_SET2");
                    this.attributeNames[attrib] = "a_UV2";
                    break;
                case "COLOR_0":
                    this.defines.push("HAS_VERTEX_COLOR");
                    this.attributeNames[attrib] = "a_Color";
                    break;
                case "JOINTS_0":
                    this.defines.push("HAS_JOINTS");
                    // TODO: implement when we do animations later
                    break;
                case "WEIGHTS_0":
                    this.defines.push("HAS_WEIGHTS");
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
};
