class gltfMesh
{
    constructor(name = "", primitives = [], weights = [])
    {
        this.name = name;
        this.primitives = primitives;
        this.weights = weights;
    }

    fromJson(jsonMesh)
    {
        if (jsonMesh.name !== undefined)
        {
            this.name = jsonMesh.name;
        }

        for (let p = 0; i < jsonMesh.primitives.length; ++i)
        {
            let primitive = new gltfPrimitive();
            primitive.fromJson(jsonMesh.primitives[p]);
            this.primitives.push(primitive);
        }

        if (jsonMesh.weights !== undefined)
        {
            this.weights = jsonMesh.weights;
        }
    }
}
