import DracoDecoderModule from '../libs/draco_decoder_gltf.wasm';

class DracoDecoder {

    constructor() {
        if (!DracoDecoder.instance)
        {
            DracoDecoder.instance = this;
            this.module = DracoDecoderModule();
        }
        return DracoDecoder.instance;
    }

    async ready() {
        return;
    }

}

const instance = new DracoDecoder();

export  default instance;
