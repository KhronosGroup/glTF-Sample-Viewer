
import axios from 'axios';
import { glTF } from '../gltf/gltf.js';
import { getIsGlb, getContainingFolder } from '../gltf/utils.js';
import { GlbParser } from './glb_parser.js';
import { gltfLoader } from "./loader.js";
import { gltfImage, ImageMimeType } from "../gltf/image.js";
import { gltfTexture, gltfTextureInfo } from '../gltf/texture.js';
import { gltfSampler } from '../gltf/sampler.js';
import { GL } from '../Renderer/webgl.js';
import { iblSampler } from '../ibl_sampler.js';


import { AsyncFileReader } from './async_file_reader.js';

import { DracoDecoder } from './draco.js';
import { KtxDecoder } from './ktx.js';

import { loadHDR } from '../libs/hdrpng.js';

/**
 * ResourceLoader can be used to load resources for the GltfState
 * that are then used to display the loaded data with GltfView
 */
class ResourceLoader
{
    /**
     * ResourceLoader class that provides an interface to load resources into
     * the view. Typically this is created with GltfView.createResourceLoader()
     * You cannot share resource loaders between GltfViews as some of the resources
     * are allocated directly on the WebGl2 Context
     * @param {Object} view the GltfView for which the resources are loaded
     */
    constructor(view)
    {
        this.view = view;
    }

    /**
     * loadGltf asynchroneously and create resources for rendering
     * @param {(String | ArrayBuffer | File)} gltfFile the .gltf or .glb file either as path or as preloaded resource. In node.js environments, only ArrayBuffer types are accepted.
     * @param {File[]} [externalFiles] additional files containing resources that are referenced in the gltf
     * @returns {Promise} a promise that fulfills when the gltf file was loaded
     */
    async loadGltf(gltfFile, externalFiles)
    {
        let isGlb = undefined;
        let buffers = undefined;
        let json = undefined;
        let data = undefined;
        let filename = "";
        if (typeof gltfFile === "string")
        {
            isGlb = getIsGlb(gltfFile);
            let response = await axios.get(gltfFile, { responseType: isGlb ? "arraybuffer" : "json" });
            json = response.data;
            data = response.data;
            filename = gltfFile;
        }
        else if (gltfFile instanceof ArrayBuffer)
        {
            isGlb = externalFiles === undefined;
            if (isGlb)
            {
                data = gltfFile;
            }
            else
            {
                console.error("Only .glb files can be loaded from an array buffer");
            }
        }
        else if (typeof (File) !== 'undefined' && gltfFile instanceof File)
        {
            let fileContent = gltfFile;
            filename = gltfFile.name;
            isGlb = getIsGlb(filename);
            if (isGlb)
            {
                data = await AsyncFileReader.readAsArrayBuffer(fileContent);
            }
            else
            {
                data = await AsyncFileReader.readAsText(fileContent);
                json = JSON.parse(data);
                buffers = externalFiles;
            }
        }
        else
        {
            console.error("Passed invalid type to loadGltf " + typeof (gltfFile));
        }

        if (isGlb)
        {
            const glbParser = new GlbParser(data);
            const glb = glbParser.extractGlbData();
            json = glb.json;
            buffers = glb.buffers;
        }

        const gltf = new glTF(filename);
        gltf.ktxDecoder = this.view.ktxDecoder;
        //Make sure draco decoder instance is ready
        gltf.fromJson(json);

        // because the gltf image paths are not relative
        // to the gltf, we have to resolve all image paths before that
        for (const image of gltf.images)
        {
            image.resolveRelativePath(getContainingFolder(gltf.path));
        }

        await gltfLoader.load(gltf, this.view.context, buffers);

        return gltf;
    }

    /**
     * loadEnvironment asynchroneously, run IBL sampling and create resources for rendering
     * @param {(String | ArrayBuffer | File)} environmentFile the .hdr file either as path or resource
     * @param {Object} [lutFiles] object containing paths or resources for the environment look up textures. Keys are lut_ggx_file, lut_charlie_file and lut_sheen_E_file
     * @returns {Promise} a promise that fulfills when the environment file was loaded
     */
    async loadEnvironment(environmentFile, lutFiles)
    {
        let image = undefined;
        if (typeof environmentFile === "string")
        {
            let response = await axios.get(environmentFile, { responseType: "arraybuffer" });

            image = await loadHDR(new Uint8Array(response.data));
        }
        else if (environmentFile instanceof ArrayBuffer)
        {
            image = await loadHDR(new Uint8Array(environmentFile));
        }
        else if (typeof (File) !== 'undefined' && environmentFile instanceof File)
        {
            const imageData = await AsyncFileReader.readAsArrayBuffer(environmentFile).catch(() =>
            {
                console.error("Could not load image with FileReader");
            });
            image = await loadHDR(new Uint8Array(imageData));
        }
        else
        {
            console.error("Passed invalid type to loadEnvironment " + typeof (gltfFile));
        }
        if (image === undefined)
        {
            return undefined;
        }
        return _loadEnvironmentFromPanorama(image, this.view, lutFiles);
    }

    /**
     * initKtxLib must be called before loading gltf files with ktx2 assets
     * @param {Object} [externalKtxLib] external ktx library (for example from a CDN)
     */
    initKtxLib(externalKtxLib)
    {
        this.view.ktxDecoder = new KtxDecoder(this.view.context, externalKtxLib);
    }

    /**
     * initDracoLib must be called before loading gltf files with draco meshes
     * @param {*} [externalDracoLib] external draco library (for example from a CDN)
     */
    async initDracoLib(externalDracoLib)
    {
        const dracoDecoder = new DracoDecoder(externalDracoLib);
        if (dracoDecoder !== undefined)
        {
            await dracoDecoder.ready();
        }
    }
}

async function _loadEnvironmentFromPanorama(imageHDR, view, luts)
{
    // The environment uses the same type of samplers, textures and images as used in the glTF class
    // so we just use it as a template
    const environment = new glTF();

    //
    // Prepare samplers.
    //

    let samplerIdx = environment.samplers.length;

    environment.samplers.push(new gltfSampler(GL.LINEAR, GL.LINEAR, GL.CLAMP_TO_EDGE, GL.CLAMP_TO_EDGE, "DiffuseCubeMapSampler"));
    const diffuseCubeSamplerIdx = samplerIdx++;

    environment.samplers.push(new gltfSampler(GL.LINEAR, GL.LINEAR_MIPMAP_LINEAR, GL.CLAMP_TO_EDGE, GL.CLAMP_TO_EDGE, "SpecularCubeMapSampler"));
    const specularCubeSamplerIdx = samplerIdx++;

    environment.samplers.push(new gltfSampler(GL.LINEAR, GL.LINEAR_MIPMAP_LINEAR, GL.CLAMP_TO_EDGE, GL.CLAMP_TO_EDGE, "SheenCubeMapSampler"));
    const sheenCubeSamplerIdx = samplerIdx++;

    environment.samplers.push(new gltfSampler(GL.LINEAR, GL.LINEAR, GL.CLAMP_TO_EDGE, GL.CLAMP_TO_EDGE, "LUTSampler"));
    const lutSamplerIdx = samplerIdx++;

    //
    // Prepare images and textures.
    //

    let imageIdx = environment.images.length;

    let environmentFiltering = new iblSampler(view);

    environmentFiltering.init(imageHDR);
    environmentFiltering.filterAll();

    // Diffuse

    const diffuseGltfImage = new gltfImage(
        undefined,
        GL.TEXTURE_CUBE_MAP,
        0,
        undefined,
        "Diffuse",
        ImageMimeType.GLTEXTURE,
        environmentFiltering.lambertianTextureID
    );

    environment.images.push(diffuseGltfImage);

    const diffuseTexture = new gltfTexture(
        diffuseCubeSamplerIdx,
        [imageIdx++],
        GL.TEXTURE_CUBE_MAP);
    diffuseTexture.initialized = true; // iblsampler has already initialized the texture

    environment.textures.push(diffuseTexture);

    environment.diffuseEnvMap = new gltfTextureInfo(environment.textures.length - 1, 0, true);
    environment.diffuseEnvMap.generateMips = false;



    // Specular
    const specularGltfImage = new gltfImage(
        undefined,
        GL.TEXTURE_CUBE_MAP,
        0,
        undefined,
        "Specular",
        ImageMimeType.GLTEXTURE,
        environmentFiltering.ggxTextureID
    );

    environment.images.push(specularGltfImage);

    const specularTexture = new gltfTexture(
        specularCubeSamplerIdx,
        [imageIdx++],
        GL.TEXTURE_CUBE_MAP);
    specularTexture.initialized = true; // iblsampler has already initialized the texture

    environment.textures.push(specularTexture);

    environment.specularEnvMap = new gltfTextureInfo(environment.textures.length - 1, 0, true);
    environment.specularEnvMap.generateMips = false;


    // Sheen
    const sheenGltfImage = new gltfImage(
        undefined,
        GL.TEXTURE_CUBE_MAP,
        0,
        undefined,
        "Sheen",
        ImageMimeType.GLTEXTURE,
        environmentFiltering.sheenTextureID
    );

    environment.images.push(sheenGltfImage);

    const sheenTexture = new gltfTexture(
        sheenCubeSamplerIdx,
        [imageIdx++],
        GL.TEXTURE_CUBE_MAP);
    sheenTexture.initialized = true; // iblsampler has already initialized the texture

    environment.textures.push(sheenTexture);

    environment.sheenEnvMap = new gltfTextureInfo(environment.textures.length - 1, 0, true);
    environment.sheenEnvMap.generateMips = false;

    /*
        // Diffuse

        const lambertian = new gltfImage(filteredEnvironmentsDirectoryPath + "/lambertian/diffuse.ktx2", GL.TEXTURE_CUBE_MAP);
        lambertian.mimeType = ImageMimeType.KTX2;
        environment.images.push(lambertian);
        environment.textures.push(new gltfTexture(diffuseCubeSamplerIdx, [imageIdx++], GL.TEXTURE_CUBE_MAP));
        environment.diffuseEnvMap = new gltfTextureInfo(environment.textures.length - 1, 0, true);
        environment.diffuseEnvMap.generateMips = false;

        // Specular

        const specular = new gltfImage(filteredEnvironmentsDirectoryPath + "/ggx/specular.ktx2", GL.TEXTURE_CUBE_MAP);
        specular.mimeType = ImageMimeType.KTX2;
        environment.images.push(specular);
        environment.textures.push(new gltfTexture(specularCubeSamplerIdx, [imageIdx++], GL.TEXTURE_CUBE_MAP));
        environment.specularEnvMap = new gltfTextureInfo(environment.textures.length - 1, 0, true);
        environment.specularEnvMap.generateMips = false;

        const specularImage = environment.images[environment.textures[environment.textures.length - 1].source];

        // Sheen

        const sheen = new gltfImage(filteredEnvironmentsDirectoryPath + "/charlie/sheen.ktx2", GL.TEXTURE_CUBE_MAP);
        sheen.mimeType = ImageMimeType.KTX2;
        environment.images.push(sheen);
        environment.textures.push(new gltfTexture(sheenCubeSamplerIdx, [imageIdx++], GL.TEXTURE_CUBE_MAP));
        environment.sheenEnvMap = new gltfTextureInfo(environment.textures.length - 1, 0, true);
        environment.sheenEnvMap.generateMips = false;*/

    //
    // Look Up Tables.
    //

    // GGX

    if (luts === undefined)
    {
        luts = {
            lut_sheen_E_file: "assets/images/lut_sheen_E.png",
        };
    }

    environment.images.push(new gltfImage(
        undefined, 
        GL.TEXTURE_2D, 
        0, 
        undefined, 
        undefined, 
        ImageMimeType.GLTEXTURE, 
        environmentFiltering.ggxLutTextureID));
    const lutTexture = new gltfTexture(lutSamplerIdx, [imageIdx++], GL.TEXTURE_2D);
    lutTexture.initialized = true; // iblsampler has already initialized the texture
    environment.textures.push(lutTexture);

    environment.lut = new gltfTextureInfo(environment.textures.length - 1, 0 , true);
    environment.lut.generateMips = false;

    // Sheen
    // Charlie
    environment.images.push(new gltfImage(
        undefined, 
        GL.TEXTURE_2D, 
        0, 
        undefined, 
        undefined, 
        ImageMimeType.GLTEXTURE, 
        environmentFiltering.charlieLutTextureID));
    const charlieLut = new gltfTexture(lutSamplerIdx, [imageIdx++], GL.TEXTURE_2D);
    charlieLut.initialized = true; // iblsampler has already initialized the texture
    environment.textures.push(charlieLut);

    environment.sheenLUT = new gltfTextureInfo(environment.textures.length - 1, 0, true);
    environment.sheenLUT.generateMips = false;

    // Sheen E LUT

    environment.images.push(new gltfImage(luts.lut_sheen_E_file, GL.TEXTURE_2D, 0, undefined, undefined, ImageMimeType.PNG));
    const sheenELut = new gltfTexture(lutSamplerIdx, [imageIdx++], GL.TEXTURE_2D);
    sheenELut.initialized = true; // iblsampler has already initialized the texture
    environment.textures.push(sheenELut);

    environment.sheenELUT = new gltfTextureInfo(environment.textures.length - 1);
    environment.sheenELUT.generateMips = false;

    await gltfLoader.loadImages(environment);

    environment.initGl(view.context);

    environment.mipCount = environmentFiltering.mipmapLevels;

    return environment;
}

export { ResourceLoader };
