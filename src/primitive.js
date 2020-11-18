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
                let dracoGeometry = this.decodeDracoBufferToIntermediate(
                    this.extensions.KHR_draco_mesh_compression, gltf);
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
            case "TANGENT":
                this.defines.push("HAS_TANGENTS 1");
                this.glAttributes.push({ attribute: attribute, name: "a_Tangent", accessor: idx });
                break;
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

    copyDataFromDecodedGeometry(gltf, dracoGeometry, primitiveAttributes)
    {
        // indices
        let indexBuffer = dracoGeometry.index.array;
        this.loadBufferIntoGltf(indexBuffer, gltf, this.indices, 34963,
                    "index buffer view");

        // Position
        if(dracoGeometry.attributes.position !== undefined)
        {
            let positionBuffer = this.loadFloat32ArrayIntoArrayBuffer(dracoGeometry.attributes.position.array);
            this.loadBufferIntoGltf(positionBuffer, gltf, primitiveAttributes["POSITION"], 34962,
                        "position buffer view");
        }

        // Normal
        if(dracoGeometry.attributes.normal !== undefined)
        {
            let normalBuffer = this.loadFloat32ArrayIntoArrayBuffer(dracoGeometry.attributes.normal.array);
            this.loadBufferIntoGltf(normalBuffer, gltf, primitiveAttributes["NORMAL"], 34962,
                        "normal buffer view");
        }

        // uv
        if(dracoGeometry.attributes.tex_coord !== undefined)
        {
            let uvBuffer = this.loadFloat32ArrayIntoArrayBuffer(dracoGeometry.attributes.tex_coord.array);
            this.loadBufferIntoGltf(uvBuffer, gltf, primitiveAttributes["TEXCOORD_0"], 34962,
                        "TEXCOORD_0 buffer view");
        }
        // Tangent
        if(dracoGeometry.attributes.tangent !== undefined)
        {
            let uvBuffer = this.loadFloat32ArrayIntoArrayBuffer(dracoGeometry.attributes.tangent.array);
            this.loadBufferIntoGltf(uvBuffer, gltf, primitiveAttributes["TANGENT"], 34962,
                        "Tangent buffer view");
        }
    }

    loadBufferIntoGltf(buffer, gltf, gltfAccessorIndex, gltfBufferViewTarget, gltfBufferViewName)
    {
        const gltfBufferObj = new gltfBuffer();
        gltfBufferObj.byteLength = buffer.byteLength;
        gltfBufferObj.buffer = buffer;
        gltf.buffers.push(gltfBufferObj);

        const gltfBufferViewObj = new gltfBufferView();
        gltfBufferViewObj.buffer = gltf.buffers.length - 1;
        gltfBufferViewObj.byteLength = buffer.byteLength;
        if(gltfBufferViewName !== undefined)
        {
            gltfBufferViewObj.name = gltfBufferViewName;
        }
        gltfBufferViewObj.target = gltfBufferViewTarget;
        gltf.bufferViews.push(gltfBufferViewObj);

        gltf.accessors[gltfAccessorIndex].byteOffset = 0;
        gltf.accessors[gltfAccessorIndex].bufferView = gltf.bufferViews.length - 1;
    }

    loadFloat32ArrayIntoArrayBuffer(float32ArrayBuffer)
    {
        let arrayBuffer = new ArrayBuffer(float32ArrayBuffer.length * 4);         // JS numbers are 8 bytes long, or 64 bits
        let floatArray = new Float32Array(arrayBuffer);  // so equivalent to Float64
        floatArray.set(float32ArrayBuffer);
        return arrayBuffer;
    }

    decodeDracoBufferToIntermediate(dracoExtension, gltf)
    {
        let dracoBufferViewIDX = dracoExtension.bufferView;

        // Create the Draco decoder.
        const origGltfDracoBufferViewObj = gltf.bufferViews[dracoBufferViewIDX];
        const origGltfDracoBuffer = gltf.buffers[origGltfDracoBufferViewObj.buffer];

        // build taskConfig
        let taskConfig = {};
        taskConfig.attributeIDs = {};
        taskConfig.attributeTypes = {};
        for(let dracoAttr in dracoExtension.attributes)
        {
            if(dracoAttr !== "NORMAL")
            {
                taskConfig.attributeIDs.normal = "NORMAL";
                taskConfig.attributeTypes.normal = "Float32Array";
            }
            if(dracoAttr !== "POSITION")
            {
                taskConfig.attributeIDs.position = "POSITION";
                taskConfig.attributeTypes.position = "Float32Array";
            }
            if(dracoAttr !== "TEXCOORD_0")
            {
                taskConfig.attributeIDs.tex_coord = "TEX_COORD";
                taskConfig.attributeTypes.tex_coord = "Float32Array";
            }
            if(dracoAttr !== "GENERIC")
            {
                taskConfig.attributeIDs.tangent = "GENERIC";
                taskConfig.attributeTypes.tangent = "Float32Array";
            }
        }

        let draco = gltf.dracoDecoder.module;
        let decoder = new draco.Decoder();
        let decoderBuffer = new draco.DecoderBuffer();
        decoderBuffer.Init( new Int8Array( origGltfDracoBuffer.buffer ), origGltfDracoBufferViewObj.byteLength );
        let geometry = this.decodeGeometry( draco, decoder, decoderBuffer, taskConfig );

        draco.destroy( decoderBuffer );

        return geometry;
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
        }
        else
        {
            throw new Error( 'THREE.DRACOLoader: Unexpected geometry type.' );
        }

        if ( ! decodingStatus.ok() || dracoGeometry.ptr === 0 ) {

            throw new Error( 'THREE.DRACOLoader: Decoding failed: ' + decodingStatus.error_msg() );

        }

        let geometry = { index: null, attributes: {} };

        // Gather all vertex attributes.
        for ( let attributeName in attributeIDs ) {
            let attributeType = self[ attributeTypes[ attributeName ] ];
            let attributeID = decoder.GetAttributeId( dracoGeometry,
                            draco[ attributeIDs[ attributeName ] ] );
            if ( attributeID === -1 )
            {
                continue;
            }
            let attribute = decoder.GetAttribute( dracoGeometry, attributeID );
            var tmpObj = this.decodeAttribute( draco, decoder,
                        dracoGeometry, attributeName, attributeType, attribute);
            geometry.attributes[tmpObj.name] = tmpObj;
        }

        // Add index buffer
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

    decodeAttribute( draco, decoder, dracoGeometry,
                    attributeName, attributeType, attribute) {
        let numComponents = attribute.num_components();
        let numPoints = dracoGeometry.num_points();
        let numValues = numPoints * numComponents;

        let dataSize = numValues * 4;
        let ptr = draco._malloc( dataSize );
        decoder.GetAttributeDataArrayForAllPoints( dracoGeometry, attribute, draco.DT_FLOAT32, dataSize, ptr );
        let array = new Float32Array( draco.HEAPF32.buffer, ptr, numValues ).slice();
        draco._free( ptr );

        return {
            name: attributeName,
            array: array,
            itemSize: numComponents
        };

    }
}

export { gltfPrimitive };

