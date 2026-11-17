// Persists the last dropped asset and environment across page reloads so a test
// glTF (and its HDR) does not have to be dropped again. IndexedDB is used rather
// than localStorage because glTF files easily exceed the ~5 MB quota localStorage
// imposes.

const DB_NAME = "gltf-sample-viewer";
const STORE_NAME = "dropped-assets";
const ASSET_KEY = "dropped-asset";
const ENVIRONMENT_KEY = "dropped-environment";

function openDb() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => {
            request.result.createObjectStore(STORE_NAME);
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function put(key, value) {
    const db = await openDb();
    await new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        transaction.objectStore(STORE_NAME).put(value, key);
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
    });
    db.close();
}

async function get(key) {
    const db = await openDb();
    const value = await new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const request = transaction.objectStore(STORE_NAME).get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
    db.close();
    return value;
}

/**
 * Stores a dropped asset so a reload can restore it. `mainFile` and each entry of
 * `additionalFiles` are `[path, File]` pairs.
 *
 * @param {[string, File]} mainFile
 * @param {Array<[string, File]>} additionalFiles
 */
export async function saveDroppedAsset(mainFile, additionalFiles) {
    const serialize = async ([path, file]) => ({
        path,
        name: file.name,
        bytes: await file.arrayBuffer()
    });
    const asset = {
        mainFile: await serialize(mainFile),
        additionalFiles: await Promise.all(additionalFiles.map(serialize))
    };
    await put(ASSET_KEY, asset);
}

/**
 * Returns the persisted asset as `{ mainFile, additionalFiles }` of `[path, File]`
 * pairs, or undefined when nothing has been dropped yet.
 */
export async function loadDroppedAsset() {
    const asset = await get(ASSET_KEY);
    if (asset === undefined) {
        return undefined;
    }
    const deserialize = (file) => [file.path, new File([file.bytes], file.name)];
    return {
        mainFile: deserialize(asset.mainFile),
        additionalFiles: asset.additionalFiles.map(deserialize)
    };
}

/**
 * Stores a dropped environment (HDR) as a File so a reload can restore it.
 * @param {File} file
 */
export async function saveDroppedEnvironment(file) {
    await put(ENVIRONMENT_KEY, { name: file.name, bytes: await file.arrayBuffer() });
}

/**
 * Returns the persisted environment as a File, or undefined when none was dropped.
 */
export async function loadDroppedEnvironment() {
    const entry = await get(ENVIRONMENT_KEY);
    if (entry === undefined) {
        return undefined;
    }
    return new File([entry.bytes], entry.name);
}
