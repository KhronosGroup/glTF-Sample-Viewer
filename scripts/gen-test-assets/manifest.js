import {
    writeGlb,
    jsonChunk,
    binChunk
} from "../../glTF-Sample-Renderer/tests/helpers/glb_writer.js";
import { buildMeshDocument } from "./document.js";
import { quad } from "./primitives.js";

// Declarative list of generated test assets. Each entry returns an ArrayBuffer.
//
// The GLB writer is imported from the renderer rather than duplicated here, so the code
// that writes the container stays next to the code that reads it.

const CUSTOM_CHUNK_TYPE = 0x4f464e49; // "INFO", an unknown type the loader must ignore

function singleBinChunk(version, assetVersion) {
    const { json, buffers } = buildMeshDocument(quad(), { version: assetVersion });
    if (version === 3) {
        json.buffers[0].chunk = 1;
    }
    return writeGlb({ version, chunks: [jsonChunk(json), binChunk(buffers[0])] });
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
    }
};

export { ASSETS };
