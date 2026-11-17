// Persists the last dropped asset across page reloads so a test glTF does not have
// to be dropped again. IndexedDB is used rather than localStorage because glTF
// files easily exceed the ~5 MB quota localStorage imposes.

const DB_NAME = "gltf-sample-viewer";
const STORE_NAME = "dropped-assets";
const ASSET_KEY = "dropped-asset";

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

    const db = await openDb();
    await new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        transaction.objectStore(STORE_NAME).put(asset, ASSET_KEY);
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
    });
    db.close();
}

/**
 * Returns the persisted asset as `{ mainFile, additionalFiles }` of `[path, File]`
 * pairs, or undefined when nothing has been dropped yet.
 */
export async function loadDroppedAsset() {
    const db = await openDb();
    const asset = await new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const request = transaction.objectStore(STORE_NAME).get(ASSET_KEY);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
    db.close();

    if (asset === undefined) {
        return undefined;
    }
    const deserialize = (file) => [file.path, new File([file.bytes], file.name)];
    return {
        mainFile: deserialize(asset.mainFile),
        additionalFiles: asset.additionalFiles.map(deserialize)
    };
}
