import { gltfImage, ImageMimeType } from './image.js';
import { gltfTexture } from './texture.js';
import { gltfSampler } from './sampler.js';

class gltfEnvironmentLoader
{
    constructor(basePath)
    {
        this.basePath = basePath;
    }

    addEnvironmentMap(gltf, subFolder, mipLevel, type)
    {
        let extension;
        switch (type)
        {
            case (ImageMimeType.JPEG):
                extension = ".jpg";
                break;
            case (ImageMimeType.HDR):
                extension = ".hdr";
                break;
            default:
                console.error("Unknown image type: " + type);
                return;
        }

        const imagesFolder = this.basePath + "assets/images/" + subFolder + "/";
        const diffusePrefix = imagesFolder + "diffuse/diffuse_";
        const diffuseSuffix = "_0" + extension;
        const specularPrefix = imagesFolder + "specular/specular_";
        const specularSuffix = "_";
        const sides =
            [
                ["right", gl.TEXTURE_CUBE_MAP_POSITIVE_X],
                ["left", gl.TEXTURE_CUBE_MAP_NEGATIVE_X],
                ["top", gl.TEXTURE_CUBE_MAP_POSITIVE_Y],
                ["bottom", gl.TEXTURE_CUBE_MAP_NEGATIVE_Y],
                ["front", gl.TEXTURE_CUBE_MAP_POSITIVE_Z],
                ["back", gl.TEXTURE_CUBE_MAP_NEGATIVE_Z]
            ];

        gltf.samplers.push(new gltfSampler(gl.LINEAR, gl.LINEAR, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, "DiffuseCubeMapSampler"));
        const diffuseCubeSamplerIdx = gltf.samplers.length - 1;

        gltf.samplers.push(new gltfSampler(gl.LINEAR, gl.LINEAR_MIPMAP_LINEAR, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, "SpecularCubeMapSampler"));
        const specularCubeSamplerIdx = gltf.samplers.length - 1;

        gltf.samplers.push(new gltfSampler(gl.LINEAR, gl.LINEAR, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, "LUTSampler"));
        const lutSamplerIdx = gltf.samplers.length - 1;

        let imageIdx = gltf.images.length;

        let indices = [];

        function addSide(basePath, side, mipLevel)
        {
            for (let i = 0; i <= mipLevel; i++)
            {
                const imagePath = basePath + i + extension;
                const image = new gltfImage(imagePath, side, i);
                image.mimeType = type;
                gltf.images.push(image);
                indices.push(++imageIdx);
            }
        };

        // u_DiffuseEnvSampler faces
        for (const side of sides)
        {
            const imagePath = diffusePrefix + side[0] + diffuseSuffix;
            const image = new gltfImage(imagePath, side[1]);
            image.mimeType = type;
            gltf.images.push(image);
        }

        // u_DiffuseEnvSampler tex
        gltf.textures.push(new gltfTexture(diffuseCubeSamplerIdx, [imageIdx, ++imageIdx, ++imageIdx, ++imageIdx, ++imageIdx, ++imageIdx], gl.TEXTURE_CUBE_MAP));

        // u_SpecularEnvSampler tex
        for (const side of sides)
        {
            addSide(specularPrefix + side[0] + specularSuffix, side[1], mipLevel);
        }

        gltf.textures.push(new gltfTexture(specularCubeSamplerIdx, indices, gl.TEXTURE_CUBE_MAP));

        gltf.images.push(new gltfImage(this.basePath + "assets/images/brdfLUT.png", gl.TEXTURE_2D));

        // u_brdfLUT tex
        gltf.textures.push(new gltfTexture(lutSamplerIdx, [++imageIdx], gl.TEXTURE_2D));
    }
}

export { gltfEnvironmentLoader };
