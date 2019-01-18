import { fromKeys, initGlForMembers } from './utils.js';
import { WebGl } from './webgl.js';

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
        this.componentCount.set("SCALAR", 1);
        this.componentCount.set("VEC2", 2);
        this.componentCount.set("VEC3", 3);
        this.componentCount.set("VEC4", 4);
        this.componentCount.set("MAT2", 4);
        this.componentCount.set("MAT3", 9);
        this.componentCount.set("MAT4", 16);
    }

    getComponentCount()
    {
        return this.componentCount.get(this.type);
    }

    getComponentSize()
    {
        switch (this.componentType)
        {
        case WebGl.context.BYTE:
        case WebGl.context.UNSIGNED_BYTE:
            return 1;
        case WebGl.context.SHORT:
        case WebGl.context.UNSIGNED_SHORT:
            return 2;
        case WebGl.context.UNSIGNED_INT:
        case WebGl.context.FLOAT:
            return 4;
        default:
            return 0;
        }
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
            let byteOffset = bufferView.byteOffset;

            let componentCount = this.getComponentCount();
            if (bufferView.byteStride != 0)
            {
                componentCount = bufferView.byteStride / this.getComponentSize();
            }

            let arrayOffsetLength = this.byteOffset / this.getComponentSize();
            let arrayLength = arrayOffsetLength + this.count * componentCount;

            switch (this.componentType)
            {
            case WebGl.context.BYTE:
                this.typedView = new Int8Array(buffer.buffer, byteOffset, arrayLength);
                break;
            case WebGl.context.UNSIGNED_BYTE:
                this.typedView = new Uint8Array(buffer.buffer, byteOffset, arrayLength);
                break;
            case WebGl.context.SHORT:
                this.typedView = new Int16Array(buffer.buffer, byteOffset, arrayLength);
                break;
            case WebGl.context.UNSIGNED_SHORT:
                this.typedView = new Uint16Array(buffer.buffer, byteOffset, arrayLength);
                break;
            case WebGl.context.UNSIGNED_INT:
                this.typedView = new Uint32Array(buffer.buffer, byteOffset, arrayLength);
                break;
            case WebGl.context.FLOAT:
                this.typedView = new Float32Array(buffer.buffer, byteOffset, arrayLength);
                break;
            }
        }

        if (this.typedView === undefined)
        {
            console.warn("Failed to convert buffer view to typed view!: " + this.bufferView);
        }

        return this.typedView;
    }

    initGl()
    {
        initGlForMembers(this);
    }

    fromJson(jsonAccessor)
    {
        fromKeys(this, jsonAccessor);
    }

    destroy()
    {
        if (this.glBuffer !== undefined)
        {
            WebGl.context.deleteBuffer(this.glBuffer);
        }

        this.glBuffer = undefined;
    }
}

export { gltfAccessor };
