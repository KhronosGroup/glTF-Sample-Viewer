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

    async loadKtxFromUri(uri) {
        console.log('Loading KTX file: ' + uri)
        const response = await fetch(uri);
        const data = new Uint8Array(await response.arrayBuffer());
        const texture = new this.libktx.ktxTexture(data);
        const uploadResult = texture.glUpload();
        console.log('Loading KTX done: ' + uri)
        return uploadResult.texture;
    }

    async loadKtxFromFile(file) {
        console.log('Loading KTX file: ' +  file.name)
        const data = new Uint8Array(await file.arrayBuffer());
        const texture = new this.libktx.ktxTexture(data);
        const uploadResult = texture.glUpload();
        console.log('Loading KTX done: ' + file.name)
        return uploadResult.texture;
    }

}

export { KtxDecoder }
