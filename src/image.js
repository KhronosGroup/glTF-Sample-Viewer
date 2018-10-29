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
        this.uri = path + this.uri;
    }

    load(promises, bufferViews) //folder,
    {
        if(this.image !== undefined) // alread loaded
        {
            return;
        }

        let image = new Image();
        let uri = this.uri;
        let bufferView = undefined;

        promises.push(new Promise(function(resolve, reject)
        {
            if(uri !== undefined) // load from uir
            {
                image = new Image();
                image.onload = resolve;
                image.onerror = resolve;
                image.src = uri;
            }
            else if(bufferView != undefined)
            {
                // TODO: load from buffer view bufferViews[this.bufferView]
            }
        }));

        this.image = image;
    }
};
