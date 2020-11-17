import { initGlForMembers } from './utils.js';
import { WebGl } from './webgl.js';
import { GltfObject } from './gltf_object.js';
import { gltfBuffer } from './buffer.js';
import { DracoDecoder } from './draco.js';
import { gltfBufferView } from './buffer_view.js';

class gltfPrimitive extends GltfObject
{
    constructor()
    {
        super();
        this.attributes = [];
        this.targets = [];
        this.indices = undefined;
        this.material = undefined;
        this.mode = WebGl.context.TRIANGLES;

        // non gltf
        this.glAttributes = [];
        this.defines = [];
        this.skip = true;
        this.hasWeights = false;
        this.hasJoints = false;

        // The primitive centroid is used for depth sorting.
        this.centroid = undefined;
    }

    initGl(gltf)
    {
        // Use the default glTF material.
        if (this.material === undefined)
        {
            this.material = gltf.materials.length - 1;
        }

        initGlForMembers(this, gltf);

        const maxAttributes = WebGl.context.getParameter(WebGl.context.MAX_VERTEX_ATTRIBS);

        // https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#meshes

        if (this.extensions !== undefined)
        {
            if (this.extensions.KHR_draco_mesh_compression !== undefined)
            {
                let dracoGeometry = this.decodeTest(this.extensions.KHR_draco_mesh_compression, gltf);
                this.copyDataFromDecodedGeometry(gltf, dracoGeometry, this.attributes);
            }
        }

        // VERTEX ATTRIBUTES
        for (const attribute of Object.keys(this.attributes))
        {
            if(this.glAttributes.length >= maxAttributes)
            {
                console.error("To many vertex attributes for this primitive, skipping " + attribute);
                break;
            }

            const idx = this.attributes[attribute];
            switch (attribute)
            {
            case "POSITION":
                this.skip = false;
                this.glAttributes.push({ attribute: attribute, name: "a_Position", accessor: idx });
                break;
            case "NORMAL":
                this.defines.push("HAS_NORMALS 1");
                this.glAttributes.push({ attribute: attribute, name: "a_Normal", accessor: idx });
                break;
            // case "TANGENT":
            //     this.defines.push("HAS_TANGENTS 1");
            //     this.glAttributes.push({ attribute: attribute, name: "a_Tangent", accessor: idx });
            //     break;
            case "TEXCOORD_0":
                this.defines.push("HAS_UV_SET1 1");
                this.glAttributes.push({ attribute: attribute, name: "a_UV1", accessor: idx });
                break;
            case "TEXCOORD_1":
                this.defines.push("HAS_UV_SET2 1");
                this.glAttributes.push({ attribute: attribute, name: "a_UV2", accessor: idx });
                break;
            case "COLOR_0":
                {
                    const accessor = gltf.accessors[idx];
                    this.defines.push("HAS_VERTEX_COLOR_" + accessor.type + " 1");
                    this.glAttributes.push({ attribute: attribute, name: "a_Color", accessor: idx });
                }
                break;
            case "JOINTS_0":
                this.hasJoints = true;
                this.defines.push("HAS_JOINT_SET1 1");
                this.glAttributes.push({ attribute: attribute, name: "a_Joint1", accessor: idx });
                break;
            case "WEIGHTS_0":
                this.hasWeights = true;
                this.defines.push("HAS_WEIGHT_SET1 1");
                this.glAttributes.push({ attribute: attribute, name: "a_Weight1", accessor: idx });
                break;
            case "JOINTS_1":
                this.hasJoints = true;
                this.defines.push("HAS_JOINT_SET2 1");
                this.glAttributes.push({ attribute: attribute, name: "a_Joint2", accessor: idx });
                break;
            case "WEIGHTS_1":
                this.hasWeights = true;
                this.defines.push("HAS_WEIGHT_SET2 1");
                this.glAttributes.push({ attribute: attribute, name: "a_Weight2", accessor: idx });
                break;
            default:
                console.log("Unknown attribute: " + attribute);
            }
        }

        // MORPH TARGETS
        if (this.targets !== undefined)
        {
            let i = 0;
            for (const target of this.targets)
            {
                if(this.glAttributes.length + 3 > maxAttributes)
                {
                    console.error("To many vertex attributes for this primitive, skipping target " + i);
                    break;
                }

                for (const attribute of Object.keys(target))
                {
                    const idx = target[attribute];

                    switch (attribute)
                    {
                    case "POSITION":
                        this.defines.push("HAS_TARGET_POSITION" + i + " 1");
                        this.glAttributes.push({ attribute: attribute, name: "a_Target_Position" + i, accessor: idx });
                        break;
                    case "NORMAL":
                        this.defines.push("HAS_TARGET_NORMAL" + i + " 1");
                        this.glAttributes.push({ attribute: attribute, name: "a_Target_Normal" + i, accessor: idx });
                        break;
                    case "TANGENT":
                        this.defines.push("HAS_TARGET_TANGENT" + i + " 1");
                        this.glAttributes.push({ attribute: attribute, name: "a_Target_Tangent" + i, accessor: idx });
                        break;
                    }
                }

                ++i;
            }
        }
    }

    getShaderIdentifier()
    {
        return "primitive.vert";
    }

    getDefines()
    {
        return this.defines;
    }

    setCentroid(centroid)
    {
        this.centroid = centroid;
    }

    decodeTest(dracoExtension, gltf)
    {
        let dracoBufferViewIDX = dracoExtension.bufferView;

        // Create the Draco decoder.
        const origGltfDracoBufferViewObj = gltf.bufferViews[dracoBufferViewIDX];
        const origGltfDracoBuffer = gltf.buffers[origGltfDracoBufferViewObj.buffer];

        let taskConfig = {};
        taskConfig.attributeIDs = {
            normal: "NORMAL",
            position: "POSITION",
            uv: "TEX_COORD",
        };
        taskConfig.attributeTypes = {
            normal: "Float32Array",
            position: "Float32Array",
            uv: "Float32Array"
        };

        let draco = gltf.dracoDecoder.module;
        let decoder = new draco.Decoder();
        let decoderBuffer = new draco.DecoderBuffer();
        decoderBuffer.Init( new Int8Array( origGltfDracoBuffer.buffer ), origGltfDracoBufferViewObj.byteLength );
        let geometry = this.decodeGeometry( draco, decoder, decoderBuffer, taskConfig );
        let buffers = geometry.attributes.map( ( attr ) => attr.array.buffer );
        if ( geometry.index ) buffers.push( geometry.index.array.buffer );

        return geometry;
    }

    copyDataFromDecodedGeometry(gltf, dracoGeometry, primitiveAttributes)
    {
        // indices
        let indexBuffer = dracoGeometry.index.array;
        const indicesGltfBuffer = new gltfBuffer();
        indicesGltfBuffer.byteLength = indexBuffer.length;
        indicesGltfBuffer.buffer = indexBuffer;
        gltf.buffers.push(indicesGltfBuffer);

        const indicesGltfBufferView = new gltfBufferView();
        indicesGltfBufferView.buffer = gltf.buffers.length - 1;
        indicesGltfBufferView.byteLength = indexBuffer.length;
        indicesGltfBufferView.name = "index buffer view";
        gltf.bufferViews.push(indicesGltfBufferView);

        gltf.accessors[this.indices].byteOffset = 0;
        gltf.accessors[this.indices].bufferView = gltf.bufferViews.length - 1;

        // Position
        let posTmpBuffer = new ArrayBuffer(dracoGeometry.attributes[1].array.length * 4);         // JS numbers are 8 bytes long, or 64 bits
        let longNumArray = new Float32Array(posTmpBuffer);  // so equivalent to Float64
        longNumArray.set(dracoGeometry.attributes[1].array);
        const positionBuffer = new Uint8Array(posTmpBuffer);

        const positionGltfBuffer = new gltfBuffer();
        positionGltfBuffer.byteLength = positionBuffer.length;
        positionGltfBuffer.buffer = positionBuffer;
        gltf.buffers.push(positionGltfBuffer);

        const positionGltfBufferView = new gltfBufferView();
        positionGltfBufferView.buffer = gltf.buffers.length - 1;
        positionGltfBufferView.byteLength = positionBuffer.length;
        positionGltfBufferView.name = "position buffer view";
        gltf.bufferViews.push(positionGltfBufferView);

        gltf.accessors[primitiveAttributes["POSITION"]].byteOffset = 0;
        gltf.accessors[primitiveAttributes["POSITION"]].bufferView = gltf.bufferViews.length - 1;

        // Normal

        let buffer = new ArrayBuffer(dracoGeometry.attributes[0].array.length * 4);         // JS numbers are 8 bytes long, or 64 bits
        longNumArray = new Float32Array(buffer);  // so equivalent to Float64
        longNumArray.set(dracoGeometry.attributes[0].array);
        const normalBuffer = new Uint8Array(buffer);

        const normalGltfBuffer = new gltfBuffer();
        normalGltfBuffer.byteLength = normalBuffer.length;
        normalGltfBuffer.buffer = normalBuffer;
        gltf.buffers.push(normalGltfBuffer);

        const normalGltfBufferView = new gltfBufferView();
        normalGltfBufferView.buffer = gltf.buffers.length - 1;
        normalGltfBufferView.byteLength = normalBuffer.length;
        normalGltfBufferView.name = "position buffer view";
        gltf.bufferViews.push(normalGltfBufferView);

        gltf.accessors[primitiveAttributes["NORMAL"]].byteOffset = 0;
        gltf.accessors[primitiveAttributes["NORMAL"]].bufferView = gltf.bufferViews.length - 1;
    }

    decodeGeometry( draco, decoder, decoderBuffer, taskConfig ) {
        let attributeIDs = taskConfig.attributeIDs;
        let attributeTypes = taskConfig.attributeTypes;

        let dracoGeometry;
        let decodingStatus;

        let geometryType = decoder.GetEncodedGeometryType( decoderBuffer );
        if ( geometryType === draco.TRIANGULAR_MESH ) {
            dracoGeometry = new draco.Mesh();
            decodingStatus = decoder.DecodeBufferToMesh( decoderBuffer, dracoGeometry );
        } else if ( geometryType === draco.POINT_CLOUD ) {
            dracoGeometry = new draco.PointCloud();
            decodingStatus = decoder.DecodeBufferToPointCloud( decoderBuffer, dracoGeometry );
        } else {
            throw new Error( 'THREE.DRACOLoader: Unexpected geometry type.' );
        }

        if ( ! decodingStatus.ok() || dracoGeometry.ptr === 0 ) {

            throw new Error( 'THREE.DRACOLoader: Decoding failed: ' + decodingStatus.error_msg() );

        }

        let geometry = { index: null, attributes: [] };

        let geometryBuffer = {};

        // Gather all vertex attributes.
        for ( let attributeName in attributeIDs ) {
            let attributeType = self[ attributeTypes[ attributeName ] ];
            let attribute;
            let attributeID;

            // A Draco file may be created with default vertex attributes, whose attribute IDs
            // are mapped 1:1 from their semantic name (POSITION, NORMAL, ...). Alternatively,
            // a Draco file may contain a custom set of attributes, identified by known unique
            // IDs. glTF files always do the latter, and `.drc` files typically do the former.
            if ( taskConfig.useUniqueIDs ) {
                attributeID = attributeIDs[ attributeName ];
                attribute = decoder.GetAttributeByUniqueId( dracoGeometry, attributeID );

            } else {
                attributeID = decoder.GetAttributeId( dracoGeometry, draco[ attributeIDs[ attributeName ] ] );

                if ( attributeID === - 1 ) continue;

                attribute = decoder.GetAttribute( dracoGeometry, attributeID );
            }
            geometry.attributes.push(this.decodeAttribute( draco, decoder, dracoGeometry, attributeName, attributeType, attribute, geometryBuffer) );
        }

        // Add index.
        if ( geometryType === draco.TRIANGULAR_MESH ) {

            // Generate mesh faces.
            let numFaces = dracoGeometry.num_faces();
            let numIndices = numFaces * 3;
            let dataSize = numIndices * 4;
            let ptr = draco._malloc( dataSize );
            decoder.GetTrianglesUInt32Array( dracoGeometry, dataSize, ptr );
            let index = new Uint32Array( draco.HEAPU32.buffer, ptr, numIndices ).slice();
            draco._free( ptr );

            geometry.index = { array: index, itemSize: 1 };

        }

        draco.destroy( dracoGeometry );
        return geometry;
    }

    decodeAttribute( draco, decoder, dracoGeometry, attributeName, attributeType, attribute, geometryBuffer) {

        let numComponents = attribute.num_components();
        let numPoints = dracoGeometry.num_points();
        let numValues = numPoints * numComponents;
        let ptr;
        let array;

        let dataSize;
        switch ( attributeType ) {

        case Float32Array:
            dataSize = numValues * 4;
            ptr = draco._malloc( dataSize );
            decoder.GetAttributeDataArrayForAllPoints( dracoGeometry, attribute, draco.DT_FLOAT32, dataSize, ptr );
            array = new Float32Array( draco.HEAPF32.buffer, ptr, numValues ).slice();
            draco._free( ptr );
            break;

        case Int8Array:
            ptr = draco._malloc( numValues );
            decoder.GetAttributeDataArrayForAllPoints( dracoGeometry, attribute, draco.DT_INT8, numValues, ptr );
            geometryBuffer[ attributeName ] = new Int8Array( draco.HEAP8.buffer, ptr, numValues ).slice();
            draco._free( ptr );
            break;

        case Int16Array:
            dataSize = numValues * 2;
            ptr = draco._malloc( dataSize );
            decoder.GetAttributeDataArrayForAllPoints( dracoGeometry, attribute, draco.DT_INT16, dataSize, ptr );
            array = new Int16Array( draco.HEAP16.buffer, ptr, numValues ).slice();
            draco._free( ptr );
            break;

        case Int32Array:
            dataSize = numValues * 4;
            ptr = draco._malloc( dataSize );
            decoder.GetAttributeDataArrayForAllPoints( dracoGeometry, attribute, draco.DT_INT32, dataSize, ptr );
            array = new Int32Array( draco.HEAP32.buffer, ptr, numValues ).slice();
            draco._free( ptr );
            break;

        case Uint8Array:
            ptr = draco._malloc( numValues );
            decoder.GetAttributeDataArrayForAllPoints( dracoGeometry, attribute, draco.DT_UINT8, numValues, ptr );
            geometryBuffer[ attributeName ] = new Uint8Array( draco.HEAPU8.buffer, ptr, numValues ).slice();
            draco._free( ptr );
            break;

        case Uint16Array:
            dataSize = numValues * 2;
            ptr = draco._malloc( dataSize );
            decoder.GetAttributeDataArrayForAllPoints( dracoGeometry, attribute, draco.DT_UINT16, dataSize, ptr );
            array = new Uint16Array( draco.HEAPU16.buffer, ptr, numValues ).slice();
            draco._free( ptr );
            break;

        case Uint32Array:
            dataSize = numValues * 4;
            ptr = draco._malloc( dataSize );
            decoder.GetAttributeDataArrayForAllPoints( dracoGeometry, attribute, draco.DT_UINT32, dataSize, ptr );
            array = new Uint32Array( draco.HEAPU32.buffer, ptr, numValues ).slice();
            draco._free( ptr );
            break;

        default:
            throw new Error( 'THREE.DRACOLoader: Unexpected attribute type.' );
        }

        return {
            name: attributeName,
            array: array,
            itemSize: numComponents
        };

    }

    concatTypedArrays(a, b) { // a, b TypedArray of same type
        let aUin8Array = new Uint8Array(a);

        let c = new Uint8Array(aUin8Array.length + b.length);
        c.set(aUin8Array, 0);
        c.set(b, aUin8Array.length);
        return c.buffer;
    }
}

export { gltfPrimitive };

