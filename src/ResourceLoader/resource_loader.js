import axios from '../../libs/axios.min.js';
import { glTF } from '../gltf.js';
import { getIsGlb } from '../utils.js';
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

    await gltfLoader.load(gltf, buffers);

    return gltf;
}

async function loadPrefilteredEnvironmentFromPath(filteredEnvironmentsDirectoryPath)
{
    // TODO: create class for environment
    const environment = new glTF(); // don't even

    //
    // Prepare samplers.
    //

    environment.samplers.push(new gltfSampler(WebGl.context.LINEAR, WebGl.context.LINEAR, WebGl.context.CLAMP_TO_EDGE, WebGl.context.CLAMP_TO_EDGE, "DiffuseCubeMapSampler"));
    const diffuseCubeSamplerIdx = environment.samplers.length - 1;

    environment.samplers.push(new gltfSampler(WebGl.context.LINEAR, WebGl.context.LINEAR_MIPMAP_LINEAR, WebGl.context.CLAMP_TO_EDGE, WebGl.context.CLAMP_TO_EDGE, "SpecularCubeMapSampler"));
    const specularCubeSamplerIdx = environment.samplers.length - 1;

    environment.samplers.push(new gltfSampler(WebGl.context.LINEAR, WebGl.context.LINEAR_MIPMAP_LINEAR, WebGl.context.CLAMP_TO_EDGE, WebGl.context.CLAMP_TO_EDGE, "SheenCubeMapSampler"));
    const sheenCubeSamplerIdx = environment.samplers.length - 1;

    environment.samplers.push(new gltfSampler(WebGl.context.LINEAR, WebGl.context.LINEAR, WebGl.context.CLAMP_TO_EDGE, WebGl.context.CLAMP_TO_EDGE, "LUTSampler"));
    const lutSamplerIdx = environment.samplers.length - 1;

    //
    // Prepare images and textures.
    //

    let imageIdx = environment.images.length;

    // Diffuse

    const lambertian = new gltfImage(filteredEnvironmentsDirectoryPath + "lambertian/diffuse.ktx2", WebGl.context.TEXTURE_CUBE_MAP);
    lambertian.mimeType = ImageMimeType.KTX2;
    environment.images.push(lambertian);
    environment.textures.push(new gltfTexture(diffuseCubeSamplerIdx, [imageIdx], WebGl.context.TEXTURE_CUBE_MAP));

    // Specular

    const specular = new gltfImage(filteredEnvironmentsDirectoryPath + "ggx/specular.ktx2", WebGl.context.TEXTURE_CUBE_MAP);
    specular.mimeType = ImageMimeType.KTX2;
    environment.images.push(specular);
    environment.textures.push(new gltfTexture(specularCubeSamplerIdx, [++imageIdx], WebGl.context.TEXTURE_CUBE_MAP));

    // Sheen

    const sheen = new gltfImage(filteredEnvironmentsDirectoryPath + "charlie/sheen.ktx2", WebGl.context.TEXTURE_CUBE_MAP);
    sheen.mimeType = ImageMimeType.KTX2;
    environment.images.push(sheen);
    environment.textures.push(new gltfTexture(sheenCubeSamplerIdx, [++imageIdx], WebGl.context.TEXTURE_CUBE_MAP));

    //
    // Look Up Tables.
    //

    // GGX

    environment.images.push(new gltfImage("assets/images/lut_ggx.png", WebGl.context.TEXTURE_2D));
    environment.textures.push(new gltfTexture(lutSamplerIdx, [++imageIdx], WebGl.context.TEXTURE_2D));

    // Sheen
    // Charlie
    environment.images.push(new gltfImage("assets/images/lut_charlie.png", WebGl.context.TEXTURE_2D));
    environment.textures.push(new gltfTexture(lutSamplerIdx, [++imageIdx], WebGl.context.TEXTURE_2D));
    // Sheen E LUT
    environment.images.push(new gltfImage("assets/images/lut_sheen_E.png", WebGl.context.TEXTURE_2D));
    environment.textures.push(new gltfTexture(lutSamplerIdx, [++imageIdx], WebGl.context.TEXTURE_2D));

    return environment;
}

export { loadGltfFromPath };
