
class DracoDecoder {

    constructor() {
        this.module = null

        this.initializingPromise = new Promise(resolve => {
            let dracoDecoderType = {};
            dracoDecoderType['onModuleLoaded'] = dracoDecoderModule => {
                this.module = dracoDecoderModule;
                resolve();
            };
            DracoDecoderModule(dracoDecoderType);
        });
    }

    async ready() {
        return this.initializingPromise;
    }

}

export { DracoDecoder }
