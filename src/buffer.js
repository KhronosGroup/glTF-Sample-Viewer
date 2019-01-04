import axios from '../libs/axios.min.js';
import { fromKeys, getContainingFolder } from './utils.js';

class gltfBuffer
{
    constructor(uri = undefined, byteLength = undefined, name = undefined)
    {
        this.uri = uri;
        this.byteLength = byteLength;
        this.name = name;
        this.buffer = undefined; // raw data blob
    }

    fromJson(jsonBuffer)
    {
        fromKeys(this, jsonBuffer);
    }

    load(gltf, additionalFiles = undefined)
    {
        if (this.buffer !== undefined)
        {
            console.error("buffer has already been loaded");
            return;
        }

        const self = this;
        return new Promise(function(resolve, reject)
        {
            if (!self.setBufferFromFiles(additionalFiles, resolve) &&
                !self.sefBufferFromUri(gltf, resolve))
            {
                console.error("Was not able to resolve buffer with uri '%s'", self.uri);
                resolve();
            }
        });
    }

    sefBufferFromUri(gltf, callback)
    {
        if (this.uri === undefined)
        {
            return false;
        }

        const self = this;
        axios.get(getContainingFolder(gltf.path) + this.uri, { responseType: 'arraybuffer'})
            .then(function(response)
            {
                self.buffer = response.data;
                callback();
            });
        return true;
    }

    setBufferFromFiles(files, callback)
    {
        if (this.uri === undefined || files === undefined)
        {
            return false;
        }

        let foundFile = files.find(function(file)
        {
            if (file.name === this.uri || file.fullPath === this.uri)
            {
                return true;
            }
        }, this)

        if (foundFile === undefined)
        {
            return false;
        }

        const self = this;
        const reader = new FileReader();
        reader.onloadend = function(event)
        {
            self.buffer = event.target.result;
            callback();
        };
        reader.readAsArrayBuffer(foundFile);

        return true;
    }
};

export { gltfBuffer };
