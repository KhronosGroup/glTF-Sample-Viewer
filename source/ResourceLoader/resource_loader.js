
import { axios } from '@bundled-es-modules/axios';
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

import { HDRImage } from '../libs/hdrpng.js';

function initKtxLib(view, ktxlib)
{
    view.ktxDecoder = new KtxDecoder(view.context,ktxlib);
}

async function initDracoLib(dracolib)
{
    const dracoDecoder = new DracoDecoder(dracolib);
    if (dracoDecoder !== undefined)
    {
        await dracoDecoder.ready();
    }
}

async function loadGltf(file, view, additionalFiles)
{
    let isGlb = undefined;
    let buffers = undefined;
    let json = undefined;
    let data = undefined;
    if(typeof file === "string")
    {
        isGlb = getIsGlb(file);
        let response = await axios.get(file, { responseType: isGlb ? "arraybuffer" : "json" });
        json = response.data;
        data = response.data;
    }
    else
    {
        let fileContent = file;
        file = file.name;
        isGlb = getIsGlb(file);
        if (isGlb)
        {
            data = await AsyncFileReader.readAsArrayBuffer(fileContent);
        }
        else
        {
            data = await AsyncFileReader.readAsText(fileContent);
            json = JSON.parse(data);
            buffers = additionalFiles;
        }
    }

    if (isGlb)
    {
        const glbParser = new GlbParser(data);
        const glb = glbParser.extractGlbData();
        json = glb.json;
        buffers = glb.buffers;
    }

    const gltf = new glTF(file);
    gltf.ktxDecoder = view.ktxDecoder;
    //Make sure draco decoder instance is ready
    gltf.fromJson(json);

    // because the gltf image paths are not relative
    // to the gltf, we have to resolve all image paths before that
    for (const image of gltf.images)
    {
        image.resolveRelativePath(getContainingFolder(gltf.path));
    }

    await gltfLoader.load(gltf, view.context, buffers);

    return gltf;
}


async function loadEnvironment(file, view)
{
    let image = new HDRImage();
    if (typeof file === "string")
    {
        await image.loadHDR(file);
        await new Promise((resolve, reject) => {
            image.onload = () => resolve(image);
            image.onerror = reject;
        });
    }
    else
    {
        const imageData = await AsyncFileReader.readAsArrayBuffer(file).catch( () => {
            console.error("Could not load image with FileReader");
        });
        await image.loadHDR(new Uint8Array(imageData));
    }
    return loadEnvironmentFromImage(image, view);
}


async function loadEnvironmentFromImage(imageHDR, view)
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
        GL.TEXTURE_CUBE_MAP,
        environmentFiltering.lambertianTextureID);

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
        GL.TEXTURE_CUBE_MAP,
        environmentFiltering.ggxTextureID);

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
        environmentFiltering.ggxTextureID
        );

    environment.images.push(sheenGltfImage);

    const sheenTexture = new gltfTexture(
        sheenCubeSamplerIdx,
        [imageIdx++],
        GL.TEXTURE_CUBE_MAP,
        environmentFiltering.sheenTextureID);

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

    environment.images.push(new gltfImage("assets/images/lut_ggx.png", GL.TEXTURE_2D));
    environment.textures.push(new gltfTexture(lutSamplerIdx, [imageIdx++], GL.TEXTURE_2D));

    environment.lut = new gltfTextureInfo(environment.textures.length - 1);
    environment.lut.generateMips = false;

    // Sheen
    // Charlie

    environment.images.push(new gltfImage("assets/images/lut_charlie.png", GL.TEXTURE_2D));
    environment.textures.push(new gltfTexture(lutSamplerIdx, [imageIdx++], GL.TEXTURE_2D));

    environment.sheenLUT = new gltfTextureInfo(environment.textures.length - 1);
    environment.sheenLUT.generateMips = false;

    // Sheen E LUT

    environment.images.push(new gltfImage("assets/images/lut_sheen_E.png", GL.TEXTURE_2D));
    environment.textures.push(new gltfTexture(lutSamplerIdx, [imageIdx++], GL.TEXTURE_2D));

    environment.sheenELUT = new gltfTextureInfo(environment.textures.length - 1);
    environment.sheenELUT.generateMips = false;

    await gltfLoader.loadImages(environment);

    environment.initGl(view.context);

    environment.mipCount = environmentFiltering.mipmapLevels;

    return environment;
}

export { loadGltf, loadEnvironment, initKtxLib, initDracoLib};
