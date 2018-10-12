class gltfSampler
{
    constructor(magFilter = 9729, minFilter = 9987,
                wrapS = 10497, wrapT = 10497,
                name = undefined)
    {
        this.magFilter = magFilter;
        this.minFilter = minFilter;
        this.wrapS = wrapS;
        this.wrapT = wrapT;
        this.name = name;
    }

    fromJson(jsonSampler)
    {
        fromKeys(this, jsonSampler);
    }
};
