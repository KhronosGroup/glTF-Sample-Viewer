class gltfBuffer
{
    constructor(uri = undefined, byteLength = undefined, name = undefined)
    {
        this.uri = uri;
        this.byteLength = byteLength;
        this.name = name;
        this.buffer = undefined;
    }

    load(folder, promises)
    {
        if (this.buffer !== undefined)
        {
            return;
        }

        let responseBuffer = undefined;
        if (this.uri !== undefined)
        {
            let promise = axios.get(folder + this.uri, { responseType: 'arraybuffer'});
            promise.then(function (response) {
                responseBuffer = response.data;
            });
            promises.push(promise);
        }
        this.buffer = responseBuffer;
    }

    fromJson(jsonBuffer)
    {
        fromKeys(this, jsonBuffer);
    }
};
