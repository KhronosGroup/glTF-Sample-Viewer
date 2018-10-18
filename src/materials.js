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

    getShaderIdentifier()
    {
        if (this.pbrMetallicRoughness !== undefined)
        {
            return "metallic-roughness.frag";
        }

        return "unlit.frag";
    }

    getDefines()
    {
        let defines = [];

        if (this.normalTexture !== undefined)
        {
            defines.push("HAS_NORMAL_MAP");
        }

        if (this.occlusionTexture !== undefined)
        {
            defines.push("HAS_OCCLUSION_MAP");
        }

        if (this.emissiveTexture !== undefined)
        {
            defines.push("HAS_EMISSIVE_MAP");
        }

        if (this.pbrMetallicRoughness !== undefined)
        {
            defines.concat(this.pbrMetallicRoughness.getDefines());
        }

        return defines;
    }

    getProperties()
    {
        let properties = new Map();

        properties["u_emissiveFactor"] = this.emissiveFactor;

        if (this.pbrMetallicRoughness !== undefined)
        {
            for (let [property, value] of this.pbrMetallicRoughness.getProperties().entries())
            {
                properties[property] = value;
            }
        }

        return propeties;
    }

    fromJson(jsonMaterial)
    {
        fromKeys(this, jsonMaterial); // Most things:
        // i.e. alphaMode + alphaCutoff, doubleSided.

        if (jsonMaterial.normalTexture !== undefined)
        {
            let normalTexture = new gltfTextureInfo();
            normalTexture.fromJson(jsonMaterial.normalTexture);
            this.normalTexture = normalTexture;
        }

        if (jsonMaterial.occlusionTexture !== undefined)
        {
            let occlusionTexture = new gltfTextureInfo();
            occlusionTexture.fromJson(jsonMaterial.occlusionTexture);
            this.occlusionTexture = occlusionTexture;
        }

        if (jsonMaterial.emissiveTexture !== undefined)
        {
            let emissiveTexture = new gltfTextureInfo();
            emissiveTexture.fromJson(jsonMaterial.emissiveTexture);
            this.emissiveTexture = emissiveTexture;
        }

        if (jsonMaterial.emissiveFactor !== undefined)
        {
            this.emissiveFactor = jsToGl(jsonMaterial.emissiveFactor);
        }

        if (jsonMaterial.pbrMetallicRoughness !== undefined)
        {
            let pbrMetallicRoughness = new gltfMetallicRoughness();
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
        this.metallicRoughnessTexture = metallicRoughnessTexture;
    }

    getDefines()
    {
        let defines = [];

        if (this.baseColorTexture !== undefined)
        {
            defines.push("HAS_BASE_COLOR_MAP");
        }

        if (this.metallicRoughnessTexture !== undefined)
        {
            defines.push("HAS_METALLIC_ROUGHNESS_MAP");
        }

        return defines;
    }

    getProperties()
    {
        let properties = new Map();

        properties["u_baseColorFactor"] = this.baseColorFactor;
        properties["u_metallicFactor"] = this.metallicFactor;
        properties["u_roughnessFactor"] = this.roughnessFactor;

        return properties;
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
            let baseColorTexture = new gltfTextureInfo();
            baseColorTexture.fromJson(jsonMetallicRoughness.baseColorTexture);
            this.baseColorTexture = baseColorTexture;
        }

        if (jsonMetallicRoughness.metallicRoughnessTexture !== undefined)
        {
            let metallicRoughnessTexture = new gltfTextureInfo();
            metallicRoughnessTexture.fromJson(jsonMetallicRoughness.metallicRoughnessTexture);
            this.metallicRoughnessTexture = metallicRoughnessTexture;
        }
    }
};
