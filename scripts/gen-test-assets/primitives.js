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

export { quad, FLOAT, UNSIGNED_SHORT };
