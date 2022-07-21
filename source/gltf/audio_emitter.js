import { GltfObject } from './gltf_object.js';
import { fromKeys } from './utils.js';
import { vec3 } from 'gl-matrix';
class gltfAudioEmitter extends GltfObject
{
    constructor()
    {
        super();
        this.type = undefined, // "global" or "positional"
        this.gain = 1.0,
        this.sources = [],
        this.name = undefined,
        this.positional = {
            coneInnerAngle: 6.283185307179586,
            coneOuterAngle: 6.283185307179586,
            coneOuterGain: 0.0,
            distanceModel: "inverse",
            maxDistance: 10000.0,
            refDistance: 1.0,
            rolloffFactor: 1.0,
        };

        // non gltf:
        this.gainNode = undefined;
        this.pannerNode = undefined; // used for positional audio effects

        this.position = vec3.create();
        this.orientation = vec3.create();
    }

    fromJson(jsonAudioEmitter)
    {
        super.fromJson(jsonAudioEmitter,["positional"]);

        if(jsonAudioEmitter.positional !== undefined)
        {
            fromKeys(this.positional, jsonAudioEmitter.positional);
        } 
    }
}

export { gltfAudioEmitter };

