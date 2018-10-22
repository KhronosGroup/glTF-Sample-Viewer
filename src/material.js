class gltfMaterial
{
    constructor(emissiveFactor = jsToGl([0, 0, 0]), alphaMode = "OPAQUE", alphaCutoff = 0.5, doubleSided = false,
                baseColorFactor = jsToGl([1, 1, 1, 1]), metallicFactor = 1.0, roughnessFactor = 1.0, // Metallic-Roughness
                diffuseFactor = jsToGl([1, 1, 1, 1]), specularFactor = jsToGl([1, 1, 1]), glossinessFactor = 1.0, // Specular Glossiness
                name = undefined)
    {
        this.textures = []; // array of gltfTextureInfos
        this.emissiveFactor = emissiveFactor;
        this.alphaMode = alphaMode;
        this.alphaCutoff = alphaCutoff;
        this.doubleSided = doubleSided;
        this.name = name;
        this.type = "unlit";

        this.metallicFactor = metallicFactor;
        this.roughnessFactor = roughnessFactor;
        this.baseColorFactor = baseColorFactor;

        this.diffuseFactor = diffuseFactor;
        this.specularFactor = specularFactor;
        this.glossinessFactor = glossinessFactor;

        this.properties = new Map();
        this.defines = [];
    }

    static getDefaults()
    {
        let defaultMaterial = new gltfMaterial();
        defaultMaterial.type = "MR";
        defaultMaterial.name = "Default Material";
        defaultMaterial.properties.set("u_EmissiveFactor", defaultMaterial.emissiveFactor);
        defaultMaterial.properties.set("u_BaseColorFactor", defaultMaterial.baseColorFactor);
        defaultMaterial.properties.set("u_MetallicFactor", defaultMaterial.metallicFactor);
        defaultMaterial.properties.set("u_RoughnessFactor", defaultMaterial.roughnessFactor);
        return defaultMaterial;
    }

    getShaderIdentifier()
    {
        switch (this.type)
        {
            case "MR": return "metallic-roughness.frag";
            case "SG": return "specular-glossiness.frag" ;
            default: return "unlit.frag";
        }
    }

    getDefines()
    {
        return this.defines;
    }

    getProperties()
    {
        return this.properties;
    }

    getTextures()
    {
        return this.textures;
    }

    fromJson(jsonMaterial)
    {
        fromKeys(this, jsonMaterial);
        // i.e. alphaMode + alphaCutoff, doubleSided.

        this.properties.set("u_EmissiveFactor", this.emissiveFactor);

        if (jsonMaterial.normalTexture !== undefined)
        {
            let normalTexture = new gltfTextureInfo();
            normalTexture.fromJson(jsonMaterial.normalTexture,"u_NormalSampler", gl.RGBA);
            this.textures.push(normalTexture);
            this.defines.push("HAS_NORMAL_MAP");
        }

        if (jsonMaterial.occlusionTexture !== undefined)
        {
            let occlusionTexture = new gltfTextureInfo();
            occlusionTexture.fromJson(jsonMaterial.occlusionTexture,"u_OcclusionSampler", gl.RGBA);
            this.textures.push(occlusionTexture);
            this.defines.push("HAS_OCCLUSION_MAP");
        }

        if (jsonMaterial.emissiveTexture !== undefined)
        {
            let emissiveTexture = new gltfTextureInfo();
            emissiveTexture.fromJson(jsonMaterial.emissiveTexture,"u_EmissiveSampler", gl.RGBA);
            this.textures.push(emissiveTexture);
            this.defines.push("HAS_EMISSIVE_MAP");
        }

        if (jsonMaterial.emissiveFactor !== undefined)
        {
            this.emissiveFactor = jsToGl(jsonMaterial.emissiveFactor);
        }

        if (jsonMaterial.pbrMetallicRoughness !== undefined)
        {
            this.type = "MR";
            this.fromJsonMetallicRoughness(jsonMaterial.pbrMetallicRoughness);
        }

        if (jsonMaterial.pbrSpecularGlossiness !== undefined)
        {
            this.type = "SG";
            this.fromJsonSpecularGlossiness(jsonMaterial.pbrSpecularGlossiness); // converts parameters to Metallic Roughness
        }
    }

    fromJsonMetallicRoughness(jsonMetallicRoughness)
    {
        if (jsonMetallicRoughness.baseColorFactor !== undefined)
        {
            this.baseColorFactor = jsToGl(jsonMetallicRoughness.baseColorFactor);
        }

        if (jsonMetallicRoughness.metallicFactor !== undefined)
        {
            this.metallicFactor = jsonMetallicRoughness.metallicFactor;
        }

        if (jsonMetallicRoughness.roughnessFactor !== undefined)
        {
            this.roughnessFactor = jsonMetallicRoughness.roughnessFactor;
        }

        this.properties.set("u_BaseColorFactor", this.baseColorFactor);
        this.properties.set("u_MetallicFactor", this.metallicFactor);
        this.properties.set("u_RoughnessFactor", this.roughnessFactor);

        if (jsonMetallicRoughness.baseColorTexture !== undefined)
        {
            let baseColorTexture = new gltfTextureInfo();
            baseColorTexture.fromJson(jsonMetallicRoughness.baseColorTexture, "u_BaseColorSampler", gl.RGBA); // TODO: sRGB ext
            this.textures.push(baseColorTexture);
            this.defines.push("HAS_BASE_COLOR_MAP");
        }

        if (jsonMetallicRoughness.metallicRoughnessTexture !== undefined)
        {
            let metallicRoughnessTexture = new gltfTextureInfo();
            metallicRoughnessTexture.fromJson(jsonMetallicRoughness.metallicRoughnessTexture, "u_MetallicRoughnessSampler", gl.RGBA);
            this.textures.push(metallicRoughnessTexture);
            this.defines.push("HAS_METALLIC_ROUGHNESS_MAP");
        }
    }

    fromJsonSpecularGlossiness(jsonSpecularGlossiness)
    {
        if (jsonSpecularGlossiness.diffuseFactor !== undefined)
        {
            this.diffuseFactor = jsToGl(jsonSpecularGlossiness.diffuseFactor);
        }

        if (jsonSpecularGlossiness.specularFactor !== undefined)
        {
            this.specularFactor = jsToGl(jsonSpecularGlossiness.specularFactor);
        }

        if (jsonSpecularGlossiness.glossinessFactor !== undefined)
        {
            this.glossinessFactor = jsonSpecularGlossiness.glossinessFactor;
        }

        this.properties.set("u_DiffuseFactor", this.diffuseFactor);
        this.properties.set("u_SpecularFactor", this.specularFactor);
        this.properties.set("u_GlossinessFactor", this.glossinessFactor);

        if (jsonSpecularGlossiness.diffuseTexture !== undefined)
        {
            let diffuseTexture = new gltfTextureInfo();
            diffuseTexture.fromJson(jsonSpecularGlossiness.diffuseTexture,"u_DiffuseSampler", gl.RGBA); // TODO: sRGB ext
            this.textures.push(diffuseTexture);
            this.defines.push("HAS_DIFFUSE_MAP");
        }

        if (jsonSpecularGlossiness.specularGlossinessTexture !== undefined)
        {
            let specularGlossinessTexture = new gltfTextureInfo();
            specularGlossinessTexture.fromJson(jsonSpecularGlossiness.specularGlossinessTexture,"u_SpecularGlossinessSampler", gl.RGBA);
            this.textures.push(specularGlossinessTexture);
            this.defines.push("HAS_SPECULAR_GLOSSINESS_MAP");
        }
    }
};
