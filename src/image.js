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

    load(monitor, bufferViews)
    {
        if(this.image !== undefined) // alread loaded
            return;

        if(this.uri !== undefined) // load from uir
        {
            this.image = new Image();
            this.image.uri = this.uri;
            monitor.pendingImages++;
        }
        else if(this.bufferView != undefined)
        {
            monitor.pendingImages++;

            // TODO: load from buffer view bufferViews[this.bufferView]
        }

        // callback on loaded
        this.image.onload = function()
        {
            monitor.pendingImages--;
        };
    }
};
