import { mat3 } from 'gl-matrix';
import { gltfTextureInfo } from './texture.js';
import { fromKeys, jsToGl } from './utils.js';

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
        defaultMaterial.defines.push("MATERIAL_METALLICROUGHNESS 1");
        defaultMaterial.properties.set("u_BaseColorFactor", defaultMaterial.baseColorFactor);
        defaultMaterial.properties.set("u_MetallicFactor", defaultMaterial.metallicFactor);
        defaultMaterial.properties.set("u_RoughnessFactor", defaultMaterial.roughnessFactor);
        return defaultMaterial;
    }

    getShaderIdentifier()
    {
        switch (this.type)
        {
            default:
            case "SG": // fall through till we sparate shaders
            case "MR": return "metallic-roughness.frag";
            //case "SG": return "specular-glossiness.frag" ;
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

    parseTextureInfoExtensions(textureInfo, textureKey)
    {
        if(textureInfo.extensions === undefined)
        {
            return;
        }

        if(textureInfo.extensions.KHR_texture_transform !== undefined)
        {
            const uvTransform = textureInfo.extensions.KHR_texture_transform;

            // override uvset
            if(uvTransform.texCoord !== undefined)
            {
                textureInfo.texCoord = uvTransform.texCoord;
            }

            let rotation = mat3.create();
            let scale = mat3.create();
            let translation = mat3.create();

            if(uvTransform.rotation !== undefined)
            {
                const s =  Math.sin(uvTransform.rotation);
                const c =  Math.cos(uvTransform.rotation);

                rotation = jsToGl([
                    c, s, 0.0,
                    -s, c, 0.0,
                    0.0, 0.0, 1.0]);
            }

            if(uvTransform.scale !== undefined)
            {
                scale = jsToGl([uvTransform.scale[0],0,0, 0,uvTransform.scale[1],0, 0,0,1]);
            }

            if(uvTransform.offset !== undefined)
            {
                translation = jsToGl([1,0,uvTransform.offset[0], 0,1,uvTransform.offset[1], 0, 0, 1]);
            }

            let uvMatrix = mat3.create();
            mat3.multiply(uvMatrix, rotation, scale);
            mat3.multiply(uvMatrix, uvMatrix, translation);

            this.defines.push("HAS_" + textureKey.toUpperCase() + "_UV_TRANSFORM 1");
            this.properties.set("u_" + textureKey + "UVTransform", uvMatrix);
        }
    }

    fromJson(jsonMaterial)
    {
        fromKeys(this, jsonMaterial);
        // i.e. alphaMode + alphaCutoff, doubleSided.

        if (jsonMaterial.emissiveFactor !== undefined)
        {
            this.emissiveFactor = jsToGl(jsonMaterial.emissiveFactor);
        }

        if (jsonMaterial.normalTexture !== undefined)
        {
            let normalTexture = new gltfTextureInfo();
            normalTexture.fromJson(jsonMaterial.normalTexture,"u_NormalSampler");
            this.parseTextureInfoExtensions(normalTexture, "Normal");
            this.textures.push(normalTexture);
            this.defines.push("HAS_NORMAL_MAP 1");
            this.properties.set("u_NormalScale", normalTexture.scale);
            this.properties.set("u_NormalUVSet", normalTexture.texCoord);
        }

        if (jsonMaterial.occlusionTexture !== undefined)
        {
            let occlusionTexture = new gltfTextureInfo();
            occlusionTexture.fromJson(jsonMaterial.occlusionTexture,"u_OcclusionSampler");
            this.parseTextureInfoExtensions(occlusionTexture, "Occlusion");
            this.textures.push(occlusionTexture);
            this.defines.push("HAS_OCCLUSION_MAP 1");
            this.properties.set("u_OcclusionStrength", occlusionTexture.strength);
            this.properties.set("u_OcclusionUVSet", occlusionTexture.texCoord);
        }

        if (jsonMaterial.emissiveTexture !== undefined)
        {
            let emissiveTexture = new gltfTextureInfo();
            emissiveTexture.fromJson(jsonMaterial.emissiveTexture,"u_EmissiveSampler");
            this.parseTextureInfoExtensions(emissiveTexture, "Emissive");
            this.textures.push(emissiveTexture);
            this.defines.push("HAS_EMISSIVE_MAP 1");
            this.properties.set("u_EmissiveFactor", this.emissiveFactor);
            this.properties.set("u_EmissiveUVSet", emissiveTexture.texCoord);
        }

        if(this.alphaMode === 'MASK') // only set cutoff value for mask material
        {
            this.defines.push("ALPHAMODE_MASK 1");
            this.properties.set("u_AlphaCutoff", this.alphaCutoff);
        }

        if(jsonMaterial.extensions !== undefined)
        {
            this.fromJsonMaterialExtensions(jsonMaterial.extensions);
        }

        // dont do MR if we parsed SG before
        if (jsonMaterial.pbrMetallicRoughness !== undefined && this.type != "SG")
        {
            this.type = "MR";
            this.fromJsonMetallicRoughness(jsonMaterial.pbrMetallicRoughness);
        }
    }

    fromJsonMaterialExtensions(jsonExtensions)
    {
        if (jsonExtensions.KHR_materials_pbrSpecularGlossiness !== undefined)
        {
            this.type = "SG";
            this.fromJsonSpecularGlossiness(jsonExtensions.KHR_materials_pbrSpecularGlossiness);
        }

        if(jsonExtensions.KHR_materials_unlit !== undefined)
        {
            this.type = "unlit";
            this.defines.push("MATERIAL_UNLIT 1");
        }
    }

    fromJsonMetallicRoughness(jsonMetallicRoughness)
    {
        this.defines.push("MATERIAL_METALLICROUGHNESS 1");

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
            baseColorTexture.fromJson(jsonMetallicRoughness.baseColorTexture, "u_BaseColorSampler");
            this.parseTextureInfoExtensions(baseColorTexture, "BaseColor");
            this.textures.push(baseColorTexture);
            this.defines.push("HAS_BASE_COLOR_MAP 1");
            this.properties.set("u_BaseColorUVSet", baseColorTexture.texCoord);
        }

        if (jsonMetallicRoughness.metallicRoughnessTexture !== undefined)
        {
            let metallicRoughnessTexture = new gltfTextureInfo();
            metallicRoughnessTexture.fromJson(jsonMetallicRoughness.metallicRoughnessTexture, "u_MetallicRoughnessSampler");
            this.parseTextureInfoExtensions(metallicRoughnessTexture, "MetallicRoughness");
            this.textures.push(metallicRoughnessTexture);
            this.defines.push("HAS_METALLIC_ROUGHNESS_MAP 1");
            this.properties.set("u_MetallicRoughnessUVSet", metallicRoughnessTexture.texCoord);
        }
    }

    fromJsonSpecularGlossiness(jsonSpecularGlossiness)
    {
        this.defines.push("MATERIAL_SPECULARGLOSSINESS 1");

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
            diffuseTexture.fromJson(jsonSpecularGlossiness.diffuseTexture,"u_DiffuseSampler");
            this.parseTextureInfoExtensions(diffuseTexture, "Diffuse");
            this.textures.push(diffuseTexture);
            this.defines.push("HAS_DIFFUSE_MAP 1");
            this.properties.set("u_DiffuseUVSet", diffuseTexture.texCoord);
        }

        if (jsonSpecularGlossiness.specularGlossinessTexture !== undefined)
        {
            let specularGlossinessTexture = new gltfTextureInfo();
            specularGlossinessTexture.fromJson(jsonSpecularGlossiness.specularGlossinessTexture,"u_SpecularGlossinessSampler");
            this.parseTextureInfoExtensions(specularGlossinessTexture, "SpecularGlossiness");
            this.textures.push(specularGlossinessTexture);
            this.defines.push("HAS_SPECULAR_GLOSSINESS_MAP 1");
            this.properties.set("u_SpecularGlossinessUVSet", specularGlossinessTexture.texCoord);
        }
    }
};

export { gltfMaterial };
