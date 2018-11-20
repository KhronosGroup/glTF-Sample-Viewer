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

        const self = this;
        if (this.uri !== undefined)
        {
            const promise = axios.get(folder + this.uri, { responseType: 'arraybuffer'});
            promise.then(function (response)
            {
                self.buffer = response.data;
            });
            return promise;
        }
    }

    loadFromFiles(files)
    {
        if (this.buffer !== undefined)
        {
            return;
        }

        if (this.uri !== undefined)
        {
            let bufferFile;
            for (bufferFile of files)
            {
                if (bufferFile.name === this.uri)
                {
                    break;
                }
            }

            const self = this;
            const reader = new FileReader();
            const promise = new Promise(function(resolve, reject)
            {
                reader.onloadend = function(event)
                {
                    self.buffer = event.target.result;
                    resolve();
                };
                reader.readAsArrayBuffer(bufferFile);
            });
            return promise;
        }
    }

    fromJson(jsonBuffer)
    {
        fromKeys(this, jsonBuffer);
    }
};
