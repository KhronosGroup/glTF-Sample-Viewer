class gltfImage
{
    constructor()
    {
        this.uri = "";
        this.bufferView = undefined;
        this.mimeType = "image/jpeg";
        this.image = undefined; // new Image()
    }

    fromJson(jsonNode)
    {
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
