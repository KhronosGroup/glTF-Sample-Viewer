import {
    writeGlb,
    jsonChunk,
    binChunk
} from "../../glTF-Sample-Renderer/tests/helpers/glb_writer.js";
import { buildMeshDocument } from "./document.js";
import { quad, quadWithTexCoordSets } from "./primitives.js";

// Declarative list of generated test assets. Each entry returns an ArrayBuffer.
//
// The GLB writer is imported from the renderer rather than duplicated here, so the code
// that writes the container stays next to the code that reads it.

const CUSTOM_CHUNK_TYPE = 0x4f464e49; // "INFO", an unknown type the loader must ignore

// A 2x2 PNG, small enough to inline. Distinct colours per quadrant so a wrong UV mapping
// or a wrong thumbnail is visible rather than plausible.
const TINY_PNG_BASE64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVQI12P8z4AAT" +
    "AxQwMgAI5gYGBgAEI0CAQbkbgQAAAAASUVORK5CYII=";

function pngBytes() {
    return Uint8Array.from(Buffer.from(TINY_PNG_BASE64, "base64"));
}

function singleBinChunk(version, assetVersion) {
    const { json, buffers } = buildMeshDocument(quad(), { version: assetVersion });
    if (version === 3) {
        json.buffers[0].chunk = 1;
    }
    return writeGlb({ version, chunks: [jsonChunk(json), binChunk(buffers[0])] });
}

function toGltfBuffer(json) {
    return new TextEncoder().encode(JSON.stringify(json, null, 4)).buffer;
}

const ASSETS = {
    // Baseline: the v2 container, to prove the rewrite did not regress glTF 2.0.
    "glb2_baseline.glb": () => singleBinChunk(2, "2.0"),

    // v3 with one binary chunk, bound explicitly by buffer.chunk.
    "glb3_single_bin.glb": () => singleBinChunk(3, "2.1"),

    // v3 relying on the glTF 2.0 fallback where buffer 0 implicitly means chunk 1.
    "glb3_implicit.glb": () => {
        const { json, buffers } = buildMeshDocument(quad(), { version: "2.1" });
        return writeGlb({ version: 3, chunks: [jsonChunk(json), binChunk(buffers[0])] });
    },

    // The headline feature: one binary chunk per buffer.
    "glb3_multi_bin.glb": () => {
        const { json, buffers } = buildMeshDocument(quad(), {
            bufferLayout: "per-attribute",
            version: "2.1"
        });
        json.buffers.forEach((buffer, index) => {
            buffer.chunk = index + 1;
        });
        return writeGlb({
            version: 3,
            chunks: [jsonChunk(json), ...buffers.map((bytes) => binChunk(bytes))]
        });
    },

    // v3 permits non-JSON chunks before the glTF JSON chunk.
    "glb3_chunk_before_json.glb": () => {
        const { json, buffers } = buildMeshDocument(quad(), { version: "2.1" });
        json.buffers[0].chunk = 2;
        return writeGlb({
            version: 3,
            chunks: [
                { type: CUSTOM_CHUNK_TYPE, data: new TextEncoder().encode("leading chunk") },
                jsonChunk(json),
                binChunk(buffers[0])
            ]
        });
    },

    // Unknown chunk types must be ignored, not rejected.
    "glb3_unknown_chunk_type.glb": () => {
        const { json, buffers } = buildMeshDocument(quad(), { version: "2.1" });
        json.buffers[0].chunk = 1;
        return writeGlb({
            version: 3,
            chunks: [
                jsonChunk(json),
                binChunk(buffers[0]),
                { type: CUSTOM_CHUNK_TYPE, data: new TextEncoder().encode("trailing chunk") }
            ]
        });
    },

    // A buffer chunk the loader cannot decode. Must fail cleanly, not render garbage.
    "glb3_unknown_encoding.glb": () => {
        const { json, buffers } = buildMeshDocument(quad(), { version: "2.1" });
        json.buffers[0].chunk = 1;
        return writeGlb({
            version: 3,
            chunks: [jsonChunk(json), binChunk(buffers[0], { encoding: 1 })]
        });
    },

    // An encoded JSON chunk makes the whole file unreadable.
    "glb3_unknown_encoding_json.glb": () => {
        const { json, buffers } = buildMeshDocument(quad(), { version: "2.1" });
        json.buffers[0].chunk = 1;
        return writeGlb({
            version: 3,
            chunks: [jsonChunk(json, { encoding: 1 }), binChunk(buffers[0])]
        });
    },

    // Alignment padding carried in the gap between chunks rather than counted in
    // chunkLength. Both are legal in v3 and the parser has to handle each.
    "glb3_gap_padding.glb": () => {
        const { json, buffers } = buildMeshDocument(quad(), { version: "2.1" });
        json.buffers[0].chunk = 1;
        return writeGlb({
            version: 3,
            chunks: [
                jsonChunk(json, { padInside: false }),
                binChunk(buffers[0], { padInside: false })
            ]
        });
    },

    // A thumbnail stored in a bufferView, the case where no filename extension is
    // available to infer the media type from.
    "thumbnail_bufferview.glb": () => {
        const { json, buffers } = buildMeshDocument(quad(), { version: "2.1" });
        const png = pngBytes();
        const merged = new Uint8Array(buffers[0].length + png.length);
        merged.set(buffers[0], 0);
        merged.set(png, buffers[0].length);

        json.buffers[0] = { byteLength: merged.length, chunk: 1 };
        json.bufferViews.push({
            buffer: 0,
            byteOffset: buffers[0].length,
            byteLength: png.length
        });
        json.images = [{ bufferView: json.bufferViews.length - 1, mimeType: "image/png" }];
        json.asset.thumbnail = 0;

        return writeGlb({ version: 3, chunks: [jsonChunk(json), binChunk(merged)] });
    },

    // The same image serves as the thumbnail and as a material texture, so the loader
    // must not skip loading it.
    "thumbnail_shared.glb": () => {
        const { json, buffers } = buildMeshDocument(quad(), { version: "2.1" });
        const png = pngBytes();
        const merged = new Uint8Array(buffers[0].length + png.length);
        merged.set(buffers[0], 0);
        merged.set(png, buffers[0].length);

        json.buffers[0] = { byteLength: merged.length, chunk: 1 };
        json.bufferViews.push({
            buffer: 0,
            byteOffset: buffers[0].length,
            byteLength: png.length
        });
        json.images = [{ bufferView: json.bufferViews.length - 1, mimeType: "image/png" }];
        json.samplers = [{}];
        json.textures = [{ source: 0, sampler: 0 }];
        json.materials[0].pbrMetallicRoughness.baseColorTexture = { index: 0 };
        json.asset.thumbnail = 0;

        return writeGlb({ version: 3, chunks: [jsonChunk(json), binChunk(merged)] });
    },

    // A thumbnail referenced by data URI, which needs no extra fetch at all.
    "thumbnail_datauri.gltf": () => {
        const { json, buffers } = buildMeshDocument(quad(), { version: "2.1" });
        json.buffers[0].uri =
            "data:application/gltf-buffer;base64," + Buffer.from(buffers[0]).toString("base64");
        json.images = [{ uri: `data:image/png;base64,${TINY_PNG_BASE64}`, mimeType: "image/png" }];
        json.asset.thumbnail = 0;
        return toGltfBuffer(json);
    },

    // glTF 2.1 texture coordinate sets need not start at 0 or be consecutive. Base
    // colour uses TEXCOORD_1 and occlusion uses TEXCOORD_3, so a renderer that ignores
    // the remapping will sample the wrong set.
    "texcoord_1_3.gltf": () => {
        const { json, buffers } = buildMeshDocument(quadWithTexCoordSets([1, 3]), {
            version: "2.1"
        });
        json.buffers[0].uri =
            "data:application/gltf-buffer;base64," + Buffer.from(buffers[0]).toString("base64");
        json.images = [{ uri: `data:image/png;base64,${TINY_PNG_BASE64}`, mimeType: "image/png" }];
        json.samplers = [{}];
        json.textures = [{ source: 0, sampler: 0 }];
        json.materials[0].pbrMetallicRoughness.baseColorTexture = { index: 0, texCoord: 1 };
        json.materials[0].occlusionTexture = { index: 0, texCoord: 3 };
        return toGltfBuffer(json);
    },

    // A single set at a non-zero index, the simplest form of the relaxation.
    "texcoord_5_only.gltf": () => {
        const { json, buffers } = buildMeshDocument(quadWithTexCoordSets([5]), {
            version: "2.1"
        });
        json.buffers[0].uri =
            "data:application/gltf-buffer;base64," + Buffer.from(buffers[0]).toString("base64");
        json.images = [{ uri: `data:image/png;base64,${TINY_PNG_BASE64}`, mimeType: "image/png" }];
        json.samplers = [{}];
        json.textures = [{ source: 0, sampler: 0 }];
        json.materials[0].pbrMetallicRoughness.baseColorTexture = { index: 0, texCoord: 5 };
        return toGltfBuffer(json);
    },

    // The material asks for a set the primitive does not provide. Must warn and fall
    // back rather than sampling garbage.
    "texcoord_missing_set.gltf": () => {
        const { json, buffers } = buildMeshDocument(quadWithTexCoordSets([0]), {
            version: "2.1"
        });
        json.buffers[0].uri =
            "data:application/gltf-buffer;base64," + Buffer.from(buffers[0]).toString("base64");
        json.images = [{ uri: `data:image/png;base64,${TINY_PNG_BASE64}`, mimeType: "image/png" }];
        json.samplers = [{}];
        json.textures = [{ source: 0, sampler: 0 }];
        json.materials[0].pbrMetallicRoughness.baseColorTexture = { index: 0, texCoord: 2 };
        return toGltfBuffer(json);
    },

    // One of every shape type, with bounding volumes referencing them. Half use explicit
    // parameters and half rely on the 2.1 defaults.
    "shapes_all.gltf": () => {
        const { json, buffers } = buildMeshDocument(quad(), { version: "2.1" });
        json.buffers[0].uri =
            "data:application/gltf-buffer;base64," + Buffer.from(buffers[0]).toString("base64");

        json.shapes = [
            { type: "box", box: { size: [2, 1, 3] } },
            { type: "box" },
            { type: "sphere", sphere: { radius: 2 } },
            { type: "sphere" },
            { type: "cylinder", cylinder: { height: 3, radiusTop: 0.2, radiusBottom: 1 } },
            { type: "cylinder" },
            { type: "capsule", capsule: { height: 2, radiusTop: 0.3, radiusBottom: 0.6 } },
            { type: "capsule" },
            { type: "plane", plane: { sizeX: 4, sizeZ: 4 } },
            { type: "plane" },
            { type: "mesh", mesh: { mesh: 0 } },
            { type: "convexMesh", convexMesh: { mesh: 0 } }
        ];

        json.nodes = json.shapes.map((_, index) => ({
            name: `Shape${index}`,
            translation: [index * 2, 0, 0],
            boundingVolume: { shape: index }
        }));
        json.nodes.push({ name: "Mesh", mesh: 0 });
        json.scenes = [{ nodes: json.nodes.map((_, index) => index) }];

        return toGltfBuffer(json);
    },

    // A bounding volume with its own TRS on a node that is itself scaled and rotated.
    // Pins the transform order from KhronosGroup/glTF#2666.
    "bv_transform.gltf": () => {
        const { json, buffers } = buildMeshDocument(quad(), { version: "2.1" });
        json.buffers[0].uri =
            "data:application/gltf-buffer;base64," + Buffer.from(buffers[0]).toString("base64");

        json.shapes = [{ type: "box", box: { size: [1, 1, 1] } }];
        json.nodes = [
            {
                name: "ScaledRotated",
                mesh: 0,
                scale: [2, 1, 0.5],
                rotation: [0, 0.3826834, 0, 0.9238795],
                boundingVolume: {
                    shape: 0,
                    translation: [1, 0, 0],
                    rotation: [0.3826834, 0, 0, 0.9238795],
                    scale: [1, 2, 1]
                }
            }
        ];
        json.scenes = [{ nodes: [0] }];

        return toGltfBuffer(json);
    }
};

export { ASSETS };
