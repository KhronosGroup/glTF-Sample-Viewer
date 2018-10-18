class gltfAccessor
{
    constructor(bufferView = undefined, byteOffset = 0,
                componentType = undefined, normalized = false,
                count = undefined, type = undefined,
                max = undefined, min = undefined,
                sparse = undefined, name = undefined)
    {
        this.bufferView = bufferView;
        this.byteOffset = byteOffset;
        this.componentType = componentType;
        this.normalized = normalized;
        this.count = count;
        this.type = type;
        this.max = max;
        this.min = min;
        this.sparse = sparse;
        this.name = name;
        this.typedView = undefined;

        this.bufferMap = new Map();
        this.bufferMap[gl.BYTE] = "";
        this.bufferMap[gl.UNSIGNED_BYTE] = "Uint8Array";
        this.bufferMap[gl.SHORT] = "Int16Array";
        this.bufferMap[gl.UNSIGNED_SHORT] = "Uint16Array";
        this.bufferMap[gl.UNSIGNED_INT] = "Uint32Array";
        this.bufferMap[gl.FLOAT] = "Float32Array";
    }

    getTypedView(gltf)
    {
        if (this.typedView !== undefined)
        {
            return this.typedView;
        }

        if (this.bufferView !== undefined)
        {
            let bufferView = gltf.bufferViews[this.bufferView];
            let buffer = gltf.buffers[bufferView.buffer];
            let offset = this.byteOffset + bufferView.byteOffset; // TODO: check indices out of bounds

            switch (this.componentType)
            {
            case gl.BYTE:
                this.typedView = new Int8Array(buffer.buffer, offset, this.count);
                break;
            case gl.UNSIGNED_BYTE:
                this.typedView = new Uint8Array(buffer.buffer, offset, this.count);
                break;
            case gl.SHORT:
                this.typedView = new Int16Array(buffer.buffer, offset, this.count);
                break;
            case gl.UNSIGNED_SHORT:
                this.typedView = new Uint16Array(buffer.buffer, offset, this.count);
                break;
            case gl.FLOAT:
                this.typedView = new Float32Array(buffer.buffer, offset, this.count);
                break;
            }
        }

        return this.typedView;
    }

    fromJson(jsonAccessor)
    {
        fromKeys(this, jsonAccessor);
    }
};
