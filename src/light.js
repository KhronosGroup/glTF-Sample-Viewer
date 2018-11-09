class gltfLight
{
    constructor(type = "directional",
                color = jsToGl([1, 1, 1]),
                intensity = 1,
                range = undefined,
                name = undefined,
                node = undefined)
    {
        this.type = type;
        this.color = color;
        this.intensity = intensity;
        this.range = range;
        this.name = name;
        this.node = node; // non-standard
    }

    fromJson(jsonLight)
    {
        fromKeys(this, jsonLight);
    }
}
