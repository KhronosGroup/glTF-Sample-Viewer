// Geometry for generated test assets. Deliberately tiny: these exist to exercise
// container and loader paths, not to look good.

const FLOAT = 5126;
const UNSIGNED_SHORT = 5123;

// A unit quad on the XY plane, two triangles, with positions, normals and UVs.
function quad() {
    const positions = new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0]);
    const normals = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]);
    const uvs = new Float32Array([0, 1, 1, 1, 1, 0, 0, 0]);
    const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

    return {
        attributes: [
            {
                semantic: "POSITION",
                data: positions,
                componentType: FLOAT,
                type: "VEC3",
                count: 4,
                min: [-0.5, -0.5, 0],
                max: [0.5, 0.5, 0]
            },
            { semantic: "NORMAL", data: normals, componentType: FLOAT, type: "VEC3", count: 4 },
            { semantic: "TEXCOORD_0", data: uvs, componentType: FLOAT, type: "VEC2", count: 4 }
        ],
        indices: { data: indices, componentType: UNSIGNED_SHORT, type: "SCALAR", count: 6 }
    };
}

/**
 * A quad whose texture coordinate sets use arbitrary indices, to exercise glTF 2.1's
 * relaxed rule that they need not start at 0 or be consecutive.
 *
 * @param {number[]} setIndices e.g. `[1, 3]` produces TEXCOORD_1 and TEXCOORD_3.
 */
function quadWithTexCoordSets(setIndices, { scales } = {}) {
    const geometry = quad();
    const uvAttribute = geometry.attributes.find((a) => a.semantic === "TEXCOORD_0");
    const others = geometry.attributes.filter((a) => a.semantic !== "TEXCOORD_0");

    // Each set gets distinct UVs so a wrong mapping is visible rather than coincidental.
    // Explicit scales let one asset reproduce another's nth set as its only set, which is
    // how a test can compare the two without a recorded baseline.
    const sets = setIndices.map((index, position) => {
        const scale = scales?.[position] ?? 1 / (position + 1);
        const data = new Float32Array(uvAttribute.data.length);
        for (let i = 0; i < data.length; i++) {
            data[i] = uvAttribute.data[i] * scale;
        }
        return { ...uvAttribute, semantic: `TEXCOORD_${index}`, data };
    });

    return { ...geometry, attributes: [...others, ...sets] };
}

function texCoordAttribute(geometry, setIndex) {
    const semantic = `TEXCOORD_${setIndex}`;
    const attribute = geometry.attributes.find((a) => a.semantic === semantic);
    if (attribute === undefined) {
        throw new Error(`geometry has no ${semantic}`);
    }
    return attribute;
}

/**
 * Adds a morph target that shifts one texture coordinate set by a constant.
 *
 * @param {number} setIndex The TEXCOORD_n to displace.
 * @param {number[]} delta Added to every vertex of that set when the weight is 1.
 */
function withTexCoordMorphTarget(geometry, setIndex, delta) {
    const attribute = texCoordAttribute(geometry, setIndex);
    const data = new Float32Array(attribute.data.length);
    for (let i = 0; i < data.length; i++) {
        data[i] = delta[i % 2];
    }
    return {
        ...geometry,
        targets: [{ [attribute.semantic]: { ...attribute, data } }]
    };
}

/**
 * Shifts a texture coordinate set in the geometry itself, i.e. the result the morph
 * target above is supposed to produce at weight 1.
 */
function withShiftedTexCoords(geometry, setIndex, delta) {
    const semantic = texCoordAttribute(geometry, setIndex).semantic;
    return {
        ...geometry,
        attributes: geometry.attributes.map((attribute) => {
            if (attribute.semantic !== semantic) {
                return attribute;
            }
            const data = new Float32Array(attribute.data.length);
            for (let i = 0; i < data.length; i++) {
                data[i] = attribute.data[i] + delta[i % 2];
            }
            return { ...attribute, data };
        })
    };
}

export {
    quad,
    quadWithTexCoordSets,
    withShiftedTexCoords,
    withTexCoordMorphTarget,
    FLOAT,
    UNSIGNED_SHORT
};
