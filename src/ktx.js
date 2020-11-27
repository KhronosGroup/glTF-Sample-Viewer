import { WebGl } from './webgl.js';

class KtxDecoder {

    constructor () {
        this.libktx = null
    }

    async init() {
        this.libktx = await LIBKTX({preinitializedWebGLContext: WebGl.context});
        this.libktx.GL.makeContextCurrent(this.libktx.GL.createContext(null, { majorVersion: 2.0 }));
        //const texture = await this.loadKtx('../assets/ggx.ktx2');
    }

    async loadKtx(url) {
        console.log('Loading KTX file: ' + url)
        const response = await fetch(url);
        const data = new Uint8Array(await response.arrayBuffer());
        const texture = new this.libktx.ktxTexture(data);
        const uploadResult = texture.glUpload();
        return uploadResult.texture;
    }

}

export { KtxDecoder }
