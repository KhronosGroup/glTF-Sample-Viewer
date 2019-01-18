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
        this.defaultMaterial = -1;
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

    fromJsonMeshes(jsonMeshes)
    {
        for (const jsonMesh of jsonMeshes)
        {
            const mesh = new gltfMesh();
            mesh.fromJson(jsonMesh, this.defaultMaterial, this);
            this.meshes.push(mesh);
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
            texture.fromJson(jsonTexture, this.defaultSampler);
            this.textures.push(texture);
        }
    }

    fromJson(json)
    {
        this.fromJsonAsset(json.asset);

        this.cameras = objectsFromJsons(json.cameras, gltfCamera);

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

        this.materials = objectsFromJsons(json.materials, gltfMaterial);

        this.materials.push(gltfMaterial.getDefaults());
        this.defaultMaterial = this.materials.length - 1;

        this.accessors = objectsFromJsons(json.accessors, gltfAccessor);

        if (json.meshes !== undefined)
        {
            this.fromJsonMeshes(json.meshes);
        }

        this.samplers = objectsFromJsons(json.samplers, gltfSampler);
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

        this.buffers = objectsFromJsons(json.buffers, gltfBuffer);
        this.bufferViews = objectsFromJsons(json.bufferViews, gltfBufferView);

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

        this.scenes = objectsFromJsons(json.scenes, gltfScene);
    }
}

export { glTF };
