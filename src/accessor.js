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
        this.glBuffer = undefined;

        this.componentCount = new Map();
        this.componentCount["SCALAR"] = 1;
        this.componentCount["VEC2"]   = 2;
        this.componentCount["VEC3"]   = 3;
        this.componentCount["VEC4"]   = 4;
        this.componentCount["MAT2"]   = 4;
        this.componentCount["MAT3"]   = 9;
        this.componentCount["MAT4"]   = 16;
    }

    getComponentCount()
    {
        return this.componentCount[this.type];
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
