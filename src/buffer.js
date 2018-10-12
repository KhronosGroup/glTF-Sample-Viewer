class gltfBuffer
{
    construct(uri = undefined, byteLength = undefined, name = undefined)
    {
        this.uri = uri;
        this.byteLength = byteLength;
        this.name = name;
        this.buffer = undefined;
    }

    load(promises)
    {
        if (this.buffer === undefined)
        {
            return;
        }

        let responseBuffer = this.buffer;
        if (this.uri !== undefined)
        {
            let promise = axios.get(this.uri, { responseType: 'arraybuffer'});
            promise.then(function (response) {
                responseBuffer = new Buffer(response.data, 'binary')
            });
            promises.push(promise);
        }
    }

    fromJson(jsonBuffer)
    {
        fromKeys(this, jsonBuffer);
    }
};
