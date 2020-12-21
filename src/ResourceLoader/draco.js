class DracoDecoder {

    constructor(dracoLib) {
        if (!DracoDecoder.instance && dracoLib === undefined)
        {
            if (DracoDecoderModule === undefined)
            {
                console.error('Failed to initalize DracoDecoder: draco library undefined');
                return undefined;
            }
            else
            {
                dracoLib = DracoDecoderModule;
            }
        }
        if (!DracoDecoder.instance)
        {
            DracoDecoder.instance = this;
            this.module = null;

            this.initializingPromise = new Promise(resolve => {
                let dracoDecoderType = {};
                dracoDecoderType['onModuleLoaded'] = dracoDecoderModule => {
                    this.module = dracoDecoderModule;
                    resolve();
                };
                dracoLib(dracoDecoderType);
            });
        }
        return DracoDecoder.instance;
    }

    async ready() {
        await this.initializingPromise;
        Object.freeze(DracoDecoder.instance);
    }

}

export { DracoDecoder };
