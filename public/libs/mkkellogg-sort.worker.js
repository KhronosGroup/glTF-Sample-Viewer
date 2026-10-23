/**
 * mkkellogg-sort.worker.js
 *
 * Web Worker that runs the mkkellogg counting-sort WASM extracted from
 * @mkkellogg/gaussian-splats-3d.
 *
 * Exported function (from sorter.cpp):
 *   sortIndexes(
 *     indexes*,          // i32 – input/output index array
 *     centers*,          // i32 – float positions stride-4 (x,y,z,w)
 *     precomputed*,      // i32 – pass 0 (unused when usePrecomputedDistances=false)
 *     mappedDistances*,  // i32 – scratch int array, size=renderCount
 *     frequencies*,      // i32 – scratch uint array, size=distanceMapRange
 *     modelViewProj*,    // i32 – view matrix (4×4 column-major float)
 *     indexesOut*,       // i32 – output sorted index array
 *     sceneIndexes*,     // i32 – pass 0 (unused when dynamicMode=false)
 *     transforms*,       // i32 – pass 0 (unused when dynamicMode=false)
 *     distanceMapRange,  // i32 – histogram bin count (32768)
 *     sortCount,         // i32 – splats to sort (= splatCount)
 *     renderCount,       // i32 – rendered splat count (= splatCount)
 *     splatCount,        // i32 – total splat count
 *     usePrecomputedDistances, // i32 – 0 (false)
 *     useIntegerSort,         // i32 – 0 (false → float path)
 *     dynamicMode             // i32 – 0 (false → single scene)
 *   )
 *
 * Messages in:
 *   { type:'init',  posOp: Float32Array, splatCount: number }
 *   { type:'sort',  viewMatrix: Float32Array[16] }
 *
 * Messages out:
 *   { type:'ready' }
 *   { type:'sorted', indices: Uint32Array }  (buffer transferred)
 *   { type:'error',  message: string }
 */

// Resolve the WASM URL relative to this worker file, compatible with both
// Rollup (import.meta.url is the worker script URL at runtime) and dev servers.
const wasmUrl = new URL('./sorter_no_simd_non_shared.wasm', import.meta.url).href;

// ── Constants ──────────────────────────────────────────────────────────────────

const DIST_MAP_RANGE = 32768;
const HEADER_PAGES   = 1;          // reserve 1 WASM page (64 KiB) for internal use
const PAGE_BYTES     = 65536;

// ── Module-level state ────────────────────────────────────────────────────────

let sortFn = null;   // wasm export function
let memBuf = null;   // WebAssembly.Memory

// Byte offsets (set during init)
let pIndexes = 0, pCenters = 0, pMappedDist = 0,
    pFrequencies = 0, pMVP = 0, pIndexesOut = 0;
let N = 0;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Align a byte offset up to 16-byte boundary. */
const align16 = (b) => (b + 15) & ~15;

// ── Initialisation ────────────────────────────────────────────────────────────

async function init({ posOp, splatCount }) {
    N = splatCount;

    // Layout each buffer (byte offsets in WebAssembly.Memory)
    let off = HEADER_PAGES * PAGE_BYTES;

    pIndexes     = off;  off = align16(off + N * 4);          // Uint32[N]
    pCenters     = off;  off = align16(off + N * 4 * 4);      // Float32[N*4]
    pMappedDist  = off;  off = align16(off + N * 4);          // Int32[N]
    pFrequencies = off;  off = align16(off + DIST_MAP_RANGE * 4); // Uint32[32768]
    pMVP         = off;  off = align16(off + 16 * 4);         // Float32[16]
    pIndexesOut  = off;  off = align16(off + N * 4);          // Uint32[N]

    const totalBytes = off;
    const pages      = Math.ceil(totalBytes / PAGE_BYTES) + 2; // +2 for safety

    memBuf = new WebAssembly.Memory({ initial: pages, maximum: pages + 4 });

    let instance;
    try {
        const response = await fetch(wasmUrl);
        ({ instance } = await WebAssembly.instantiateStreaming(response, {
            env: { memory: memBuf },
        }));
    } catch (err) {
        // Fallback: fetch as ArrayBuffer (needed when streaming isn't available).
        const ab = await (await fetch(wasmUrl)).arrayBuffer();
        ({ instance } = await WebAssembly.instantiate(ab, {
            env: { memory: memBuf },
        }));
    }

    sortFn = instance.exports.sortIndexes;
    if (typeof instance.exports.__wasm_call_ctors === 'function') {
        instance.exports.__wasm_call_ctors();
    }

    // Populate centres (stride-4): Float32 (x, y, z, opacity) — raw positions.
    const fv = new Float32Array(memBuf.buffer);
    fv.set(new Float32Array(posOp, 0, N * 4), pCenters >> 2);

    // Initialise indexes 0..N-1
    const uv = new Uint32Array(memBuf.buffer);
    for (let i = 0; i < N; i++) uv[(pIndexes >> 2) + i] = i;

    self.postMessage({ type: 'ready' });
}

// ── Sort ──────────────────────────────────────────────────────────────────────

function sort({ viewMatrix }) {
    const uv = new Uint32Array(memBuf.buffer);
    const fv = new Float32Array(memBuf.buffer);

    // Reset frequencies histogram to zero
    uv.fill(0, pFrequencies >> 2, (pFrequencies >> 2) + DIST_MAP_RANGE);

    // Write view matrix into WASM memory, with the Z row negated.
    // The standard lookAt puts -forward in row 2, so visible splats have negative
    // distances (near ≈ −ε, far ≈ −∞).  The WASM counting sort maps low values to
    // low bins and places them at the END of indexesOut, giving front-to-back order.
    // By negating row 2 (columns 2, 6, 10, 14) we flip all distances to positive
    // (near ≈ +ε, far ≈ +∞), so the sort naturally produces back-to-front order
    // with no O(N) reversal pass needed.
    fv.set(viewMatrix, pMVP >> 2);
    const base = pMVP >> 2;
    fv[base +  2] = -fv[base +  2];
    fv[base +  6] = -fv[base +  6];
    fv[base + 10] = -fv[base + 10];
    fv[base + 14] = -fv[base + 14];

    // Call the counting sort
    //   sortIndexes(indexes, centers, precomputed, mappedDist, frequencies,
    //               mvp, indexesOut, sceneIdxs, transforms,
    //               distMapRange, sortCount, renderCount, splatCount,
    //               usePrecomputed, useIntegerSort, dynamicMode)
    sortFn(
        pIndexes, pCenters, 0,
        pMappedDist, pFrequencies, pMVP,
        pIndexesOut, 0, 0,
        DIST_MAP_RANGE, N, N, N,
        0, 0, 0,
    );

    const out = new Uint32Array(uv.subarray(pIndexesOut >> 2, (pIndexesOut >> 2) + N));
    self.postMessage({ type: 'sorted', indices: out }, [out.buffer]);
}

// ── Message dispatcher ────────────────────────────────────────────────────────

self.onmessage = async (e) => {
    try {
        if (e.data.type === 'init') {
            await init(e.data);
        } else if (e.data.type === 'sort') {
            sort(e.data);
        }
    } catch (err) {
        self.postMessage({ type: 'error', message: String(err) });
    }
};
