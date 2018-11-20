class gltfBuffer
{
    constructor(uri = undefined, byteLength = undefined, name = undefined)
    {
        this.uri = uri;
        this.byteLength = byteLength;
        this.name = name;
        this.buffer = undefined; // raw data blob
    }

    load(folder)
    {
        if (this.buffer !== undefined)
        {
            return;
        }

        let self = this;
        if (this.uri !== undefined)
        {
            let promise = axios.get(folder + this.uri, { responseType: 'arraybuffer'});
            promise.then(function (response) {
                self.buffer = response.data;
            });
            return promise;
        }
    }

    fromJson(jsonBuffer)
    {
        fromKeys(this, jsonBuffer);
    }
};
