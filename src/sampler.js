class gltfSampler
{
    constructor(magFilter = 9729, minFilter = 9987, wrapS = 10497, wrapT = 10497)
    {
        this.magFilter = magFilter;
        this.minFilter = minFilter;
        this.wrapS = wrapS;
        this.wrapT = wrapT;
    }

    fromJson(jsonSampler)
    {
        fromKeys(this, jsonSampler);
    }
};
