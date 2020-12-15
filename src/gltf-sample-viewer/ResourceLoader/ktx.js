import { LIBKTX } from '../libs/libktx.js';

class KtxDecoder {

    constructor (context) {
        this.libktx = null;
        this.initializied = this.init(context);
    }

    async init(context) {
        this.libktx = await LIBKTX({preinitializedWebGLContext: context});
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
