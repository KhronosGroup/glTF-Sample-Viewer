import { jsToGl } from './utils.js';
import { GltfObject } from './gltf_object.js';
import { WebGl } from './webgl.js';

// https://github.com/KhronosGroup/glTF/blob/khr_ktx2_ibl/extensions/2.0/Khronos/KHR_lights_image_based/schema/imageBasedLight.schema.json

class ImageBasedLight extends GltfObject
{
    constructor()
    {
        super();
        this.rotation = jsToGl([0, 0, 0, 1]);
        this.brightnessFactor = 1;
        this.brightnessOffset = 0;
        this.specularEnvironmentTexture = undefined;
        this.diffuseEnvironmentTexture = undefined;
        this.sheenEnvironmentTexture = undefined;

        // non-gltf
        this.levelCount = 1;
    }

    fromJson(jsonIBL)
    {
        super.fromJson(jsonIBL);

        if(jsonIBL.extensions !== undefined)
        {
            this.fromJsonExtensions(jsonIBL.extensions);
        }
    }

    fromJsonExtensions(extensions)
    {
        if (extensions.KHR_materials_sheen !== undefined)
        {
            this.sheenEnvironmentTexture = extensions.KHR_materials_sheen.sheenEnvironmentTexture;
        }
    }

    initGl(gltf)
    {
        if (this.diffuseEnvironmentTexture !== undefined)
        {
            const textureObject = gltf.textures[this.diffuseEnvironmentTexture];
            textureObject.type = WebGl.context.TEXTURE_CUBE_MAP;
        }
        if (this.specularEnvironmentTexture !== undefined)
        {
            const textureObject = gltf.textures[this.specularEnvironmentTexture];
            textureObject.type = WebGl.context.TEXTURE_CUBE_MAP;

            const imageObject = gltf.images[textureObject.source];
            this.levelCount = imageObject.image.levelCount;
        }
        if(this.sheenEnvironmentTexture !== undefined)
        {
            const textureObject = gltf.textures[this.sheenEnvironmentTexture];
            textureObject.type = WebGl.context.TEXTURE_CUBE_MAP;

            const imageObject = gltf.images[textureObject.source];
            if (this.levelCount !== imageObject.image.levelCount)
            {
                console.error("Specular and sheen do not have same level count");
            }
        }
    }
}

export { ImageBasedLight };
