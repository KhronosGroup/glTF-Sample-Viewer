import { gltfAccessor } from './accessor.js';
import { gltfBuffer } from './buffer.js';
import { gltfBufferView } from './buffer_view.js';
import { gltfCamera } from './camera.js';
import { gltfImage } from './image.js';
import { gltfLight } from './light.js';
import { gltfMaterial, DefaultMaterial } from './material.js';
import { gltfMesh } from './mesh.js';
import { gltfNode } from './node.js';
import { gltfSampler } from './sampler.js';
import { gltfScene } from './scene.js';
import { gltfTexture } from './texture.js';
import { getContainingFolder, initGlForMembers, objectsFromJsons } from './utils';
import { gltfAsset } from './asset.js';

class glTF
{
    constructor(file)
    {
        this.asset = new gltfAsset();
        this.accessors = [];
        this.nodes = [];
        this.scene = undefined; // the default scene to show.
        this.scenes = [];
        this.cameras = [];
        this.lights = [];
        this.textures = [];
        this.images = [];
        this.samplers = [];
        this.meshes = [];
        this.buffers = [];
        this.bufferViews = [];
        this.materials = [];
        this.defaultSampler  = -1;
        this.cubemapSampler  = -1;
        this.path = file;
    }

    initGl(gltf)
    {
        initGlForMembers(this, gltf);
    }

    fromJsonAsset(jsonAsset)
    {
        this.asset.fromJson(jsonAsset);
    }

    fromJsonNodes(jsonNodes)
    {
        for (let i = 0; i < jsonNodes.length; ++i)
        {
            const jsonNode = jsonNodes[i];
            let node = new gltfNode();
            node.fromJson(jsonNode);
            this.nodes.push(node);

            // assign the corresponding camera node
            if(node.camera !== undefined)
            {
                this.cameras[node.camera].node = i;
            }

            if(jsonNode.extensions !== undefined)
            {
                if (jsonNode.extensions.KHR_lights_punctual !== undefined)
                {
                    this.lights[jsonNode.extensions.KHR_lights_punctual.light].node = i;
                }
            }
        }
    }

    fromJsonImages(jsonImages)
    {
        for (const jsonImage of jsonImages)
        {
            const image = new gltfImage();
            image.fromJson(jsonImage, getContainingFolder(this.path));
            this.images.push(image);
        }
    }

    fromJsonTextures(jsonTextures)
    {
        for (const jsonTexture of jsonTextures)
        {
            const texture = new gltfTexture();
            texture.fromJson(jsonTexture);
            this.textures.push(texture);
        }
    }

    fromJson(json)
    {
        this.fromJsonAsset(json.asset);

        this.cameras = objectsFromJsons(json.cameras, gltfCamera);
        this.accessors = objectsFromJsons(json.accessors, gltfAccessor);
        this.meshes = objectsFromJsons(json.meshes, gltfMesh);
        this.samplers = objectsFromJsons(json.samplers, gltfSampler);
        this.materials = objectsFromJsons(json.materials, gltfMaterial);
        this.buffers = objectsFromJsons(json.buffers, gltfBuffer);
        this.bufferViews = objectsFromJsons(json.bufferViews, gltfBufferView);
        this.scenes = objectsFromJsons(json.scenes, gltfScene);

        this.materials.push(DefaultMaterial);
        this.samplers.push(new gltfSampler());
        this.defaultSampler = this.samplers.length - 1;

        if(json.extensions !== undefined)
        {
            if(json.extensions.KHR_lights_punctual !== undefined)
            {
                this.lights = objectsFromJsons(json.extensions.KHR_lights_punctual.lights, gltfLight);
            }
        }

        if(json.nodes !== undefined)
        {
            this.fromJsonNodes(json.nodes);
        }

        if(json.textures !== undefined)
        {
            this.fromJsonTextures(json.textures);
        }

        if(json.images !== undefined)
        {
            this.fromJsonImages(json.images);
        }

        // Load the default scene too.
        if (json.scenes !== undefined)
        {
            if (json.scene === undefined && json.scenes.length > 0)
            {
                this.scene = 0;
            }
            else
            {
                this.scene = json.scene;
            }
        }
    }
}

export { glTF };
