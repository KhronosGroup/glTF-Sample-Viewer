class gltfImage
{
    constructor(uri = undefined, bufferView = undefined, mimeType = "image/jpeg", image = undefined, name = undefined)
    {
        this.uri = uri;
        this.bufferView = bufferView;
        this.mimeType = mimeType;
        this.image = image;
        this.name = name;
    }

    fromJson(jsonNode)
    {
        this.name = jsonNode.name;
        if(jsonNode.uri !== undefined)
        {
            this.uri = jsonNode.uri;
        }

        if(jsonNode.bufferView !== undefined)
        {
            this.bufferView = jsonNode.bufferView;
        }

        if(jsonNode.mimeType !== undefined)
        {
            this.mimeType = jsonNode.mimeType;
        }
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
