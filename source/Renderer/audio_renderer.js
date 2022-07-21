import { mat4, vec3, vec4 } from 'gl-matrix';


class gltfAudioRenderer
{
    constructor()
    {
        this.currentCameraPosition = vec3.create();
        this.currentCameraLookDirection = vec3.create();
        this.currentCameraUpDirection = vec3.create();
        this.audioContext = undefined;
    }

    prepareScene(state, scene) 
    {
        this.nodes = scene.gatherNodes(state.gltf);

        this.audioEmitterNodes = this.nodes
            .filter(node => node.extensions !== undefined && node.extensions.KHR_audio !== undefined && node.extensions.KHR_audio.emitter !== undefined);

        if(this.audioContext !== undefined)
        {
            this.audioContext.close();
        }
        
        this.audioContext = new AudioContext();
    }


    updateAudioEmitter(state, emitter)
    {
        // emitterSourceNode -> source.gainNode -> emitter.gainNode -> [optional: pannerNode] -> globalDestination

        // At first create audio nodes if they are undefined

        // controls emitter gain
        if(emitter.gainNode === undefined)
        {
            emitter.gainNode = this.audioContext.createGain();
        }
           
        if(emitter.pannerNode === undefined) 
        {                          
            emitter.pannerNode = this.audioContext.createPanner();
        }

        if(emitter.type === "global")
        {   
            // skip panner node if we have a global emitter
            emitter.gainNode.connect(this.audioContext.destination);
        }
        else
        {
            // add panner node between gain and destination for positional emitter
            emitter.gainNode.connect(emitter.pannerNode);
            emitter.pannerNode.connect(this.audioContext.destination);
        }

        // audio source node
        for (let sourceRef of emitter.sources)
        {
            let source = state.gltf.audioSources[sourceRef];
            if(source.gainNode === undefined)
            {
                source.gainNode = this.audioContext.createGain();
                source.gainNode.connect(emitter.gainNode);
            }

            if(source.audioBufferSourceNode === undefined)
            {
                // Set audio data
                source.audioBufferSourceNode = this.audioContext.createBufferSource();
                const audio = state.gltf.audio[source.audio];

                if(audio.decodedAudio === undefined)
                {
                    console.log("Unable to play audio source");
                }

                source.audioBufferSourceNode.buffer = audio.decodedAudio;

                if(source.autoPlay === true)
                {
                    source.audioBufferSourceNode.start();
                }

                source.audioBufferSourceNode.connect(source.gainNode);
                
            }
            // Update values of sources
            source.audioBufferSourceNode.loop = source.loop;   
            source.gainNode.gain.setValueAtTime(source.gain, this.audioContext.currentTime);

        }


        // Update values of emitter:
        emitter.gainNode.gain.setValueAtTime(emitter.gain, this.audioContext.currentTime);

        emitter.pannerNode.distanceModel = emitter.positional.distanceModel;
        emitter.pannerNode.refDistance = emitter.positional.refDistance;
        emitter.pannerNode.maxDistance = emitter.positional.maxDistance;
        emitter.pannerNode.rolloffFactor = emitter.positional.rolloffFactor;
        // pannerNode angles are given in degrees. glTF values are given in radians
        emitter.pannerNode.coneInnerAngle = emitter.positional.coneInnerAngle * 180.0 / Math.PI;
        emitter.pannerNode.coneOuterAngle = emitter.positional.coneOuterAngle * 180.0 / Math.PI;
        emitter.pannerNode.coneOuterGain = emitter.positional.coneOuterGain;

        if(emitter.pannerNode.orientationX) 
        {
            emitter.pannerNode.orientationX.setValueAtTime(emitter.orientation[0], this.audioContext.currentTime);
            emitter.pannerNode.orientationY.setValueAtTime(emitter.orientation[1], this.audioContext.currentTime);
            emitter.pannerNode.orientationZ.setValueAtTime(emitter.orientation[2], this.audioContext.currentTime);
        } 
        else 
        {
            // Firefox
            emitter.pannerNode.setOrientation(emitter.orientation[0],emitter.orientation[1],emitter.orientation[2]);
        }

        if(emitter.pannerNode.positionX) 
        {
            emitter.pannerNode.positionX.setValueAtTime(emitter.position[0], this.audioContext.currentTime);
            emitter.pannerNode.positionY.setValueAtTime(emitter.position[1], this.audioContext.currentTime);
            emitter.pannerNode.positionZ.setValueAtTime(emitter.position[2], this.audioContext.currentTime);
        } 
        else 
        {   
            // Firefox
            emitter.pannerNode.setPosition(emitter.position[0], emitter.position[1], emitter.position[2]);
        }
    }

    updateAudioListener()
    {
        var listener = this.audioContext.listener;

        if(listener.forwardX) {
            listener.forwardX.setValueAtTime(this.currentCameraLookDirection[0], this.audioContext.currentTime);
            listener.forwardY.setValueAtTime(this.currentCameraLookDirection[1], this.audioContext.currentTime);
            listener.forwardZ.setValueAtTime(this.currentCameraLookDirection[2], this.audioContext.currentTime);
            listener.upX.setValueAtTime(this.currentCameraUpDirection[0], this.audioContext.currentTime);
            listener.upY.setValueAtTime(this.currentCameraUpDirection[1], this.audioContext.currentTime);
            listener.upZ.setValueAtTime(this.currentCameraUpDirection[2], this.audioContext.currentTime);
        } 
        else 
        {
            // Firefox requires deprecated function
            listener.setOrientation(
                this.currentCameraLookDirection[0],
                this.currentCameraLookDirection[1],
                this.currentCameraLookDirection[2],
                this.currentCameraUpDirection[0],
                this.currentCameraUpDirection[1],
                this.currentCameraUpDirection[2]);
        }

        if(listener.positionX) 
        { 
            listener.positionX.setValueAtTime(this.currentCameraPosition[0], this.audioContext.currentTime);
            listener.positionY.setValueAtTime(this.currentCameraPosition[1], this.audioContext.currentTime);
            listener.positionZ.setValueAtTime(this.currentCameraPosition[2], this.audioContext.currentTime);
        } 
        else 
        {   
            // Firefox requires deprecated function
            listener.setPosition(this.currentCameraPosition[0], this.currentCameraPosition[1], this.currentCameraPosition[2]);
        }
    }

    handleAudio(state, scene)
    {
        if (this.preparedScene !== scene) 
        {
            this.prepareScene(state, scene);
            this.preparedScene = scene;
        }

        let currentCamera = undefined;

        if (state.cameraIndex === undefined)
        {
            currentCamera = state.userCamera;
        }
        else
        {
            currentCamera = state.gltf.cameras[state.cameraIndex].clone();
        }

        this.currentCameraPosition = currentCamera.getPosition(state.gltf);
        this.currentCameraLookDirection = currentCamera.getLookDirection(state.gltf);
        this.currentCameraUpDirection = currentCamera.getUpDirection(state.gltf);
        
        this.updateAudioListener();

        if( scene.extensions !== undefined 
            && scene.extensions.KHR_audio !== undefined)
        { 
            for(const emitterReference of scene.extensions.KHR_audio.emitters){
                let emitter = state.gltf.audioEmitters[emitterReference];
                if(emitter.type !== "global") // only global emitters can be used in a scene
                {
                    continue;
                }

                this.updateAudioEmitter(state, emitter);
            }
        }

        for(const node of this.audioEmitterNodes) {
            
            const emitterReference = node.extensions.KHR_audio.emitter;
            let emitter = state.gltf.audioEmitters[emitterReference];
            if(emitter.type !== "positional") // only positional emitters can be used in a node
            {
                continue;
            }

            const worldTransform = node.worldTransform;
            
            mat4.getTranslation(emitter.position, worldTransform);
            let resultTransform = vec4.create();
            vec4.transformMat4(resultTransform, vec4.fromValues(0, 0, -1, 0), worldTransform);
            vec3.normalize(emitter.orientation,vec3.fromValues(resultTransform[0], resultTransform[1], resultTransform[2]));
            
            this.updateAudioEmitter(state, emitter);
        }     

    }

}

export { gltfAudioRenderer };
