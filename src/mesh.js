class gltfMesh
{
    constructor(primitives = [], weights = [], name = undefined)
    {
        this.primitives = primitives;
        this.weights = weights;
        this.name = name;
    }

    fromJson(jsonMesh)
    {
        if (jsonMesh.name !== undefined)
        {
            this.name = jsonMesh.name;
        }

        for (let i = 0; i < jsonMesh.primitives.length; ++i)
        {
            let primitive = new gltfPrimitive();
            primitive.fromJson(jsonMesh.primitives[i]);
            this.primitives.push(primitive);
        }

        if (jsonMesh.weights !== undefined)
        {
            this.weights = jsonMesh.weights;
        }
    }
};
