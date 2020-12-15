import DracoDecoderModule from '../libs/draco_decoder_gltf.wasm';
class DracoDecoder {

    constructor() {
        if (!DracoDecoder.instance)
        {
            DracoDecoder.instance = this;
            this.module = null;

            this.initializingPromise = DracoDecoderModule().then((module) => {
                // This is reached when everything is ready, and you can call methods on
                // Module.
                this.module = module;
                console.log('Decoder Module Initialized!');
            });
        }
        return DracoDecoder.instance;
    }

    async ready() {
        await this.initializingPromise;
        Object.freeze(DracoDecoder.instance);
    }

}

const instance = new DracoDecoder();

export  default instance;
