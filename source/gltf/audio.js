import { GltfObject } from './gltf_object.js';
import { AsyncFileReader } from '../ResourceLoader/async_file_reader.js';

class gltfAudio extends GltfObject
{
    constructor(
        uri = undefined,
        bufferView = undefined,
        name = undefined,
        mimeType = "audio/mpeg",
        decodedAudio = undefined)
    {
        super();
        this.uri = uri;
        this.bufferView = bufferView;
        this.mimeType = mimeType;
        this.name = name;  

        // non glTF
        this.decodedAudio = decodedAudio;  
    }

    resolveRelativePath(basePath)
    {
        if (typeof this.uri === 'string' || this.uri instanceof String)
        {
            if (this.uri.startsWith('./'))
            {
                // Remove preceding './' from URI.
                this.uri = this.uri.substr(2);
            }
            this.uri = basePath + this.uri;
        }
    }

    async load(gltf, additionalFiles = undefined)
    {
        if (this.audio !== undefined)
        {
            return;
        }

        if (!await this.setAudioFromBufferView(gltf) &&
            !await this.setAudioFromFiles(additionalFiles, gltf) &&
            !await this.setAudioFromUri(gltf))
        {
            console.error("Was not able to resolve audio with uri '%s'", this.uri);
            return;
        }

        return;
    }

    static loadHTMLAudio(url)
    {
        const context = new AudioContext();
        return  fetch(url)
            .then(res => res.arrayBuffer())
            .then(ArrayBuffer => context.decodeAudioData(ArrayBuffer));

    }

    async setAudioFromUri()
    {
        if (this.uri === undefined)
        {
            return false;
        }

        if (this.mimeType === "audio/mpeg")
        {
            this.decodedAudio = await gltfAudio.loadHTMLAudio(this.uri).catch( (error) => {
                console.error(error);
            });
        }
        else
        {
            console.error("Unsupported audio type " + this.mimeType);
            return false;
        }

        return true;
    }

    async setAudioFromBufferView(gltf)
    {
        const view = gltf.bufferViews[this.bufferView];
        if (view === undefined)
        {
            return false;
        }

        const buffer = gltf.buffers[view.buffer].buffer;
        const array = new Uint8Array(buffer, view.byteOffset, view.byteLength);
        if(typeof(AudioContext) !== 'undefined' && this.mimeType === "audio/mpeg")
        {
            const blob = new Blob([array], { "type": this.mimeType });
            const objectURL = URL.createObjectURL(blob);
            this.decodedAudio = await gltfAudio.loadHTMLAudio(objectURL).catch( () => {
                console.error("Could not load audio from buffer view");
            });
        }
        else
        {
            console.error("Unsupported audio type " + this.mimeType);
            return false;
        }

        return true;
    }

    async setAudioFromFiles(files)
    {
        if (this.uri === undefined || files === undefined)
        {
            return false;
        }

        let foundFile = files.find(function(file)
        {
            const uriName = this.uri.split('\\').pop().split('/').pop();
            if (file.name === uriName)
            {
                return true;
            }
        }, this);

        if (foundFile === undefined)
        {
            return false;
        }

        if (typeof(AudioContext) !== 'undefined' && (this.mimeType === "audio/mpeg"))
        {
            const audioData = await AsyncFileReader.readAsDataURL(foundFile).catch( () => {
                console.error("Could not load audio with FileReader");
            });
            this.decodedAudio = await gltfAudio.loadHTMLAudio(audioData).catch( () => {
                console.error("Could not create audio source from FileReader audio data");
            });
        }
        else
        {
            console.error("Unsupported audio type " + this.mimeType);
            return false;
        }


        return true;
    }
}

export { gltfAudio };

