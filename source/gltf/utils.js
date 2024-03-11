import { glMatrix } from 'gl-matrix';

function jsToGl(array) {
    let tensor = new glMatrix.ARRAY_TYPE(array.length);

    for (let i = 0; i < array.length; ++i) {
        tensor[i] = array[i];
    }

    return tensor;
}

function jsToGlSlice(array, offset, stride) {
    let tensor = new glMatrix.ARRAY_TYPE(stride);

    for (let i = 0; i < stride; ++i) {
        tensor[i] = array[offset + i];
    }

    return tensor;
}

function initGlForMembers(gltfObj, gltf, webGlContext) {
    for (const name of Object.keys(gltfObj)) {
        const member = gltfObj[name];

        if (member === undefined) {
            continue;
        }
        if (member.initGl !== undefined) {
            member.initGl(gltf, webGlContext);
        }
        if (Array.isArray(member)) {
            for (const element of member) {
                if (element !== null && element !== undefined && element.initGl !== undefined) {
                    element.initGl(gltf, webGlContext);
                }
            }
        }
    }
}

function objectsFromJsons(jsonObjects, GltfType) {
    if (jsonObjects === undefined) {
        return [];
    }

    const objects = [];
    for (const jsonObject of jsonObjects) {
        objects.push(objectFromJson(jsonObject, GltfType));
    }
    return objects;
}

function objectFromJson(jsonObject, GltfType) {
    const object = new GltfType();
    object.fromJson(jsonObject);
    return object;
}

function fromKeys(target, jsonObj, ignore = []) {
    for (let k of Object.keys(target)) {
        if (ignore && ignore.find(function (elem) { return elem == k; }) !== undefined) {
            continue; // skip
        }
        if (jsonObj[k] !== undefined) {
            let normalizedK = k.replace("^@", "");
            target[normalizedK] = jsonObj[k];
        }
    }
}

function fromParams(parameters, target, jsonObj) {
    for (let p of parameters) {
        if (jsonObj[p] !== undefined) {
            target[p] = jsonObj[p];
        }
    }
}

function stringHash(str, seed = 0) {
    let hash = seed;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
        let chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

function clamp(number, min, max) {
    return Math.min(Math.max(number, min), max);
}

function getIsGlb(filename) {
    return getExtension(filename) == "glb";
}

function getIsGltf(filename) {
    return getExtension(filename) == "gltf";
}

function getIsHdr(filename) {
    return getExtension(filename) == "hdr";
}

function getExtension(filename) {
    const split = filename.toLowerCase().split(".");
    if (split.length == 1) {
        return undefined;
    }
    return split[split.length - 1];
}

function getFileName(filePath) {
    const split = filePath.split("/");
    return split[split.length - 1];
}

function getFileNameWithoutExtension(filePath) {
    const filename = getFileName(filePath);
    const index = filename.lastIndexOf(".");
    return filename.slice(0, index);
}

function getContainingFolder(filePath) {
    return filePath.substring(0, filePath.lastIndexOf("/") + 1);
}

function combinePaths() {
    const parts = Array.from(arguments);
    return parts.join("/");
}

// marker interface used to for parsing the uniforms
class UniformStruct { }

class Timer {
    constructor() {
        this.startTime = undefined;
        this.endTime = undefined;
        this.seconds = undefined;
    }

    start() {
        this.startTime = new Date().getTime() / 1000;
        this.endTime = undefined;
        this.seconds = undefined;
    }

    stop() {
        this.endTime = new Date().getTime() / 1000;
        this.seconds = this.endTime - this.startTime;
    }
}

class AnimationTimer {
    constructor() {
        this.startTime = 0;
        this.paused = true;
        this.fixedTime = null;
        this.pausedTime = 0;
    }

    elapsedSec() {
        if (this.paused) {
            return this.pausedTime / 1000;
        }
        else {
            return this.fixedTime || (new Date().getTime() - this.startTime) / 1000;
        }
    }

    toggle() {
        if (this.paused) {
            this.unpause();
        }
        else {
            this.pause();
        }
    }

    start() {
        this.startTime = new Date().getTime();
        this.paused = false;
    }

    pause() {
        this.pausedTime = new Date().getTime() - this.startTime;
        this.paused = true;
    }

    unpause() {
        this.startTime += new Date().getTime() - this.startTime - this.pausedTime;
        this.paused = false;
    }

    reset() {
        if (!this.paused) {
            // Animation is running.
            this.startTime = new Date().getTime();
        }
        else {
            this.startTime = 0;
        }
        this.pausedTime = 0;
    }

    setFixedTime(timeInSec) {
        this.paused = false;
        this.fixedTime = timeInSec;
    }
}

export {
    jsToGl,
    jsToGlSlice,
    objectsFromJsons,
    objectFromJson,
    fromKeys,
    fromParams,
    stringHash,
    clamp,
    getIsGlb,
    getIsGltf,
    getIsHdr,
    getExtension,
    getFileName,
    getFileNameWithoutExtension,
    getContainingFolder,
    combinePaths,
    UniformStruct,
    Timer,
    AnimationTimer,
    initGlForMembers
};
