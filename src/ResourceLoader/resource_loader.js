import axios from '../../libs/axios.min.js';
import { glTF } from '../gltf.js';
import { getIsGlb, getContainingFolder } from '../utils.js';
import { GlbParser } from '../glb_parser.js';
import { gltfLoader } from "../loader";
import { gltfImage, ImageMimeType } from "../image";
import { gltfTexture } from '../texture.js';
import { gltfSampler } from '../sampler.js';
import { WebGl } from '../webgl.js';

async function loadGltfFromPath(path)
{
    const isGlb = getIsGlb(path);

    let response = await axios.get(path, { responseType: isGlb ? "arraybuffer" : "json" });

    let json = response.data;
    let buffers = undefined;

    if (isGlb)
    {
        const glbParser = new GlbParser(response.data);
        const glb = glbParser.extractGlbData();
        json = glb.json;
        buffers = glb.buffers;
    }

    const gltf = new glTF(path);
    gltf.fromJson(json);

    // because the gltf image paths are not relative
    // to the gltf, we have to resolve all image paths before that
    for (const image of gltf.images)
    {
        image.resolveRelativePath(getContainingFolder(gltf.path));
    }

    await gltfLoader.load(gltf, buffers);

    return gltf;
}

async function loadPrefilteredEnvironmentFromPath(filteredEnvironmentsDirectoryPath, gltf)
{
    // TODO: create class for environment
    const environment = new glTF();

    //
    // Prepare samplers.
    //

    let samplerIdx = gltf.samplers.length;

    environment.samplers.push(new gltfSampler(WebGl.context.LINEAR, WebGl.context.LINEAR, WebGl.context.CLAMP_TO_EDGE, WebGl.context.CLAMP_TO_EDGE, "DiffuseCubeMapSampler"));
    const diffuseCubeSamplerIdx = samplerIdx++;

    environment.samplers.push(new gltfSampler(WebGl.context.LINEAR, WebGl.context.LINEAR_MIPMAP_LINEAR, WebGl.context.CLAMP_TO_EDGE, WebGl.context.CLAMP_TO_EDGE, "SpecularCubeMapSampler"));
    const specularCubeSamplerIdx = samplerIdx++;

    environment.samplers.push(new gltfSampler(WebGl.context.LINEAR, WebGl.context.LINEAR_MIPMAP_LINEAR, WebGl.context.CLAMP_TO_EDGE, WebGl.context.CLAMP_TO_EDGE, "SheenCubeMapSampler"));
    const sheenCubeSamplerIdx = samplerIdx++;

    environment.samplers.push(new gltfSampler(WebGl.context.LINEAR, WebGl.context.LINEAR, WebGl.context.CLAMP_TO_EDGE, WebGl.context.CLAMP_TO_EDGE, "LUTSampler"));
    const lutSamplerIdx = samplerIdx++;

    //
    // Prepare images and textures.
    //

    let textureIdx = gltf.images.length;

    // Diffuse

    const lambertian = new gltfImage(filteredEnvironmentsDirectoryPath + "/lambertian/diffuse.ktx2", WebGl.context.TEXTURE_CUBE_MAP);
    lambertian.mimeType = ImageMimeType.KTX2;
    environment.images.push(lambertian);
    environment.textures.push(new gltfTexture(diffuseCubeSamplerIdx, [textureIdx++], WebGl.context.TEXTURE_CUBE_MAP));

    // Specular

    const specular = new gltfImage(filteredEnvironmentsDirectoryPath + "/ggx/specular.ktx2", WebGl.context.TEXTURE_CUBE_MAP);
    specular.mimeType = ImageMimeType.KTX2;
    environment.images.push(specular);
    environment.textures.push(new gltfTexture(specularCubeSamplerIdx, [textureIdx++], WebGl.context.TEXTURE_CUBE_MAP));

    // Sheen

    const sheen = new gltfImage(filteredEnvironmentsDirectoryPath + "/charlie/sheen.ktx2", WebGl.context.TEXTURE_CUBE_MAP);
    sheen.mimeType = ImageMimeType.KTX2;
    environment.images.push(sheen);
    environment.textures.push(new gltfTexture(sheenCubeSamplerIdx, [textureIdx++], WebGl.context.TEXTURE_CUBE_MAP));

    //
    // Look Up Tables.
    //

    // GGX

    environment.images.push(new gltfImage("assets/images/lut_ggx.png", WebGl.context.TEXTURE_2D));
    environment.textures.push(new gltfTexture(lutSamplerIdx, [textureIdx++], WebGl.context.TEXTURE_2D));

    // Sheen
    // Charlie
    environment.images.push(new gltfImage("assets/images/lut_charlie.png", WebGl.context.TEXTURE_2D));
    environment.textures.push(new gltfTexture(lutSamplerIdx, [textureIdx++], WebGl.context.TEXTURE_2D));
    // Sheen E LUT
    environment.images.push(new gltfImage("assets/images/lut_sheen_E.png", WebGl.context.TEXTURE_2D));
    environment.textures.push(new gltfTexture(lutSamplerIdx, [textureIdx++], WebGl.context.TEXTURE_2D));

    await gltfLoader.loadImages(environment).then(() => gltfLoader.processImages(environment));

    environment.initGl();

    return environment;
}

export { loadGltfFromPath, loadPrefilteredEnvironmentFromPath };
