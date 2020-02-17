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
        case (ImageMimeType.KTX2):
            extension = ".ktx2";
            break;
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
        const diffusePrefix = imagesFolder + "lambertian/diffuse_";
        const diffuseSuffix = "_0" + extension;
        const specularPrefix = imagesFolder + "ggx/specular_";
        const specularSuffix = "_";
        const sheenPrefix = imagesFolder + "charlie/specular_";
        const sheenSuffix = "_";

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

        gltf.samplers.push(new gltfSampler(WebGl.context.LINEAR, WebGl.context.LINEAR_MIPMAP_LINEAR, WebGl.context.CLAMP_TO_EDGE, WebGl.context.CLAMP_TO_EDGE, "SheenCubeMapSampler"));
        const sheenCubeSamplerIdx = gltf.samplers.length - 1;

        gltf.samplers.push(new gltfSampler(WebGl.context.LINEAR, WebGl.context.LINEAR, WebGl.context.CLAMP_TO_EDGE, WebGl.context.CLAMP_TO_EDGE, "LUTSampler"));
        const lutSamplerIdx = gltf.samplers.length - 1;

        let imageIdx = gltf.images.length;

		if (environment.type != ImageMimeType.KTX2)
		{
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
			
			// u_SheenEnvSampler tex
			
			// Sheen and specualr need to have same mip level.
			
			gltf.textures.push(new gltfTexture(sheenCubeSamplerIdx, indices, WebGl.context.TEXTURE_CUBE_MAP));
		}
		else
		{
			const lambertian = new gltfImage(this.basePath + imagesFolder + "lambertian/diffuse" + extension, WebGl.context.TEXTURE_CUBE_MAP);
			lambertian.mimeType = ImageMimeType.KTX2;
			gltf.images.push(lambertian);

			gltf.textures.push(new gltfTexture(diffuseCubeSamplerIdx, [imageIdx], WebGl.context.TEXTURE_CUBE_MAP));			
			
			//

			const specular = new gltfImage(this.basePath + imagesFolder + "ggx/specular" + extension, WebGl.context.TEXTURE_CUBE_MAP);
			specular.mimeType = ImageMimeType.KTX2;
			gltf.images.push(specular);

			gltf.textures.push(new gltfTexture(specularCubeSamplerIdx, [++imageIdx], WebGl.context.TEXTURE_CUBE_MAP));			
			
			//

			const sheen = new gltfImage(this.basePath + imagesFolder + "charlie/sheen" + extension, WebGl.context.TEXTURE_CUBE_MAP);
			sheen.mimeType = ImageMimeType.KTX2;
			gltf.images.push(sheen);

			gltf.textures.push(new gltfTexture(sheenCubeSamplerIdx, [++imageIdx], WebGl.context.TEXTURE_CUBE_MAP));
		}

        gltf.images.push(new gltfImage(this.basePath + "assets/images/lut_ggx.png", WebGl.context.TEXTURE_2D));
        gltf.images.push(new gltfImage(this.basePath + "assets/images/lut_charlie.png", WebGl.context.TEXTURE_2D));

        // u_brdfLUT tex
        gltf.textures.push(new gltfTexture(lutSamplerIdx, [++imageIdx], WebGl.context.TEXTURE_2D));
        gltf.textures.push(new gltfTexture(lutSamplerIdx, [++imageIdx], WebGl.context.TEXTURE_2D));
    }
}

export { gltfEnvironmentLoader };
