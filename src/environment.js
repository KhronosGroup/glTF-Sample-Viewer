import { gltfImage, ImageMimeType } from './image.js';
import { gltfTexture } from './texture.js';
import { gltfSampler } from './sampler.js';
import { WebGl } from './webgl.js';

class gltfEnvironmentLoader
{
    constructor(basePath)
    {
        this.basePath = basePath;
    }

    addEnvironmentMap(gltf, environment)
    {
        // Only allow KTX2 to simplify code.
        if (environment.type != ImageMimeType.KTX2)
        {
            return;
        }

        const imagesFolder = this.basePath + "assets/environments/" + environment.folder + "/";

        //
        // Prepare samplers.
        //

        gltf.samplers.push(new gltfSampler(WebGl.context.LINEAR, WebGl.context.LINEAR, WebGl.context.CLAMP_TO_EDGE, WebGl.context.CLAMP_TO_EDGE, "DiffuseCubeMapSampler"));
        const diffuseCubeSamplerIdx = gltf.samplers.length - 1;

        gltf.samplers.push(new gltfSampler(WebGl.context.LINEAR, WebGl.context.LINEAR_MIPMAP_LINEAR, WebGl.context.CLAMP_TO_EDGE, WebGl.context.CLAMP_TO_EDGE, "SpecularCubeMapSampler"));
        const specularCubeSamplerIdx = gltf.samplers.length - 1;

        gltf.samplers.push(new gltfSampler(WebGl.context.LINEAR, WebGl.context.LINEAR_MIPMAP_LINEAR, WebGl.context.CLAMP_TO_EDGE, WebGl.context.CLAMP_TO_EDGE, "SheenCubeMapSampler"));
        const sheenCubeSamplerIdx = gltf.samplers.length - 1;

        gltf.samplers.push(new gltfSampler(WebGl.context.LINEAR, WebGl.context.LINEAR, WebGl.context.CLAMP_TO_EDGE, WebGl.context.CLAMP_TO_EDGE, "LUTSampler"));
        const lutSamplerIdx = gltf.samplers.length - 1;

        //
        // Prepare images and textures.
        //

        let imageIdx = gltf.images.length;

        // Diffuse

        const lambertian = new gltfImage(this.basePath + imagesFolder + "lambertian/diffuse.ktx2", WebGl.context.TEXTURE_CUBE_MAP);
        lambertian.mimeType = ImageMimeType.KTX2;
        gltf.images.push(lambertian);
        gltf.textures.push(new gltfTexture(diffuseCubeSamplerIdx, [imageIdx], WebGl.context.TEXTURE_CUBE_MAP));

        // Specular

        const specular = new gltfImage(this.basePath + imagesFolder + "ggx/specular.ktx2", WebGl.context.TEXTURE_CUBE_MAP);
        specular.mimeType = ImageMimeType.KTX2;
        gltf.images.push(specular);
        gltf.textures.push(new gltfTexture(specularCubeSamplerIdx, [++imageIdx], WebGl.context.TEXTURE_CUBE_MAP));

        // Sheen

        const sheen = new gltfImage(this.basePath + imagesFolder + "charlie/sheen.ktx2", WebGl.context.TEXTURE_CUBE_MAP);
        sheen.mimeType = ImageMimeType.KTX2;
        gltf.images.push(sheen);
        gltf.textures.push(new gltfTexture(sheenCubeSamplerIdx, [++imageIdx], WebGl.context.TEXTURE_CUBE_MAP));

        //
        // Look Up Tables.
        //

        // GGX

        gltf.images.push(new gltfImage(this.basePath + "assets/images/lut_ggx.png", WebGl.context.TEXTURE_2D));
        gltf.textures.push(new gltfTexture(lutSamplerIdx, [++imageIdx], WebGl.context.TEXTURE_2D));

        // Charlie

        gltf.images.push(new gltfImage(this.basePath + "assets/images/lut_charlie.png", WebGl.context.TEXTURE_2D));
        gltf.textures.push(new gltfTexture(lutSamplerIdx, [++imageIdx], WebGl.context.TEXTURE_2D));

        // Thin film

        gltf.images.push(new gltfImage(this.basePath + "assets/images/lut_thin_film.png", WebGl.context.TEXTURE_2D));
        gltf.textures.push(new gltfTexture(lutSamplerIdx, [++imageIdx], WebGl.context.TEXTURE_2D));
    }
}

export { gltfEnvironmentLoader };
