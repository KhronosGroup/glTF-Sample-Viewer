class gltfImage
{
    constructor(uri = undefined, bufferView = undefined, mimeType = "image/jpeg", image = undefined, name = undefined, type = gl.TEXTURE_2D)
    {
        this.uri = uri;
        this.bufferView = bufferView;
        this.mimeType = mimeType;
        this.image = image;
        this.name = name;
        this.type = type;
    }

    fromJson(jsonImage)
    {
        fromKeys(this, jsonImage);
    }

    load(folder, promises, bufferViews)
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
                image.src = folder + uri;
            }
            else if(bufferView != undefined)
            {
                // TODO: load from buffer view bufferViews[this.bufferView]
            }
        }));

        this.image = image;
    }
};
