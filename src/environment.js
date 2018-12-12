import { gltfImage, ImageMimeType } from './image.js';
import { gltfTexture } from './texture.js';
import { gltfSampler } from './sampler.js';

class gltfEnvironmentLoader
{
    constructor(basePath)
    {
        this.basePath = basePath;
    }

    addEnvironmentMap(gltf, environment, type)
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

        const imagesFolder = this.basePath + "assets/images/" + environment.folder + "/";
        const diffusePrefix = imagesFolder + "diffuse/diffuse_";
        const diffuseSuffix = "_0" + extension;
        const specularPrefix = imagesFolder + "specular/specular_";
        const specularSuffix = "_";

        const CubeMapSides =
        [
            { name: "right", type: gl.TEXTURE_CUBE_MAP_POSITIVE_X },
            { name: "left", type: gl.TEXTURE_CUBE_MAP_NEGATIVE_X },
            { name: "top", type: gl.TEXTURE_CUBE_MAP_POSITIVE_Y },
            { name: "bottom", type: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y },
            { name: "front", type: gl.TEXTURE_CUBE_MAP_POSITIVE_Z },
            { name: "back", type: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z },
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
        for (const side of CubeMapSides)
        {
            const imagePath = diffusePrefix + side.name + diffuseSuffix;
            const image = new gltfImage(imagePath, side.type);
            image.mimeType = type;
            gltf.images.push(image);
        }

        // u_DiffuseEnvSampler tex
        gltf.textures.push(new gltfTexture(diffuseCubeSamplerIdx, [imageIdx, ++imageIdx, ++imageIdx, ++imageIdx, ++imageIdx, ++imageIdx], gl.TEXTURE_CUBE_MAP));

        // u_SpecularEnvSampler tex
        for (const side of CubeMapSides)
        {
            addSide(specularPrefix + side.name + specularSuffix, side.type, environment.mipLevel);
        }

        gltf.textures.push(new gltfTexture(specularCubeSamplerIdx, indices, gl.TEXTURE_CUBE_MAP));

        gltf.images.push(new gltfImage(this.basePath + "assets/images/brdfLUT.png", gl.TEXTURE_2D));

        // u_brdfLUT tex
        gltf.textures.push(new gltfTexture(lutSamplerIdx, [++imageIdx], gl.TEXTURE_2D));
    }
}

export { gltfEnvironmentLoader };
