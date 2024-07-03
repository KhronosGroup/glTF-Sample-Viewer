class WebPLibrary {

    constructor (context, externalWebPlib) {
        this.gl = context;
        if (context !== undefined)
        {
            if (externalWebPlib === undefined && LIBWEBP !== undefined)
            {
                externalWebPlib = LIBWEBP;
            }
            if (externalWebPlib !== undefined)
            {
                this.initializied = this.init(context, externalWebPlib);
            }
            else
            {
                console.error('Failed to initalize WebPLibrary: webp library undefined');
                return undefined;
            }
        }
        else
        {
            console.error('Failed to initalize WebPLibrary: WebGL context undefined');
            return undefined;
        }
    }

    async decode(webp_data) {
        const texture = new this.libwebp.webpTexture(webp_data);
        return {
            data: Uint8ClampedArray.from(texture.data),
            width: texture.width, 
            height: texture.height
        }; 
    }

    async rescale(raw_data, width, height, comps, scaled_width, scaled_height) {
        return this.libwebp.rescale(raw_data, width, height, comps, scaled_width, scaled_height);
    }

    async encode(raw_data, width, height, comps, quality) {
        return this.libwebp.encode(raw_data, width, height, comps, quality);
    }

    async init(context, externalWebPlib) {
        this.libwebp = await externalWebPlib({noInitialRun: true});
    }
}

export { WebPLibrary };
