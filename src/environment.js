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
        let extension;
        switch (environment.type)
        {
        case (ImageMimeType.HDR):
            extension = ".hdr";
            break;
        case (ImageMimeType.PNG):
            extension = ".png";
            break;
        case (ImageMimeType.JPEG):
        default:
            extension = ".jpg";
            break;
        }

        const imagesFolder = this.basePath + "assets/environments/" + environment.folder + "/";
        const diffusePrefix = imagesFolder + "diffuse/diffuse_";
        const diffuseSuffix = "_0" + extension;
        const specularPrefix = imagesFolder + "specular/specular_";
        const specularSuffix = "_";

        const CubeMapSides =
        [
            { name: "right", type: WebGl.context.TEXTURE_CUBE_MAP_POSITIVE_X },
            { name: "left", type: WebGl.context.TEXTURE_CUBE_MAP_NEGATIVE_X },
            { name: "top", type: WebGl.context.TEXTURE_CUBE_MAP_POSITIVE_Y },
            { name: "bottom", type: WebGl.context.TEXTURE_CUBE_MAP_NEGATIVE_Y },
            { name: "front", type: WebGl.context.TEXTURE_CUBE_MAP_POSITIVE_Z },
            { name: "back", type: WebGl.context.TEXTURE_CUBE_MAP_NEGATIVE_Z },
        ];

        gltf.samplers.push(new gltfSampler(WebGl.context.LINEAR, WebGl.context.LINEAR, WebGl.context.CLAMP_TO_EDGE, WebGl.context.CLAMP_TO_EDGE, "DiffuseCubeMapSampler"));
        const diffuseCubeSamplerIdx = gltf.samplers.length - 1;

        gltf.samplers.push(new gltfSampler(WebGl.context.LINEAR, WebGl.context.LINEAR_MIPMAP_LINEAR, WebGl.context.CLAMP_TO_EDGE, WebGl.context.CLAMP_TO_EDGE, "SpecularCubeMapSampler"));
        const specularCubeSamplerIdx = gltf.samplers.length - 1;

        gltf.samplers.push(new gltfSampler(WebGl.context.LINEAR, WebGl.context.LINEAR, WebGl.context.CLAMP_TO_EDGE, WebGl.context.CLAMP_TO_EDGE, "LUTSampler"));
        const lutSamplerIdx = gltf.samplers.length - 1;

        let imageIdx = gltf.images.length;

        // u_DiffuseEnvSampler faces
        for (const side of CubeMapSides)
        {
            const imagePath = diffusePrefix + side.name + diffuseSuffix;
            const image = new gltfImage(imagePath, side.type);
            image.mimeType = environment.type;
            gltf.images.push(image);
        }

        // u_DiffuseEnvSampler tex
        gltf.textures.push(new gltfTexture(diffuseCubeSamplerIdx, [imageIdx, ++imageIdx, ++imageIdx, ++imageIdx, ++imageIdx, ++imageIdx], WebGl.context.TEXTURE_CUBE_MAP));

        const indices = [];
        function addSide(basePath, side, mipLevel)
        {
            for (let i = 0; i < mipLevel; i++)
            {
                const imagePath = basePath + i + extension;
                const image = new gltfImage(imagePath, side, i);
                image.mimeType = environment.type;
                gltf.images.push(image);
                indices.push(++imageIdx);
            }
        }

        // u_SpecularEnvSampler tex
        for (const side of CubeMapSides)
        {
            addSide(specularPrefix + side.name + specularSuffix, side.type, environment.mipLevel);
        }

        gltf.textures.push(new gltfTexture(specularCubeSamplerIdx, indices, WebGl.context.TEXTURE_CUBE_MAP));

        gltf.images.push(new gltfImage(this.basePath + "assets/images/brdfLUT.png", WebGl.context.TEXTURE_2D));

        // u_brdfLUT tex
        gltf.textures.push(new gltfTexture(lutSamplerIdx, [++imageIdx], WebGl.context.TEXTURE_2D));
    }
}

export { gltfEnvironmentLoader };
