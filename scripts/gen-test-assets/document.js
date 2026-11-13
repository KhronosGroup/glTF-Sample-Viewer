// Assembles a minimal glTF document around generated geometry, laying the binary data
// out across a configurable number of buffers so GLB chunk binding can be exercised.

function alignUp(value, alignment) {
    return Math.ceil(value / alignment) * alignment;
}

function toBytes(typedArray) {
    return new Uint8Array(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
}

/**
 * Builds a single-mesh glTF document.
 *
 * @param {object} geometry From primitives.js.
 * @param {object} [options]
 * @param {"single"|"per-attribute"} [options.bufferLayout] `per-attribute` puts every
 *   accessor in its own buffer, which is how multiple GLB binary chunks get used.
 * @param {string} [options.version] Value for `asset.version`.
 * @returns {{ json: object, buffers: Uint8Array[] }}
 */
function buildMeshDocument(geometry, { bufferLayout = "single", version = "2.0" } = {}) {
    // Morph target accessors sit between the attributes and the indices, so the indices
    // stay the last accessor, which is how the primitive refers to them.
    const targetEntries = (geometry.targets ?? []).map((target) => Object.entries(target));
    const targetSources = targetEntries.flat().map(([, source]) => source);
    const sources = [...geometry.attributes, ...targetSources, geometry.indices];
    const perAttribute = bufferLayout === "per-attribute";

    const buffers = [];
    const bufferViews = [];
    const accessors = [];

    let singleBufferParts = [];
    let singleBufferOffset = 0;

    for (const source of sources) {
        const bytes = toBytes(source.data);
        let bufferIndex;
        let byteOffset;

        if (perAttribute) {
            bufferIndex = buffers.length;
            byteOffset = 0;
            buffers.push(bytes);
        } else {
            bufferIndex = 0;
            byteOffset = alignUp(singleBufferOffset, 4);
            singleBufferParts.push({ bytes, byteOffset });
            singleBufferOffset = byteOffset + bytes.length;
        }

        bufferViews.push({ buffer: bufferIndex, byteOffset, byteLength: bytes.length });
        accessors.push({
            bufferView: bufferViews.length - 1,
            componentType: source.componentType,
            count: source.count,
            type: source.type,
            ...(source.min !== undefined ? { min: source.min, max: source.max } : {})
        });
    }

    if (!perAttribute) {
        const merged = new Uint8Array(alignUp(singleBufferOffset, 4));
        for (const part of singleBufferParts) {
            merged.set(part.bytes, part.byteOffset);
        }
        buffers.push(merged);
    }

    const attributes = {};
    geometry.attributes.forEach((attribute, index) => {
        attributes[attribute.semantic] = index;
    });

    let nextTargetAccessor = geometry.attributes.length;
    const targets = targetEntries.map((entries) =>
        Object.fromEntries(entries.map(([semantic]) => [semantic, nextTargetAccessor++]))
    );

    const json = {
        asset: { version },
        scene: 0,
        scenes: [{ nodes: [0] }],
        nodes: [{ mesh: 0, name: "TestMesh" }],
        meshes: [
            {
                primitives: [
                    {
                        attributes,
                        indices: accessors.length - 1,
                        material: 0,
                        ...(targets.length > 0 ? { targets } : {})
                    }
                ],
                ...(targets.length > 0 ? { weights: geometry.weights ?? targets.map(() => 1) } : {})
            }
        ],
        materials: [
            {
                pbrMetallicRoughness: {
                    baseColorFactor: [0.8, 0.3, 0.2, 1.0],
                    metallicFactor: 0.0,
                    roughnessFactor: 0.6
                }
            }
        ],
        accessors,
        bufferViews,
        buffers: buffers.map((bytes) => ({ byteLength: bytes.length }))
    };

    return { json, buffers };
}

export { buildMeshDocument, alignUp };
