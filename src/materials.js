class gltfMaterial
{
    constructor(normalTexture = undefined, occlusionTexture = undefined,
                emissiveTexture = undefined, emissiveFactor = jsToGl([0, 0, 0]),
                alphaMode = "OPAQUE", alphaCutoff = 0.5, doubleSided = false,
                name = undefined,
                pbrMetallicRoughness = undefined) // add more materials here!
    {
        this.normalTexture = normalTexture;
        this.occlusionTexture = occlusionTexture;
        this.emissiveTexture = emissiveTexture;
        this.emissiveFactor = emissiveFactor;
        this.alphaMode = alphaMode;
        this.alphaCutoff = alphaCutoff;
        this.doubleSided = doubleSided;
        this.name = name;
        this.pbrMetallicRoughness = pbrMetallicRoughness;
    }

    fromJson(jsonMaterial)
    {
        fromKeys(this, jsonMaterial); // Most things:
        // i.e. alphaMode + alphaCutoff, doubleSided.

        if (jsonMaterial.normalTexture !== undefined)
        {
            var normalTexture = new gltfTextureInfo();
            normalTexture.fromJson(jsonMaterial.normalTexture);
            this.normalTexture = normalTexture;
        }

        if (jsonMaterial.occlusiontexture !== undefined)
        {
            var occlusiontexture = new gltfTextureInfo();
            occlusiontexture.fromJson(jsonMaterial.occlusiontexture);
            this.occlusiontexture = occlusiontexture;
        }

        if (jsonMaterial.emissiveTexture !== undefined)
        {
            var emissiveTexture = new gltfTextureInfo();
            emissiveTexture.fromJson(jsonMaterial.emissiveTexture);
            this.emissiveTexture = emissiveTexture;
        }

        if (jsonMaterial.emissiveFactor !== undefined)
        {
            this.emissiveFactor = jsToGl(jsonMaterial.emissiveFactor);
        }

        if (jsonMaterial.pbrMetallicRoughness !== undefined)
        {
            var pbrMetallicRoughness = new gltfMetallicRoughness();
            pbrMetallicRoughness.fromJson(jsonMaterial.pbrMetallicRoughness);
            this.pbrMetallicRoughness = pbrMetallicRoughness;
        }
    }
};

class gltfMetallicRoughness
{
    constructor(baseColorFactor = jsToGl([1, 1, 1, 1]), baseColorTexture = undefined,
                metallicFactor = 1.0, roughnessFactor = 1.0,
                metallicRoughnessTexture = undefined)
    {
        this.baseColorFactor = baseColorFactor;
        this.baseColorTexture = baseColorTexture;
        this.metallicFactor = metallicFactor;
        this.roughnessFactor = roughnessFactor;
        this.metallicRoughnessTexture = undefined;
    }

    fromJson(jsonMetallicRoughness)
    {
        fromKeys(this, jsonMetallicRoughness); // Copy over most parameters here.

        if (jsonMetallicRoughness.baseColorFactor !== undefined)
        {
            this.baseColorFactor = jsToGl(jsonMetallicRoughness.baseColorFactor);
        }

        if (jsonMetallicRoughness.baseColorTexture !== undefined)
        {
            var baseColorTexture = new gltfTextureInfo();
            baseColorTexture.fromJson(jsonMetallicRoughness.baseColorTexture);
            this.baseColorTexture = baseColorTexture;
        }

        if (jsonMetallicRoughness.metallicRoughnessTexture !== undefined)
        {
            var metallicRoughnessTexture = new gltfTextureInfo();
            metallicRoughnessTexture.fromJson(jsonMetallicRoughness.metallicRoughnessTexture);
            this.metallicRoughnessTexture = metallicRoughnessTexture;
        }
    }
};
