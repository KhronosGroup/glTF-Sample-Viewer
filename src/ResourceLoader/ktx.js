class KtxDecoder {

    constructor (context, externalKtxlib) {
        this.libktx = null;
        if (context !== undefined)
        {
            if (externalKtxlib === undefined && LIBKTX !== undefined)
            {
                externalKtxlib = LIBKTX;
            }
            if (externalKtxlib !== undefined)
            {
                this.initializied = this.init(context, externalKtxlib);
            }
            else
            {
                console.error('Failed to initalize KTXDecoder: ktx library undefined');
                return undefined;
            }
        }
        else
        {
            console.error('Failed to initalize KTXDecoder: WebGL context undefined');
            return undefined;
        }
    }

    async init(context, externalKtxlib) {
        this.libktx = await externalKtxlib({preinitializedWebGLContext: context});
        this.libktx.GL.makeContextCurrent(this.libktx.GL.createContext(null, { majorVersion: 2.0 }));
    }

    async loadKtxFromUri(uri) {
        await this.initializied;
        const response = await fetch(uri);
        const data = new Uint8Array(await response.arrayBuffer());
        const texture = new this.libktx.ktxTexture(data);
        let uploadResult = texture.glUpload();
        uploadResult.texture.levels = Math.log2(texture.baseWidth);
        return uploadResult.texture;
    }

    async loadKtxFromBuffer(data) {
        await this.initializied;
        const texture = new this.libktx.ktxTexture(data);
        const uploadResult = texture.glUpload();
        return uploadResult.texture;
    }
}

export { KtxDecoder };
