class gltfImage
{
    constructor()
    {
        this.uri = "";
        this.bufferView = undefined;
        this.mimeType = "image/jpeg";
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
};
