class gltfImage
{
    constructor(uri = undefined, type = gl.TEXTURE_2D, miplevel = 0, bufferView = undefined, name = undefined, mimeType = "image/jpeg", image = undefined)
    {
        this.uri = uri;
        this.bufferView = bufferView;
        this.mimeType = mimeType;
        this.image = image; // javascript image
        this.name = name;
        this.type = type; // nonstandard
        this.miplevel = miplevel; // nonstandard
    }

    fromJson(jsonImage, path = "")
    {
        fromKeys(this, jsonImage);

        if(this.uri !== undefined)
        {
            this.uri = path + this.uri;
        }
    }

    load(promises, gltf)
    {
        if(this.image !== undefined) // alread loaded
        {
            return;
        }

        let image = new Image();
        let uri = this.uri;
        let bufferView = this.bufferView;
        let mimeType = this.mimeType;

        promises.push(new Promise(function(resolve, reject)
        {
            if (uri !== undefined) // load from uri
            {
                image = new Image();
                image.onload = resolve;
                image.onerror = resolve;
                image.src = uri;
            }
            else if (bufferView !== undefined) // load from binary
            {
                image = new Image();
                image.onload = resolve;
                image.onerror = resolve;

                let view = gltf.bufferViews[bufferView];
                let buffer = gltf.buffers[view.buffer];
                let array = new Uint8Array(buffer, view.byteOffset, view.byteLength);
                let blob = new Blob(array, { "type": mimeType });
                image.src = URL.createObjectURL(blob);
            }
        }));

        this.image = image;
    }
};
