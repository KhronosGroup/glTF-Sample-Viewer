import { mat3, vec3, vec4 } from 'gl-matrix';
import { gltfTextureInfo } from './texture.js';
import { jsToGl, initGlForMembers } from './utils.js';
import { GltfObject } from './gltf_object.js';

class gltfMaterial extends GltfObject
{
    constructor()
    {
        super();
        this.name = undefined;
        this.pbrMetallicRoughness = undefined;
        this.normalTexture = undefined;
        this.occlusionTexture = undefined;
        this.emissiveTexture = undefined;
        this.emissiveFactor = vec3.fromValues(0, 0, 0);
        this.alphaMode = "OPAQUE";
        this.alphaCutoff = 0.5;
        this.doubleSided = false;

        // pbr next extension toggles
        this.hasClearcoat = false;
        this.hasSheen = false;
        this.hasTransmission = false;
        this.hasIOR = false;
        this.hasEmissiveStrength = false;
        this.hasVolume = false;
        this.hasIridescence = false;

        // non gltf properties
        this.type = "unlit";
        this.textures = [];
        this.properties = new Map();
        this.defines = [];
    }

    static createDefault()
    {
        const defaultMaterial = new gltfMaterial();
        defaultMaterial.type = "MR";
        defaultMaterial.name = "Default Material";
        defaultMaterial.defines.push("MATERIAL_METALLICROUGHNESS 1");
        const baseColorFactor = vec4.fromValues(1, 1, 1, 1);
        const metallicFactor = 1;
        const roughnessFactor = 1;
        defaultMaterial.properties.set("u_BaseColorFactor", baseColorFactor);
        defaultMaterial.properties.set("u_MetallicFactor", metallicFactor);
        defaultMaterial.properties.set("u_RoughnessFactor", roughnessFactor);

        return defaultMaterial;
    }

    getShaderIdentifier()
    {
        switch (this.type)
        {
        default:
        case "SG": // fall through till we sparate shaders
        case "MR": return "pbr.frag";
            //case "SG": return "specular-glossiness.frag" ;
        }
    }

    getDefines(renderingParameters)
    {
        const defines = Array.from(this.defines);

        if (this.hasClearcoat && renderingParameters.enabledExtensions.KHR_materials_clearcoat)
        {
            defines.push("MATERIAL_CLEARCOAT 1");
        }
        if (this.hasSheen && renderingParameters.enabledExtensions.KHR_materials_sheen)
        {
            defines.push("MATERIAL_SHEEN 1");
        }
        if (this.hasTransmission && renderingParameters.enabledExtensions.KHR_materials_transmission)
        {
            defines.push("MATERIAL_TRANSMISSION 1");
        }
        if (this.hasVolume && renderingParameters.enabledExtensions.KHR_materials_volume)
        {
            defines.push("MATERIAL_VOLUME 1");
        }
        if(this.hasIOR && renderingParameters.enabledExtensions.KHR_materials_ior)
        {
            defines.push("MATERIAL_IOR 1");
        }
        if(this.hasSpecular && renderingParameters.enabledExtensions.KHR_materials_specular)
        {
            defines.push("MATERIAL_SPECULAR 1");
        }
        if(this.hasIridescence && renderingParameters.enabledExtensions.KHR_materials_iridescence)
        {
            defines.push("MATERIAL_IRIDESCENCE 1");
        }
        if(this.hasEmissiveStrength && renderingParameters.enabledExtensions.KHR_materials_emissive_strength)
        {
            defines.push("MATERIAL_EMISSIVE_STRENGTH 1");
        }

        return defines;
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
                    c, -s, 0.0,
                    s, c, 0.0,
                    0.0, 0.0, 1.0]);
            }

            if(uvTransform.scale !== undefined)
            {
                scale = jsToGl([
                    uvTransform.scale[0], 0, 0, 
                    0, uvTransform.scale[1], 0, 
                    0, 0, 1
                ]);
            }

            if(uvTransform.offset !== undefined)
            {
                translation = jsToGl([
                    1, 0, 0, 
                    0, 1, 0, 
                    uvTransform.offset[0], uvTransform.offset[1], 1
                ]);
            }

            let uvMatrix = mat3.create();
            mat3.multiply(uvMatrix, translation, rotation);
            mat3.multiply(uvMatrix, uvMatrix, scale);

            this.defines.push("HAS_" + textureKey.toUpperCase() + "_UV_TRANSFORM 1");
            this.properties.set("u_" + textureKey + "UVTransform", uvMatrix);
        }
    }

    initGl(gltf, webGlContext)
    {
        if (this.normalTexture !== undefined)
        {
            this.normalTexture.samplerName = "u_NormalSampler";
            this.parseTextureInfoExtensions(this.normalTexture, "Normal");
            this.textures.push(this.normalTexture);
            this.defines.push("HAS_NORMAL_MAP 1");
            this.properties.set("u_NormalScale", this.normalTexture.scale);
            this.properties.set("u_NormalUVSet", this.normalTexture.texCoord);
        }

        if (this.occlusionTexture !== undefined)
        {
            this.occlusionTexture.samplerName = "u_OcclusionSampler";
            this.parseTextureInfoExtensions(this.occlusionTexture, "Occlusion");
            this.textures.push(this.occlusionTexture);
            this.defines.push("HAS_OCCLUSION_MAP 1");
            this.properties.set("u_OcclusionStrength", this.occlusionTexture.strength);
            this.properties.set("u_OcclusionUVSet", this.occlusionTexture.texCoord);
        }

        this.properties.set("u_EmissiveFactor", this.emissiveFactor);
        if (this.emissiveTexture !== undefined)
        {
            this.emissiveTexture.samplerName = "u_EmissiveSampler";
            this.parseTextureInfoExtensions(this.emissiveTexture, "Emissive");
            this.textures.push(this.emissiveTexture);
            this.defines.push("HAS_EMISSIVE_MAP 1");
            this.properties.set("u_EmissiveUVSet", this.emissiveTexture.texCoord);
        }

        if (this.baseColorTexture !== undefined)
        {
            this.baseColorTexture.samplerName = "u_BaseColorSampler";
            this.parseTextureInfoExtensions(this.baseColorTexture, "BaseColor");
            this.textures.push(this.baseColorTexture);
            this.defines.push("HAS_BASE_COLOR_MAP 1");
            this.properties.set("u_BaseColorUVSet", this.baseColorTexture.texCoord);
        }

        if (this.metallicRoughnessTexture !== undefined)
        {
            this.metallicRoughnessTexture.samplerName = "u_MetallicRoughnessSampler";
            this.parseTextureInfoExtensions(this.metallicRoughnessTexture, "MetallicRoughness");
            this.textures.push(this.metallicRoughnessTexture);
            this.defines.push("HAS_METALLIC_ROUGHNESS_MAP 1");
            this.properties.set("u_MetallicRoughnessUVSet", this.metallicRoughnessTexture.texCoord);
        }

        if (this.diffuseTexture !== undefined)
        {
            this.diffuseTexture.samplerName = "u_DiffuseSampler";
            this.parseTextureInfoExtensions(this.diffuseTexture, "Diffuse");
            this.textures.push(this.diffuseTexture);
            this.defines.push("HAS_DIFFUSE_MAP 1");
            this.properties.set("u_DiffuseUVSet", this.diffuseTexture.texCoord);
        }

        if (this.specularGlossinessTexture !== undefined)
        {
            this.specularGlossinessTexture.samplerName = "u_SpecularGlossinessSampler";
            this.parseTextureInfoExtensions(this.specularGlossinessTexture, "SpecularGlossiness");
            this.textures.push(this.specularGlossinessTexture);
            this.defines.push("HAS_SPECULAR_GLOSSINESS_MAP 1");
            this.properties.set("u_SpecularGlossinessUVSet", this.specularGlossinessTexture.texCoord);
        }

        this.defines.push("ALPHAMODE_OPAQUE 0");
        this.defines.push("ALPHAMODE_MASK 1");
        this.defines.push("ALPHAMODE_BLEND 2");
        if(this.alphaMode === 'MASK') // only set cutoff value for mask material
        {
            this.defines.push("ALPHAMODE ALPHAMODE_MASK");
            this.properties.set("u_AlphaCutoff", this.alphaCutoff);
        }
        else if (this.alphaMode === 'OPAQUE')
        {
            this.defines.push("ALPHAMODE ALPHAMODE_OPAQUE");
        }
        else
        {
            this.defines.push("ALPHAMODE ALPHAMODE_BLEND");
        }

        // if we have SG, we prefer SG (best practice) but if we have neither objects we use MR default values
        if(this.type !== "SG" )
        {
            this.defines.push("MATERIAL_METALLICROUGHNESS 1");
            this.properties.set("u_BaseColorFactor", vec4.fromValues(1, 1, 1, 1));
            this.properties.set("u_MetallicFactor", 1);
            this.properties.set("u_RoughnessFactor", 1);
        }

        if (this.pbrMetallicRoughness !== undefined && this.type !== "SG")
        {
            if (this.pbrMetallicRoughness.baseColorFactor !== undefined)
            {
                let baseColorFactor = jsToGl(this.pbrMetallicRoughness.baseColorFactor);
                this.properties.set("u_BaseColorFactor", baseColorFactor);
            }

            if (this.pbrMetallicRoughness.metallicFactor !== undefined)
            {
                let metallicFactor = this.pbrMetallicRoughness.metallicFactor;
                this.properties.set("u_MetallicFactor", metallicFactor);
            }

            if (this.pbrMetallicRoughness.roughnessFactor !== undefined)
            {
                let roughnessFactor = this.pbrMetallicRoughness.roughnessFactor;
                this.properties.set("u_RoughnessFactor", roughnessFactor);
            }

        }

        if (this.extensions !== undefined)
        {
            if (this.extensions.KHR_materials_unlit !== undefined)
            {
                this.defines.push("MATERIAL_UNLIT 1");
            }

            if (this.extensions.KHR_materials_pbrSpecularGlossiness !== undefined)
            {
                this.defines.push("MATERIAL_SPECULARGLOSSINESS 1");

                let diffuseFactor = vec4.fromValues(1, 1, 1, 1);
                let specularFactor = vec3.fromValues(1, 1, 1);
                let glossinessFactor = 1;

                if (this.extensions.KHR_materials_pbrSpecularGlossiness.diffuseFactor !== undefined)
                {
                    diffuseFactor = jsToGl(this.extensions.KHR_materials_pbrSpecularGlossiness.diffuseFactor);
                }

                if (this.extensions.KHR_materials_pbrSpecularGlossiness.specularFactor !== undefined)
                {
                    specularFactor = jsToGl(this.extensions.KHR_materials_pbrSpecularGlossiness.specularFactor);
                }

                if (this.extensions.KHR_materials_pbrSpecularGlossiness.glossinessFactor !== undefined)
                {
                    glossinessFactor = this.extensions.KHR_materials_pbrSpecularGlossiness.glossinessFactor;
                }

                this.properties.set("u_DiffuseFactor", diffuseFactor);
                this.properties.set("u_SpecularFactor", specularFactor);
                this.properties.set("u_GlossinessFactor", glossinessFactor);
            }

            // Clearcoat is part of the default metallic-roughness shader
            if(this.extensions.KHR_materials_clearcoat !== undefined)
            {
                let clearcoatFactor = 0.0;
                let clearcoatRoughnessFactor = 0.0;

                this.hasClearcoat = true;

                if(this.extensions.KHR_materials_clearcoat.clearcoatFactor !== undefined)
                {
                    clearcoatFactor = this.extensions.KHR_materials_clearcoat.clearcoatFactor;
                }
                if(this.extensions.KHR_materials_clearcoat.clearcoatRoughnessFactor !== undefined)
                {
                    clearcoatRoughnessFactor = this.extensions.KHR_materials_clearcoat.clearcoatRoughnessFactor;
                }

                if (this.clearcoatTexture !== undefined)
                {
                    this.clearcoatTexture.samplerName = "u_ClearcoatSampler";
                    this.parseTextureInfoExtensions(this.clearcoatTexture, "Clearcoat");
                    this.textures.push(this.clearcoatTexture);
                    this.defines.push("HAS_CLEARCOAT_MAP 1");
                    this.properties.set("u_ClearcoatUVSet", this.clearcoatTexture.texCoord);
                }
                if (this.clearcoatRoughnessTexture !== undefined)
                {
                    this.clearcoatRoughnessTexture.samplerName = "u_ClearcoatRoughnessSampler";
                    this.parseTextureInfoExtensions(this.clearcoatRoughnessTexture, "ClearcoatRoughness");
                    this.textures.push(this.clearcoatRoughnessTexture);
                    this.defines.push("HAS_CLEARCOAT_ROUGHNESS_MAP 1");
                    this.properties.set("u_ClearcoatRoughnessUVSet", this.clearcoatRoughnessTexture.texCoord);
                }
                if (this.clearcoatNormalTexture !== undefined)
                {
                    this.clearcoatNormalTexture.samplerName = "u_ClearcoatNormalSampler";
                    this.parseTextureInfoExtensions(this.clearcoatNormalTexture, "ClearcoatNormal");
                    this.textures.push(this.clearcoatNormalTexture);
                    this.defines.push("HAS_CLEARCOAT_NORMAL_MAP 1");
                    this.properties.set("u_ClearcoatNormalUVSet", this.clearcoatNormalTexture.texCoord);
                    this.properties.set("u_ClearcoatNormalScale", this.clearcoatNormalTexture.scale);

                }
                this.properties.set("u_ClearcoatFactor", clearcoatFactor);
                this.properties.set("u_ClearcoatRoughnessFactor", clearcoatRoughnessFactor);
            }

            // Sheen material extension
            // https://github.com/sebavan/glTF/tree/KHR_materials_sheen/extensions/2.0/Khronos/KHR_materials_sheen
            if(this.extensions.KHR_materials_sheen !== undefined)
            {
                let sheenRoughnessFactor = 0.0;
                let sheenColorFactor =  vec3.fromValues(1.0, 1.0, 1.0);

                this.hasSheen = true;

                if(this.extensions.KHR_materials_sheen.sheenRoughnessFactor !== undefined)
                {
                    sheenRoughnessFactor = this.extensions.KHR_materials_sheen.sheenRoughnessFactor;
                }
                if(this.extensions.KHR_materials_sheen.sheenColorFactor !== undefined)
                {
                    sheenColorFactor = jsToGl(this.extensions.KHR_materials_sheen.sheenColorFactor);
                }
                if (this.sheenRoughnessTexture !== undefined)
                {
                    this.sheenRoughnessTexture.samplerName = "u_sheenRoughnessSampler";
                    this.parseTextureInfoExtensions(this.sheenRoughnessTexture, "SheenRoughness");
                    this.textures.push(this.sheenRoughnessTexture);
                    this.defines.push("HAS_SHEEN_ROUGHNESS_MAP 1");
                    this.properties.set("u_SheenRoughnessUVSet", this.sheenRoughnessTexture.texCoord);
                }
                if (this.sheenColorTexture !== undefined)
                {
                    this.sheenColorTexture.samplerName = "u_SheenColorSampler";
                    this.parseTextureInfoExtensions(this.sheenColorTexture, "SheenColor");
                    this.sheenColorTexture.linear = false;
                    this.textures.push(this.sheenColorTexture);
                    this.defines.push("HAS_SHEEN_COLOR_MAP 1");
                    this.properties.set("u_SheenColorUVSet", this.sheenColorTexture.texCoord);
                }

                this.properties.set("u_SheenRoughnessFactor", sheenRoughnessFactor);
                this.properties.set("u_SheenColorFactor", sheenColorFactor);
            }

            // KHR Extension: Specular
            if (this.extensions.KHR_materials_specular !== undefined)
            {
                this.hasSpecular = true;

                if (this.specularTexture !== undefined)
                {
                    this.specularTexture.samplerName = "u_SpecularSampler";
                    this.parseTextureInfoExtensions(this.specularTexture, "Specular");
                    this.textures.push(this.specularTexture);
                    this.defines.push("HAS_SPECULAR_MAP 1");
                    this.properties.set("u_SpecularUVSet", this.specularTexture.texCoord);
                }

                if (this.specularColorTexture !== undefined)
                {
                    this.specularColorTexture.samplerName = "u_SpecularColorSampler";
                    this.parseTextureInfoExtensions(this.specularColorTexture, "SpecularColor");
                    this.specularColorTexture.linear = false;
                    this.textures.push(this.specularColorTexture);
                    this.defines.push("HAS_SPECULAR_COLOR_MAP 1");
                    this.properties.set("u_SpecularColorUVSet", this.specularColorTexture.texCoord);
                }

                let specularColorFactor = jsToGl(this.extensions.KHR_materials_specular.specularColorFactor ?? [1.0, 1.0, 1.0]);
                let specularFactor = this.extensions.KHR_materials_specular.specularFactor ?? 1.0;

                this.properties.set("u_KHR_materials_specular_specularColorFactor", specularColorFactor);
                this.properties.set("u_KHR_materials_specular_specularFactor", specularFactor);
            }

            // KHR Extension: Emissive strength
            if (this.extensions.KHR_materials_emissive_strength !== undefined)
            {
                this.hasEmissiveStrength = true;

                let emissiveStrength = this.extensions.KHR_materials_emissive_strength.emissiveStrength ?? 1.0;

                this.properties.set("u_EmissiveStrength", emissiveStrength);
            }

            // KHR Extension: Transmission
            if (this.extensions.KHR_materials_transmission !== undefined)
            {
                let transmissionFactor = 0.0;

                this.hasTransmission = true;

                if (transmissionFactor !== undefined)
                {
                    transmissionFactor = this.extensions.KHR_materials_transmission.transmissionFactor;
                }
                if (this.transmissionTexture !== undefined)
                {
                    this.transmissionTexture.samplerName = "u_TransmissionSampler";
                    this.parseTextureInfoExtensions(this.transmissionTexture, "Transmission");
                    this.textures.push(this.transmissionTexture);
                    this.defines.push("HAS_TRANSMISSION_MAP 1");
                    this.properties.set("u_TransmissionUVSet", this.transmissionTexture.texCoord);
                }

                this.properties.set("u_TransmissionFactor", transmissionFactor);
            }

            // KHR Extension: IOR
            //https://github.com/DassaultSystemes-Technology/glTF/tree/KHR_materials_ior/extensions/2.0/Khronos/KHR_materials_ior
            if (this.extensions.KHR_materials_ior !== undefined)
            {
                let ior = 1.5;

                this.hasIOR = true;
                
                if(this.extensions.KHR_materials_ior.ior !== undefined)
                {
                    ior = this.extensions.KHR_materials_ior.ior;
                }

                this.properties.set("u_Ior", ior);
            }

            // KHR Extension: Volume
            if (this.extensions.KHR_materials_volume !== undefined)
            {
                this.hasVolume = true;

                if (this.thicknessTexture !== undefined)
                {
                    this.thicknessTexture.samplerName = "u_ThicknessSampler";
                    this.parseTextureInfoExtensions(this.thicknessTexture, "Thickness");
                    this.textures.push(this.thicknessTexture);
                    this.defines.push("HAS_THICKNESS_MAP 1");
                    this.properties.set("u_ThicknessUVSet", this.thicknessTexture.texCoord);
                }

                let attenuationColor = jsToGl(this.extensions.KHR_materials_volume.attenuationColor ?? [1.0, 1.0, 1.0]);
                let attenuationDistance = this.extensions.KHR_materials_volume.attenuationDistance ?? 0.0;
                let thicknessFactor = this.extensions.KHR_materials_volume.thicknessFactor ?? 0.0;

                this.properties.set("u_AttenuationColor", attenuationColor);
                this.properties.set("u_AttenuationDistance", attenuationDistance);
                this.properties.set("u_ThicknessFactor", thicknessFactor);
            }

            // KHR Extension: Iridescence
            // See https://github.com/ux3d/glTF/tree/extensions/KHR_materials_iridescence/extensions/2.0/Khronos/KHR_materials_iridescence
            if(this.extensions.KHR_materials_iridescence !== undefined)
            {
                this.hasIridescence = true;

                let factor = this.extensions.KHR_materials_iridescence.iridescenceFactor;
                let iridescenceIor = this.extensions.KHR_materials_iridescence.iridescenceIor;
                let thicknessMinimum = this.extensions.KHR_materials_iridescence.iridescenceThicknessMinimum;
                let thicknessMaximum = this.extensions.KHR_materials_iridescence.iridescenceThicknessMaximum;

                if (factor === undefined)
                {
                    factor = 0.0;
                }
                if (iridescenceIor === undefined)
                {
                    iridescenceIor = 1.3;
                }
                if (thicknessMinimum === undefined)
                {
                    thicknessMinimum = 100.0;
                }
                if (thicknessMaximum === undefined)
                {
                    thicknessMaximum = 400.0;
                }

                if (this.iridescenceTexture !== undefined)
                {
                    this.iridescenceTexture.samplerName = "u_IridescenceSampler";
                    this.parseTextureInfoExtensions(this.iridescenceTexture, "Iridescence");
                    this.textures.push(this.iridescenceTexture);
                    this.defines.push("HAS_IRIDESCENCE_MAP 1");
                    this.properties.set("u_IridescenceUVSet", this.iridescenceTexture.texCoord);
                }

                if (this.iridescenceThicknessTexture !== undefined)
                {
                    this.iridescenceThicknessTexture.samplerName = "u_IridescenceThicknessSampler";
                    this.parseTextureInfoExtensions(this.iridescenceThicknessTexture, "IridescenceThickness");
                    this.textures.push(this.iridescenceThicknessTexture);
                    this.defines.push("HAS_IRIDESCENCE_THICKNESS_MAP 1");
                    this.properties.set("u_IridescenceThicknessUVSet", this.iridescenceThicknessTexture.texCoord);

                    // The thickness minimum is only required when there is a thickness texture present.
                    // Because 1.0 is the default value for the thickness, no texture implies that only the
                    // maximum thickness is ever read in the shader.
                    this.properties.set("u_IridescenceThicknessMinimum", thicknessMinimum);
                }

                this.properties.set("u_IridescenceFactor", factor);
                this.properties.set("u_IridescenceIor", iridescenceIor);
                this.properties.set("u_IridescenceThicknessMaximum", thicknessMaximum);
            }
        }

        initGlForMembers(this, gltf, webGlContext);
    }

    fromJson(jsonMaterial)
    {
        super.fromJson(jsonMaterial);

        if (jsonMaterial.emissiveFactor !== undefined)
        {
            this.emissiveFactor = jsToGl(jsonMaterial.emissiveFactor);
        }

        if (jsonMaterial.normalTexture !== undefined)
        {
            const normalTexture = new gltfTextureInfo();
            normalTexture.fromJson(jsonMaterial.normalTexture);
            this.normalTexture = normalTexture;
        }

        if (jsonMaterial.occlusionTexture !== undefined)
        {
            const occlusionTexture = new gltfTextureInfo();
            occlusionTexture.fromJson(jsonMaterial.occlusionTexture);
            this.occlusionTexture = occlusionTexture;
        }

        if (jsonMaterial.emissiveTexture !== undefined)
        {
            const emissiveTexture = new gltfTextureInfo(undefined, 0, false);
            emissiveTexture.fromJson(jsonMaterial.emissiveTexture);
            this.emissiveTexture = emissiveTexture;
        }

        if(jsonMaterial.extensions !== undefined)
        {
            this.fromJsonMaterialExtensions(jsonMaterial.extensions);
        }

        if (jsonMaterial.pbrMetallicRoughness !== undefined && this.type !== "SG")
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
        }

        if(jsonExtensions.KHR_materials_clearcoat !== undefined)
        {
            this.fromJsonClearcoat(jsonExtensions.KHR_materials_clearcoat);
        }

        if(jsonExtensions.KHR_materials_sheen !== undefined)
        {
            this.fromJsonSheen(jsonExtensions.KHR_materials_sheen);
        }

        if(jsonExtensions.KHR_materials_transmission !== undefined)
        {
            this.fromJsonTransmission(jsonExtensions.KHR_materials_transmission);
        }

        if(jsonExtensions.KHR_materials_specular !== undefined)
        {
            this.fromJsonSpecular(jsonExtensions.KHR_materials_specular);
        }

        if(jsonExtensions.KHR_materials_volume !== undefined)
        {
            this.fromJsonVolume(jsonExtensions.KHR_materials_volume);
        }

        if(jsonExtensions.KHR_materials_iridescence !== undefined)
        {
            this.fromJsonIridescence(jsonExtensions.KHR_materials_iridescence);
        }
    }

    fromJsonMetallicRoughness(jsonMetallicRoughness)
    {
        if (jsonMetallicRoughness.baseColorTexture !== undefined)
        {
            const baseColorTexture = new gltfTextureInfo(undefined, 0, false);
            baseColorTexture.fromJson(jsonMetallicRoughness.baseColorTexture);
            this.baseColorTexture = baseColorTexture;
        }

        if (jsonMetallicRoughness.metallicRoughnessTexture !== undefined)
        {
            const metallicRoughnessTexture = new gltfTextureInfo();
            metallicRoughnessTexture.fromJson(jsonMetallicRoughness.metallicRoughnessTexture);
            this.metallicRoughnessTexture = metallicRoughnessTexture;
        }
    }

    fromJsonSpecularGlossiness(jsonSpecularGlossiness)
    {
        if (jsonSpecularGlossiness.diffuseTexture !== undefined)
        {
            const diffuseTexture = new gltfTextureInfo(undefined, 0, false);
            diffuseTexture.fromJson(jsonSpecularGlossiness.diffuseTexture);
            this.diffuseTexture = diffuseTexture;
        }

        if (jsonSpecularGlossiness.specularGlossinessTexture !== undefined)
        {
            const specularGlossinessTexture = new gltfTextureInfo(undefined, 0, false);
            specularGlossinessTexture.fromJson(jsonSpecularGlossiness.specularGlossinessTexture);
            this.specularGlossinessTexture = specularGlossinessTexture;
        }
    }

    fromJsonClearcoat(jsonClearcoat)
    {
        if(jsonClearcoat.clearcoatTexture !== undefined)
        {
            const clearcoatTexture = new gltfTextureInfo();
            clearcoatTexture.fromJson(jsonClearcoat.clearcoatTexture);
            this.clearcoatTexture = clearcoatTexture;
        }

        if(jsonClearcoat.clearcoatRoughnessTexture !== undefined)
        {
            const clearcoatRoughnessTexture =  new gltfTextureInfo();
            clearcoatRoughnessTexture.fromJson(jsonClearcoat.clearcoatRoughnessTexture);
            this.clearcoatRoughnessTexture = clearcoatRoughnessTexture;
        }

        if(jsonClearcoat.clearcoatNormalTexture !== undefined)
        {
            const clearcoatNormalTexture =  new gltfTextureInfo();
            clearcoatNormalTexture.fromJson(jsonClearcoat.clearcoatNormalTexture);
            this.clearcoatNormalTexture = clearcoatNormalTexture;
        }
    }

    fromJsonSheen(jsonSheen)
    {
        if(jsonSheen.sheenColorTexture !== undefined)
        {
            const sheenColorTexture = new gltfTextureInfo(undefined, 0, false);
            sheenColorTexture.fromJson(jsonSheen.sheenColorTexture);
            this.sheenColorTexture = sheenColorTexture;
        }
        if(jsonSheen.sheenRoughnessTexture !== undefined)
        {
            const sheenRoughnessTexture = new gltfTextureInfo();
            sheenRoughnessTexture.fromJson(jsonSheen.sheenRoughnessTexture);
            this.sheenRoughnessTexture = sheenRoughnessTexture;
        }
    }

    fromJsonTransmission(jsonTransmission)
    {
        if(jsonTransmission.transmissionTexture !== undefined)
        {
            const transmissionTexture = new gltfTextureInfo();
            transmissionTexture.fromJson(jsonTransmission.transmissionTexture);
            this.transmissionTexture = transmissionTexture;
        }
    }

    fromJsonSpecular(jsonSpecular)
    {
        if(jsonSpecular.specularTexture !== undefined)
        {
            const specularTexture = new gltfTextureInfo();
            specularTexture.fromJson(jsonSpecular.specularTexture);
            this.specularTexture = specularTexture;
        }

        if(jsonSpecular.specularColorTexture !== undefined)
        {
            const specularColorTexture = new gltfTextureInfo();
            specularColorTexture.fromJson(jsonSpecular.specularColorTexture);
            this.specularColorTexture = specularColorTexture;
        }
    }

    fromJsonVolume(jsonVolume)
    {
        if(jsonVolume.thicknessTexture !== undefined)
        {
            const thicknessTexture = new gltfTextureInfo();
            thicknessTexture.fromJson(jsonVolume.thicknessTexture);
            this.thicknessTexture = thicknessTexture;
        }
    }

    fromJsonIridescence(jsonIridescence)
    {
        if(jsonIridescence.iridescenceTexture !== undefined)
        {
            const iridescenceTexture = new gltfTextureInfo();
            iridescenceTexture.fromJson(jsonIridescence.iridescenceTexture);
            this.iridescenceTexture = iridescenceTexture;
        }

        if(jsonIridescence.iridescenceThicknessTexture !== undefined)
        {
            const iridescenceThicknessTexture = new gltfTextureInfo();
            iridescenceThicknessTexture.fromJson(jsonIridescence.iridescenceThicknessTexture);
            this.iridescenceThicknessTexture = iridescenceThicknessTexture;
        }
    }
}

export { gltfMaterial };
