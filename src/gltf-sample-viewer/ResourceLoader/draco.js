import { createDecoderModule } from 'draco3d';
class DracoDecoder {

    constructor() {
        if (!DracoDecoder.instance)
        {
            DracoDecoder.instance = this;
            this.module = null;

            this.initializingPromise = createDecoderModule({}).then((module) => {
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
