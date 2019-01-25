import { WebGl } from './webgl.js';
import { GltfObject } from './gltf_object.js';

class gltfAccessor extends GltfObject
{
    constructor()
    {
        super();
        this.bufferView = undefined;
        this.byteOffset = 0;
        this.componentType = undefined;
        this.normalized = false;
        this.count = undefined;
        this.type = undefined;
        this.max = undefined;
        this.min = undefined;
        this.sparse = undefined;
        this.name = undefined;

        // non gltf
        this.glBuffer = undefined;
        this.typedView = undefined;
    }

    getTypedView(gltf)
    {
        if (this.typedView !== undefined)
        {
            return this.typedView;
        }

        if (this.bufferView !== undefined)
        {
            const bufferView = gltf.bufferViews[this.bufferView];
            const buffer = gltf.buffers[bufferView.buffer];
            const byteOffset = bufferView.byteOffset;

            let componentCount = this.getComponentCount();
            if (bufferView.byteStride !== 0)
            {
                componentCount = bufferView.byteStride / this.getComponentSize();
            }

            const arrayOffsetLength = this.byteOffset / this.getComponentSize();
            const arrayLength = arrayOffsetLength + this.count * componentCount;

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

    getComponentCount()
    {
        return CompononentCount.get(this.type);
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

    destroy()
    {
        if (this.glBuffer !== undefined)
        {
            WebGl.context.deleteBuffer(this.glBuffer);
        }

        this.glBuffer = undefined;
    }
}

const CompononentCount = new Map(
    [
        ["SCALAR", 1],
        ["VEC2", 2],
        ["VEC3", 3],
        ["VEC4", 4],
        ["MAT2", 4],
        ["MAT3", 9],
        ["MAT4", 16]
    ]
);

export { gltfAccessor };
