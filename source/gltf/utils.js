import { glMatrix } from 'gl-matrix';
import { PointerTargetProperty } from './pointer_target_property.js';

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

function initStateForMembers(gltfObj, state) {
    for (const name of Object.keys(gltfObj)) {
        const member = gltfObj[name];
        member?.initState?.(state);
        if (Array.isArray(member)) {
            for (const element of member) {
                element?.initState?.(state);
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
            if (target[normalizedK] instanceof PointerTargetProperty) {
                target[normalizedK].setFallbackValue(jsonObj[k]);
            }
            else {
                target[normalizedK] = jsonObj[k];
            }
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

/** use custom mod function that returns positive results for negative inputs */
function mod(left, right) {
    return ((left % right) + right) % right;
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
    constructor(totalTime) {
        this._isPaused = true;
        this._isStopped = false;
        this._totalTime = totalTime;
        this.repetitions = -1;
        this.speedChanges = [];
        /** onFinishRepetitions may hold a function that is executed when the animation stops after completing all allowed repetitions*/
        this.onFinishRepetitions; 
    }

    isPaused() {
        return this._isPaused;
    }

    isStopped() {
        return this._isStopped;
    }

    /** Calculate the complete time an animation has been playing in ms. Speed is taken into account. Result can be negative */
    calculateAnimationTime() {
        let animationTimeMs = 0.0;
        for(let i = 0; i < this.speedChanges.length; ++i) {
            const change = this.speedChanges[i];
            let durationMs = 0.0;
            if (i == this.speedChanges.length - 1) {
                durationMs = new Date().getTime() - change.timestampMs;
            } else {
                const nextChange = this.speedChanges[i + 1];
                durationMs = nextChange.timestampMs - change.timestampMs;
            }
            animationTimeMs += change.speed * durationMs
        }

        return animationTimeMs;
    }

    /** Returns time in seconds */
    time() {
        if (this._isStopped) {
            return this._totalTime - 0.02; // this constant is a quick fix to get the end state of an animation
        }

        const totalAnimationTimeSec = this.calculateAnimationTime() / 1000;
        const animationTimeSec = mod(totalAnimationTimeSec, this._totalTime);

        if (this.repetitions >= 0) {
            /** warning: using repetitions in conjunction with setTime leads to undefined behavior */
            if (totalAnimationTimeSec / this._totalTime > this.repetitions) {
                this.stop();
                if (this.onFinishRepetitions !== undefined) {
                    this.onFinishRepetitions();
                    this.onFinishRepetitions = undefined;
                }
                return this._totalTime - 0.02; // this constant is a quick fix to get the end state of an animation
            }
        }

        return animationTimeSec;
    }
    
    /** Set time in seconds */
    setTime(timeSec) {
        if (this._isStopped) {
            return;
        }
        const lastChange = this.speedChanges[this.speedChanges.length - 1];
        const currentSpeed = lastChange.speed;

        const timeNowMs = new Date().getTime();
        const newTimestamp = timeNowMs - (timeSec * 1000);

        this.speedChanges = [];
        this.speedChanges.push({ speed: 1.0, timestampMs: newTimestamp });
        this.speedChanges.push({ speed: currentSpeed, timestampMs: timeNowMs });
    }

    setSpeed(speed) {
        if (this._isStopped) {
            return;
        }
        const newSpeedChange = { speed: speed, timestampMs: new Date().getTime() };
        this.speedChanges.push(newSpeedChange);
        this._isPaused = false;
    }

    setRepetitions(repetitions) {
        this.repetitions = repetitions;
    }

    start() {
        this.speedChanges = [{ speed: 1.0, timestampMs: new Date().getTime() }];
        this._isPaused = false;
        this._isStopped = false;
    }

    pause() {
        if (this._isPaused || this._isStopped) {
            return;
        }
        this.speedChanges.push({ speed: 0.0, timestampMs: new Date().getTime() });
        this._isPaused = true;
    }

    continue() {
        if (!this._isPaused || this._isStopped) {
            return;
        }
        if (this.speedChanges.length < 2) {
            this.start();
            return;
        }
        const lastChangeBeforePause = this.speedChanges[this.speedChanges.length - 2];
        const newSpeed = lastChangeBeforePause.speed;

        const newSpeedChange = { speed: newSpeed, timestampMs: new Date().getTime() };
        this.speedChanges.push(newSpeedChange);
        this._isPaused = false;
    }

    stop() {
        this.speedChanges = [{ speed: 0.0, timestampMs: new Date().getTime() }];
        this._isStopped = true;
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
    initGlForMembers,
    initStateForMembers
};
