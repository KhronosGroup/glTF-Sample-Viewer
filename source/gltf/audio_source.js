import { GltfObject } from './gltf_object.js';

class gltfAudioSource extends GltfObject
{
    constructor()
    {
        super();
        this.autoPlay = false;
        this.gain = 1.0;
        this.loop = false;
        this.audio = undefined;

        // non gltf: 
        this.audioBufferSourceNode = undefined;
        this.gainNode = undefined;
    }

}

export { gltfAudioSource };

