import { gltfAccessor } from './accessor.js';
import { gltfBuffer } from './buffer.js';
import { gltfBufferView } from './buffer_view.js';
import { gltfCamera } from './camera.js';
import { gltfImage } from './image.js';
import { gltfLight } from './light.js';
import { gltfMaterial } from './material.js';
import { gltfMesh } from './mesh.js';
import { gltfNode } from './node.js';
import { gltfSampler } from './sampler.js';
import { gltfScene } from './scene.js';
import { gltfTexture } from './texture.js';
import { getContainingFolder } from './utils';
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
        this.defaultMaterial = -1;
        this.defaultSampler  = -1;
        this.cubemapSampler  = -1;
        this.path = file;
    }

    fromJsonAsset(jsonAsset)
    {
        this.asset.version = jsonAsset.version;
        this.asset.minVersion = jsonAsset.minVersion;
        this.asset.copyright = jsonAsset.copyright;
        this.asset.generator = jsonAsset.generator;
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

    fromJsonCameras(jsonCameras)
    {
        for (let i = 0; i < jsonCameras.length; ++i)
        {
            let camera = new gltfCamera();
            camera.fromJson(jsonCameras[i]);
            this.cameras.push(camera);
        }
    }

    // pass extenstions.KHR_lights_punctual.lights to this
    fromJsonLights(jsonLights)
    {
        for (let i = 0; i < jsonLights.length; ++i)
        {
            let light = new gltfLight();
            light.fromJson(jsonLights[i]);
            this.lights.push(light);
        }
    }

    fromJsonMeshes(jsonMeshes)
    {
        for (let i = 0; i < jsonMeshes.length; ++i)
        {
            let mesh = new gltfMesh();
            mesh.fromJson(jsonMeshes[i], this.defaultMaterial, this);
            this.meshes.push(mesh);
        }
    }

    fromJsonSamplers(jsonSamplers)
    {
        for (let i = 0; i < jsonSamplers.length; ++i)
        {
            let sampler = new gltfSampler();
            sampler.fromJson(jsonSamplers[i]);
            this.samplers.push(sampler);
        }
    }

    fromJsonImages(jsonImages)
    {
        for (let i = 0; i < jsonImages.length; ++i)
        {
            let image = new gltfImage();
            image.fromJson(jsonImages[i], getContainingFolder(this.path));
            this.images.push(image);
        }
    }

    fromJsonTextures(jsonTextures)
    {
        for (let i = 0; i < jsonTextures.length; ++i)
        {
            let texture = new gltfTexture();
            texture.fromJson(jsonTextures[i], this.defaultSampler);
            this.textures.push(texture);
        }
    }

    fromJsonBuffers(jsonBuffers)
    {
        for (let i = 0; i < jsonBuffers.length; ++i)
        {
            let buffer = new gltfBuffer();
            buffer.fromJson(jsonBuffers[i]);
            this.buffers.push(buffer);
        }
    }

    fromJsonBufferViews(jsonBufferViews)
    {
        for (let i = 0; i < jsonBufferViews.length; ++i)
        {
            let bufferView = new gltfBufferView();
            bufferView.fromJson(jsonBufferViews[i]);
            this.bufferViews.push(bufferView);
        }
    }

    fromJsonAccessors(jsonAccessors)
    {
        for (let i = 0; i < jsonAccessors.length; ++i)
        {
            let accessor = new gltfAccessor();
            accessor.fromJson(jsonAccessors[i]);
            this.accessors.push(accessor);
        }
    }

    fromJsonScenes(jsonScenes)
    {
        for (let i = 0; i < jsonScenes.length; ++i)
        {
            let scene = new gltfScene();
            scene.fromJson(jsonScenes[i]);
            this.scenes.push(scene);
        }
    }

    fromJsonMaterials(jsonMaterials)
    {
        for (let i = 0; i < jsonMaterials.length; ++i)
        {
            let material = new gltfMaterial();
            material.fromJson(jsonMaterials[i]);
            this.materials.push(material);
        }
    }

    fromJson(json)
    {
        this.fromJsonAsset(json.asset);

        if(json.cameras !== undefined)
        {
            this.fromJsonCameras(json.cameras);
        }

        if(json.extensions !== undefined)
        {
            if(json.extensions.KHR_lights_punctual !== undefined)
            {
                if(json.extensions.KHR_lights_punctual.lights !== undefined)
                {
                    this.fromJsonLights(json.extensions.KHR_lights_punctual.lights);
                }
            }
        }

        if(json.nodes !== undefined)
        {
            this.fromJsonNodes(json.nodes);
        }

        if (json.materials !== undefined)
        {
            this.fromJsonMaterials(json.materials);
        }

        this.materials.push(gltfMaterial.getDefaults());
        this.defaultMaterial = this.materials.length - 1;

        if (json.accessors !== undefined)
        {
            this.fromJsonAccessors(json.accessors);
        }

        if (json.meshes !== undefined)
        {
            this.fromJsonMeshes(json.meshes);
        }

        if(json.samplers !== undefined)
        {
            this.fromJsonSamplers(json.samplers);
        }

        this.samplers.push(new gltfSampler());
        this.defaultSampler = this.samplers.length - 1;

        if(json.textures !== undefined)
        {
            this.fromJsonTextures(json.textures);
        }

        if(json.images !== undefined)
        {
            this.fromJsonImages(json.images);
        }

        if(json.buffers !== undefined)
        {
            this.fromJsonBuffers(json.buffers);
        }

        if(json.bufferViews !== undefined)
        {
            this.fromJsonBufferViews(json.bufferViews);
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

        if (json.scenes !== undefined)
        {
            this.fromJsonScenes(json.scenes);
        }
    }
}

export { glTF };
