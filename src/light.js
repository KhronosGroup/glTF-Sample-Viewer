class gltfLight
{
    constructor(type = "directional",
                color = jsToGl([1, 1, 1]),
                intensity = 1,
                range = undefined,
                name = undefined)
    {
        this.type = type;
        this.color = color;
        this.intensity = intensity;
        this.range = range;
        this.name = name;
    }

    fromJson(jsonLight)
    {
        fromKeys(this, jsonLight);
    }
}
