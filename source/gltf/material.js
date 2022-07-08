import { mat3, vec3, vec4 } from 'gl-matrix';
import { gltfTextureInfo } from './texture.js';
import { jsToGl, initGlForMembers } from './utils.js';
import { GltfObject } from './gltf_object.js';
import { AnimatableProperty, makeAnimatable } from './animatable_property.js';

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
        this.emissiveFactor = new AnimatableProperty(vec3.fromValues(0, 0, 0));
        this.alphaMode = "OPAQUE";
        this.alphaCutoff = new AnimatableProperty(0.5);
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
        this.textureTransforms = [];
        this.defines = [];
        this.properties = new Map();
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

    updateTextureTransforms()
    {
        for (const { key, uv } of this.textureTransforms) {
            let rotation = mat3.create();
            let scale = mat3.create();
            let translation = mat3.create();

            if (uv.rotation.value() !== undefined)
            {
                const s =  Math.sin(uv.rotation.value());
                const c =  Math.cos(uv.rotation.value());
                rotation = jsToGl([
                    c, -s, 0.0,
                    s, c, 0.0,
                    0.0, 0.0, 1.0]);
            }

            if (uv.scale.value() !== undefined)
            {
                scale = jsToGl([
                    uv.scale.value()[0], 0, 0, 
                    0, uv.scale.value()[1], 0, 
                    0, 0, 1
                ]);
            }

            if (uv.offset.value() !== undefined)
            {
                translation = jsToGl([
                    1, 0, 0, 
                    0, 1, 0, 
                    uv.offset.value()[0], uv.offset.value()[1], 1
                ]);
            }

            let uvMatrix = mat3.create();
            mat3.multiply(uvMatrix, translation, rotation);
            mat3.multiply(uvMatrix, uvMatrix, scale);
            this.properties.set("u_" + key + "UVTransform", uvMatrix);
        }
    }

    parseTextureInfoExtensions(textureInfo, textureKey)
    {
        if (textureInfo.extensions?.KHR_texture_transform === undefined)
        {
            return;
        }

        const uv = textureInfo.extensions.KHR_texture_transform;

        this.textureTransforms.push({
            key: textureKey,
            uv: uv
        });

        if(uv.texCoord !== undefined)
        {
            textureInfo.texCoord = uv.texCoord;
        }

        this.defines.push("HAS_" + textureKey.toUpperCase() + "_UV_TRANSFORM 1");
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
        if (this.type !== "SG")
        {
            this.defines.push("MATERIAL_METALLICROUGHNESS 1");
            this.properties.set("u_BaseColorFactor", this.pbrMetallicRoughness?.baseColorFactor);
            this.properties.set("u_MetallicFactor", this.pbrMetallicRoughness?.metallicFactor);
            this.properties.set("u_RoughnessFactor", this.pbrMetallicRoughness?.roughnessFactor);
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
                this.hasClearcoat = true;

                this.properties.set("u_ClearcoatFactor", this.extensions.KHR_materials_clearcoat.clearcoatFactor);
                this.properties.set("u_ClearcoatRoughnessFactor", this.extensions.KHR_materials_clearcoat.clearcoatRoughnessFactor);

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
            }

            // Sheen material extension
            // https://github.com/sebavan/glTF/tree/KHR_materials_sheen/extensions/2.0/Khronos/KHR_materials_sheen
            if(this.extensions.KHR_materials_sheen !== undefined)
            {
                this.hasSheen = true;

                this.properties.set("u_SheenRoughnessFactor", this.extensions.KHR_materials_sheen.sheenRoughnessFactor);
                this.properties.set("u_SheenColorFactor", this.extensions.KHR_materials_sheen.sheenColorFactor);
                
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
            }

            // KHR Extension: Specular
            if (this.extensions.KHR_materials_specular !== undefined)
            {
                this.hasSpecular = true;

                this.properties.set("u_KHR_materials_specular_specularColorFactor", this.extensions.KHR_materials_specular.specularColorFactor);
                this.properties.set("u_KHR_materials_specular_specularFactor", this.extensions.KHR_materials_specular.specularFactor);

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
            }

            // KHR Extension: Emissive strength
            if (this.extensions.KHR_materials_emissive_strength !== undefined)
            {
                this.hasEmissiveStrength = true;

                this.properties.set("u_EmissiveStrength", this.extensions.KHR_materials_emissive_strength.emissiveStrength);
            }

            // KHR Extension: Transmission
            if (this.extensions.KHR_materials_transmission !== undefined)
            {
                this.hasTransmission = true;

                this.properties.set("u_TransmissionFactor", this.extensions.KHR_materials_transmission.transmissionFactor);

                if (this.transmissionTexture !== undefined)
                {
                    this.transmissionTexture.samplerName = "u_TransmissionSampler";
                    this.parseTextureInfoExtensions(this.transmissionTexture, "Transmission");
                    this.textures.push(this.transmissionTexture);
                    this.defines.push("HAS_TRANSMISSION_MAP 1");
                    this.properties.set("u_TransmissionUVSet", this.transmissionTexture.texCoord);
                }
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

                this.properties.set("u_AttenuationColor", this.extensions.KHR_materials_volume.attenuationColor);
                this.properties.set("u_AttenuationDistance", this.extensions.KHR_materials_volume.attenuationDistance);
                this.properties.set("u_ThicknessFactor", this.extensions.KHR_materials_volume.thicknessFactor);

                if (this.thicknessTexture !== undefined)
                {
                    this.thicknessTexture.samplerName = "u_ThicknessSampler";
                    this.parseTextureInfoExtensions(this.thicknessTexture, "Thickness");
                    this.textures.push(this.thicknessTexture);
                    this.defines.push("HAS_THICKNESS_MAP 1");
                    this.properties.set("u_ThicknessUVSet", this.thicknessTexture.texCoord);
                }
            }

            // KHR Extension: Iridescence
            // See https://github.com/ux3d/glTF/tree/extensions/KHR_materials_iridescence/extensions/2.0/Khronos/KHR_materials_iridescence
            if(this.extensions.KHR_materials_iridescence !== undefined)
            {
                this.hasIridescence = true;

                this.properties.set("u_IridescenceFactor", this.extensions.KHR_materials_iridescence.iridescenceFactor);
                this.properties.set("u_IridescenceIor", this.extensions.KHR_materials_iridescence.iridescenceIor);
                this.properties.set("u_IridescenceThicknessMaximum", this.extensions.KHR_materials_iridescence.iridescenceThicknessMaximum);

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
                    this.properties.set("u_IridescenceThicknessMinimum", this.extensions.KHR_materials_iridescence.iridescenceThicknessMinimum);
                }
            }
        }

        initGlForMembers(this, gltf, webGlContext);
    }

    fromJson(jsonMaterial)
    {
        super.fromJson(jsonMaterial);

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

        if(jsonExtensions.KHR_materials_emissive_strength !== undefined)
        {
            this.fromJsonEmissiveStrength(jsonExtensions.KHR_materials_emissive_strength);
        }
    }

    fromJsonMetallicRoughness(jsonMetallicRoughness)
    {
        makeAnimatable(this.pbrMetallicRoughness, jsonMetallicRoughness, {
            "baseColorFactor": vec4.fromValues(1, 1, 1, 1),
            "metallicFactor": 1,
            "roughnessFactor": 1,
        })

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
        makeAnimatable(this.pbrMetallicRoughness, jsonMetallicRoughness, {
            "clearcoatFactor": 0,
            "clearcoatRoughnessFactor": 0,
        })

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
        makeAnimatable(this.extensions.KHR_materials_sheen, jsonSheen, {
            "sheenRoughnessFactor": 0,
            "sheenColorFactor": [1, 1, 1],
        });
        
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
        makeAnimatable(this.extensions.KHR_materials_transmission, jsonTransmission, {
            "transmissionFactor": 0,
        });

        if(jsonTransmission.transmissionTexture !== undefined)
        {
            const transmissionTexture = new gltfTextureInfo();
            transmissionTexture.fromJson(jsonTransmission.transmissionTexture);
            this.transmissionTexture = transmissionTexture;
        }
    }

    fromJsonSpecular(jsonSpecular)
    {
        makeAnimatable(this.extensions.KHR_materials_specular, jsonSpecular, {
            "specularColorFactor": [1, 1, 1],
            "specularFactor": 1,
        });

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
        makeAnimatable(this.extensions.KHR_materials_volume, jsonVolume, {
            "thicknessFactor": 0,
            "attenuationColor": [1, 1, 1],
            "attenuationDistance": 0,

        });

        if(jsonVolume.thicknessTexture !== undefined)
        {
            const thicknessTexture = new gltfTextureInfo();
            thicknessTexture.fromJson(jsonVolume.thicknessTexture);
            this.thicknessTexture = thicknessTexture;
        }
    }

    fromJsonEmissiveStrength(json)
    {
        makeAnimatable(this.extensions.KHR_materials_emissive_strength, json, {
            "emissiveStrength": 1,
        });
    }

    fromJsonIridescence(jsonIridescence)
    {
        makeAnimatable(this.extensions.KHR_materials_iridescence, jsonIridescence, {
            "factor": 0,
            "iridescenceIor": 1.3,
            "iridescenceThicknessMinimum": 100,
            "iridescenceThicknessMaximum": 400,
        });

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
