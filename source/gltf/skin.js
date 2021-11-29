import { jsToGlSlice } from './utils.js';
import { GltfObject } from './gltf_object.js';
import { mat4 } from 'gl-matrix';
import { GL  } from '../Renderer/webgl.js';
import { gltfImage } from './image.js';
import { ImageMimeType } from './image_mime_type.js';
import { gltfTexture } from './texture.js';
import { gltfTextureInfo } from './texture.js';
import { gltfSampler } from './sampler.js';

class gltfSkin extends GltfObject
{
    constructor()
    {
        super();

        this.name = "";
        this.inverseBindMatrices = undefined;
        this.joints = [];
        this.skeleton = undefined;

        // not gltf
        this.jointTextureInfo = undefined;
        this.jointWebGlTexture = undefined;
    }

    initGl(gltf, webGlContext)
    {
        this.jointWebGlTexture = webGlContext.createTexture();
        webGlContext.bindTexture( webGlContext.TEXTURE_2D, this.jointWebGlTexture);

        // Ensure mipmapping is disabled and the sampler is configured correctly.
        webGlContext.texParameteri( GL.TEXTURE_2D,  GL.TEXTURE_WRAP_S,  GL.CLAMP_TO_EDGE);
        webGlContext.texParameteri( GL.TEXTURE_2D,  GL.TEXTURE_WRAP_T,  GL.CLAMP_TO_EDGE);
        webGlContext.texParameteri( GL.TEXTURE_2D,  GL.TEXTURE_WRAP_R,  GL.CLAMP_TO_EDGE);
        webGlContext.texParameteri( GL.TEXTURE_2D,  GL.TEXTURE_MIN_FILTER,  GL.NEAREST);
        webGlContext.texParameteri( GL.TEXTURE_2D,  GL.TEXTURE_MAG_FILTER,  GL.NEAREST);
        
        // Now we add the joints texture as a gltf texture info resource, so that 
        // we can just call webGl.setTexture(..., gltfTextureInfo, ...) in the renderer.
        const jointsImage = new gltfImage(
            undefined, // uri
            GL.TEXTURE_2D, // type
            0, // mip level
            undefined, // buffer view
            undefined, // name
            ImageMimeType.GLTEXTURE, // mimeType
            this.jointWebGlTexture // image
        );
        gltf.images.push(jointsImage);

        gltf.samplers.push(new gltfSampler(GL.NEAREST, GL.NEAREST, GL.CLAMP_TO_EDGE, GL.CLAMP_TO_EDGE, undefined));

        const jointsTexture = new gltfTexture(
            gltf.samplers.length - 1,
            gltf.images.length - 1,
            GL.TEXTURE_2D);
        // The webgl texture is already initialized -> this flag informs
        // webgl.setTexture about this.
        jointsTexture.initialized = true;

        gltf.textures.push(jointsTexture);

        this.jointTextureInfo = new gltfTextureInfo(gltf.textures.length - 1, 0, true);
        this.jointTextureInfo.samplerName = "u_jointsSampler";
        this.jointTextureInfo.generateMips = false;
    }

    computeJoints(gltf, parentNode, webGlContext)
    {
        const ibmAccessor = gltf.accessors[this.inverseBindMatrices].getDeinterlacedView(gltf);
        this.jointMatrices = [];
        this.jointNormalMatrices = [];

        const width = Math.ceil(Math.sqrt(this.joints.length * 8));
        let textureData = new Float32Array(Math.pow(width, 2) * 4);

        let i = 0;
        for(const joint of this.joints)
        {
            const node = gltf.nodes[joint];

            let jointMatrix = mat4.create();
            let ibm = jsToGlSlice(ibmAccessor, i * 16, 16);
            mat4.mul(jointMatrix, node.worldTransform, ibm);
            mat4.mul(jointMatrix, parentNode.inverseWorldTransform, jointMatrix);

            let normalMatrix = mat4.create();
            mat4.invert(normalMatrix, jointMatrix);
            mat4.transpose(normalMatrix, normalMatrix);
            
            textureData.set(jointMatrix, i * 32);
            textureData.set(normalMatrix, i * 32 + 16);
            ++i;
        }

        webGlContext.bindTexture( webGlContext.TEXTURE_2D, this.jointWebGlTexture);
        // Set texture format and upload data.
        let internalFormat = webGlContext.RGBA32F;
        let format = webGlContext.RGBA;
        let type = webGlContext.FLOAT;
        let data = textureData;
        webGlContext.texImage2D(
            webGlContext.TEXTURE_2D,
            0, //level
            internalFormat,
            width,
            width,
            0, //border
            format,
            type,
            data);
    }
}

export { gltfSkin };
