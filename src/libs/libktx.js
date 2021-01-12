var LIBKTX = (function () {
    var _scriptDir = typeof document !== "undefined" && document.currentScript ? document.currentScript.src : undefined;
    return function (LIBKTX) {
        LIBKTX = LIBKTX || {};

        var Module = typeof LIBKTX !== "undefined" ? LIBKTX : {};
        var moduleOverrides = {};
        var key;
        for (key in Module) {
            if (Module.hasOwnProperty(key)) {
                moduleOverrides[key] = Module[key];
            }
        }
        var arguments_ = [];
        var thisProgram = "./this.program";
        var quit_ = function (status, toThrow) {
            throw toThrow;
        };
        var ENVIRONMENT_IS_WEB = false;
        var ENVIRONMENT_IS_WORKER = false;
        var ENVIRONMENT_IS_NODE = false;
        var ENVIRONMENT_HAS_NODE = false;
        var ENVIRONMENT_IS_SHELL = false;
        ENVIRONMENT_IS_WEB = typeof window === "object";
        ENVIRONMENT_IS_WORKER = typeof importScripts === "function";
        ENVIRONMENT_HAS_NODE = typeof process === "object" && typeof process.versions === "object" && typeof process.versions.node === "string";
        ENVIRONMENT_IS_NODE = ENVIRONMENT_HAS_NODE && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;
        ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
        var scriptDirectory = "";
        function locateFile(path) {
            if (Module["locateFile"]) {
                return Module["locateFile"](path, scriptDirectory);
            }
            return scriptDirectory + path;
        }
        var read_, readAsync, readBinary, setWindowTitle;
        if (ENVIRONMENT_IS_NODE) {
            scriptDirectory = __dirname + "/";
            var nodeFS;
            var nodePath;
            read_ = function shell_read(filename, binary) {
                var ret;
                if (!nodeFS) nodeFS = require("fs");
                if (!nodePath) nodePath = require("path");
                filename = nodePath["normalize"](filename);
                ret = nodeFS["readFileSync"](filename);
                return binary ? ret : ret.toString();
            };
            readBinary = function readBinary(filename) {
                var ret = read_(filename, true);
                if (!ret.buffer) {
                    ret = new Uint8Array(ret);
                }
                assert(ret.buffer);
                return ret;
            };
            if (process["argv"].length > 1) {
                thisProgram = process["argv"][1].replace(/\\/g, "/");
            }
            arguments_ = process["argv"].slice(2);
            process["on"]("uncaughtException", function (ex) {
                if (!(ex instanceof ExitStatus)) {
                    throw ex;
                }
            });
            process["on"]("unhandledRejection", abort);
            quit_ = function (status) {
                process["exit"](status);
            };
            Module["inspect"] = function () {
                return "[Emscripten Module object]";
            };
        } else if (ENVIRONMENT_IS_SHELL) {
            if (typeof read != "undefined") {
                read_ = function shell_read(f) {
                    return read(f);
                };
            }
            readBinary = function readBinary(f) {
                var data;
                if (typeof readbuffer === "function") {
                    return new Uint8Array(readbuffer(f));
                }
                data = read(f, "binary");
                assert(typeof data === "object");
                return data;
            };
            if (typeof scriptArgs != "undefined") {
                arguments_ = scriptArgs;
            } else if (typeof arguments != "undefined") {
                arguments_ = arguments;
            }
            if (typeof quit === "function") {
                quit_ = function (status) {
                    quit(status);
                };
            }
            if (typeof print !== "undefined") {
                if (typeof console === "undefined") console = {};
                console.log = print;
                console.warn = console.error = typeof printErr !== "undefined" ? printErr : print;
            }
        } else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
            if (ENVIRONMENT_IS_WORKER) {
                scriptDirectory = self.location.href;
            } else if (document.currentScript) {
                scriptDirectory = document.currentScript.src;
            }
            if (_scriptDir) {
                scriptDirectory = _scriptDir;
            }
            if (scriptDirectory.indexOf("blob:") !== 0) {
                scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf("/") + 1);
            } else {
                scriptDirectory = "";
            }
            read_ = function shell_read(url) {
                var xhr = new XMLHttpRequest();
                xhr.open("GET", url, false);
                xhr.send(null);
                return xhr.responseText;
            };
            if (ENVIRONMENT_IS_WORKER) {
                readBinary = function readBinary(url) {
                    var xhr = new XMLHttpRequest();
                    xhr.open("GET", url, false);
                    xhr.responseType = "arraybuffer";
                    xhr.send(null);
                    return new Uint8Array(xhr.response);
                };
            }
            readAsync = function readAsync(url, onload, onerror) {
                var xhr = new XMLHttpRequest();
                xhr.open("GET", url, true);
                xhr.responseType = "arraybuffer";
                xhr.onload = function xhr_onload() {
                    if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) {
                        onload(xhr.response);
                        return;
                    }
                    onerror();
                };
                xhr.onerror = onerror;
                xhr.send(null);
            };
            setWindowTitle = function (title) {
                document.title = title;
            };
        } else {
        }
        var out = Module["print"] || console.log.bind(console);
        var err = Module["printErr"] || console.warn.bind(console);
        for (key in moduleOverrides) {
            if (moduleOverrides.hasOwnProperty(key)) {
                Module[key] = moduleOverrides[key];
            }
        }
        moduleOverrides = null;
        if (Module["arguments"]) arguments_ = Module["arguments"];
        if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
        if (Module["quit"]) quit_ = Module["quit"];
        function dynamicAlloc(size) {
            var ret = HEAP32[DYNAMICTOP_PTR >> 2];
            var end = (ret + size + 15) & -16;
            if (end > _emscripten_get_heap_size()) {
                abort();
            }
            HEAP32[DYNAMICTOP_PTR >> 2] = end;
            return ret;
        }
        function getNativeTypeSize(type) {
            switch (type) {
                case "i1":
                case "i8":
                    return 1;
                case "i16":
                    return 2;
                case "i32":
                    return 4;
                case "i64":
                    return 8;
                case "float":
                    return 4;
                case "double":
                    return 8;
                default: {
                    if (type[type.length - 1] === "*") {
                        return 4;
                    } else if (type[0] === "i") {
                        var bits = parseInt(type.substr(1));
                        assert(bits % 8 === 0, "getNativeTypeSize invalid bits " + bits + ", type " + type);
                        return bits / 8;
                    } else {
                        return 0;
                    }
                }
            }
        }
        var asm2wasmImports = {
            "f64-rem": function (x, y) {
                return x % y;
            },
            debugger: function () {},
        };
        var functionPointers = new Array(0);
        var tempRet0 = 0;
        var setTempRet0 = function (value) {
            tempRet0 = value;
        };
        var wasmBinary;
        if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];
        var noExitRuntime;
        if (Module["noExitRuntime"]) noExitRuntime = Module["noExitRuntime"];
        if (typeof WebAssembly !== "object") {
            err("no native wasm support detected");
        }
        function setValue(ptr, value, type, noSafe) {
            type = type || "i8";
            if (type.charAt(type.length - 1) === "*") type = "i32";
            switch (type) {
                case "i1":
                    HEAP8[ptr >> 0] = value;
                    break;
                case "i8":
                    HEAP8[ptr >> 0] = value;
                    break;
                case "i16":
                    HEAP16[ptr >> 1] = value;
                    break;
                case "i32":
                    HEAP32[ptr >> 2] = value;
                    break;
                case "i64":
                    (tempI64 = [
                        value >>> 0,
                        ((tempDouble = value),
                        +Math_abs(tempDouble) >= 1 ? (tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0) : 0),
                    ]),
                        (HEAP32[ptr >> 2] = tempI64[0]),
                        (HEAP32[(ptr + 4) >> 2] = tempI64[1]);
                    break;
                case "float":
                    HEAPF32[ptr >> 2] = value;
                    break;
                case "double":
                    HEAPF64[ptr >> 3] = value;
                    break;
                default:
                    abort("invalid type for setValue: " + type);
            }
        }
        var wasmMemory;
        var wasmTable;
        var ABORT = false;
        var EXITSTATUS = 0;
        function assert(condition, text) {
            if (!condition) {
                abort("Assertion failed: " + text);
            }
        }
        var ALLOC_NONE = 3;
        function allocate(slab, types, allocator, ptr) {
            var zeroinit, size;
            if (typeof slab === "number") {
                zeroinit = true;
                size = slab;
            } else {
                zeroinit = false;
                size = slab.length;
            }
            var singleType = typeof types === "string" ? types : null;
            var ret;
            if (allocator == ALLOC_NONE) {
                ret = ptr;
            } else {
                ret = [_malloc, stackAlloc, dynamicAlloc][allocator](Math.max(size, singleType ? 1 : types.length));
            }
            if (zeroinit) {
                var stop;
                ptr = ret;
                assert((ret & 3) == 0);
                stop = ret + (size & ~3);
                for (; ptr < stop; ptr += 4) {
                    HEAP32[ptr >> 2] = 0;
                }
                stop = ret + size;
                while (ptr < stop) {
                    HEAP8[ptr++ >> 0] = 0;
                }
                return ret;
            }
            if (singleType === "i8") {
                if (slab.subarray || slab.slice) {
                    HEAPU8.set(slab, ret);
                } else {
                    HEAPU8.set(new Uint8Array(slab), ret);
                }
                return ret;
            }
            var i = 0,
                type,
                typeSize,
                previousType;
            while (i < size) {
                var curr = slab[i];
                type = singleType || types[i];
                if (type === 0) {
                    i++;
                    continue;
                }
                if (type == "i64") type = "i32";
                setValue(ret + i, curr, type);
                if (previousType !== type) {
                    typeSize = getNativeTypeSize(type);
                    previousType = type;
                }
                i += typeSize;
            }
            return ret;
        }
        var UTF8Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : undefined;
        function UTF8ArrayToString(u8Array, idx, maxBytesToRead) {
            var endIdx = idx + maxBytesToRead;
            var endPtr = idx;
            while (u8Array[endPtr] && !(endPtr >= endIdx)) ++endPtr;
            if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
                return UTF8Decoder.decode(u8Array.subarray(idx, endPtr));
            } else {
                var str = "";
                while (idx < endPtr) {
                    var u0 = u8Array[idx++];
                    if (!(u0 & 128)) {
                        str += String.fromCharCode(u0);
                        continue;
                    }
                    var u1 = u8Array[idx++] & 63;
                    if ((u0 & 224) == 192) {
                        str += String.fromCharCode(((u0 & 31) << 6) | u1);
                        continue;
                    }
                    var u2 = u8Array[idx++] & 63;
                    if ((u0 & 240) == 224) {
                        u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
                    } else {
                        u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (u8Array[idx++] & 63);
                    }
                    if (u0 < 65536) {
                        str += String.fromCharCode(u0);
                    } else {
                        var ch = u0 - 65536;
                        str += String.fromCharCode(55296 | (ch >> 10), 56320 | (ch & 1023));
                    }
                }
            }
            return str;
        }
        function UTF8ToString(ptr, maxBytesToRead) {
            return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";
        }
        function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
            if (!(maxBytesToWrite > 0)) return 0;
            var startIdx = outIdx;
            var endIdx = outIdx + maxBytesToWrite - 1;
            for (var i = 0; i < str.length; ++i) {
                var u = str.charCodeAt(i);
                if (u >= 55296 && u <= 57343) {
                    var u1 = str.charCodeAt(++i);
                    u = (65536 + ((u & 1023) << 10)) | (u1 & 1023);
                }
                if (u <= 127) {
                    if (outIdx >= endIdx) break;
                    outU8Array[outIdx++] = u;
                } else if (u <= 2047) {
                    if (outIdx + 1 >= endIdx) break;
                    outU8Array[outIdx++] = 192 | (u >> 6);
                    outU8Array[outIdx++] = 128 | (u & 63);
                } else if (u <= 65535) {
                    if (outIdx + 2 >= endIdx) break;
                    outU8Array[outIdx++] = 224 | (u >> 12);
                    outU8Array[outIdx++] = 128 | ((u >> 6) & 63);
                    outU8Array[outIdx++] = 128 | (u & 63);
                } else {
                    if (outIdx + 3 >= endIdx) break;
                    outU8Array[outIdx++] = 240 | (u >> 18);
                    outU8Array[outIdx++] = 128 | ((u >> 12) & 63);
                    outU8Array[outIdx++] = 128 | ((u >> 6) & 63);
                    outU8Array[outIdx++] = 128 | (u & 63);
                }
            }
            outU8Array[outIdx] = 0;
            return outIdx - startIdx;
        }
        function stringToUTF8(str, outPtr, maxBytesToWrite) {
            return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
        }
        function lengthBytesUTF8(str) {
            var len = 0;
            for (var i = 0; i < str.length; ++i) {
                var u = str.charCodeAt(i);
                if (u >= 55296 && u <= 57343) u = (65536 + ((u & 1023) << 10)) | (str.charCodeAt(++i) & 1023);
                if (u <= 127) ++len;
                else if (u <= 2047) len += 2;
                else if (u <= 65535) len += 3;
                else len += 4;
            }
            return len;
        }
        var UTF16Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-16le") : undefined;
        function allocateUTF8(str) {
            var size = lengthBytesUTF8(str) + 1;
            var ret = _malloc(size);
            if (ret) stringToUTF8Array(str, HEAP8, ret, size);
            return ret;
        }
        function writeArrayToMemory(array, buffer) {
            HEAP8.set(array, buffer);
        }
        var WASM_PAGE_SIZE = 65536;
        function alignUp(x, multiple) {
            if (x % multiple > 0) {
                x += multiple - (x % multiple);
            }
            return x;
        }
        var buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
        function updateGlobalBufferAndViews(buf) {
            buffer = buf;
            Module["HEAP8"] = HEAP8 = new Int8Array(buf);
            Module["HEAP16"] = HEAP16 = new Int16Array(buf);
            Module["HEAP32"] = HEAP32 = new Int32Array(buf);
            Module["HEAPU8"] = HEAPU8 = new Uint8Array(buf);
            Module["HEAPU16"] = HEAPU16 = new Uint16Array(buf);
            Module["HEAPU32"] = HEAPU32 = new Uint32Array(buf);
            Module["HEAPF32"] = HEAPF32 = new Float32Array(buf);
            Module["HEAPF64"] = HEAPF64 = new Float64Array(buf);
        }
        var DYNAMIC_BASE = 5615824,
            DYNAMICTOP_PTR = 372912;
        var INITIAL_TOTAL_MEMORY = Module["TOTAL_MEMORY"] || 16777216;
        if (Module["wasmMemory"]) {
            wasmMemory = Module["wasmMemory"];
        } else {
            wasmMemory = new WebAssembly.Memory({ initial: INITIAL_TOTAL_MEMORY / WASM_PAGE_SIZE });
        }
        if (wasmMemory) {
            buffer = wasmMemory.buffer;
        }
        INITIAL_TOTAL_MEMORY = buffer.byteLength;
        updateGlobalBufferAndViews(buffer);
        HEAP32[DYNAMICTOP_PTR >> 2] = DYNAMIC_BASE;
        function callRuntimeCallbacks(callbacks) {
            while (callbacks.length > 0) {
                var callback = callbacks.shift();
                if (typeof callback == "function") {
                    callback();
                    continue;
                }
                var func = callback.func;
                if (typeof func === "number") {
                    if (callback.arg === undefined) {
                        Module["dynCall_v"](func);
                    } else {
                        Module["dynCall_vi"](func, callback.arg);
                    }
                } else {
                    func(callback.arg === undefined ? null : callback.arg);
                }
            }
        }
        var __ATPRERUN__ = [];
        var __ATINIT__ = [];
        var __ATMAIN__ = [];
        var __ATPOSTRUN__ = [];
        var runtimeInitialized = false;
        var runtimeExited = false;
        function preRun() {
            if (Module["preRun"]) {
                if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];
                while (Module["preRun"].length) {
                    addOnPreRun(Module["preRun"].shift());
                }
            }
            callRuntimeCallbacks(__ATPRERUN__);
        }
        function initRuntime() {
            runtimeInitialized = true;
            if (!Module["noFSInit"] && !FS.init.initialized) FS.init();
            TTY.init();
            callRuntimeCallbacks(__ATINIT__);
        }
        function preMain() {
            FS.ignorePermissions = false;
            callRuntimeCallbacks(__ATMAIN__);
        }
        function exitRuntime() {
            runtimeExited = true;
        }
        function postRun() {
            if (Module["postRun"]) {
                if (typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]];
                while (Module["postRun"].length) {
                    addOnPostRun(Module["postRun"].shift());
                }
            }
            callRuntimeCallbacks(__ATPOSTRUN__);
        }
        function addOnPreRun(cb) {
            __ATPRERUN__.unshift(cb);
        }
        function addOnPostRun(cb) {
            __ATPOSTRUN__.unshift(cb);
        }
        var Math_abs = Math.abs;
        var Math_ceil = Math.ceil;
        var Math_floor = Math.floor;
        var Math_min = Math.min;
        var runDependencies = 0;
        var runDependencyWatcher = null;
        var dependenciesFulfilled = null;
        function getUniqueRunDependency(id) {
            return id;
        }
        function addRunDependency(id) {
            runDependencies++;
            if (Module["monitorRunDependencies"]) {
                Module["monitorRunDependencies"](runDependencies);
            }
        }
        function removeRunDependency(id) {
            runDependencies--;
            if (Module["monitorRunDependencies"]) {
                Module["monitorRunDependencies"](runDependencies);
            }
            if (runDependencies == 0) {
                if (runDependencyWatcher !== null) {
                    clearInterval(runDependencyWatcher);
                    runDependencyWatcher = null;
                }
                if (dependenciesFulfilled) {
                    var callback = dependenciesFulfilled;
                    dependenciesFulfilled = null;
                    callback();
                }
            }
        }
        Module["preloadedImages"] = {};
        Module["preloadedAudios"] = {};
        var dataURIPrefix = "data:application/octet-stream;base64,";
        function isDataURI(filename) {
            return String.prototype.startsWith ? filename.startsWith(dataURIPrefix) : filename.indexOf(dataURIPrefix) === 0;
        }
        var wasmBinaryFile = "libktx.wasm";
        if (!isDataURI(wasmBinaryFile)) {
            wasmBinaryFile = locateFile(wasmBinaryFile);
        }
        function getBinary() {
            try {
                if (wasmBinary) {
                    return new Uint8Array(wasmBinary);
                }
                if (readBinary) {
                    return readBinary(wasmBinaryFile);
                } else {
                    throw "both async and sync fetching of the wasm failed";
                }
            } catch (err) {
                abort(err);
            }
        }
        function getBinaryPromise() {
            if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && typeof fetch === "function") {
                return fetch(wasmBinaryFile, { credentials: "same-origin" })
                    .then(function (response) {
                        if (!response["ok"]) {
                            throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
                        }
                        return response["arrayBuffer"]();
                    })
                    .catch(function () {
                        return getBinary();
                    });
            }
            return new Promise(function (resolve, reject) {
                resolve(getBinary());
            });
        }
        function createWasm(env) {
            var info = { env: env, global: { NaN: NaN, Infinity: Infinity }, "global.Math": Math, asm2wasm: asm2wasmImports };
            function receiveInstance(instance, module) {
                var exports = instance.exports;
                Module["asm"] = exports;
                removeRunDependency("wasm-instantiate");
            }
            addRunDependency("wasm-instantiate");
            function receiveInstantiatedSource(output) {
                receiveInstance(output["instance"]);
            }
            function instantiateArrayBuffer(receiver) {
                return getBinaryPromise()
                    .then(function (binary) {
                        return WebAssembly.instantiate(binary, info);
                    })
                    .then(receiver, function (reason) {
                        err("failed to asynchronously prepare wasm: " + reason);
                        abort(reason);
                    });
            }
            function instantiateAsync() {
                if (!wasmBinary && typeof WebAssembly.instantiateStreaming === "function" && !isDataURI(wasmBinaryFile) && typeof fetch === "function") {
                    fetch(wasmBinaryFile, { credentials: "same-origin" }).then(function (response) {
                        var result = WebAssembly.instantiateStreaming(response, info);
                        return result.then(receiveInstantiatedSource, function (reason) {
                            err("wasm streaming compile failed: " + reason);
                            err("falling back to ArrayBuffer instantiation");
                            instantiateArrayBuffer(receiveInstantiatedSource);
                        });
                    });
                } else {
                    return instantiateArrayBuffer(receiveInstantiatedSource);
                }
            }
            if (Module["instantiateWasm"]) {
                try {
                    var exports = Module["instantiateWasm"](info, receiveInstance);
                    return exports;
                } catch (e) {
                    err("Module.instantiateWasm callback failed with error: " + e);
                    return false;
                }
            }
            instantiateAsync();
            return {};
        }
        Module["asm"] = function (global, env, providedBuffer) {
            env["memory"] = wasmMemory;
            env["table"] = wasmTable = new WebAssembly.Table({ initial: 1167, maximum: 1167, element: "anyfunc" });
            env["__memory_base"] = 1024;
            env["__table_base"] = 0;
            var exports = createWasm(env);
            return exports;
        };
        var tempDouble;
        var tempI64;
        __ATINIT__.push({
            func: function () {
                globalCtors();
            },
        });
        function demangle(func) {
            return func;
        }
        function demangleAll(text) {
            var regex = /\b__Z[\w\d_]+/g;
            return text.replace(regex, function (x) {
                var y = demangle(x);
                return x === y ? x : y + " [" + x + "]";
            });
        }
        function jsStackTrace() {
            var err = new Error();
            if (!err.stack) {
                try {
                    throw new Error(0);
                } catch (e) {
                    err = e;
                }
                if (!err.stack) {
                    return "(no stack trace available)";
                }
            }
            return err.stack.toString();
        }
        function stackTrace() {
            var js = jsStackTrace();
            if (Module["extraStackTrace"]) js += "\n" + Module["extraStackTrace"]();
            return demangleAll(js);
        }
        function ___assert_fail(condition, filename, line, func) {
            abort("Assertion failed: " + UTF8ToString(condition) + ", at: " + [filename ? UTF8ToString(filename) : "unknown filename", line, func ? UTF8ToString(func) : "unknown function"]);
        }
        function ___cxa_allocate_exception(size) {
            return _malloc(size);
        }
        var ___exception_infos = {};
        function ___cxa_pure_virtual() {
            ABORT = true;
            throw "Pure virtual function called!";
        }
        var ___exception_last = 0;
        function ___cxa_throw(ptr, type, destructor) {
            ___exception_infos[ptr] = { ptr: ptr, adjusted: [ptr], type: type, destructor: destructor, refcount: 0, caught: false, rethrown: false };
            ___exception_last = ptr;
            if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
                __ZSt18uncaught_exceptionv.uncaught_exceptions = 1;
            } else {
                __ZSt18uncaught_exceptionv.uncaught_exceptions++;
            }
            throw ptr;
        }
        function ___cxa_uncaught_exceptions() {
            return __ZSt18uncaught_exceptionv.uncaught_exceptions;
        }
        function ___lock() {}
        function ___setErrNo(value) {
            if (Module["___errno_location"]) HEAP32[Module["___errno_location"]() >> 2] = value;
            return value;
        }
        function ___map_file(pathname, size) {
            ___setErrNo(1);
            return -1;
        }
        var PATH = {
            splitPath: function (filename) {
                var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
                return splitPathRe.exec(filename).slice(1);
            },
            normalizeArray: function (parts, allowAboveRoot) {
                var up = 0;
                for (var i = parts.length - 1; i >= 0; i--) {
                    var last = parts[i];
                    if (last === ".") {
                        parts.splice(i, 1);
                    } else if (last === "..") {
                        parts.splice(i, 1);
                        up++;
                    } else if (up) {
                        parts.splice(i, 1);
                        up--;
                    }
                }
                if (allowAboveRoot) {
                    for (; up; up--) {
                        parts.unshift("..");
                    }
                }
                return parts;
            },
            normalize: function (path) {
                var isAbsolute = path.charAt(0) === "/",
                    trailingSlash = path.substr(-1) === "/";
                path = PATH.normalizeArray(
                    path.split("/").filter(function (p) {
                        return !!p;
                    }),
                    !isAbsolute
                ).join("/");
                if (!path && !isAbsolute) {
                    path = ".";
                }
                if (path && trailingSlash) {
                    path += "/";
                }
                return (isAbsolute ? "/" : "") + path;
            },
            dirname: function (path) {
                var result = PATH.splitPath(path),
                    root = result[0],
                    dir = result[1];
                if (!root && !dir) {
                    return ".";
                }
                if (dir) {
                    dir = dir.substr(0, dir.length - 1);
                }
                return root + dir;
            },
            basename: function (path) {
                if (path === "/") return "/";
                var lastSlash = path.lastIndexOf("/");
                if (lastSlash === -1) return path;
                return path.substr(lastSlash + 1);
            },
            extname: function (path) {
                return PATH.splitPath(path)[3];
            },
            join: function () {
                var paths = Array.prototype.slice.call(arguments, 0);
                return PATH.normalize(paths.join("/"));
            },
            join2: function (l, r) {
                return PATH.normalize(l + "/" + r);
            },
        };
        var PATH_FS = {
            resolve: function () {
                var resolvedPath = "",
                    resolvedAbsolute = false;
                for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
                    var path = i >= 0 ? arguments[i] : FS.cwd();
                    if (typeof path !== "string") {
                        throw new TypeError("Arguments to path.resolve must be strings");
                    } else if (!path) {
                        return "";
                    }
                    resolvedPath = path + "/" + resolvedPath;
                    resolvedAbsolute = path.charAt(0) === "/";
                }
                resolvedPath = PATH.normalizeArray(
                    resolvedPath.split("/").filter(function (p) {
                        return !!p;
                    }),
                    !resolvedAbsolute
                ).join("/");
                return (resolvedAbsolute ? "/" : "") + resolvedPath || ".";
            },
            relative: function (from, to) {
                from = PATH_FS.resolve(from).substr(1);
                to = PATH_FS.resolve(to).substr(1);
                function trim(arr) {
                    var start = 0;
                    for (; start < arr.length; start++) {
                        if (arr[start] !== "") break;
                    }
                    var end = arr.length - 1;
                    for (; end >= 0; end--) {
                        if (arr[end] !== "") break;
                    }
                    if (start > end) return [];
                    return arr.slice(start, end - start + 1);
                }
                var fromParts = trim(from.split("/"));
                var toParts = trim(to.split("/"));
                var length = Math.min(fromParts.length, toParts.length);
                var samePartsLength = length;
                for (var i = 0; i < length; i++) {
                    if (fromParts[i] !== toParts[i]) {
                        samePartsLength = i;
                        break;
                    }
                }
                var outputParts = [];
                for (var i = samePartsLength; i < fromParts.length; i++) {
                    outputParts.push("..");
                }
                outputParts = outputParts.concat(toParts.slice(samePartsLength));
                return outputParts.join("/");
            },
        };
        var TTY = {
            ttys: [],
            init: function () {},
            shutdown: function () {},
            register: function (dev, ops) {
                TTY.ttys[dev] = { input: [], output: [], ops: ops };
                FS.registerDevice(dev, TTY.stream_ops);
            },
            stream_ops: {
                open: function (stream) {
                    var tty = TTY.ttys[stream.node.rdev];
                    if (!tty) {
                        throw new FS.ErrnoError(19);
                    }
                    stream.tty = tty;
                    stream.seekable = false;
                },
                close: function (stream) {
                    stream.tty.ops.flush(stream.tty);
                },
                flush: function (stream) {
                    stream.tty.ops.flush(stream.tty);
                },
                read: function (stream, buffer, offset, length, pos) {
                    if (!stream.tty || !stream.tty.ops.get_char) {
                        throw new FS.ErrnoError(6);
                    }
                    var bytesRead = 0;
                    for (var i = 0; i < length; i++) {
                        var result;
                        try {
                            result = stream.tty.ops.get_char(stream.tty);
                        } catch (e) {
                            throw new FS.ErrnoError(5);
                        }
                        if (result === undefined && bytesRead === 0) {
                            throw new FS.ErrnoError(11);
                        }
                        if (result === null || result === undefined) break;
                        bytesRead++;
                        buffer[offset + i] = result;
                    }
                    if (bytesRead) {
                        stream.node.timestamp = Date.now();
                    }
                    return bytesRead;
                },
                write: function (stream, buffer, offset, length, pos) {
                    if (!stream.tty || !stream.tty.ops.put_char) {
                        throw new FS.ErrnoError(6);
                    }
                    try {
                        for (var i = 0; i < length; i++) {
                            stream.tty.ops.put_char(stream.tty, buffer[offset + i]);
                        }
                    } catch (e) {
                        throw new FS.ErrnoError(5);
                    }
                    if (length) {
                        stream.node.timestamp = Date.now();
                    }
                    return i;
                },
            },
            default_tty_ops: {
                get_char: function (tty) {
                    if (!tty.input.length) {
                        var result = null;
                        if (ENVIRONMENT_IS_NODE) {
                            var BUFSIZE = 256;
                            var buf = Buffer.alloc ? Buffer.alloc(BUFSIZE) : new Buffer(BUFSIZE);
                            var bytesRead = 0;
                            var isPosixPlatform = process.platform != "win32";
                            var fd = process.stdin.fd;
                            if (isPosixPlatform) {
                                var usingDevice = false;
                                try {
                                    fd = fs.openSync("/dev/stdin", "r");
                                    usingDevice = true;
                                } catch (e) {}
                            }
                            try {
                                bytesRead = fs.readSync(fd, buf, 0, BUFSIZE, null);
                            } catch (e) {
                                if (e.toString().indexOf("EOF") != -1) bytesRead = 0;
                                else throw e;
                            }
                            if (usingDevice) {
                                fs.closeSync(fd);
                            }
                            if (bytesRead > 0) {
                                result = buf.slice(0, bytesRead).toString("utf-8");
                            } else {
                                result = null;
                            }
                        } else if (typeof window != "undefined" && typeof window.prompt == "function") {
                            result = window.prompt("Input: ");
                            if (result !== null) {
                                result += "\n";
                            }
                        } else if (typeof readline == "function") {
                            result = readline();
                            if (result !== null) {
                                result += "\n";
                            }
                        }
                        if (!result) {
                            return null;
                        }
                        tty.input = intArrayFromString(result, true);
                    }
                    return tty.input.shift();
                },
                put_char: function (tty, val) {
                    if (val === null || val === 10) {
                        out(UTF8ArrayToString(tty.output, 0));
                        tty.output = [];
                    } else {
                        if (val != 0) tty.output.push(val);
                    }
                },
                flush: function (tty) {
                    if (tty.output && tty.output.length > 0) {
                        out(UTF8ArrayToString(tty.output, 0));
                        tty.output = [];
                    }
                },
            },
            default_tty1_ops: {
                put_char: function (tty, val) {
                    if (val === null || val === 10) {
                        err(UTF8ArrayToString(tty.output, 0));
                        tty.output = [];
                    } else {
                        if (val != 0) tty.output.push(val);
                    }
                },
                flush: function (tty) {
                    if (tty.output && tty.output.length > 0) {
                        err(UTF8ArrayToString(tty.output, 0));
                        tty.output = [];
                    }
                },
            },
        };
        var MEMFS = {
            ops_table: null,
            mount: function (mount) {
                return MEMFS.createNode(null, "/", 16384 | 511, 0);
            },
            createNode: function (parent, name, mode, dev) {
                if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
                    throw new FS.ErrnoError(1);
                }
                if (!MEMFS.ops_table) {
                    MEMFS.ops_table = {
                        dir: {
                            node: {
                                getattr: MEMFS.node_ops.getattr,
                                setattr: MEMFS.node_ops.setattr,
                                lookup: MEMFS.node_ops.lookup,
                                mknod: MEMFS.node_ops.mknod,
                                rename: MEMFS.node_ops.rename,
                                unlink: MEMFS.node_ops.unlink,
                                rmdir: MEMFS.node_ops.rmdir,
                                readdir: MEMFS.node_ops.readdir,
                                symlink: MEMFS.node_ops.symlink,
                            },
                            stream: { llseek: MEMFS.stream_ops.llseek },
                        },
                        file: {
                            node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr },
                            stream: { llseek: MEMFS.stream_ops.llseek, read: MEMFS.stream_ops.read, write: MEMFS.stream_ops.write, allocate: MEMFS.stream_ops.allocate, mmap: MEMFS.stream_ops.mmap, msync: MEMFS.stream_ops.msync },
                        },
                        link: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr, readlink: MEMFS.node_ops.readlink }, stream: {} },
                        chrdev: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr }, stream: FS.chrdev_stream_ops },
                    };
                }
                var node = FS.createNode(parent, name, mode, dev);
                if (FS.isDir(node.mode)) {
                    node.node_ops = MEMFS.ops_table.dir.node;
                    node.stream_ops = MEMFS.ops_table.dir.stream;
                    node.contents = {};
                } else if (FS.isFile(node.mode)) {
                    node.node_ops = MEMFS.ops_table.file.node;
                    node.stream_ops = MEMFS.ops_table.file.stream;
                    node.usedBytes = 0;
                    node.contents = null;
                } else if (FS.isLink(node.mode)) {
                    node.node_ops = MEMFS.ops_table.link.node;
                    node.stream_ops = MEMFS.ops_table.link.stream;
                } else if (FS.isChrdev(node.mode)) {
                    node.node_ops = MEMFS.ops_table.chrdev.node;
                    node.stream_ops = MEMFS.ops_table.chrdev.stream;
                }
                node.timestamp = Date.now();
                if (parent) {
                    parent.contents[name] = node;
                }
                return node;
            },
            getFileDataAsRegularArray: function (node) {
                if (node.contents && node.contents.subarray) {
                    var arr = [];
                    for (var i = 0; i < node.usedBytes; ++i) arr.push(node.contents[i]);
                    return arr;
                }
                return node.contents;
            },
            getFileDataAsTypedArray: function (node) {
                if (!node.contents) return new Uint8Array();
                if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes);
                return new Uint8Array(node.contents);
            },
            expandFileStorage: function (node, newCapacity) {
                var prevCapacity = node.contents ? node.contents.length : 0;
                if (prevCapacity >= newCapacity) return;
                var CAPACITY_DOUBLING_MAX = 1024 * 1024;
                newCapacity = Math.max(newCapacity, (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125)) | 0);
                if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256);
                var oldContents = node.contents;
                node.contents = new Uint8Array(newCapacity);
                if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0);
                return;
            },
            resizeFileStorage: function (node, newSize) {
                if (node.usedBytes == newSize) return;
                if (newSize == 0) {
                    node.contents = null;
                    node.usedBytes = 0;
                    return;
                }
                if (!node.contents || node.contents.subarray) {
                    var oldContents = node.contents;
                    node.contents = new Uint8Array(new ArrayBuffer(newSize));
                    if (oldContents) {
                        node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)));
                    }
                    node.usedBytes = newSize;
                    return;
                }
                if (!node.contents) node.contents = [];
                if (node.contents.length > newSize) node.contents.length = newSize;
                else while (node.contents.length < newSize) node.contents.push(0);
                node.usedBytes = newSize;
            },
            node_ops: {
                getattr: function (node) {
                    var attr = {};
                    attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
                    attr.ino = node.id;
                    attr.mode = node.mode;
                    attr.nlink = 1;
                    attr.uid = 0;
                    attr.gid = 0;
                    attr.rdev = node.rdev;
                    if (FS.isDir(node.mode)) {
                        attr.size = 4096;
                    } else if (FS.isFile(node.mode)) {
                        attr.size = node.usedBytes;
                    } else if (FS.isLink(node.mode)) {
                        attr.size = node.link.length;
                    } else {
                        attr.size = 0;
                    }
                    attr.atime = new Date(node.timestamp);
                    attr.mtime = new Date(node.timestamp);
                    attr.ctime = new Date(node.timestamp);
                    attr.blksize = 4096;
                    attr.blocks = Math.ceil(attr.size / attr.blksize);
                    return attr;
                },
                setattr: function (node, attr) {
                    if (attr.mode !== undefined) {
                        node.mode = attr.mode;
                    }
                    if (attr.timestamp !== undefined) {
                        node.timestamp = attr.timestamp;
                    }
                    if (attr.size !== undefined) {
                        MEMFS.resizeFileStorage(node, attr.size);
                    }
                },
                lookup: function (parent, name) {
                    throw FS.genericErrors[2];
                },
                mknod: function (parent, name, mode, dev) {
                    return MEMFS.createNode(parent, name, mode, dev);
                },
                rename: function (old_node, new_dir, new_name) {
                    if (FS.isDir(old_node.mode)) {
                        var new_node;
                        try {
                            new_node = FS.lookupNode(new_dir, new_name);
                        } catch (e) {}
                        if (new_node) {
                            for (var i in new_node.contents) {
                                throw new FS.ErrnoError(39);
                            }
                        }
                    }
                    delete old_node.parent.contents[old_node.name];
                    old_node.name = new_name;
                    new_dir.contents[new_name] = old_node;
                    old_node.parent = new_dir;
                },
                unlink: function (parent, name) {
                    delete parent.contents[name];
                },
                rmdir: function (parent, name) {
                    var node = FS.lookupNode(parent, name);
                    for (var i in node.contents) {
                        throw new FS.ErrnoError(39);
                    }
                    delete parent.contents[name];
                },
                readdir: function (node) {
                    var entries = [".", ".."];
                    for (var key in node.contents) {
                        if (!node.contents.hasOwnProperty(key)) {
                            continue;
                        }
                        entries.push(key);
                    }
                    return entries;
                },
                symlink: function (parent, newname, oldpath) {
                    var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
                    node.link = oldpath;
                    return node;
                },
                readlink: function (node) {
                    if (!FS.isLink(node.mode)) {
                        throw new FS.ErrnoError(22);
                    }
                    return node.link;
                },
            },
            stream_ops: {
                read: function (stream, buffer, offset, length, position) {
                    var contents = stream.node.contents;
                    if (position >= stream.node.usedBytes) return 0;
                    var size = Math.min(stream.node.usedBytes - position, length);
                    if (size > 8 && contents.subarray) {
                        buffer.set(contents.subarray(position, position + size), offset);
                    } else {
                        for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i];
                    }
                    return size;
                },
                write: function (stream, buffer, offset, length, position, canOwn) {
                    canOwn = false;
                    if (!length) return 0;
                    var node = stream.node;
                    node.timestamp = Date.now();
                    if (buffer.subarray && (!node.contents || node.contents.subarray)) {
                        if (canOwn) {
                            node.contents = buffer.subarray(offset, offset + length);
                            node.usedBytes = length;
                            return length;
                        } else if (node.usedBytes === 0 && position === 0) {
                            node.contents = new Uint8Array(buffer.subarray(offset, offset + length));
                            node.usedBytes = length;
                            return length;
                        } else if (position + length <= node.usedBytes) {
                            node.contents.set(buffer.subarray(offset, offset + length), position);
                            return length;
                        }
                    }
                    MEMFS.expandFileStorage(node, position + length);
                    if (node.contents.subarray && buffer.subarray) node.contents.set(buffer.subarray(offset, offset + length), position);
                    else {
                        for (var i = 0; i < length; i++) {
                            node.contents[position + i] = buffer[offset + i];
                        }
                    }
                    node.usedBytes = Math.max(node.usedBytes, position + length);
                    return length;
                },
                llseek: function (stream, offset, whence) {
                    var position = offset;
                    if (whence === 1) {
                        position += stream.position;
                    } else if (whence === 2) {
                        if (FS.isFile(stream.node.mode)) {
                            position += stream.node.usedBytes;
                        }
                    }
                    if (position < 0) {
                        throw new FS.ErrnoError(22);
                    }
                    return position;
                },
                allocate: function (stream, offset, length) {
                    MEMFS.expandFileStorage(stream.node, offset + length);
                    stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
                },
                mmap: function (stream, buffer, offset, length, position, prot, flags) {
                    if (!FS.isFile(stream.node.mode)) {
                        throw new FS.ErrnoError(19);
                    }
                    var ptr;
                    var allocated;
                    var contents = stream.node.contents;
                    if (!(flags & 2) && (contents.buffer === buffer || contents.buffer === buffer.buffer)) {
                        allocated = false;
                        ptr = contents.byteOffset;
                    } else {
                        if (position > 0 || position + length < stream.node.usedBytes) {
                            if (contents.subarray) {
                                contents = contents.subarray(position, position + length);
                            } else {
                                contents = Array.prototype.slice.call(contents, position, position + length);
                            }
                        }
                        allocated = true;
                        var fromHeap = buffer.buffer == HEAP8.buffer;
                        ptr = _malloc(length);
                        if (!ptr) {
                            throw new FS.ErrnoError(12);
                        }
                        (fromHeap ? HEAP8 : buffer).set(contents, ptr);
                    }
                    return { ptr: ptr, allocated: allocated };
                },
                msync: function (stream, buffer, offset, length, mmapFlags) {
                    if (!FS.isFile(stream.node.mode)) {
                        throw new FS.ErrnoError(19);
                    }
                    if (mmapFlags & 2) {
                        return 0;
                    }
                    var bytesWritten = MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
                    return 0;
                },
            },
        };
        var IDBFS = {
            dbs: {},
            indexedDB: function () {
                if (typeof indexedDB !== "undefined") return indexedDB;
                var ret = null;
                if (typeof window === "object") ret = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
                assert(ret, "IDBFS used, but indexedDB not supported");
                return ret;
            },
            DB_VERSION: 21,
            DB_STORE_NAME: "FILE_DATA",
            mount: function (mount) {
                return MEMFS.mount.apply(null, arguments);
            },
            syncfs: function (mount, populate, callback) {
                IDBFS.getLocalSet(mount, function (err, local) {
                    if (err) return callback(err);
                    IDBFS.getRemoteSet(mount, function (err, remote) {
                        if (err) return callback(err);
                        var src = populate ? remote : local;
                        var dst = populate ? local : remote;
                        IDBFS.reconcile(src, dst, callback);
                    });
                });
            },
            getDB: function (name, callback) {
                var db = IDBFS.dbs[name];
                if (db) {
                    return callback(null, db);
                }
                var req;
                try {
                    req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
                } catch (e) {
                    return callback(e);
                }
                if (!req) {
                    return callback("Unable to connect to IndexedDB");
                }
                req.onupgradeneeded = function (e) {
                    var db = e.target.result;
                    var transaction = e.target.transaction;
                    var fileStore;
                    if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
                        fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME);
                    } else {
                        fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME);
                    }
                    if (!fileStore.indexNames.contains("timestamp")) {
                        fileStore.createIndex("timestamp", "timestamp", { unique: false });
                    }
                };
                req.onsuccess = function () {
                    db = req.result;
                    IDBFS.dbs[name] = db;
                    callback(null, db);
                };
                req.onerror = function (e) {
                    callback(this.error);
                    e.preventDefault();
                };
            },
            getLocalSet: function (mount, callback) {
                var entries = {};
                function isRealDir(p) {
                    return p !== "." && p !== "..";
                }
                function toAbsolute(root) {
                    return function (p) {
                        return PATH.join2(root, p);
                    };
                }
                var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
                while (check.length) {
                    var path = check.pop();
                    var stat;
                    try {
                        stat = FS.stat(path);
                    } catch (e) {
                        return callback(e);
                    }
                    if (FS.isDir(stat.mode)) {
                        check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)));
                    }
                    entries[path] = { timestamp: stat.mtime };
                }
                return callback(null, { type: "local", entries: entries });
            },
            getRemoteSet: function (mount, callback) {
                var entries = {};
                IDBFS.getDB(mount.mountpoint, function (err, db) {
                    if (err) return callback(err);
                    try {
                        var transaction = db.transaction([IDBFS.DB_STORE_NAME], "readonly");
                        transaction.onerror = function (e) {
                            callback(this.error);
                            e.preventDefault();
                        };
                        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
                        var index = store.index("timestamp");
                        index.openKeyCursor().onsuccess = function (event) {
                            var cursor = event.target.result;
                            if (!cursor) {
                                return callback(null, { type: "remote", db: db, entries: entries });
                            }
                            entries[cursor.primaryKey] = { timestamp: cursor.key };
                            cursor.continue();
                        };
                    } catch (e) {
                        return callback(e);
                    }
                });
            },
            loadLocalEntry: function (path, callback) {
                var stat, node;
                try {
                    var lookup = FS.lookupPath(path);
                    node = lookup.node;
                    stat = FS.stat(path);
                } catch (e) {
                    return callback(e);
                }
                if (FS.isDir(stat.mode)) {
                    return callback(null, { timestamp: stat.mtime, mode: stat.mode });
                } else if (FS.isFile(stat.mode)) {
                    node.contents = MEMFS.getFileDataAsTypedArray(node);
                    return callback(null, { timestamp: stat.mtime, mode: stat.mode, contents: node.contents });
                } else {
                    return callback(new Error("node type not supported"));
                }
            },
            storeLocalEntry: function (path, entry, callback) {
                try {
                    if (FS.isDir(entry.mode)) {
                        FS.mkdir(path, entry.mode);
                    } else if (FS.isFile(entry.mode)) {
                        FS.writeFile(path, entry.contents, { canOwn: true });
                    } else {
                        return callback(new Error("node type not supported"));
                    }
                    FS.chmod(path, entry.mode);
                    FS.utime(path, entry.timestamp, entry.timestamp);
                } catch (e) {
                    return callback(e);
                }
                callback(null);
            },
            removeLocalEntry: function (path, callback) {
                try {
                    var lookup = FS.lookupPath(path);
                    var stat = FS.stat(path);
                    if (FS.isDir(stat.mode)) {
                        FS.rmdir(path);
                    } else if (FS.isFile(stat.mode)) {
                        FS.unlink(path);
                    }
                } catch (e) {
                    return callback(e);
                }
                callback(null);
            },
            loadRemoteEntry: function (store, path, callback) {
                var req = store.get(path);
                req.onsuccess = function (event) {
                    callback(null, event.target.result);
                };
                req.onerror = function (e) {
                    callback(this.error);
                    e.preventDefault();
                };
            },
            storeRemoteEntry: function (store, path, entry, callback) {
                var req = store.put(entry, path);
                req.onsuccess = function () {
                    callback(null);
                };
                req.onerror = function (e) {
                    callback(this.error);
                    e.preventDefault();
                };
            },
            removeRemoteEntry: function (store, path, callback) {
                var req = store.delete(path);
                req.onsuccess = function () {
                    callback(null);
                };
                req.onerror = function (e) {
                    callback(this.error);
                    e.preventDefault();
                };
            },
            reconcile: function (src, dst, callback) {
                var total = 0;
                var create = [];
                Object.keys(src.entries).forEach(function (key) {
                    var e = src.entries[key];
                    var e2 = dst.entries[key];
                    if (!e2 || e.timestamp > e2.timestamp) {
                        create.push(key);
                        total++;
                    }
                });
                var remove = [];
                Object.keys(dst.entries).forEach(function (key) {
                    var e = dst.entries[key];
                    var e2 = src.entries[key];
                    if (!e2) {
                        remove.push(key);
                        total++;
                    }
                });
                if (!total) {
                    return callback(null);
                }
                var errored = false;
                var db = src.type === "remote" ? src.db : dst.db;
                var transaction = db.transaction([IDBFS.DB_STORE_NAME], "readwrite");
                var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
                function done(err) {
                    if (err && !errored) {
                        errored = true;
                        return callback(err);
                    }
                }
                transaction.onerror = function (e) {
                    done(this.error);
                    e.preventDefault();
                };
                transaction.oncomplete = function (e) {
                    if (!errored) {
                        callback(null);
                    }
                };
                create.sort().forEach(function (path) {
                    if (dst.type === "local") {
                        IDBFS.loadRemoteEntry(store, path, function (err, entry) {
                            if (err) return done(err);
                            IDBFS.storeLocalEntry(path, entry, done);
                        });
                    } else {
                        IDBFS.loadLocalEntry(path, function (err, entry) {
                            if (err) return done(err);
                            IDBFS.storeRemoteEntry(store, path, entry, done);
                        });
                    }
                });
                remove
                    .sort()
                    .reverse()
                    .forEach(function (path) {
                        if (dst.type === "local") {
                            IDBFS.removeLocalEntry(path, done);
                        } else {
                            IDBFS.removeRemoteEntry(store, path, done);
                        }
                    });
            },
        };
        var NODEFS = {
            isWindows: false,
            staticInit: function () {
                NODEFS.isWindows = !!process.platform.match(/^win/);
                var flags = process["binding"]("constants");
                if (flags["fs"]) {
                    flags = flags["fs"];
                }
                NODEFS.flagsForNodeMap = { 1024: flags["O_APPEND"], 64: flags["O_CREAT"], 128: flags["O_EXCL"], 0: flags["O_RDONLY"], 2: flags["O_RDWR"], 4096: flags["O_SYNC"], 512: flags["O_TRUNC"], 1: flags["O_WRONLY"] };
            },
            bufferFrom: function (arrayBuffer) {
                return Buffer.alloc ? Buffer.from(arrayBuffer) : new Buffer(arrayBuffer);
            },
            mount: function (mount) {
                assert(ENVIRONMENT_HAS_NODE);
                return NODEFS.createNode(null, "/", NODEFS.getMode(mount.opts.root), 0);
            },
            createNode: function (parent, name, mode, dev) {
                if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
                    throw new FS.ErrnoError(22);
                }
                var node = FS.createNode(parent, name, mode);
                node.node_ops = NODEFS.node_ops;
                node.stream_ops = NODEFS.stream_ops;
                return node;
            },
            getMode: function (path) {
                var stat;
                try {
                    stat = fs.lstatSync(path);
                    if (NODEFS.isWindows) {
                        stat.mode = stat.mode | ((stat.mode & 292) >> 2);
                    }
                } catch (e) {
                    if (!e.code) throw e;
                    throw new FS.ErrnoError(-e.errno);
                }
                return stat.mode;
            },
            realPath: function (node) {
                var parts = [];
                while (node.parent !== node) {
                    parts.push(node.name);
                    node = node.parent;
                }
                parts.push(node.mount.opts.root);
                parts.reverse();
                return PATH.join.apply(null, parts);
            },
            flagsForNode: function (flags) {
                flags &= ~2097152;
                flags &= ~2048;
                flags &= ~32768;
                flags &= ~524288;
                var newFlags = 0;
                for (var k in NODEFS.flagsForNodeMap) {
                    if (flags & k) {
                        newFlags |= NODEFS.flagsForNodeMap[k];
                        flags ^= k;
                    }
                }
                if (!flags) {
                    return newFlags;
                } else {
                    throw new FS.ErrnoError(22);
                }
            },
            node_ops: {
                getattr: function (node) {
                    var path = NODEFS.realPath(node);
                    var stat;
                    try {
                        stat = fs.lstatSync(path);
                    } catch (e) {
                        if (!e.code) throw e;
                        throw new FS.ErrnoError(-e.errno);
                    }
                    if (NODEFS.isWindows && !stat.blksize) {
                        stat.blksize = 4096;
                    }
                    if (NODEFS.isWindows && !stat.blocks) {
                        stat.blocks = ((stat.size + stat.blksize - 1) / stat.blksize) | 0;
                    }
                    return {
                        dev: stat.dev,
                        ino: stat.ino,
                        mode: stat.mode,
                        nlink: stat.nlink,
                        uid: stat.uid,
                        gid: stat.gid,
                        rdev: stat.rdev,
                        size: stat.size,
                        atime: stat.atime,
                        mtime: stat.mtime,
                        ctime: stat.ctime,
                        blksize: stat.blksize,
                        blocks: stat.blocks,
                    };
                },
                setattr: function (node, attr) {
                    var path = NODEFS.realPath(node);
                    try {
                        if (attr.mode !== undefined) {
                            fs.chmodSync(path, attr.mode);
                            node.mode = attr.mode;
                        }
                        if (attr.timestamp !== undefined) {
                            var date = new Date(attr.timestamp);
                            fs.utimesSync(path, date, date);
                        }
                        if (attr.size !== undefined) {
                            fs.truncateSync(path, attr.size);
                        }
                    } catch (e) {
                        if (!e.code) throw e;
                        throw new FS.ErrnoError(-e.errno);
                    }
                },
                lookup: function (parent, name) {
                    var path = PATH.join2(NODEFS.realPath(parent), name);
                    var mode = NODEFS.getMode(path);
                    return NODEFS.createNode(parent, name, mode);
                },
                mknod: function (parent, name, mode, dev) {
                    var node = NODEFS.createNode(parent, name, mode, dev);
                    var path = NODEFS.realPath(node);
                    try {
                        if (FS.isDir(node.mode)) {
                            fs.mkdirSync(path, node.mode);
                        } else {
                            fs.writeFileSync(path, "", { mode: node.mode });
                        }
                    } catch (e) {
                        if (!e.code) throw e;
                        throw new FS.ErrnoError(-e.errno);
                    }
                    return node;
                },
                rename: function (oldNode, newDir, newName) {
                    var oldPath = NODEFS.realPath(oldNode);
                    var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
                    try {
                        fs.renameSync(oldPath, newPath);
                    } catch (e) {
                        if (!e.code) throw e;
                        throw new FS.ErrnoError(-e.errno);
                    }
                },
                unlink: function (parent, name) {
                    var path = PATH.join2(NODEFS.realPath(parent), name);
                    try {
                        fs.unlinkSync(path);
                    } catch (e) {
                        if (!e.code) throw e;
                        throw new FS.ErrnoError(-e.errno);
                    }
                },
                rmdir: function (parent, name) {
                    var path = PATH.join2(NODEFS.realPath(parent), name);
                    try {
                        fs.rmdirSync(path);
                    } catch (e) {
                        if (!e.code) throw e;
                        throw new FS.ErrnoError(-e.errno);
                    }
                },
                readdir: function (node) {
                    var path = NODEFS.realPath(node);
                    try {
                        return fs.readdirSync(path);
                    } catch (e) {
                        if (!e.code) throw e;
                        throw new FS.ErrnoError(-e.errno);
                    }
                },
                symlink: function (parent, newName, oldPath) {
                    var newPath = PATH.join2(NODEFS.realPath(parent), newName);
                    try {
                        fs.symlinkSync(oldPath, newPath);
                    } catch (e) {
                        if (!e.code) throw e;
                        throw new FS.ErrnoError(-e.errno);
                    }
                },
                readlink: function (node) {
                    var path = NODEFS.realPath(node);
                    try {
                        path = fs.readlinkSync(path);
                        path = NODEJS_PATH.relative(NODEJS_PATH.resolve(node.mount.opts.root), path);
                        return path;
                    } catch (e) {
                        if (!e.code) throw e;
                        throw new FS.ErrnoError(-e.errno);
                    }
                },
            },
            stream_ops: {
                open: function (stream) {
                    var path = NODEFS.realPath(stream.node);
                    try {
                        if (FS.isFile(stream.node.mode)) {
                            stream.nfd = fs.openSync(path, NODEFS.flagsForNode(stream.flags));
                        }
                    } catch (e) {
                        if (!e.code) throw e;
                        throw new FS.ErrnoError(-e.errno);
                    }
                },
                close: function (stream) {
                    try {
                        if (FS.isFile(stream.node.mode) && stream.nfd) {
                            fs.closeSync(stream.nfd);
                        }
                    } catch (e) {
                        if (!e.code) throw e;
                        throw new FS.ErrnoError(-e.errno);
                    }
                },
                read: function (stream, buffer, offset, length, position) {
                    if (length === 0) return 0;
                    try {
                        return fs.readSync(stream.nfd, NODEFS.bufferFrom(buffer.buffer), offset, length, position);
                    } catch (e) {
                        throw new FS.ErrnoError(-e.errno);
                    }
                },
                write: function (stream, buffer, offset, length, position) {
                    try {
                        return fs.writeSync(stream.nfd, NODEFS.bufferFrom(buffer.buffer), offset, length, position);
                    } catch (e) {
                        throw new FS.ErrnoError(-e.errno);
                    }
                },
                llseek: function (stream, offset, whence) {
                    var position = offset;
                    if (whence === 1) {
                        position += stream.position;
                    } else if (whence === 2) {
                        if (FS.isFile(stream.node.mode)) {
                            try {
                                var stat = fs.fstatSync(stream.nfd);
                                position += stat.size;
                            } catch (e) {
                                throw new FS.ErrnoError(-e.errno);
                            }
                        }
                    }
                    if (position < 0) {
                        throw new FS.ErrnoError(22);
                    }
                    return position;
                },
            },
        };
        var WORKERFS = {
            DIR_MODE: 16895,
            FILE_MODE: 33279,
            reader: null,
            mount: function (mount) {
                assert(ENVIRONMENT_IS_WORKER);
                if (!WORKERFS.reader) WORKERFS.reader = new FileReaderSync();
                var root = WORKERFS.createNode(null, "/", WORKERFS.DIR_MODE, 0);
                var createdParents = {};
                function ensureParent(path) {
                    var parts = path.split("/");
                    var parent = root;
                    for (var i = 0; i < parts.length - 1; i++) {
                        var curr = parts.slice(0, i + 1).join("/");
                        if (!createdParents[curr]) {
                            createdParents[curr] = WORKERFS.createNode(parent, parts[i], WORKERFS.DIR_MODE, 0);
                        }
                        parent = createdParents[curr];
                    }
                    return parent;
                }
                function base(path) {
                    var parts = path.split("/");
                    return parts[parts.length - 1];
                }
                Array.prototype.forEach.call(mount.opts["files"] || [], function (file) {
                    WORKERFS.createNode(ensureParent(file.name), base(file.name), WORKERFS.FILE_MODE, 0, file, file.lastModifiedDate);
                });
                (mount.opts["blobs"] || []).forEach(function (obj) {
                    WORKERFS.createNode(ensureParent(obj["name"]), base(obj["name"]), WORKERFS.FILE_MODE, 0, obj["data"]);
                });
                (mount.opts["packages"] || []).forEach(function (pack) {
                    pack["metadata"].files.forEach(function (file) {
                        var name = file.filename.substr(1);
                        WORKERFS.createNode(ensureParent(name), base(name), WORKERFS.FILE_MODE, 0, pack["blob"].slice(file.start, file.end));
                    });
                });
                return root;
            },
            createNode: function (parent, name, mode, dev, contents, mtime) {
                var node = FS.createNode(parent, name, mode);
                node.mode = mode;
                node.node_ops = WORKERFS.node_ops;
                node.stream_ops = WORKERFS.stream_ops;
                node.timestamp = (mtime || new Date()).getTime();
                assert(WORKERFS.FILE_MODE !== WORKERFS.DIR_MODE);
                if (mode === WORKERFS.FILE_MODE) {
                    node.size = contents.size;
                    node.contents = contents;
                } else {
                    node.size = 4096;
                    node.contents = {};
                }
                if (parent) {
                    parent.contents[name] = node;
                }
                return node;
            },
            node_ops: {
                getattr: function (node) {
                    return {
                        dev: 1,
                        ino: undefined,
                        mode: node.mode,
                        nlink: 1,
                        uid: 0,
                        gid: 0,
                        rdev: undefined,
                        size: node.size,
                        atime: new Date(node.timestamp),
                        mtime: new Date(node.timestamp),
                        ctime: new Date(node.timestamp),
                        blksize: 4096,
                        blocks: Math.ceil(node.size / 4096),
                    };
                },
                setattr: function (node, attr) {
                    if (attr.mode !== undefined) {
                        node.mode = attr.mode;
                    }
                    if (attr.timestamp !== undefined) {
                        node.timestamp = attr.timestamp;
                    }
                },
                lookup: function (parent, name) {
                    throw new FS.ErrnoError(2);
                },
                mknod: function (parent, name, mode, dev) {
                    throw new FS.ErrnoError(1);
                },
                rename: function (oldNode, newDir, newName) {
                    throw new FS.ErrnoError(1);
                },
                unlink: function (parent, name) {
                    throw new FS.ErrnoError(1);
                },
                rmdir: function (parent, name) {
                    throw new FS.ErrnoError(1);
                },
                readdir: function (node) {
                    var entries = [".", ".."];
                    for (var key in node.contents) {
                        if (!node.contents.hasOwnProperty(key)) {
                            continue;
                        }
                        entries.push(key);
                    }
                    return entries;
                },
                symlink: function (parent, newName, oldPath) {
                    throw new FS.ErrnoError(1);
                },
                readlink: function (node) {
                    throw new FS.ErrnoError(1);
                },
            },
            stream_ops: {
                read: function (stream, buffer, offset, length, position) {
                    if (position >= stream.node.size) return 0;
                    var chunk = stream.node.contents.slice(position, position + length);
                    var ab = WORKERFS.reader.readAsArrayBuffer(chunk);
                    buffer.set(new Uint8Array(ab), offset);
                    return chunk.size;
                },
                write: function (stream, buffer, offset, length, position) {
                    throw new FS.ErrnoError(5);
                },
                llseek: function (stream, offset, whence) {
                    var position = offset;
                    if (whence === 1) {
                        position += stream.position;
                    } else if (whence === 2) {
                        if (FS.isFile(stream.node.mode)) {
                            position += stream.node.size;
                        }
                    }
                    if (position < 0) {
                        throw new FS.ErrnoError(22);
                    }
                    return position;
                },
            },
        };
        var FS = {
            root: null,
            mounts: [],
            devices: {},
            streams: [],
            nextInode: 1,
            nameTable: null,
            currentPath: "/",
            initialized: false,
            ignorePermissions: true,
            trackingDelegate: {},
            tracking: { openFlags: { READ: 1, WRITE: 2 } },
            ErrnoError: null,
            genericErrors: {},
            filesystems: null,
            syncFSRequests: 0,
            handleFSError: function (e) {
                if (!(e instanceof FS.ErrnoError)) throw e + " : " + stackTrace();
                return ___setErrNo(e.errno);
            },
            lookupPath: function (path, opts) {
                path = PATH_FS.resolve(FS.cwd(), path);
                opts = opts || {};
                if (!path) return { path: "", node: null };
                var defaults = { follow_mount: true, recurse_count: 0 };
                for (var key in defaults) {
                    if (opts[key] === undefined) {
                        opts[key] = defaults[key];
                    }
                }
                if (opts.recurse_count > 8) {
                    throw new FS.ErrnoError(40);
                }
                var parts = PATH.normalizeArray(
                    path.split("/").filter(function (p) {
                        return !!p;
                    }),
                    false
                );
                var current = FS.root;
                var current_path = "/";
                for (var i = 0; i < parts.length; i++) {
                    var islast = i === parts.length - 1;
                    if (islast && opts.parent) {
                        break;
                    }
                    current = FS.lookupNode(current, parts[i]);
                    current_path = PATH.join2(current_path, parts[i]);
                    if (FS.isMountpoint(current)) {
                        if (!islast || (islast && opts.follow_mount)) {
                            current = current.mounted.root;
                        }
                    }
                    if (!islast || opts.follow) {
                        var count = 0;
                        while (FS.isLink(current.mode)) {
                            var link = FS.readlink(current_path);
                            current_path = PATH_FS.resolve(PATH.dirname(current_path), link);
                            var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
                            current = lookup.node;
                            if (count++ > 40) {
                                throw new FS.ErrnoError(40);
                            }
                        }
                    }
                }
                return { path: current_path, node: current };
            },
            getPath: function (node) {
                var path;
                while (true) {
                    if (FS.isRoot(node)) {
                        var mount = node.mount.mountpoint;
                        if (!path) return mount;
                        return mount[mount.length - 1] !== "/" ? mount + "/" + path : mount + path;
                    }
                    path = path ? node.name + "/" + path : node.name;
                    node = node.parent;
                }
            },
            hashName: function (parentid, name) {
                var hash = 0;
                for (var i = 0; i < name.length; i++) {
                    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
                }
                return ((parentid + hash) >>> 0) % FS.nameTable.length;
            },
            hashAddNode: function (node) {
                var hash = FS.hashName(node.parent.id, node.name);
                node.name_next = FS.nameTable[hash];
                FS.nameTable[hash] = node;
            },
            hashRemoveNode: function (node) {
                var hash = FS.hashName(node.parent.id, node.name);
                if (FS.nameTable[hash] === node) {
                    FS.nameTable[hash] = node.name_next;
                } else {
                    var current = FS.nameTable[hash];
                    while (current) {
                        if (current.name_next === node) {
                            current.name_next = node.name_next;
                            break;
                        }
                        current = current.name_next;
                    }
                }
            },
            lookupNode: function (parent, name) {
                var err = FS.mayLookup(parent);
                if (err) {
                    throw new FS.ErrnoError(err, parent);
                }
                var hash = FS.hashName(parent.id, name);
                for (var node = FS.nameTable[hash]; node; node = node.name_next) {
                    var nodeName = node.name;
                    if (node.parent.id === parent.id && nodeName === name) {
                        return node;
                    }
                }
                return FS.lookup(parent, name);
            },
            createNode: function (parent, name, mode, rdev) {
                if (!FS.FSNode) {
                    FS.FSNode = function (parent, name, mode, rdev) {
                        if (!parent) {
                            parent = this;
                        }
                        this.parent = parent;
                        this.mount = parent.mount;
                        this.mounted = null;
                        this.id = FS.nextInode++;
                        this.name = name;
                        this.mode = mode;
                        this.node_ops = {};
                        this.stream_ops = {};
                        this.rdev = rdev;
                    };
                    FS.FSNode.prototype = {};
                    var readMode = 292 | 73;
                    var writeMode = 146;
                    Object.defineProperties(FS.FSNode.prototype, {
                        read: {
                            get: function () {
                                return (this.mode & readMode) === readMode;
                            },
                            set: function (val) {
                                val ? (this.mode |= readMode) : (this.mode &= ~readMode);
                            },
                        },
                        write: {
                            get: function () {
                                return (this.mode & writeMode) === writeMode;
                            },
                            set: function (val) {
                                val ? (this.mode |= writeMode) : (this.mode &= ~writeMode);
                            },
                        },
                        isFolder: {
                            get: function () {
                                return FS.isDir(this.mode);
                            },
                        },
                        isDevice: {
                            get: function () {
                                return FS.isChrdev(this.mode);
                            },
                        },
                    });
                }
                var node = new FS.FSNode(parent, name, mode, rdev);
                FS.hashAddNode(node);
                return node;
            },
            destroyNode: function (node) {
                FS.hashRemoveNode(node);
            },
            isRoot: function (node) {
                return node === node.parent;
            },
            isMountpoint: function (node) {
                return !!node.mounted;
            },
            isFile: function (mode) {
                return (mode & 61440) === 32768;
            },
            isDir: function (mode) {
                return (mode & 61440) === 16384;
            },
            isLink: function (mode) {
                return (mode & 61440) === 40960;
            },
            isChrdev: function (mode) {
                return (mode & 61440) === 8192;
            },
            isBlkdev: function (mode) {
                return (mode & 61440) === 24576;
            },
            isFIFO: function (mode) {
                return (mode & 61440) === 4096;
            },
            isSocket: function (mode) {
                return (mode & 49152) === 49152;
            },
            flagModes: { r: 0, rs: 1052672, "r+": 2, w: 577, wx: 705, xw: 705, "w+": 578, "wx+": 706, "xw+": 706, a: 1089, ax: 1217, xa: 1217, "a+": 1090, "ax+": 1218, "xa+": 1218 },
            modeStringToFlags: function (str) {
                var flags = FS.flagModes[str];
                if (typeof flags === "undefined") {
                    throw new Error("Unknown file open mode: " + str);
                }
                return flags;
            },
            flagsToPermissionString: function (flag) {
                var perms = ["r", "w", "rw"][flag & 3];
                if (flag & 512) {
                    perms += "w";
                }
                return perms;
            },
            nodePermissions: function (node, perms) {
                if (FS.ignorePermissions) {
                    return 0;
                }
                if (perms.indexOf("r") !== -1 && !(node.mode & 292)) {
                    return 13;
                } else if (perms.indexOf("w") !== -1 && !(node.mode & 146)) {
                    return 13;
                } else if (perms.indexOf("x") !== -1 && !(node.mode & 73)) {
                    return 13;
                }
                return 0;
            },
            mayLookup: function (dir) {
                var err = FS.nodePermissions(dir, "x");
                if (err) return err;
                if (!dir.node_ops.lookup) return 13;
                return 0;
            },
            mayCreate: function (dir, name) {
                try {
                    var node = FS.lookupNode(dir, name);
                    return 17;
                } catch (e) {}
                return FS.nodePermissions(dir, "wx");
            },
            mayDelete: function (dir, name, isdir) {
                var node;
                try {
                    node = FS.lookupNode(dir, name);
                } catch (e) {
                    return e.errno;
                }
                var err = FS.nodePermissions(dir, "wx");
                if (err) {
                    return err;
                }
                if (isdir) {
                    if (!FS.isDir(node.mode)) {
                        return 20;
                    }
                    if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
                        return 16;
                    }
                } else {
                    if (FS.isDir(node.mode)) {
                        return 21;
                    }
                }
                return 0;
            },
            mayOpen: function (node, flags) {
                if (!node) {
                    return 2;
                }
                if (FS.isLink(node.mode)) {
                    return 40;
                } else if (FS.isDir(node.mode)) {
                    if (FS.flagsToPermissionString(flags) !== "r" || flags & 512) {
                        return 21;
                    }
                }
                return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
            },
            MAX_OPEN_FDS: 4096,
            nextfd: function (fd_start, fd_end) {
                fd_start = fd_start || 0;
                fd_end = fd_end || FS.MAX_OPEN_FDS;
                for (var fd = fd_start; fd <= fd_end; fd++) {
                    if (!FS.streams[fd]) {
                        return fd;
                    }
                }
                throw new FS.ErrnoError(24);
            },
            getStream: function (fd) {
                return FS.streams[fd];
            },
            createStream: function (stream, fd_start, fd_end) {
                if (!FS.FSStream) {
                    FS.FSStream = function () {};
                    FS.FSStream.prototype = {};
                    Object.defineProperties(FS.FSStream.prototype, {
                        object: {
                            get: function () {
                                return this.node;
                            },
                            set: function (val) {
                                this.node = val;
                            },
                        },
                        isRead: {
                            get: function () {
                                return (this.flags & 2097155) !== 1;
                            },
                        },
                        isWrite: {
                            get: function () {
                                return (this.flags & 2097155) !== 0;
                            },
                        },
                        isAppend: {
                            get: function () {
                                return this.flags & 1024;
                            },
                        },
                    });
                }
                var newStream = new FS.FSStream();
                for (var p in stream) {
                    newStream[p] = stream[p];
                }
                stream = newStream;
                var fd = FS.nextfd(fd_start, fd_end);
                stream.fd = fd;
                FS.streams[fd] = stream;
                return stream;
            },
            closeStream: function (fd) {
                FS.streams[fd] = null;
            },
            chrdev_stream_ops: {
                open: function (stream) {
                    var device = FS.getDevice(stream.node.rdev);
                    stream.stream_ops = device.stream_ops;
                    if (stream.stream_ops.open) {
                        stream.stream_ops.open(stream);
                    }
                },
                llseek: function () {
                    throw new FS.ErrnoError(29);
                },
            },
            major: function (dev) {
                return dev >> 8;
            },
            minor: function (dev) {
                return dev & 255;
            },
            makedev: function (ma, mi) {
                return (ma << 8) | mi;
            },
            registerDevice: function (dev, ops) {
                FS.devices[dev] = { stream_ops: ops };
            },
            getDevice: function (dev) {
                return FS.devices[dev];
            },
            getMounts: function (mount) {
                var mounts = [];
                var check = [mount];
                while (check.length) {
                    var m = check.pop();
                    mounts.push(m);
                    check.push.apply(check, m.mounts);
                }
                return mounts;
            },
            syncfs: function (populate, callback) {
                if (typeof populate === "function") {
                    callback = populate;
                    populate = false;
                }
                FS.syncFSRequests++;
                if (FS.syncFSRequests > 1) {
                    console.log("warning: " + FS.syncFSRequests + " FS.syncfs operations in flight at once, probably just doing extra work");
                }
                var mounts = FS.getMounts(FS.root.mount);
                var completed = 0;
                function doCallback(err) {
                    FS.syncFSRequests--;
                    return callback(err);
                }
                function done(err) {
                    if (err) {
                        if (!done.errored) {
                            done.errored = true;
                            return doCallback(err);
                        }
                        return;
                    }
                    if (++completed >= mounts.length) {
                        doCallback(null);
                    }
                }
                mounts.forEach(function (mount) {
                    if (!mount.type.syncfs) {
                        return done(null);
                    }
                    mount.type.syncfs(mount, populate, done);
                });
            },
            mount: function (type, opts, mountpoint) {
                var root = mountpoint === "/";
                var pseudo = !mountpoint;
                var node;
                if (root && FS.root) {
                    throw new FS.ErrnoError(16);
                } else if (!root && !pseudo) {
                    var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
                    mountpoint = lookup.path;
                    node = lookup.node;
                    if (FS.isMountpoint(node)) {
                        throw new FS.ErrnoError(16);
                    }
                    if (!FS.isDir(node.mode)) {
                        throw new FS.ErrnoError(20);
                    }
                }
                var mount = { type: type, opts: opts, mountpoint: mountpoint, mounts: [] };
                var mountRoot = type.mount(mount);
                mountRoot.mount = mount;
                mount.root = mountRoot;
                if (root) {
                    FS.root = mountRoot;
                } else if (node) {
                    node.mounted = mount;
                    if (node.mount) {
                        node.mount.mounts.push(mount);
                    }
                }
                return mountRoot;
            },
            unmount: function (mountpoint) {
                var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
                if (!FS.isMountpoint(lookup.node)) {
                    throw new FS.ErrnoError(22);
                }
                var node = lookup.node;
                var mount = node.mounted;
                var mounts = FS.getMounts(mount);
                Object.keys(FS.nameTable).forEach(function (hash) {
                    var current = FS.nameTable[hash];
                    while (current) {
                        var next = current.name_next;
                        if (mounts.indexOf(current.mount) !== -1) {
                            FS.destroyNode(current);
                        }
                        current = next;
                    }
                });
                node.mounted = null;
                var idx = node.mount.mounts.indexOf(mount);
                node.mount.mounts.splice(idx, 1);
            },
            lookup: function (parent, name) {
                return parent.node_ops.lookup(parent, name);
            },
            mknod: function (path, mode, dev) {
                var lookup = FS.lookupPath(path, { parent: true });
                var parent = lookup.node;
                var name = PATH.basename(path);
                if (!name || name === "." || name === "..") {
                    throw new FS.ErrnoError(22);
                }
                var err = FS.mayCreate(parent, name);
                if (err) {
                    throw new FS.ErrnoError(err);
                }
                if (!parent.node_ops.mknod) {
                    throw new FS.ErrnoError(1);
                }
                return parent.node_ops.mknod(parent, name, mode, dev);
            },
            create: function (path, mode) {
                mode = mode !== undefined ? mode : 438;
                mode &= 4095;
                mode |= 32768;
                return FS.mknod(path, mode, 0);
            },
            mkdir: function (path, mode) {
                mode = mode !== undefined ? mode : 511;
                mode &= 511 | 512;
                mode |= 16384;
                return FS.mknod(path, mode, 0);
            },
            mkdirTree: function (path, mode) {
                var dirs = path.split("/");
                var d = "";
                for (var i = 0; i < dirs.length; ++i) {
                    if (!dirs[i]) continue;
                    d += "/" + dirs[i];
                    try {
                        FS.mkdir(d, mode);
                    } catch (e) {
                        if (e.errno != 17) throw e;
                    }
                }
            },
            mkdev: function (path, mode, dev) {
                if (typeof dev === "undefined") {
                    dev = mode;
                    mode = 438;
                }
                mode |= 8192;
                return FS.mknod(path, mode, dev);
            },
            symlink: function (oldpath, newpath) {
                if (!PATH_FS.resolve(oldpath)) {
                    throw new FS.ErrnoError(2);
                }
                var lookup = FS.lookupPath(newpath, { parent: true });
                var parent = lookup.node;
                if (!parent) {
                    throw new FS.ErrnoError(2);
                }
                var newname = PATH.basename(newpath);
                var err = FS.mayCreate(parent, newname);
                if (err) {
                    throw new FS.ErrnoError(err);
                }
                if (!parent.node_ops.symlink) {
                    throw new FS.ErrnoError(1);
                }
                return parent.node_ops.symlink(parent, newname, oldpath);
            },
            rename: function (old_path, new_path) {
                var old_dirname = PATH.dirname(old_path);
                var new_dirname = PATH.dirname(new_path);
                var old_name = PATH.basename(old_path);
                var new_name = PATH.basename(new_path);
                var lookup, old_dir, new_dir;
                try {
                    lookup = FS.lookupPath(old_path, { parent: true });
                    old_dir = lookup.node;
                    lookup = FS.lookupPath(new_path, { parent: true });
                    new_dir = lookup.node;
                } catch (e) {
                    throw new FS.ErrnoError(16);
                }
                if (!old_dir || !new_dir) throw new FS.ErrnoError(2);
                if (old_dir.mount !== new_dir.mount) {
                    throw new FS.ErrnoError(18);
                }
                var old_node = FS.lookupNode(old_dir, old_name);
                var relative = PATH_FS.relative(old_path, new_dirname);
                if (relative.charAt(0) !== ".") {
                    throw new FS.ErrnoError(22);
                }
                relative = PATH_FS.relative(new_path, old_dirname);
                if (relative.charAt(0) !== ".") {
                    throw new FS.ErrnoError(39);
                }
                var new_node;
                try {
                    new_node = FS.lookupNode(new_dir, new_name);
                } catch (e) {}
                if (old_node === new_node) {
                    return;
                }
                var isdir = FS.isDir(old_node.mode);
                var err = FS.mayDelete(old_dir, old_name, isdir);
                if (err) {
                    throw new FS.ErrnoError(err);
                }
                err = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
                if (err) {
                    throw new FS.ErrnoError(err);
                }
                if (!old_dir.node_ops.rename) {
                    throw new FS.ErrnoError(1);
                }
                if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
                    throw new FS.ErrnoError(16);
                }
                if (new_dir !== old_dir) {
                    err = FS.nodePermissions(old_dir, "w");
                    if (err) {
                        throw new FS.ErrnoError(err);
                    }
                }
                try {
                    if (FS.trackingDelegate["willMovePath"]) {
                        FS.trackingDelegate["willMovePath"](old_path, new_path);
                    }
                } catch (e) {
                    console.log("FS.trackingDelegate['willMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message);
                }
                FS.hashRemoveNode(old_node);
                try {
                    old_dir.node_ops.rename(old_node, new_dir, new_name);
                } catch (e) {
                    throw e;
                } finally {
                    FS.hashAddNode(old_node);
                }
                try {
                    if (FS.trackingDelegate["onMovePath"]) FS.trackingDelegate["onMovePath"](old_path, new_path);
                } catch (e) {
                    console.log("FS.trackingDelegate['onMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message);
                }
            },
            rmdir: function (path) {
                var lookup = FS.lookupPath(path, { parent: true });
                var parent = lookup.node;
                var name = PATH.basename(path);
                var node = FS.lookupNode(parent, name);
                var err = FS.mayDelete(parent, name, true);
                if (err) {
                    throw new FS.ErrnoError(err);
                }
                if (!parent.node_ops.rmdir) {
                    throw new FS.ErrnoError(1);
                }
                if (FS.isMountpoint(node)) {
                    throw new FS.ErrnoError(16);
                }
                try {
                    if (FS.trackingDelegate["willDeletePath"]) {
                        FS.trackingDelegate["willDeletePath"](path);
                    }
                } catch (e) {
                    console.log("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message);
                }
                parent.node_ops.rmdir(parent, name);
                FS.destroyNode(node);
                try {
                    if (FS.trackingDelegate["onDeletePath"]) FS.trackingDelegate["onDeletePath"](path);
                } catch (e) {
                    console.log("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message);
                }
            },
            readdir: function (path) {
                var lookup = FS.lookupPath(path, { follow: true });
                var node = lookup.node;
                if (!node.node_ops.readdir) {
                    throw new FS.ErrnoError(20);
                }
                return node.node_ops.readdir(node);
            },
            unlink: function (path) {
                var lookup = FS.lookupPath(path, { parent: true });
                var parent = lookup.node;
                var name = PATH.basename(path);
                var node = FS.lookupNode(parent, name);
                var err = FS.mayDelete(parent, name, false);
                if (err) {
                    throw new FS.ErrnoError(err);
                }
                if (!parent.node_ops.unlink) {
                    throw new FS.ErrnoError(1);
                }
                if (FS.isMountpoint(node)) {
                    throw new FS.ErrnoError(16);
                }
                try {
                    if (FS.trackingDelegate["willDeletePath"]) {
                        FS.trackingDelegate["willDeletePath"](path);
                    }
                } catch (e) {
                    console.log("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message);
                }
                parent.node_ops.unlink(parent, name);
                FS.destroyNode(node);
                try {
                    if (FS.trackingDelegate["onDeletePath"]) FS.trackingDelegate["onDeletePath"](path);
                } catch (e) {
                    console.log("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message);
                }
            },
            readlink: function (path) {
                var lookup = FS.lookupPath(path);
                var link = lookup.node;
                if (!link) {
                    throw new FS.ErrnoError(2);
                }
                if (!link.node_ops.readlink) {
                    throw new FS.ErrnoError(22);
                }
                return PATH_FS.resolve(FS.getPath(link.parent), link.node_ops.readlink(link));
            },
            stat: function (path, dontFollow) {
                var lookup = FS.lookupPath(path, { follow: !dontFollow });
                var node = lookup.node;
                if (!node) {
                    throw new FS.ErrnoError(2);
                }
                if (!node.node_ops.getattr) {
                    throw new FS.ErrnoError(1);
                }
                return node.node_ops.getattr(node);
            },
            lstat: function (path) {
                return FS.stat(path, true);
            },
            chmod: function (path, mode, dontFollow) {
                var node;
                if (typeof path === "string") {
                    var lookup = FS.lookupPath(path, { follow: !dontFollow });
                    node = lookup.node;
                } else {
                    node = path;
                }
                if (!node.node_ops.setattr) {
                    throw new FS.ErrnoError(1);
                }
                node.node_ops.setattr(node, { mode: (mode & 4095) | (node.mode & ~4095), timestamp: Date.now() });
            },
            lchmod: function (path, mode) {
                FS.chmod(path, mode, true);
            },
            fchmod: function (fd, mode) {
                var stream = FS.getStream(fd);
                if (!stream) {
                    throw new FS.ErrnoError(9);
                }
                FS.chmod(stream.node, mode);
            },
            chown: function (path, uid, gid, dontFollow) {
                var node;
                if (typeof path === "string") {
                    var lookup = FS.lookupPath(path, { follow: !dontFollow });
                    node = lookup.node;
                } else {
                    node = path;
                }
                if (!node.node_ops.setattr) {
                    throw new FS.ErrnoError(1);
                }
                node.node_ops.setattr(node, { timestamp: Date.now() });
            },
            lchown: function (path, uid, gid) {
                FS.chown(path, uid, gid, true);
            },
            fchown: function (fd, uid, gid) {
                var stream = FS.getStream(fd);
                if (!stream) {
                    throw new FS.ErrnoError(9);
                }
                FS.chown(stream.node, uid, gid);
            },
            truncate: function (path, len) {
                if (len < 0) {
                    throw new FS.ErrnoError(22);
                }
                var node;
                if (typeof path === "string") {
                    var lookup = FS.lookupPath(path, { follow: true });
                    node = lookup.node;
                } else {
                    node = path;
                }
                if (!node.node_ops.setattr) {
                    throw new FS.ErrnoError(1);
                }
                if (FS.isDir(node.mode)) {
                    throw new FS.ErrnoError(21);
                }
                if (!FS.isFile(node.mode)) {
                    throw new FS.ErrnoError(22);
                }
                var err = FS.nodePermissions(node, "w");
                if (err) {
                    throw new FS.ErrnoError(err);
                }
                node.node_ops.setattr(node, { size: len, timestamp: Date.now() });
            },
            ftruncate: function (fd, len) {
                var stream = FS.getStream(fd);
                if (!stream) {
                    throw new FS.ErrnoError(9);
                }
                if ((stream.flags & 2097155) === 0) {
                    throw new FS.ErrnoError(22);
                }
                FS.truncate(stream.node, len);
            },
            utime: function (path, atime, mtime) {
                var lookup = FS.lookupPath(path, { follow: true });
                var node = lookup.node;
                node.node_ops.setattr(node, { timestamp: Math.max(atime, mtime) });
            },
            open: function (path, flags, mode, fd_start, fd_end) {
                if (path === "") {
                    throw new FS.ErrnoError(2);
                }
                flags = typeof flags === "string" ? FS.modeStringToFlags(flags) : flags;
                mode = typeof mode === "undefined" ? 438 : mode;
                if (flags & 64) {
                    mode = (mode & 4095) | 32768;
                } else {
                    mode = 0;
                }
                var node;
                if (typeof path === "object") {
                    node = path;
                } else {
                    path = PATH.normalize(path);
                    try {
                        var lookup = FS.lookupPath(path, { follow: !(flags & 131072) });
                        node = lookup.node;
                    } catch (e) {}
                }
                var created = false;
                if (flags & 64) {
                    if (node) {
                        if (flags & 128) {
                            throw new FS.ErrnoError(17);
                        }
                    } else {
                        node = FS.mknod(path, mode, 0);
                        created = true;
                    }
                }
                if (!node) {
                    throw new FS.ErrnoError(2);
                }
                if (FS.isChrdev(node.mode)) {
                    flags &= ~512;
                }
                if (flags & 65536 && !FS.isDir(node.mode)) {
                    throw new FS.ErrnoError(20);
                }
                if (!created) {
                    var err = FS.mayOpen(node, flags);
                    if (err) {
                        throw new FS.ErrnoError(err);
                    }
                }
                if (flags & 512) {
                    FS.truncate(node, 0);
                }
                flags &= ~(128 | 512);
                var stream = FS.createStream({ node: node, path: FS.getPath(node), flags: flags, seekable: true, position: 0, stream_ops: node.stream_ops, ungotten: [], error: false }, fd_start, fd_end);
                if (stream.stream_ops.open) {
                    stream.stream_ops.open(stream);
                }
                if (Module["logReadFiles"] && !(flags & 1)) {
                    if (!FS.readFiles) FS.readFiles = {};
                    if (!(path in FS.readFiles)) {
                        FS.readFiles[path] = 1;
                        console.log("FS.trackingDelegate error on read file: " + path);
                    }
                }
                try {
                    if (FS.trackingDelegate["onOpenFile"]) {
                        var trackingFlags = 0;
                        if ((flags & 2097155) !== 1) {
                            trackingFlags |= FS.tracking.openFlags.READ;
                        }
                        if ((flags & 2097155) !== 0) {
                            trackingFlags |= FS.tracking.openFlags.WRITE;
                        }
                        FS.trackingDelegate["onOpenFile"](path, trackingFlags);
                    }
                } catch (e) {
                    console.log("FS.trackingDelegate['onOpenFile']('" + path + "', flags) threw an exception: " + e.message);
                }
                return stream;
            },
            close: function (stream) {
                if (FS.isClosed(stream)) {
                    throw new FS.ErrnoError(9);
                }
                if (stream.getdents) stream.getdents = null;
                try {
                    if (stream.stream_ops.close) {
                        stream.stream_ops.close(stream);
                    }
                } catch (e) {
                    throw e;
                } finally {
                    FS.closeStream(stream.fd);
                }
                stream.fd = null;
            },
            isClosed: function (stream) {
                return stream.fd === null;
            },
            llseek: function (stream, offset, whence) {
                if (FS.isClosed(stream)) {
                    throw new FS.ErrnoError(9);
                }
                if (!stream.seekable || !stream.stream_ops.llseek) {
                    throw new FS.ErrnoError(29);
                }
                if (whence != 0 && whence != 1 && whence != 2) {
                    throw new FS.ErrnoError(22);
                }
                stream.position = stream.stream_ops.llseek(stream, offset, whence);
                stream.ungotten = [];
                return stream.position;
            },
            read: function (stream, buffer, offset, length, position) {
                if (length < 0 || position < 0) {
                    throw new FS.ErrnoError(22);
                }
                if (FS.isClosed(stream)) {
                    throw new FS.ErrnoError(9);
                }
                if ((stream.flags & 2097155) === 1) {
                    throw new FS.ErrnoError(9);
                }
                if (FS.isDir(stream.node.mode)) {
                    throw new FS.ErrnoError(21);
                }
                if (!stream.stream_ops.read) {
                    throw new FS.ErrnoError(22);
                }
                var seeking = typeof position !== "undefined";
                if (!seeking) {
                    position = stream.position;
                } else if (!stream.seekable) {
                    throw new FS.ErrnoError(29);
                }
                var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
                if (!seeking) stream.position += bytesRead;
                return bytesRead;
            },
            write: function (stream, buffer, offset, length, position, canOwn) {
                if (length < 0 || position < 0) {
                    throw new FS.ErrnoError(22);
                }
                if (FS.isClosed(stream)) {
                    throw new FS.ErrnoError(9);
                }
                if ((stream.flags & 2097155) === 0) {
                    throw new FS.ErrnoError(9);
                }
                if (FS.isDir(stream.node.mode)) {
                    throw new FS.ErrnoError(21);
                }
                if (!stream.stream_ops.write) {
                    throw new FS.ErrnoError(22);
                }
                if (stream.flags & 1024) {
                    FS.llseek(stream, 0, 2);
                }
                var seeking = typeof position !== "undefined";
                if (!seeking) {
                    position = stream.position;
                } else if (!stream.seekable) {
                    throw new FS.ErrnoError(29);
                }
                var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
                if (!seeking) stream.position += bytesWritten;
                try {
                    if (stream.path && FS.trackingDelegate["onWriteToFile"]) FS.trackingDelegate["onWriteToFile"](stream.path);
                } catch (e) {
                    console.log("FS.trackingDelegate['onWriteToFile']('" + stream.path + "') threw an exception: " + e.message);
                }
                return bytesWritten;
            },
            allocate: function (stream, offset, length) {
                if (FS.isClosed(stream)) {
                    throw new FS.ErrnoError(9);
                }
                if (offset < 0 || length <= 0) {
                    throw new FS.ErrnoError(22);
                }
                if ((stream.flags & 2097155) === 0) {
                    throw new FS.ErrnoError(9);
                }
                if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
                    throw new FS.ErrnoError(19);
                }
                if (!stream.stream_ops.allocate) {
                    throw new FS.ErrnoError(95);
                }
                stream.stream_ops.allocate(stream, offset, length);
            },
            mmap: function (stream, buffer, offset, length, position, prot, flags) {
                if ((prot & 2) !== 0 && (flags & 2) === 0 && (stream.flags & 2097155) !== 2) {
                    throw new FS.ErrnoError(13);
                }
                if ((stream.flags & 2097155) === 1) {
                    throw new FS.ErrnoError(13);
                }
                if (!stream.stream_ops.mmap) {
                    throw new FS.ErrnoError(19);
                }
                return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
            },
            msync: function (stream, buffer, offset, length, mmapFlags) {
                if (!stream || !stream.stream_ops.msync) {
                    return 0;
                }
                return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
            },
            munmap: function (stream) {
                return 0;
            },
            ioctl: function (stream, cmd, arg) {
                if (!stream.stream_ops.ioctl) {
                    throw new FS.ErrnoError(25);
                }
                return stream.stream_ops.ioctl(stream, cmd, arg);
            },
            readFile: function (path, opts) {
                opts = opts || {};
                opts.flags = opts.flags || "r";
                opts.encoding = opts.encoding || "binary";
                if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
                    throw new Error('Invalid encoding type "' + opts.encoding + '"');
                }
                var ret;
                var stream = FS.open(path, opts.flags);
                var stat = FS.stat(path);
                var length = stat.size;
                var buf = new Uint8Array(length);
                FS.read(stream, buf, 0, length, 0);
                if (opts.encoding === "utf8") {
                    ret = UTF8ArrayToString(buf, 0);
                } else if (opts.encoding === "binary") {
                    ret = buf;
                }
                FS.close(stream);
                return ret;
            },
            writeFile: function (path, data, opts) {
                opts = opts || {};
                opts.flags = opts.flags || "w";
                var stream = FS.open(path, opts.flags, opts.mode);
                if (typeof data === "string") {
                    var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
                    var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
                    FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn);
                } else if (ArrayBuffer.isView(data)) {
                    FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
                } else {
                    throw new Error("Unsupported data type");
                }
                FS.close(stream);
            },
            cwd: function () {
                return FS.currentPath;
            },
            chdir: function (path) {
                var lookup = FS.lookupPath(path, { follow: true });
                if (lookup.node === null) {
                    throw new FS.ErrnoError(2);
                }
                if (!FS.isDir(lookup.node.mode)) {
                    throw new FS.ErrnoError(20);
                }
                var err = FS.nodePermissions(lookup.node, "x");
                if (err) {
                    throw new FS.ErrnoError(err);
                }
                FS.currentPath = lookup.path;
            },
            createDefaultDirectories: function () {
                FS.mkdir("/tmp");
                FS.mkdir("/home");
                FS.mkdir("/home/web_user");
            },
            createDefaultDevices: function () {
                FS.mkdir("/dev");
                FS.registerDevice(FS.makedev(1, 3), {
                    read: function () {
                        return 0;
                    },
                    write: function (stream, buffer, offset, length, pos) {
                        return length;
                    },
                });
                FS.mkdev("/dev/null", FS.makedev(1, 3));
                TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
                TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
                FS.mkdev("/dev/tty", FS.makedev(5, 0));
                FS.mkdev("/dev/tty1", FS.makedev(6, 0));
                var random_device;
                if (typeof crypto === "object" && typeof crypto["getRandomValues"] === "function") {
                    var randomBuffer = new Uint8Array(1);
                    random_device = function () {
                        crypto.getRandomValues(randomBuffer);
                        return randomBuffer[0];
                    };
                } else if (ENVIRONMENT_IS_NODE) {
                    try {
                        var crypto_module = require("crypto");
                        random_device = function () {
                            return crypto_module["randomBytes"](1)[0];
                        };
                    } catch (e) {}
                } else {
                }
                if (!random_device) {
                    random_device = function () {
                        abort("random_device");
                    };
                }
                FS.createDevice("/dev", "random", random_device);
                FS.createDevice("/dev", "urandom", random_device);
                FS.mkdir("/dev/shm");
                FS.mkdir("/dev/shm/tmp");
            },
            createSpecialDirectories: function () {
                FS.mkdir("/proc");
                FS.mkdir("/proc/self");
                FS.mkdir("/proc/self/fd");
                FS.mount(
                    {
                        mount: function () {
                            var node = FS.createNode("/proc/self", "fd", 16384 | 511, 73);
                            node.node_ops = {
                                lookup: function (parent, name) {
                                    var fd = +name;
                                    var stream = FS.getStream(fd);
                                    if (!stream) throw new FS.ErrnoError(9);
                                    var ret = {
                                        parent: null,
                                        mount: { mountpoint: "fake" },
                                        node_ops: {
                                            readlink: function () {
                                                return stream.path;
                                            },
                                        },
                                    };
                                    ret.parent = ret;
                                    return ret;
                                },
                            };
                            return node;
                        },
                    },
                    {},
                    "/proc/self/fd"
                );
            },
            createStandardStreams: function () {
                if (Module["stdin"]) {
                    FS.createDevice("/dev", "stdin", Module["stdin"]);
                } else {
                    FS.symlink("/dev/tty", "/dev/stdin");
                }
                if (Module["stdout"]) {
                    FS.createDevice("/dev", "stdout", null, Module["stdout"]);
                } else {
                    FS.symlink("/dev/tty", "/dev/stdout");
                }
                if (Module["stderr"]) {
                    FS.createDevice("/dev", "stderr", null, Module["stderr"]);
                } else {
                    FS.symlink("/dev/tty1", "/dev/stderr");
                }
                var stdin = FS.open("/dev/stdin", "r");
                var stdout = FS.open("/dev/stdout", "w");
                var stderr = FS.open("/dev/stderr", "w");
            },
            ensureErrnoError: function () {
                if (FS.ErrnoError) return;
                FS.ErrnoError = function ErrnoError(errno, node) {
                    this.node = node;
                    this.setErrno = function (errno) {
                        this.errno = errno;
                    };
                    this.setErrno(errno);
                    this.message = "FS error";
                };
                FS.ErrnoError.prototype = new Error();
                FS.ErrnoError.prototype.constructor = FS.ErrnoError;
                [2].forEach(function (code) {
                    FS.genericErrors[code] = new FS.ErrnoError(code);
                    FS.genericErrors[code].stack = "<generic error, no stack>";
                });
            },
            staticInit: function () {
                FS.ensureErrnoError();
                FS.nameTable = new Array(4096);
                FS.mount(MEMFS, {}, "/");
                FS.createDefaultDirectories();
                FS.createDefaultDevices();
                FS.createSpecialDirectories();
                FS.filesystems = { MEMFS: MEMFS, IDBFS: IDBFS, NODEFS: NODEFS, WORKERFS: WORKERFS };
            },
            init: function (input, output, error) {
                FS.init.initialized = true;
                FS.ensureErrnoError();
                Module["stdin"] = input || Module["stdin"];
                Module["stdout"] = output || Module["stdout"];
                Module["stderr"] = error || Module["stderr"];
                FS.createStandardStreams();
            },
            quit: function () {
                FS.init.initialized = false;
                var fflush = Module["_fflush"];
                if (fflush) fflush(0);
                for (var i = 0; i < FS.streams.length; i++) {
                    var stream = FS.streams[i];
                    if (!stream) {
                        continue;
                    }
                    FS.close(stream);
                }
            },
            getMode: function (canRead, canWrite) {
                var mode = 0;
                if (canRead) mode |= 292 | 73;
                if (canWrite) mode |= 146;
                return mode;
            },
            joinPath: function (parts, forceRelative) {
                var path = PATH.join.apply(null, parts);
                if (forceRelative && path[0] == "/") path = path.substr(1);
                return path;
            },
            absolutePath: function (relative, base) {
                return PATH_FS.resolve(base, relative);
            },
            standardizePath: function (path) {
                return PATH.normalize(path);
            },
            findObject: function (path, dontResolveLastLink) {
                var ret = FS.analyzePath(path, dontResolveLastLink);
                if (ret.exists) {
                    return ret.object;
                } else {
                    ___setErrNo(ret.error);
                    return null;
                }
            },
            analyzePath: function (path, dontResolveLastLink) {
                try {
                    var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
                    path = lookup.path;
                } catch (e) {}
                var ret = { isRoot: false, exists: false, error: 0, name: null, path: null, object: null, parentExists: false, parentPath: null, parentObject: null };
                try {
                    var lookup = FS.lookupPath(path, { parent: true });
                    ret.parentExists = true;
                    ret.parentPath = lookup.path;
                    ret.parentObject = lookup.node;
                    ret.name = PATH.basename(path);
                    lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
                    ret.exists = true;
                    ret.path = lookup.path;
                    ret.object = lookup.node;
                    ret.name = lookup.node.name;
                    ret.isRoot = lookup.path === "/";
                } catch (e) {
                    ret.error = e.errno;
                }
                return ret;
            },
            createFolder: function (parent, name, canRead, canWrite) {
                var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
                var mode = FS.getMode(canRead, canWrite);
                return FS.mkdir(path, mode);
            },
            createPath: function (parent, path, canRead, canWrite) {
                parent = typeof parent === "string" ? parent : FS.getPath(parent);
                var parts = path.split("/").reverse();
                while (parts.length) {
                    var part = parts.pop();
                    if (!part) continue;
                    var current = PATH.join2(parent, part);
                    try {
                        FS.mkdir(current);
                    } catch (e) {}
                    parent = current;
                }
                return current;
            },
            createFile: function (parent, name, properties, canRead, canWrite) {
                var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
                var mode = FS.getMode(canRead, canWrite);
                return FS.create(path, mode);
            },
            createDataFile: function (parent, name, data, canRead, canWrite, canOwn) {
                var path = name ? PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name) : parent;
                var mode = FS.getMode(canRead, canWrite);
                var node = FS.create(path, mode);
                if (data) {
                    if (typeof data === "string") {
                        var arr = new Array(data.length);
                        for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
                        data = arr;
                    }
                    FS.chmod(node, mode | 146);
                    var stream = FS.open(node, "w");
                    FS.write(stream, data, 0, data.length, 0, canOwn);
                    FS.close(stream);
                    FS.chmod(node, mode);
                }
                return node;
            },
            createDevice: function (parent, name, input, output) {
                var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
                var mode = FS.getMode(!!input, !!output);
                if (!FS.createDevice.major) FS.createDevice.major = 64;
                var dev = FS.makedev(FS.createDevice.major++, 0);
                FS.registerDevice(dev, {
                    open: function (stream) {
                        stream.seekable = false;
                    },
                    close: function (stream) {
                        if (output && output.buffer && output.buffer.length) {
                            output(10);
                        }
                    },
                    read: function (stream, buffer, offset, length, pos) {
                        var bytesRead = 0;
                        for (var i = 0; i < length; i++) {
                            var result;
                            try {
                                result = input();
                            } catch (e) {
                                throw new FS.ErrnoError(5);
                            }
                            if (result === undefined && bytesRead === 0) {
                                throw new FS.ErrnoError(11);
                            }
                            if (result === null || result === undefined) break;
                            bytesRead++;
                            buffer[offset + i] = result;
                        }
                        if (bytesRead) {
                            stream.node.timestamp = Date.now();
                        }
                        return bytesRead;
                    },
                    write: function (stream, buffer, offset, length, pos) {
                        for (var i = 0; i < length; i++) {
                            try {
                                output(buffer[offset + i]);
                            } catch (e) {
                                throw new FS.ErrnoError(5);
                            }
                        }
                        if (length) {
                            stream.node.timestamp = Date.now();
                        }
                        return i;
                    },
                });
                return FS.mkdev(path, mode, dev);
            },
            createLink: function (parent, name, target, canRead, canWrite) {
                var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
                return FS.symlink(target, path);
            },
            forceLoadFile: function (obj) {
                if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
                var success = true;
                if (typeof XMLHttpRequest !== "undefined") {
                    throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
                } else if (read_) {
                    try {
                        obj.contents = intArrayFromString(read_(obj.url), true);
                        obj.usedBytes = obj.contents.length;
                    } catch (e) {
                        success = false;
                    }
                } else {
                    throw new Error("Cannot load without read() or XMLHttpRequest.");
                }
                if (!success) ___setErrNo(5);
                return success;
            },
            createLazyFile: function (parent, name, url, canRead, canWrite) {
                function LazyUint8Array() {
                    this.lengthKnown = false;
                    this.chunks = [];
                }
                LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
                    if (idx > this.length - 1 || idx < 0) {
                        return undefined;
                    }
                    var chunkOffset = idx % this.chunkSize;
                    var chunkNum = (idx / this.chunkSize) | 0;
                    return this.getter(chunkNum)[chunkOffset];
                };
                LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
                    this.getter = getter;
                };
                LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
                    var xhr = new XMLHttpRequest();
                    xhr.open("HEAD", url, false);
                    xhr.send(null);
                    if (!((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                    var datalength = Number(xhr.getResponseHeader("Content-length"));
                    var header;
                    var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
                    var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
                    var chunkSize = 1024 * 1024;
                    if (!hasByteServing) chunkSize = datalength;
                    var doXHR = function (from, to) {
                        if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                        if (to > datalength - 1) throw new Error("only " + datalength + " bytes available! programmer error!");
                        var xhr = new XMLHttpRequest();
                        xhr.open("GET", url, false);
                        if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                        if (typeof Uint8Array != "undefined") xhr.responseType = "arraybuffer";
                        if (xhr.overrideMimeType) {
                            xhr.overrideMimeType("text/plain; charset=x-user-defined");
                        }
                        xhr.send(null);
                        if (!((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                        if (xhr.response !== undefined) {
                            return new Uint8Array(xhr.response || []);
                        } else {
                            return intArrayFromString(xhr.responseText || "", true);
                        }
                    };
                    var lazyArray = this;
                    lazyArray.setDataGetter(function (chunkNum) {
                        var start = chunkNum * chunkSize;
                        var end = (chunkNum + 1) * chunkSize - 1;
                        end = Math.min(end, datalength - 1);
                        if (typeof lazyArray.chunks[chunkNum] === "undefined") {
                            lazyArray.chunks[chunkNum] = doXHR(start, end);
                        }
                        if (typeof lazyArray.chunks[chunkNum] === "undefined") throw new Error("doXHR failed!");
                        return lazyArray.chunks[chunkNum];
                    });
                    if (usesGzip || !datalength) {
                        chunkSize = datalength = 1;
                        datalength = this.getter(0).length;
                        chunkSize = datalength;
                        console.log("LazyFiles on gzip forces download of the whole file when length is accessed");
                    }
                    this._length = datalength;
                    this._chunkSize = chunkSize;
                    this.lengthKnown = true;
                };
                if (typeof XMLHttpRequest !== "undefined") {
                    if (!ENVIRONMENT_IS_WORKER) throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
                    var lazyArray = new LazyUint8Array();
                    Object.defineProperties(lazyArray, {
                        length: {
                            get: function () {
                                if (!this.lengthKnown) {
                                    this.cacheLength();
                                }
                                return this._length;
                            },
                        },
                        chunkSize: {
                            get: function () {
                                if (!this.lengthKnown) {
                                    this.cacheLength();
                                }
                                return this._chunkSize;
                            },
                        },
                    });
                    var properties = { isDevice: false, contents: lazyArray };
                } else {
                    var properties = { isDevice: false, url: url };
                }
                var node = FS.createFile(parent, name, properties, canRead, canWrite);
                if (properties.contents) {
                    node.contents = properties.contents;
                } else if (properties.url) {
                    node.contents = null;
                    node.url = properties.url;
                }
                Object.defineProperties(node, {
                    usedBytes: {
                        get: function () {
                            return this.contents.length;
                        },
                    },
                });
                var stream_ops = {};
                var keys = Object.keys(node.stream_ops);
                keys.forEach(function (key) {
                    var fn = node.stream_ops[key];
                    stream_ops[key] = function forceLoadLazyFile() {
                        if (!FS.forceLoadFile(node)) {
                            throw new FS.ErrnoError(5);
                        }
                        return fn.apply(null, arguments);
                    };
                });
                stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
                    if (!FS.forceLoadFile(node)) {
                        throw new FS.ErrnoError(5);
                    }
                    var contents = stream.node.contents;
                    if (position >= contents.length) return 0;
                    var size = Math.min(contents.length - position, length);
                    if (contents.slice) {
                        for (var i = 0; i < size; i++) {
                            buffer[offset + i] = contents[position + i];
                        }
                    } else {
                        for (var i = 0; i < size; i++) {
                            buffer[offset + i] = contents.get(position + i);
                        }
                    }
                    return size;
                };
                node.stream_ops = stream_ops;
                return node;
            },
            createPreloadedFile: function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) {
                Browser.init();
                var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
                var dep = getUniqueRunDependency("cp " + fullname);
                function processData(byteArray) {
                    function finish(byteArray) {
                        if (preFinish) preFinish();
                        if (!dontCreateFile) {
                            FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
                        }
                        if (onload) onload();
                        removeRunDependency(dep);
                    }
                    var handled = false;
                    Module["preloadPlugins"].forEach(function (plugin) {
                        if (handled) return;
                        if (plugin["canHandle"](fullname)) {
                            plugin["handle"](byteArray, fullname, finish, function () {
                                if (onerror) onerror();
                                removeRunDependency(dep);
                            });
                            handled = true;
                        }
                    });
                    if (!handled) finish(byteArray);
                }
                addRunDependency(dep);
                if (typeof url == "string") {
                    Browser.asyncLoad(
                        url,
                        function (byteArray) {
                            processData(byteArray);
                        },
                        onerror
                    );
                } else {
                    processData(url);
                }
            },
            indexedDB: function () {
                return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
            },
            DB_NAME: function () {
                return "EM_FS_" + window.location.pathname;
            },
            DB_VERSION: 20,
            DB_STORE_NAME: "FILE_DATA",
            saveFilesToDB: function (paths, onload, onerror) {
                onload = onload || function () {};
                onerror = onerror || function () {};
                var indexedDB = FS.indexedDB();
                try {
                    var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
                } catch (e) {
                    return onerror(e);
                }
                openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
                    console.log("creating db");
                    var db = openRequest.result;
                    db.createObjectStore(FS.DB_STORE_NAME);
                };
                openRequest.onsuccess = function openRequest_onsuccess() {
                    var db = openRequest.result;
                    var transaction = db.transaction([FS.DB_STORE_NAME], "readwrite");
                    var files = transaction.objectStore(FS.DB_STORE_NAME);
                    var ok = 0,
                        fail = 0,
                        total = paths.length;
                    function finish() {
                        if (fail == 0) onload();
                        else onerror();
                    }
                    paths.forEach(function (path) {
                        var putRequest = files.put(FS.analyzePath(path).object.contents, path);
                        putRequest.onsuccess = function putRequest_onsuccess() {
                            ok++;
                            if (ok + fail == total) finish();
                        };
                        putRequest.onerror = function putRequest_onerror() {
                            fail++;
                            if (ok + fail == total) finish();
                        };
                    });
                    transaction.onerror = onerror;
                };
                openRequest.onerror = onerror;
            },
            loadFilesFromDB: function (paths, onload, onerror) {
                onload = onload || function () {};
                onerror = onerror || function () {};
                var indexedDB = FS.indexedDB();
                try {
                    var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
                } catch (e) {
                    return onerror(e);
                }
                openRequest.onupgradeneeded = onerror;
                openRequest.onsuccess = function openRequest_onsuccess() {
                    var db = openRequest.result;
                    try {
                        var transaction = db.transaction([FS.DB_STORE_NAME], "readonly");
                    } catch (e) {
                        onerror(e);
                        return;
                    }
                    var files = transaction.objectStore(FS.DB_STORE_NAME);
                    var ok = 0,
                        fail = 0,
                        total = paths.length;
                    function finish() {
                        if (fail == 0) onload();
                        else onerror();
                    }
                    paths.forEach(function (path) {
                        var getRequest = files.get(path);
                        getRequest.onsuccess = function getRequest_onsuccess() {
                            if (FS.analyzePath(path).exists) {
                                FS.unlink(path);
                            }
                            FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
                            ok++;
                            if (ok + fail == total) finish();
                        };
                        getRequest.onerror = function getRequest_onerror() {
                            fail++;
                            if (ok + fail == total) finish();
                        };
                    });
                    transaction.onerror = onerror;
                };
                openRequest.onerror = onerror;
            },
        };
        var SYSCALLS = {
            DEFAULT_POLLMASK: 5,
            mappings: {},
            umask: 511,
            calculateAt: function (dirfd, path) {
                if (path[0] !== "/") {
                    var dir;
                    if (dirfd === -100) {
                        dir = FS.cwd();
                    } else {
                        var dirstream = FS.getStream(dirfd);
                        if (!dirstream) throw new FS.ErrnoError(9);
                        dir = dirstream.path;
                    }
                    path = PATH.join2(dir, path);
                }
                return path;
            },
            doStat: function (func, path, buf) {
                try {
                    var stat = func(path);
                } catch (e) {
                    if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
                        return -20;
                    }
                    throw e;
                }
                HEAP32[buf >> 2] = stat.dev;
                HEAP32[(buf + 4) >> 2] = 0;
                HEAP32[(buf + 8) >> 2] = stat.ino;
                HEAP32[(buf + 12) >> 2] = stat.mode;
                HEAP32[(buf + 16) >> 2] = stat.nlink;
                HEAP32[(buf + 20) >> 2] = stat.uid;
                HEAP32[(buf + 24) >> 2] = stat.gid;
                HEAP32[(buf + 28) >> 2] = stat.rdev;
                HEAP32[(buf + 32) >> 2] = 0;
                (tempI64 = [
                    stat.size >>> 0,
                    ((tempDouble = stat.size),
                    +Math_abs(tempDouble) >= 1 ? (tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0) : 0),
                ]),
                    (HEAP32[(buf + 40) >> 2] = tempI64[0]),
                    (HEAP32[(buf + 44) >> 2] = tempI64[1]);
                HEAP32[(buf + 48) >> 2] = 4096;
                HEAP32[(buf + 52) >> 2] = stat.blocks;
                HEAP32[(buf + 56) >> 2] = (stat.atime.getTime() / 1e3) | 0;
                HEAP32[(buf + 60) >> 2] = 0;
                HEAP32[(buf + 64) >> 2] = (stat.mtime.getTime() / 1e3) | 0;
                HEAP32[(buf + 68) >> 2] = 0;
                HEAP32[(buf + 72) >> 2] = (stat.ctime.getTime() / 1e3) | 0;
                HEAP32[(buf + 76) >> 2] = 0;
                (tempI64 = [
                    stat.ino >>> 0,
                    ((tempDouble = stat.ino),
                    +Math_abs(tempDouble) >= 1 ? (tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0) : 0),
                ]),
                    (HEAP32[(buf + 80) >> 2] = tempI64[0]),
                    (HEAP32[(buf + 84) >> 2] = tempI64[1]);
                return 0;
            },
            doMsync: function (addr, stream, len, flags) {
                var buffer = new Uint8Array(HEAPU8.subarray(addr, addr + len));
                FS.msync(stream, buffer, 0, len, flags);
            },
            doMkdir: function (path, mode) {
                path = PATH.normalize(path);
                if (path[path.length - 1] === "/") path = path.substr(0, path.length - 1);
                FS.mkdir(path, mode, 0);
                return 0;
            },
            doMknod: function (path, mode, dev) {
                switch (mode & 61440) {
                    case 32768:
                    case 8192:
                    case 24576:
                    case 4096:
                    case 49152:
                        break;
                    default:
                        return -22;
                }
                FS.mknod(path, mode, dev);
                return 0;
            },
            doReadlink: function (path, buf, bufsize) {
                if (bufsize <= 0) return -22;
                var ret = FS.readlink(path);
                var len = Math.min(bufsize, lengthBytesUTF8(ret));
                var endChar = HEAP8[buf + len];
                stringToUTF8(ret, buf, bufsize + 1);
                HEAP8[buf + len] = endChar;
                return len;
            },
            doAccess: function (path, amode) {
                if (amode & ~7) {
                    return -22;
                }
                var node;
                var lookup = FS.lookupPath(path, { follow: true });
                node = lookup.node;
                if (!node) {
                    return -2;
                }
                var perms = "";
                if (amode & 4) perms += "r";
                if (amode & 2) perms += "w";
                if (amode & 1) perms += "x";
                if (perms && FS.nodePermissions(node, perms)) {
                    return -13;
                }
                return 0;
            },
            doDup: function (path, flags, suggestFD) {
                var suggest = FS.getStream(suggestFD);
                if (suggest) FS.close(suggest);
                return FS.open(path, flags, 0, suggestFD, suggestFD).fd;
            },
            doReadv: function (stream, iov, iovcnt, offset) {
                var ret = 0;
                for (var i = 0; i < iovcnt; i++) {
                    var ptr = HEAP32[(iov + i * 8) >> 2];
                    var len = HEAP32[(iov + (i * 8 + 4)) >> 2];
                    var curr = FS.read(stream, HEAP8, ptr, len, offset);
                    if (curr < 0) return -1;
                    ret += curr;
                    if (curr < len) break;
                }
                return ret;
            },
            doWritev: function (stream, iov, iovcnt, offset) {
                var ret = 0;
                for (var i = 0; i < iovcnt; i++) {
                    var ptr = HEAP32[(iov + i * 8) >> 2];
                    var len = HEAP32[(iov + (i * 8 + 4)) >> 2];
                    var curr = FS.write(stream, HEAP8, ptr, len, offset);
                    if (curr < 0) return -1;
                    ret += curr;
                }
                return ret;
            },
            varargs: 0,
            get: function (varargs) {
                SYSCALLS.varargs += 4;
                var ret = HEAP32[(SYSCALLS.varargs - 4) >> 2];
                return ret;
            },
            getStr: function () {
                var ret = UTF8ToString(SYSCALLS.get());
                return ret;
            },
            getStreamFromFD: function () {
                var stream = FS.getStream(SYSCALLS.get());
                if (!stream) throw new FS.ErrnoError(9);
                return stream;
            },
            get64: function () {
                var low = SYSCALLS.get(),
                    high = SYSCALLS.get();
                return low;
            },
            getZero: function () {
                SYSCALLS.get();
            },
        };
        function ___syscall140(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var stream = SYSCALLS.getStreamFromFD(),
                    offset_high = SYSCALLS.get(),
                    offset_low = SYSCALLS.get(),
                    result = SYSCALLS.get(),
                    whence = SYSCALLS.get();
                var HIGH_OFFSET = 4294967296;
                var offset = offset_high * HIGH_OFFSET + (offset_low >>> 0);
                var DOUBLE_LIMIT = 9007199254740992;
                if (offset <= -DOUBLE_LIMIT || offset >= DOUBLE_LIMIT) {
                    return -75;
                }
                FS.llseek(stream, offset, whence);
                (tempI64 = [
                    stream.position >>> 0,
                    ((tempDouble = stream.position),
                    +Math_abs(tempDouble) >= 1 ? (tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0) : 0),
                ]),
                    (HEAP32[result >> 2] = tempI64[0]),
                    (HEAP32[(result + 4) >> 2] = tempI64[1]);
                if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
                return 0;
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno;
            }
        }
        function ___syscall145(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var stream = SYSCALLS.getStreamFromFD(),
                    iov = SYSCALLS.get(),
                    iovcnt = SYSCALLS.get();
                return SYSCALLS.doReadv(stream, iov, iovcnt);
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno;
            }
        }
        function ___syscall146(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var stream = SYSCALLS.getStreamFromFD(),
                    iov = SYSCALLS.get(),
                    iovcnt = SYSCALLS.get();
                return SYSCALLS.doWritev(stream, iov, iovcnt);
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno;
            }
        }
        function ___syscall54(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var stream = SYSCALLS.getStreamFromFD(),
                    op = SYSCALLS.get();
                switch (op) {
                    case 21509:
                    case 21505: {
                        if (!stream.tty) return -25;
                        return 0;
                    }
                    case 21510:
                    case 21511:
                    case 21512:
                    case 21506:
                    case 21507:
                    case 21508: {
                        if (!stream.tty) return -25;
                        return 0;
                    }
                    case 21519: {
                        if (!stream.tty) return -25;
                        var argp = SYSCALLS.get();
                        HEAP32[argp >> 2] = 0;
                        return 0;
                    }
                    case 21520: {
                        if (!stream.tty) return -25;
                        return -22;
                    }
                    case 21531: {
                        var argp = SYSCALLS.get();
                        return FS.ioctl(stream, op, argp);
                    }
                    case 21523: {
                        if (!stream.tty) return -25;
                        return 0;
                    }
                    case 21524: {
                        if (!stream.tty) return -25;
                        return 0;
                    }
                    default:
                        abort("bad ioctl syscall " + op);
                }
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno;
            }
        }
        function ___syscall6(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var stream = SYSCALLS.getStreamFromFD();
                FS.close(stream);
                return 0;
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno;
            }
        }
        function __emscripten_syscall_munmap(addr, len) {
            if (addr === -1 || len === 0) {
                return -22;
            }
            var info = SYSCALLS.mappings[addr];
            if (!info) return 0;
            if (len === info.len) {
                var stream = FS.getStream(info.fd);
                SYSCALLS.doMsync(addr, stream, len, info.flags);
                FS.munmap(stream);
                SYSCALLS.mappings[addr] = null;
                if (info.allocated) {
                    _free(info.malloc);
                }
            }
            return 0;
        }
        function ___syscall91(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var addr = SYSCALLS.get(),
                    len = SYSCALLS.get();
                return __emscripten_syscall_munmap(addr, len);
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno;
            }
        }
        function ___unlock() {}
        var structRegistrations = {};
        function runDestructors(destructors) {
            while (destructors.length) {
                var ptr = destructors.pop();
                var del = destructors.pop();
                del(ptr);
            }
        }
        function simpleReadValueFromPointer(pointer) {
            return this["fromWireType"](HEAPU32[pointer >> 2]);
        }
        var awaitingDependencies = {};
        var registeredTypes = {};
        var typeDependencies = {};
        var char_0 = 48;
        var char_9 = 57;
        function makeLegalFunctionName(name) {
            if (undefined === name) {
                return "_unknown";
            }
            name = name.replace(/[^a-zA-Z0-9_]/g, "$");
            var f = name.charCodeAt(0);
            if (f >= char_0 && f <= char_9) {
                return "_" + name;
            } else {
                return name;
            }
        }
        function createNamedFunction(name, body) {
            name = makeLegalFunctionName(name);
            return new Function("body", "return function " + name + "() {\n" + '    "use strict";' + "    return body.apply(this, arguments);\n" + "};\n")(body);
        }
        function extendError(baseErrorType, errorName) {
            var errorClass = createNamedFunction(errorName, function (message) {
                this.name = errorName;
                this.message = message;
                var stack = new Error(message).stack;
                if (stack !== undefined) {
                    this.stack = this.toString() + "\n" + stack.replace(/^Error(:[^\n]*)?\n/, "");
                }
            });
            errorClass.prototype = Object.create(baseErrorType.prototype);
            errorClass.prototype.constructor = errorClass;
            errorClass.prototype.toString = function () {
                if (this.message === undefined) {
                    return this.name;
                } else {
                    return this.name + ": " + this.message;
                }
            };
            return errorClass;
        }
        var InternalError = undefined;
        function throwInternalError(message) {
            throw new InternalError(message);
        }
        function whenDependentTypesAreResolved(myTypes, dependentTypes, getTypeConverters) {
            myTypes.forEach(function (type) {
                typeDependencies[type] = dependentTypes;
            });
            function onComplete(typeConverters) {
                var myTypeConverters = getTypeConverters(typeConverters);
                if (myTypeConverters.length !== myTypes.length) {
                    throwInternalError("Mismatched type converter count");
                }
                for (var i = 0; i < myTypes.length; ++i) {
                    registerType(myTypes[i], myTypeConverters[i]);
                }
            }
            var typeConverters = new Array(dependentTypes.length);
            var unregisteredTypes = [];
            var registered = 0;
            dependentTypes.forEach(function (dt, i) {
                if (registeredTypes.hasOwnProperty(dt)) {
                    typeConverters[i] = registeredTypes[dt];
                } else {
                    unregisteredTypes.push(dt);
                    if (!awaitingDependencies.hasOwnProperty(dt)) {
                        awaitingDependencies[dt] = [];
                    }
                    awaitingDependencies[dt].push(function () {
                        typeConverters[i] = registeredTypes[dt];
                        ++registered;
                        if (registered === unregisteredTypes.length) {
                            onComplete(typeConverters);
                        }
                    });
                }
            });
            if (0 === unregisteredTypes.length) {
                onComplete(typeConverters);
            }
        }
        function __embind_finalize_value_object(structType) {
            var reg = structRegistrations[structType];
            delete structRegistrations[structType];
            var rawConstructor = reg.rawConstructor;
            var rawDestructor = reg.rawDestructor;
            var fieldRecords = reg.fields;
            var fieldTypes = fieldRecords
                .map(function (field) {
                    return field.getterReturnType;
                })
                .concat(
                    fieldRecords.map(function (field) {
                        return field.setterArgumentType;
                    })
                );
            whenDependentTypesAreResolved([structType], fieldTypes, function (fieldTypes) {
                var fields = {};
                fieldRecords.forEach(function (field, i) {
                    var fieldName = field.fieldName;
                    var getterReturnType = fieldTypes[i];
                    var getter = field.getter;
                    var getterContext = field.getterContext;
                    var setterArgumentType = fieldTypes[i + fieldRecords.length];
                    var setter = field.setter;
                    var setterContext = field.setterContext;
                    fields[fieldName] = {
                        read: function (ptr) {
                            return getterReturnType["fromWireType"](getter(getterContext, ptr));
                        },
                        write: function (ptr, o) {
                            var destructors = [];
                            setter(setterContext, ptr, setterArgumentType["toWireType"](destructors, o));
                            runDestructors(destructors);
                        },
                    };
                });
                return [
                    {
                        name: reg.name,
                        fromWireType: function (ptr) {
                            var rv = {};
                            for (var i in fields) {
                                rv[i] = fields[i].read(ptr);
                            }
                            rawDestructor(ptr);
                            return rv;
                        },
                        toWireType: function (destructors, o) {
                            for (var fieldName in fields) {
                                if (!(fieldName in o)) {
                                    throw new TypeError("Missing field");
                                }
                            }
                            var ptr = rawConstructor();
                            for (fieldName in fields) {
                                fields[fieldName].write(ptr, o[fieldName]);
                            }
                            if (destructors !== null) {
                                destructors.push(rawDestructor, ptr);
                            }
                            return ptr;
                        },
                        argPackAdvance: 8,
                        readValueFromPointer: simpleReadValueFromPointer,
                        destructorFunction: rawDestructor,
                    },
                ];
            });
        }
        function getShiftFromSize(size) {
            switch (size) {
                case 1:
                    return 0;
                case 2:
                    return 1;
                case 4:
                    return 2;
                case 8:
                    return 3;
                default:
                    throw new TypeError("Unknown type size: " + size);
            }
        }
        function embind_init_charCodes() {
            var codes = new Array(256);
            for (var i = 0; i < 256; ++i) {
                codes[i] = String.fromCharCode(i);
            }
            embind_charCodes = codes;
        }
        var embind_charCodes = undefined;
        function readLatin1String(ptr) {
            var ret = "";
            var c = ptr;
            while (HEAPU8[c]) {
                ret += embind_charCodes[HEAPU8[c++]];
            }
            return ret;
        }
        var BindingError = undefined;
        function throwBindingError(message) {
            throw new BindingError(message);
        }
        function registerType(rawType, registeredInstance, options) {
            options = options || {};
            if (!("argPackAdvance" in registeredInstance)) {
                throw new TypeError("registerType registeredInstance requires argPackAdvance");
            }
            var name = registeredInstance.name;
            if (!rawType) {
                throwBindingError('type "' + name + '" must have a positive integer typeid pointer');
            }
            if (registeredTypes.hasOwnProperty(rawType)) {
                if (options.ignoreDuplicateRegistrations) {
                    return;
                } else {
                    throwBindingError("Cannot register type '" + name + "' twice");
                }
            }
            registeredTypes[rawType] = registeredInstance;
            delete typeDependencies[rawType];
            if (awaitingDependencies.hasOwnProperty(rawType)) {
                var callbacks = awaitingDependencies[rawType];
                delete awaitingDependencies[rawType];
                callbacks.forEach(function (cb) {
                    cb();
                });
            }
        }
        function __embind_register_bool(rawType, name, size, trueValue, falseValue) {
            var shift = getShiftFromSize(size);
            name = readLatin1String(name);
            registerType(rawType, {
                name: name,
                fromWireType: function (wt) {
                    return !!wt;
                },
                toWireType: function (destructors, o) {
                    return o ? trueValue : falseValue;
                },
                argPackAdvance: 8,
                readValueFromPointer: function (pointer) {
                    var heap;
                    if (size === 1) {
                        heap = HEAP8;
                    } else if (size === 2) {
                        heap = HEAP16;
                    } else if (size === 4) {
                        heap = HEAP32;
                    } else {
                        throw new TypeError("Unknown boolean type size: " + name);
                    }
                    return this["fromWireType"](heap[pointer >> shift]);
                },
                destructorFunction: null,
            });
        }
        function ClassHandle_isAliasOf(other) {
            if (!(this instanceof ClassHandle)) {
                return false;
            }
            if (!(other instanceof ClassHandle)) {
                return false;
            }
            var leftClass = this.$$.ptrType.registeredClass;
            var left = this.$$.ptr;
            var rightClass = other.$$.ptrType.registeredClass;
            var right = other.$$.ptr;
            while (leftClass.baseClass) {
                left = leftClass.upcast(left);
                leftClass = leftClass.baseClass;
            }
            while (rightClass.baseClass) {
                right = rightClass.upcast(right);
                rightClass = rightClass.baseClass;
            }
            return leftClass === rightClass && left === right;
        }
        function shallowCopyInternalPointer(o) {
            return { count: o.count, deleteScheduled: o.deleteScheduled, preservePointerOnDelete: o.preservePointerOnDelete, ptr: o.ptr, ptrType: o.ptrType, smartPtr: o.smartPtr, smartPtrType: o.smartPtrType };
        }
        function throwInstanceAlreadyDeleted(obj) {
            function getInstanceTypeName(handle) {
                return handle.$$.ptrType.registeredClass.name;
            }
            throwBindingError(getInstanceTypeName(obj) + " instance already deleted");
        }
        var finalizationGroup = false;
        function detachFinalizer(handle) {}
        function runDestructor($$) {
            if ($$.smartPtr) {
                $$.smartPtrType.rawDestructor($$.smartPtr);
            } else {
                $$.ptrType.registeredClass.rawDestructor($$.ptr);
            }
        }
        function releaseClassHandle($$) {
            $$.count.value -= 1;
            var toDelete = 0 === $$.count.value;
            if (toDelete) {
                runDestructor($$);
            }
        }
        function attachFinalizer(handle) {
            if ("undefined" === typeof FinalizationGroup) {
                attachFinalizer = function (handle) {
                    return handle;
                };
                return handle;
            }
            finalizationGroup = new FinalizationGroup(function (iter) {
                for (var result = iter.next(); !result.done; result = iter.next()) {
                    var $$ = result.value;
                    if (!$$.ptr) {
                        console.warn("object already deleted: " + $$.ptr);
                    } else {
                        releaseClassHandle($$);
                    }
                }
            });
            attachFinalizer = function (handle) {
                finalizationGroup.register(handle, handle.$$, handle.$$);
                return handle;
            };
            detachFinalizer = function (handle) {
                finalizationGroup.unregister(handle.$$);
            };
            return attachFinalizer(handle);
        }
        function ClassHandle_clone() {
            if (!this.$$.ptr) {
                throwInstanceAlreadyDeleted(this);
            }
            if (this.$$.preservePointerOnDelete) {
                this.$$.count.value += 1;
                return this;
            } else {
                var clone = attachFinalizer(Object.create(Object.getPrototypeOf(this), { $$: { value: shallowCopyInternalPointer(this.$$) } }));
                clone.$$.count.value += 1;
                clone.$$.deleteScheduled = false;
                return clone;
            }
        }
        function ClassHandle_delete() {
            if (!this.$$.ptr) {
                throwInstanceAlreadyDeleted(this);
            }
            if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
                throwBindingError("Object already scheduled for deletion");
            }
            detachFinalizer(this);
            releaseClassHandle(this.$$);
            if (!this.$$.preservePointerOnDelete) {
                this.$$.smartPtr = undefined;
                this.$$.ptr = undefined;
            }
        }
        function ClassHandle_isDeleted() {
            return !this.$$.ptr;
        }
        var delayFunction = undefined;
        var deletionQueue = [];
        function flushPendingDeletes() {
            while (deletionQueue.length) {
                var obj = deletionQueue.pop();
                obj.$$.deleteScheduled = false;
                obj["delete"]();
            }
        }
        function ClassHandle_deleteLater() {
            if (!this.$$.ptr) {
                throwInstanceAlreadyDeleted(this);
            }
            if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
                throwBindingError("Object already scheduled for deletion");
            }
            deletionQueue.push(this);
            if (deletionQueue.length === 1 && delayFunction) {
                delayFunction(flushPendingDeletes);
            }
            this.$$.deleteScheduled = true;
            return this;
        }
        function init_ClassHandle() {
            ClassHandle.prototype["isAliasOf"] = ClassHandle_isAliasOf;
            ClassHandle.prototype["clone"] = ClassHandle_clone;
            ClassHandle.prototype["delete"] = ClassHandle_delete;
            ClassHandle.prototype["isDeleted"] = ClassHandle_isDeleted;
            ClassHandle.prototype["deleteLater"] = ClassHandle_deleteLater;
        }
        function ClassHandle() {}
        var registeredPointers = {};
        function ensureOverloadTable(proto, methodName, humanName) {
            if (undefined === proto[methodName].overloadTable) {
                var prevFunc = proto[methodName];
                proto[methodName] = function () {
                    if (!proto[methodName].overloadTable.hasOwnProperty(arguments.length)) {
                        throwBindingError("Function '" + humanName + "' called with an invalid number of arguments (" + arguments.length + ") - expects one of (" + proto[methodName].overloadTable + ")!");
                    }
                    return proto[methodName].overloadTable[arguments.length].apply(this, arguments);
                };
                proto[methodName].overloadTable = [];
                proto[methodName].overloadTable[prevFunc.argCount] = prevFunc;
            }
        }
        function exposePublicSymbol(name, value, numArguments) {
            if (Module.hasOwnProperty(name)) {
                if (undefined === numArguments || (undefined !== Module[name].overloadTable && undefined !== Module[name].overloadTable[numArguments])) {
                    throwBindingError("Cannot register public name '" + name + "' twice");
                }
                ensureOverloadTable(Module, name, name);
                if (Module.hasOwnProperty(numArguments)) {
                    throwBindingError("Cannot register multiple overloads of a function with the same number of arguments (" + numArguments + ")!");
                }
                Module[name].overloadTable[numArguments] = value;
            } else {
                Module[name] = value;
                if (undefined !== numArguments) {
                    Module[name].numArguments = numArguments;
                }
            }
        }
        function RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast) {
            this.name = name;
            this.constructor = constructor;
            this.instancePrototype = instancePrototype;
            this.rawDestructor = rawDestructor;
            this.baseClass = baseClass;
            this.getActualType = getActualType;
            this.upcast = upcast;
            this.downcast = downcast;
            this.pureVirtualFunctions = [];
        }
        function upcastPointer(ptr, ptrClass, desiredClass) {
            while (ptrClass !== desiredClass) {
                if (!ptrClass.upcast) {
                    throwBindingError("Expected null or instance of " + desiredClass.name + ", got an instance of " + ptrClass.name);
                }
                ptr = ptrClass.upcast(ptr);
                ptrClass = ptrClass.baseClass;
            }
            return ptr;
        }
        function constNoSmartPtrRawPointerToWireType(destructors, handle) {
            if (handle === null) {
                if (this.isReference) {
                    throwBindingError("null is not a valid " + this.name);
                }
                return 0;
            }
            if (!handle.$$) {
                throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
            }
            if (!handle.$$.ptr) {
                throwBindingError("Cannot pass deleted object as a pointer of type " + this.name);
            }
            var handleClass = handle.$$.ptrType.registeredClass;
            var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
            return ptr;
        }
        function genericPointerToWireType(destructors, handle) {
            var ptr;
            if (handle === null) {
                if (this.isReference) {
                    throwBindingError("null is not a valid " + this.name);
                }
                if (this.isSmartPointer) {
                    ptr = this.rawConstructor();
                    if (destructors !== null) {
                        destructors.push(this.rawDestructor, ptr);
                    }
                    return ptr;
                } else {
                    return 0;
                }
            }
            if (!handle.$$) {
                throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
            }
            if (!handle.$$.ptr) {
                throwBindingError("Cannot pass deleted object as a pointer of type " + this.name);
            }
            if (!this.isConst && handle.$$.ptrType.isConst) {
                throwBindingError("Cannot convert argument of type " + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + " to parameter type " + this.name);
            }
            var handleClass = handle.$$.ptrType.registeredClass;
            ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
            if (this.isSmartPointer) {
                if (undefined === handle.$$.smartPtr) {
                    throwBindingError("Passing raw pointer to smart pointer is illegal");
                }
                switch (this.sharingPolicy) {
                    case 0:
                        if (handle.$$.smartPtrType === this) {
                            ptr = handle.$$.smartPtr;
                        } else {
                            throwBindingError("Cannot convert argument of type " + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + " to parameter type " + this.name);
                        }
                        break;
                    case 1:
                        ptr = handle.$$.smartPtr;
                        break;
                    case 2:
                        if (handle.$$.smartPtrType === this) {
                            ptr = handle.$$.smartPtr;
                        } else {
                            var clonedHandle = handle["clone"]();
                            ptr = this.rawShare(
                                ptr,
                                __emval_register(function () {
                                    clonedHandle["delete"]();
                                })
                            );
                            if (destructors !== null) {
                                destructors.push(this.rawDestructor, ptr);
                            }
                        }
                        break;
                    default:
                        throwBindingError("Unsupporting sharing policy");
                }
            }
            return ptr;
        }
        function nonConstNoSmartPtrRawPointerToWireType(destructors, handle) {
            if (handle === null) {
                if (this.isReference) {
                    throwBindingError("null is not a valid " + this.name);
                }
                return 0;
            }
            if (!handle.$$) {
                throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
            }
            if (!handle.$$.ptr) {
                throwBindingError("Cannot pass deleted object as a pointer of type " + this.name);
            }
            if (handle.$$.ptrType.isConst) {
                throwBindingError("Cannot convert argument of type " + handle.$$.ptrType.name + " to parameter type " + this.name);
            }
            var handleClass = handle.$$.ptrType.registeredClass;
            var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
            return ptr;
        }
        function RegisteredPointer_getPointee(ptr) {
            if (this.rawGetPointee) {
                ptr = this.rawGetPointee(ptr);
            }
            return ptr;
        }
        function RegisteredPointer_destructor(ptr) {
            if (this.rawDestructor) {
                this.rawDestructor(ptr);
            }
        }
        function RegisteredPointer_deleteObject(handle) {
            if (handle !== null) {
                handle["delete"]();
            }
        }
        function downcastPointer(ptr, ptrClass, desiredClass) {
            if (ptrClass === desiredClass) {
                return ptr;
            }
            if (undefined === desiredClass.baseClass) {
                return null;
            }
            var rv = downcastPointer(ptr, ptrClass, desiredClass.baseClass);
            if (rv === null) {
                return null;
            }
            return desiredClass.downcast(rv);
        }
        function getInheritedInstanceCount() {
            return Object.keys(registeredInstances).length;
        }
        function getLiveInheritedInstances() {
            var rv = [];
            for (var k in registeredInstances) {
                if (registeredInstances.hasOwnProperty(k)) {
                    rv.push(registeredInstances[k]);
                }
            }
            return rv;
        }
        function setDelayFunction(fn) {
            delayFunction = fn;
            if (deletionQueue.length && delayFunction) {
                delayFunction(flushPendingDeletes);
            }
        }
        function init_embind() {
            Module["getInheritedInstanceCount"] = getInheritedInstanceCount;
            Module["getLiveInheritedInstances"] = getLiveInheritedInstances;
            Module["flushPendingDeletes"] = flushPendingDeletes;
            Module["setDelayFunction"] = setDelayFunction;
        }
        var registeredInstances = {};
        function getBasestPointer(class_, ptr) {
            if (ptr === undefined) {
                throwBindingError("ptr should not be undefined");
            }
            while (class_.baseClass) {
                ptr = class_.upcast(ptr);
                class_ = class_.baseClass;
            }
            return ptr;
        }
        function getInheritedInstance(class_, ptr) {
            ptr = getBasestPointer(class_, ptr);
            return registeredInstances[ptr];
        }
        function makeClassHandle(prototype, record) {
            if (!record.ptrType || !record.ptr) {
                throwInternalError("makeClassHandle requires ptr and ptrType");
            }
            var hasSmartPtrType = !!record.smartPtrType;
            var hasSmartPtr = !!record.smartPtr;
            if (hasSmartPtrType !== hasSmartPtr) {
                throwInternalError("Both smartPtrType and smartPtr must be specified");
            }
            record.count = { value: 1 };
            return attachFinalizer(Object.create(prototype, { $$: { value: record } }));
        }
        function RegisteredPointer_fromWireType(ptr) {
            var rawPointer = this.getPointee(ptr);
            if (!rawPointer) {
                this.destructor(ptr);
                return null;
            }
            var registeredInstance = getInheritedInstance(this.registeredClass, rawPointer);
            if (undefined !== registeredInstance) {
                if (0 === registeredInstance.$$.count.value) {
                    registeredInstance.$$.ptr = rawPointer;
                    registeredInstance.$$.smartPtr = ptr;
                    return registeredInstance["clone"]();
                } else {
                    var rv = registeredInstance["clone"]();
                    this.destructor(ptr);
                    return rv;
                }
            }
            function makeDefaultHandle() {
                if (this.isSmartPointer) {
                    return makeClassHandle(this.registeredClass.instancePrototype, { ptrType: this.pointeeType, ptr: rawPointer, smartPtrType: this, smartPtr: ptr });
                } else {
                    return makeClassHandle(this.registeredClass.instancePrototype, { ptrType: this, ptr: ptr });
                }
            }
            var actualType = this.registeredClass.getActualType(rawPointer);
            var registeredPointerRecord = registeredPointers[actualType];
            if (!registeredPointerRecord) {
                return makeDefaultHandle.call(this);
            }
            var toType;
            if (this.isConst) {
                toType = registeredPointerRecord.constPointerType;
            } else {
                toType = registeredPointerRecord.pointerType;
            }
            var dp = downcastPointer(rawPointer, this.registeredClass, toType.registeredClass);
            if (dp === null) {
                return makeDefaultHandle.call(this);
            }
            if (this.isSmartPointer) {
                return makeClassHandle(toType.registeredClass.instancePrototype, { ptrType: toType, ptr: dp, smartPtrType: this, smartPtr: ptr });
            } else {
                return makeClassHandle(toType.registeredClass.instancePrototype, { ptrType: toType, ptr: dp });
            }
        }
        function init_RegisteredPointer() {
            RegisteredPointer.prototype.getPointee = RegisteredPointer_getPointee;
            RegisteredPointer.prototype.destructor = RegisteredPointer_destructor;
            RegisteredPointer.prototype["argPackAdvance"] = 8;
            RegisteredPointer.prototype["readValueFromPointer"] = simpleReadValueFromPointer;
            RegisteredPointer.prototype["deleteObject"] = RegisteredPointer_deleteObject;
            RegisteredPointer.prototype["fromWireType"] = RegisteredPointer_fromWireType;
        }
        function RegisteredPointer(name, registeredClass, isReference, isConst, isSmartPointer, pointeeType, sharingPolicy, rawGetPointee, rawConstructor, rawShare, rawDestructor) {
            this.name = name;
            this.registeredClass = registeredClass;
            this.isReference = isReference;
            this.isConst = isConst;
            this.isSmartPointer = isSmartPointer;
            this.pointeeType = pointeeType;
            this.sharingPolicy = sharingPolicy;
            this.rawGetPointee = rawGetPointee;
            this.rawConstructor = rawConstructor;
            this.rawShare = rawShare;
            this.rawDestructor = rawDestructor;
            if (!isSmartPointer && registeredClass.baseClass === undefined) {
                if (isConst) {
                    this["toWireType"] = constNoSmartPtrRawPointerToWireType;
                    this.destructorFunction = null;
                } else {
                    this["toWireType"] = nonConstNoSmartPtrRawPointerToWireType;
                    this.destructorFunction = null;
                }
            } else {
                this["toWireType"] = genericPointerToWireType;
            }
        }
        function replacePublicSymbol(name, value, numArguments) {
            if (!Module.hasOwnProperty(name)) {
                throwInternalError("Replacing nonexistant public symbol");
            }
            if (undefined !== Module[name].overloadTable && undefined !== numArguments) {
                Module[name].overloadTable[numArguments] = value;
            } else {
                Module[name] = value;
                Module[name].argCount = numArguments;
            }
        }
        function embind__requireFunction(signature, rawFunction) {
            signature = readLatin1String(signature);
            function makeDynCaller(dynCall) {
                var args = [];
                for (var i = 1; i < signature.length; ++i) {
                    args.push("a" + i);
                }
                var name = "dynCall_" + signature + "_" + rawFunction;
                var body = "return function " + name + "(" + args.join(", ") + ") {\n";
                body += "    return dynCall(rawFunction" + (args.length ? ", " : "") + args.join(", ") + ");\n";
                body += "};\n";
                return new Function("dynCall", "rawFunction", body)(dynCall, rawFunction);
            }
            var fp;
            if (Module["FUNCTION_TABLE_" + signature] !== undefined) {
                fp = Module["FUNCTION_TABLE_" + signature][rawFunction];
            } else if (typeof FUNCTION_TABLE !== "undefined") {
                fp = FUNCTION_TABLE[rawFunction];
            } else {
                var dc = Module["dynCall_" + signature];
                if (dc === undefined) {
                    dc = Module["dynCall_" + signature.replace(/f/g, "d")];
                    if (dc === undefined) {
                        throwBindingError("No dynCall invoker for signature: " + signature);
                    }
                }
                fp = makeDynCaller(dc);
            }
            if (typeof fp !== "function") {
                throwBindingError("unknown function pointer with signature " + signature + ": " + rawFunction);
            }
            return fp;
        }
        var UnboundTypeError = undefined;
        function getTypeName(type) {
            var ptr = ___getTypeName(type);
            var rv = readLatin1String(ptr);
            _free(ptr);
            return rv;
        }
        function throwUnboundTypeError(message, types) {
            var unboundTypes = [];
            var seen = {};
            function visit(type) {
                if (seen[type]) {
                    return;
                }
                if (registeredTypes[type]) {
                    return;
                }
                if (typeDependencies[type]) {
                    typeDependencies[type].forEach(visit);
                    return;
                }
                unboundTypes.push(type);
                seen[type] = true;
            }
            types.forEach(visit);
            throw new UnboundTypeError(message + ": " + unboundTypes.map(getTypeName).join([", "]));
        }
        function __embind_register_class(
            rawType,
            rawPointerType,
            rawConstPointerType,
            baseClassRawType,
            getActualTypeSignature,
            getActualType,
            upcastSignature,
            upcast,
            downcastSignature,
            downcast,
            name,
            destructorSignature,
            rawDestructor
        ) {
            name = readLatin1String(name);
            getActualType = embind__requireFunction(getActualTypeSignature, getActualType);
            if (upcast) {
                upcast = embind__requireFunction(upcastSignature, upcast);
            }
            if (downcast) {
                downcast = embind__requireFunction(downcastSignature, downcast);
            }
            rawDestructor = embind__requireFunction(destructorSignature, rawDestructor);
            var legalFunctionName = makeLegalFunctionName(name);
            exposePublicSymbol(legalFunctionName, function () {
                throwUnboundTypeError("Cannot construct " + name + " due to unbound types", [baseClassRawType]);
            });
            whenDependentTypesAreResolved([rawType, rawPointerType, rawConstPointerType], baseClassRawType ? [baseClassRawType] : [], function (base) {
                base = base[0];
                var baseClass;
                var basePrototype;
                if (baseClassRawType) {
                    baseClass = base.registeredClass;
                    basePrototype = baseClass.instancePrototype;
                } else {
                    basePrototype = ClassHandle.prototype;
                }
                var constructor = createNamedFunction(legalFunctionName, function () {
                    if (Object.getPrototypeOf(this) !== instancePrototype) {
                        throw new BindingError("Use 'new' to construct " + name);
                    }
                    if (undefined === registeredClass.constructor_body) {
                        throw new BindingError(name + " has no accessible constructor");
                    }
                    var body = registeredClass.constructor_body[arguments.length];
                    if (undefined === body) {
                        throw new BindingError(
                            "Tried to invoke ctor of " + name + " with invalid number of parameters (" + arguments.length + ") - expected (" + Object.keys(registeredClass.constructor_body).toString() + ") parameters instead!"
                        );
                    }
                    return body.apply(this, arguments);
                });
                var instancePrototype = Object.create(basePrototype, { constructor: { value: constructor } });
                constructor.prototype = instancePrototype;
                var registeredClass = new RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast);
                var referenceConverter = new RegisteredPointer(name, registeredClass, true, false, false);
                var pointerConverter = new RegisteredPointer(name + "*", registeredClass, false, false, false);
                var constPointerConverter = new RegisteredPointer(name + " const*", registeredClass, false, true, false);
                registeredPointers[rawType] = { pointerType: pointerConverter, constPointerType: constPointerConverter };
                replacePublicSymbol(legalFunctionName, constructor);
                return [referenceConverter, pointerConverter, constPointerConverter];
            });
        }
        function heap32VectorToArray(count, firstElement) {
            var array = [];
            for (var i = 0; i < count; i++) {
                array.push(HEAP32[(firstElement >> 2) + i]);
            }
            return array;
        }
        function __embind_register_class_constructor(rawClassType, argCount, rawArgTypesAddr, invokerSignature, invoker, rawConstructor) {
            var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
            invoker = embind__requireFunction(invokerSignature, invoker);
            whenDependentTypesAreResolved([], [rawClassType], function (classType) {
                classType = classType[0];
                var humanName = "constructor " + classType.name;
                if (undefined === classType.registeredClass.constructor_body) {
                    classType.registeredClass.constructor_body = [];
                }
                if (undefined !== classType.registeredClass.constructor_body[argCount - 1]) {
                    throw new BindingError(
                        "Cannot register multiple constructors with identical number of parameters (" +
                            (argCount - 1) +
                            ") for class '" +
                            classType.name +
                            "'! Overload resolution is currently only performed using the parameter count, not actual type info!"
                    );
                }
                classType.registeredClass.constructor_body[argCount - 1] = function unboundTypeHandler() {
                    throwUnboundTypeError("Cannot construct " + classType.name + " due to unbound types", rawArgTypes);
                };
                whenDependentTypesAreResolved([], rawArgTypes, function (argTypes) {
                    classType.registeredClass.constructor_body[argCount - 1] = function constructor_body() {
                        if (arguments.length !== argCount - 1) {
                            throwBindingError(humanName + " called with " + arguments.length + " arguments, expected " + (argCount - 1));
                        }
                        var destructors = [];
                        var args = new Array(argCount);
                        args[0] = rawConstructor;
                        for (var i = 1; i < argCount; ++i) {
                            args[i] = argTypes[i]["toWireType"](destructors, arguments[i - 1]);
                        }
                        var ptr = invoker.apply(null, args);
                        runDestructors(destructors);
                        return argTypes[0]["fromWireType"](ptr);
                    };
                    return [];
                });
                return [];
            });
        }
        function new_(constructor, argumentList) {
            if (!(constructor instanceof Function)) {
                throw new TypeError("new_ called with constructor type " + typeof constructor + " which is not a function");
            }
            var dummy = createNamedFunction(constructor.name || "unknownFunctionName", function () {});
            dummy.prototype = constructor.prototype;
            var obj = new dummy();
            var r = constructor.apply(obj, argumentList);
            return r instanceof Object ? r : obj;
        }
        function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc) {
            var argCount = argTypes.length;
            if (argCount < 2) {
                throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!");
            }
            var isClassMethodFunc = argTypes[1] !== null && classType !== null;
            var needsDestructorStack = false;
            for (var i = 1; i < argTypes.length; ++i) {
                if (argTypes[i] !== null && argTypes[i].destructorFunction === undefined) {
                    needsDestructorStack = true;
                    break;
                }
            }
            var returns = argTypes[0].name !== "void";
            var argsList = "";
            var argsListWired = "";
            for (var i = 0; i < argCount - 2; ++i) {
                argsList += (i !== 0 ? ", " : "") + "arg" + i;
                argsListWired += (i !== 0 ? ", " : "") + "arg" + i + "Wired";
            }
            var invokerFnBody =
                "return function " +
                makeLegalFunctionName(humanName) +
                "(" +
                argsList +
                ") {\n" +
                "if (arguments.length !== " +
                (argCount - 2) +
                ") {\n" +
                "throwBindingError('function " +
                humanName +
                " called with ' + arguments.length + ' arguments, expected " +
                (argCount - 2) +
                " args!');\n" +
                "}\n";
            if (needsDestructorStack) {
                invokerFnBody += "var destructors = [];\n";
            }
            var dtorStack = needsDestructorStack ? "destructors" : "null";
            var args1 = ["throwBindingError", "invoker", "fn", "runDestructors", "retType", "classParam"];
            var args2 = [throwBindingError, cppInvokerFunc, cppTargetFunc, runDestructors, argTypes[0], argTypes[1]];
            if (isClassMethodFunc) {
                invokerFnBody += "var thisWired = classParam.toWireType(" + dtorStack + ", this);\n";
            }
            for (var i = 0; i < argCount - 2; ++i) {
                invokerFnBody += "var arg" + i + "Wired = argType" + i + ".toWireType(" + dtorStack + ", arg" + i + "); // " + argTypes[i + 2].name + "\n";
                args1.push("argType" + i);
                args2.push(argTypes[i + 2]);
            }
            if (isClassMethodFunc) {
                argsListWired = "thisWired" + (argsListWired.length > 0 ? ", " : "") + argsListWired;
            }
            invokerFnBody += (returns ? "var rv = " : "") + "invoker(fn" + (argsListWired.length > 0 ? ", " : "") + argsListWired + ");\n";
            if (needsDestructorStack) {
                invokerFnBody += "runDestructors(destructors);\n";
            } else {
                for (var i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) {
                    var paramName = i === 1 ? "thisWired" : "arg" + (i - 2) + "Wired";
                    if (argTypes[i].destructorFunction !== null) {
                        invokerFnBody += paramName + "_dtor(" + paramName + "); // " + argTypes[i].name + "\n";
                        args1.push(paramName + "_dtor");
                        args2.push(argTypes[i].destructorFunction);
                    }
                }
            }
            if (returns) {
                invokerFnBody += "var ret = retType.fromWireType(rv);\n" + "return ret;\n";
            } else {
            }
            invokerFnBody += "}\n";
            args1.push(invokerFnBody);
            var invokerFunction = new_(Function, args1).apply(null, args2);
            return invokerFunction;
        }
        function __embind_register_class_function(rawClassType, methodName, argCount, rawArgTypesAddr, invokerSignature, rawInvoker, context, isPureVirtual) {
            var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
            methodName = readLatin1String(methodName);
            rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
            whenDependentTypesAreResolved([], [rawClassType], function (classType) {
                classType = classType[0];
                var humanName = classType.name + "." + methodName;
                if (isPureVirtual) {
                    classType.registeredClass.pureVirtualFunctions.push(methodName);
                }
                function unboundTypesHandler() {
                    throwUnboundTypeError("Cannot call " + humanName + " due to unbound types", rawArgTypes);
                }
                var proto = classType.registeredClass.instancePrototype;
                var method = proto[methodName];
                if (undefined === method || (undefined === method.overloadTable && method.className !== classType.name && method.argCount === argCount - 2)) {
                    unboundTypesHandler.argCount = argCount - 2;
                    unboundTypesHandler.className = classType.name;
                    proto[methodName] = unboundTypesHandler;
                } else {
                    ensureOverloadTable(proto, methodName, humanName);
                    proto[methodName].overloadTable[argCount - 2] = unboundTypesHandler;
                }
                whenDependentTypesAreResolved([], rawArgTypes, function (argTypes) {
                    var memberFunction = craftInvokerFunction(humanName, argTypes, classType, rawInvoker, context);
                    if (undefined === proto[methodName].overloadTable) {
                        memberFunction.argCount = argCount - 2;
                        proto[methodName] = memberFunction;
                    } else {
                        proto[methodName].overloadTable[argCount - 2] = memberFunction;
                    }
                    return [];
                });
                return [];
            });
        }
        function validateThis(this_, classType, humanName) {
            if (!(this_ instanceof Object)) {
                throwBindingError(humanName + ' with invalid "this": ' + this_);
            }
            if (!(this_ instanceof classType.registeredClass.constructor)) {
                throwBindingError(humanName + ' incompatible with "this" of type ' + this_.constructor.name);
            }
            if (!this_.$$.ptr) {
                throwBindingError("cannot call emscripten binding method " + humanName + " on deleted object");
            }
            return upcastPointer(this_.$$.ptr, this_.$$.ptrType.registeredClass, classType.registeredClass);
        }
        function __embind_register_class_property(classType, fieldName, getterReturnType, getterSignature, getter, getterContext, setterArgumentType, setterSignature, setter, setterContext) {
            fieldName = readLatin1String(fieldName);
            getter = embind__requireFunction(getterSignature, getter);
            whenDependentTypesAreResolved([], [classType], function (classType) {
                classType = classType[0];
                var humanName = classType.name + "." + fieldName;
                var desc = {
                    get: function () {
                        throwUnboundTypeError("Cannot access " + humanName + " due to unbound types", [getterReturnType, setterArgumentType]);
                    },
                    enumerable: true,
                    configurable: true,
                };
                if (setter) {
                    desc.set = function () {
                        throwUnboundTypeError("Cannot access " + humanName + " due to unbound types", [getterReturnType, setterArgumentType]);
                    };
                } else {
                    desc.set = function (v) {
                        throwBindingError(humanName + " is a read-only property");
                    };
                }
                Object.defineProperty(classType.registeredClass.instancePrototype, fieldName, desc);
                whenDependentTypesAreResolved([], setter ? [getterReturnType, setterArgumentType] : [getterReturnType], function (types) {
                    var getterReturnType = types[0];
                    var desc = {
                        get: function () {
                            var ptr = validateThis(this, classType, humanName + " getter");
                            return getterReturnType["fromWireType"](getter(getterContext, ptr));
                        },
                        enumerable: true,
                    };
                    if (setter) {
                        setter = embind__requireFunction(setterSignature, setter);
                        var setterArgumentType = types[1];
                        desc.set = function (v) {
                            var ptr = validateThis(this, classType, humanName + " setter");
                            var destructors = [];
                            setter(setterContext, ptr, setterArgumentType["toWireType"](destructors, v));
                            runDestructors(destructors);
                        };
                    }
                    Object.defineProperty(classType.registeredClass.instancePrototype, fieldName, desc);
                    return [];
                });
                return [];
            });
        }
        var emval_free_list = [];
        var emval_handle_array = [{}, { value: undefined }, { value: null }, { value: true }, { value: false }];
        function __emval_decref(handle) {
            if (handle > 4 && 0 === --emval_handle_array[handle].refcount) {
                emval_handle_array[handle] = undefined;
                emval_free_list.push(handle);
            }
        }
        function count_emval_handles() {
            var count = 0;
            for (var i = 5; i < emval_handle_array.length; ++i) {
                if (emval_handle_array[i] !== undefined) {
                    ++count;
                }
            }
            return count;
        }
        function get_first_emval() {
            for (var i = 5; i < emval_handle_array.length; ++i) {
                if (emval_handle_array[i] !== undefined) {
                    return emval_handle_array[i];
                }
            }
            return null;
        }
        function init_emval() {
            Module["count_emval_handles"] = count_emval_handles;
            Module["get_first_emval"] = get_first_emval;
        }
        function __emval_register(value) {
            switch (value) {
                case undefined: {
                    return 1;
                }
                case null: {
                    return 2;
                }
                case true: {
                    return 3;
                }
                case false: {
                    return 4;
                }
                default: {
                    var handle = emval_free_list.length ? emval_free_list.pop() : emval_handle_array.length;
                    emval_handle_array[handle] = { refcount: 1, value: value };
                    return handle;
                }
            }
        }
        function __embind_register_emval(rawType, name) {
            name = readLatin1String(name);
            registerType(rawType, {
                name: name,
                fromWireType: function (handle) {
                    var rv = emval_handle_array[handle].value;
                    __emval_decref(handle);
                    return rv;
                },
                toWireType: function (destructors, value) {
                    return __emval_register(value);
                },
                argPackAdvance: 8,
                readValueFromPointer: simpleReadValueFromPointer,
                destructorFunction: null,
            });
        }
        function enumReadValueFromPointer(name, shift, signed) {
            switch (shift) {
                case 0:
                    return function (pointer) {
                        var heap = signed ? HEAP8 : HEAPU8;
                        return this["fromWireType"](heap[pointer]);
                    };
                case 1:
                    return function (pointer) {
                        var heap = signed ? HEAP16 : HEAPU16;
                        return this["fromWireType"](heap[pointer >> 1]);
                    };
                case 2:
                    return function (pointer) {
                        var heap = signed ? HEAP32 : HEAPU32;
                        return this["fromWireType"](heap[pointer >> 2]);
                    };
                default:
                    throw new TypeError("Unknown integer type: " + name);
            }
        }
        function __embind_register_enum(rawType, name, size, isSigned) {
            var shift = getShiftFromSize(size);
            name = readLatin1String(name);
            function ctor() {}
            ctor.values = {};
            registerType(rawType, {
                name: name,
                constructor: ctor,
                fromWireType: function (c) {
                    return this.constructor.values[c];
                },
                toWireType: function (destructors, c) {
                    return c.value;
                },
                argPackAdvance: 8,
                readValueFromPointer: enumReadValueFromPointer(name, shift, isSigned),
                destructorFunction: null,
            });
            exposePublicSymbol(name, ctor);
        }
        function requireRegisteredType(rawType, humanName) {
            var impl = registeredTypes[rawType];
            if (undefined === impl) {
                throwBindingError(humanName + " has unknown type " + getTypeName(rawType));
            }
            return impl;
        }
        function __embind_register_enum_value(rawEnumType, name, enumValue) {
            var enumType = requireRegisteredType(rawEnumType, "enum");
            name = readLatin1String(name);
            var Enum = enumType.constructor;
            var Value = Object.create(enumType.constructor.prototype, { value: { value: enumValue }, constructor: { value: createNamedFunction(enumType.name + "_" + name, function () {}) } });
            Enum.values[enumValue] = Value;
            Enum[name] = Value;
        }
        function _embind_repr(v) {
            if (v === null) {
                return "null";
            }
            var t = typeof v;
            if (t === "object" || t === "array" || t === "function") {
                return v.toString();
            } else {
                return "" + v;
            }
        }
        function floatReadValueFromPointer(name, shift) {
            switch (shift) {
                case 2:
                    return function (pointer) {
                        return this["fromWireType"](HEAPF32[pointer >> 2]);
                    };
                case 3:
                    return function (pointer) {
                        return this["fromWireType"](HEAPF64[pointer >> 3]);
                    };
                default:
                    throw new TypeError("Unknown float type: " + name);
            }
        }
        function __embind_register_float(rawType, name, size) {
            var shift = getShiftFromSize(size);
            name = readLatin1String(name);
            registerType(rawType, {
                name: name,
                fromWireType: function (value) {
                    return value;
                },
                toWireType: function (destructors, value) {
                    if (typeof value !== "number" && typeof value !== "boolean") {
                        throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
                    }
                    return value;
                },
                argPackAdvance: 8,
                readValueFromPointer: floatReadValueFromPointer(name, shift),
                destructorFunction: null,
            });
        }
        function integerReadValueFromPointer(name, shift, signed) {
            switch (shift) {
                case 0:
                    return signed
                        ? function readS8FromPointer(pointer) {
                              return HEAP8[pointer];
                          }
                        : function readU8FromPointer(pointer) {
                              return HEAPU8[pointer];
                          };
                case 1:
                    return signed
                        ? function readS16FromPointer(pointer) {
                              return HEAP16[pointer >> 1];
                          }
                        : function readU16FromPointer(pointer) {
                              return HEAPU16[pointer >> 1];
                          };
                case 2:
                    return signed
                        ? function readS32FromPointer(pointer) {
                              return HEAP32[pointer >> 2];
                          }
                        : function readU32FromPointer(pointer) {
                              return HEAPU32[pointer >> 2];
                          };
                default:
                    throw new TypeError("Unknown integer type: " + name);
            }
        }
        function __embind_register_integer(primitiveType, name, size, minRange, maxRange) {
            name = readLatin1String(name);
            if (maxRange === -1) {
                maxRange = 4294967295;
            }
            var shift = getShiftFromSize(size);
            var fromWireType = function (value) {
                return value;
            };
            if (minRange === 0) {
                var bitshift = 32 - 8 * size;
                fromWireType = function (value) {
                    return (value << bitshift) >>> bitshift;
                };
            }
            var isUnsignedType = name.indexOf("unsigned") != -1;
            registerType(primitiveType, {
                name: name,
                fromWireType: fromWireType,
                toWireType: function (destructors, value) {
                    if (typeof value !== "number" && typeof value !== "boolean") {
                        throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
                    }
                    if (value < minRange || value > maxRange) {
                        throw new TypeError('Passing a number "' + _embind_repr(value) + '" from JS side to C/C++ side to an argument of type "' + name + '", which is outside the valid range [' + minRange + ", " + maxRange + "]!");
                    }
                    return isUnsignedType ? value >>> 0 : value | 0;
                },
                argPackAdvance: 8,
                readValueFromPointer: integerReadValueFromPointer(name, shift, minRange !== 0),
                destructorFunction: null,
            });
        }
        function __embind_register_memory_view(rawType, dataTypeIndex, name) {
            var typeMapping = [Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array];
            var TA = typeMapping[dataTypeIndex];
            function decodeMemoryView(handle) {
                handle = handle >> 2;
                var heap = HEAPU32;
                var size = heap[handle];
                var data = heap[handle + 1];
                return new TA(heap["buffer"], data, size);
            }
            name = readLatin1String(name);
            registerType(rawType, { name: name, fromWireType: decodeMemoryView, argPackAdvance: 8, readValueFromPointer: decodeMemoryView }, { ignoreDuplicateRegistrations: true });
        }
        function __embind_register_std_string(rawType, name) {
            name = readLatin1String(name);
            var stdStringIsUTF8 = name === "std::string";
            registerType(rawType, {
                name: name,
                fromWireType: function (value) {
                    var length = HEAPU32[value >> 2];
                    var str;
                    if (stdStringIsUTF8) {
                        var endChar = HEAPU8[value + 4 + length];
                        var endCharSwap = 0;
                        if (endChar != 0) {
                            endCharSwap = endChar;
                            HEAPU8[value + 4 + length] = 0;
                        }
                        var decodeStartPtr = value + 4;
                        for (var i = 0; i <= length; ++i) {
                            var currentBytePtr = value + 4 + i;
                            if (HEAPU8[currentBytePtr] == 0) {
                                var stringSegment = UTF8ToString(decodeStartPtr);
                                if (str === undefined) str = stringSegment;
                                else {
                                    str += String.fromCharCode(0);
                                    str += stringSegment;
                                }
                                decodeStartPtr = currentBytePtr + 1;
                            }
                        }
                        if (endCharSwap != 0) HEAPU8[value + 4 + length] = endCharSwap;
                    } else {
                        var a = new Array(length);
                        for (var i = 0; i < length; ++i) {
                            a[i] = String.fromCharCode(HEAPU8[value + 4 + i]);
                        }
                        str = a.join("");
                    }
                    _free(value);
                    return str;
                },
                toWireType: function (destructors, value) {
                    if (value instanceof ArrayBuffer) {
                        value = new Uint8Array(value);
                    }
                    var getLength;
                    var valueIsOfTypeString = typeof value === "string";
                    if (!(valueIsOfTypeString || value instanceof Uint8Array || value instanceof Uint8ClampedArray || value instanceof Int8Array)) {
                        throwBindingError("Cannot pass non-string to std::string");
                    }
                    if (stdStringIsUTF8 && valueIsOfTypeString) {
                        getLength = function () {
                            return lengthBytesUTF8(value);
                        };
                    } else {
                        getLength = function () {
                            return value.length;
                        };
                    }
                    var length = getLength();
                    var ptr = _malloc(4 + length + 1);
                    HEAPU32[ptr >> 2] = length;
                    if (stdStringIsUTF8 && valueIsOfTypeString) {
                        stringToUTF8(value, ptr + 4, length + 1);
                    } else {
                        if (valueIsOfTypeString) {
                            for (var i = 0; i < length; ++i) {
                                var charCode = value.charCodeAt(i);
                                if (charCode > 255) {
                                    _free(ptr);
                                    throwBindingError("String has UTF-16 code units that do not fit in 8 bits");
                                }
                                HEAPU8[ptr + 4 + i] = charCode;
                            }
                        } else {
                            for (var i = 0; i < length; ++i) {
                                HEAPU8[ptr + 4 + i] = value[i];
                            }
                        }
                    }
                    if (destructors !== null) {
                        destructors.push(_free, ptr);
                    }
                    return ptr;
                },
                argPackAdvance: 8,
                readValueFromPointer: simpleReadValueFromPointer,
                destructorFunction: function (ptr) {
                    _free(ptr);
                },
            });
        }
        function __embind_register_std_wstring(rawType, charSize, name) {
            name = readLatin1String(name);
            var getHeap, shift;
            if (charSize === 2) {
                getHeap = function () {
                    return HEAPU16;
                };
                shift = 1;
            } else if (charSize === 4) {
                getHeap = function () {
                    return HEAPU32;
                };
                shift = 2;
            }
            registerType(rawType, {
                name: name,
                fromWireType: function (value) {
                    var HEAP = getHeap();
                    var length = HEAPU32[value >> 2];
                    var a = new Array(length);
                    var start = (value + 4) >> shift;
                    for (var i = 0; i < length; ++i) {
                        a[i] = String.fromCharCode(HEAP[start + i]);
                    }
                    _free(value);
                    return a.join("");
                },
                toWireType: function (destructors, value) {
                    var HEAP = getHeap();
                    var length = value.length;
                    var ptr = _malloc(4 + length * charSize);
                    HEAPU32[ptr >> 2] = length;
                    var start = (ptr + 4) >> shift;
                    for (var i = 0; i < length; ++i) {
                        HEAP[start + i] = value.charCodeAt(i);
                    }
                    if (destructors !== null) {
                        destructors.push(_free, ptr);
                    }
                    return ptr;
                },
                argPackAdvance: 8,
                readValueFromPointer: simpleReadValueFromPointer,
                destructorFunction: function (ptr) {
                    _free(ptr);
                },
            });
        }
        function __embind_register_value_object(rawType, name, constructorSignature, rawConstructor, destructorSignature, rawDestructor) {
            structRegistrations[rawType] = {
                name: readLatin1String(name),
                rawConstructor: embind__requireFunction(constructorSignature, rawConstructor),
                rawDestructor: embind__requireFunction(destructorSignature, rawDestructor),
                fields: [],
            };
        }
        function __embind_register_value_object_field(structType, fieldName, getterReturnType, getterSignature, getter, getterContext, setterArgumentType, setterSignature, setter, setterContext) {
            structRegistrations[structType].fields.push({
                fieldName: readLatin1String(fieldName),
                getterReturnType: getterReturnType,
                getter: embind__requireFunction(getterSignature, getter),
                getterContext: getterContext,
                setterArgumentType: setterArgumentType,
                setter: embind__requireFunction(setterSignature, setter),
                setterContext: setterContext,
            });
        }
        function __embind_register_void(rawType, name) {
            name = readLatin1String(name);
            registerType(rawType, {
                isVoid: true,
                name: name,
                argPackAdvance: 0,
                fromWireType: function () {
                    return undefined;
                },
                toWireType: function (destructors, o) {
                    return undefined;
                },
            });
        }
        function requireHandle(handle) {
            if (!handle) {
                throwBindingError("Cannot use deleted val. handle = " + handle);
            }
            return emval_handle_array[handle].value;
        }
        function __emval_as(handle, returnType, destructorsRef) {
            handle = requireHandle(handle);
            returnType = requireRegisteredType(returnType, "emval::as");
            var destructors = [];
            var rd = __emval_register(destructors);
            HEAP32[destructorsRef >> 2] = rd;
            return returnType["toWireType"](destructors, handle);
        }
        var emval_symbols = {};
        function getStringOrSymbol(address) {
            var symbol = emval_symbols[address];
            if (symbol === undefined) {
                return readLatin1String(address);
            } else {
                return symbol;
            }
        }
        var emval_methodCallers = [];
        function __emval_call_void_method(caller, handle, methodName, args) {
            caller = emval_methodCallers[caller];
            handle = requireHandle(handle);
            methodName = getStringOrSymbol(methodName);
            caller(handle, methodName, null, args);
        }
        function __emval_addMethodCaller(caller) {
            var id = emval_methodCallers.length;
            emval_methodCallers.push(caller);
            return id;
        }
        function __emval_lookupTypes(argCount, argTypes, argWireTypes) {
            var a = new Array(argCount);
            for (var i = 0; i < argCount; ++i) {
                a[i] = requireRegisteredType(HEAP32[(argTypes >> 2) + i], "parameter " + i);
            }
            return a;
        }
        function __emval_get_method_caller(argCount, argTypes) {
            var types = __emval_lookupTypes(argCount, argTypes);
            var retType = types[0];
            var signatureName =
                retType.name +
                "_$" +
                types
                    .slice(1)
                    .map(function (t) {
                        return t.name;
                    })
                    .join("_") +
                "$";
            var params = ["retType"];
            var args = [retType];
            var argsList = "";
            for (var i = 0; i < argCount - 1; ++i) {
                argsList += (i !== 0 ? ", " : "") + "arg" + i;
                params.push("argType" + i);
                args.push(types[1 + i]);
            }
            var functionName = makeLegalFunctionName("methodCaller_" + signatureName);
            var functionBody = "return function " + functionName + "(handle, name, destructors, args) {\n";
            var offset = 0;
            for (var i = 0; i < argCount - 1; ++i) {
                functionBody += "    var arg" + i + " = argType" + i + ".readValueFromPointer(args" + (offset ? "+" + offset : "") + ");\n";
                offset += types[i + 1]["argPackAdvance"];
            }
            functionBody += "    var rv = handle[name](" + argsList + ");\n";
            for (var i = 0; i < argCount - 1; ++i) {
                if (types[i + 1]["deleteObject"]) {
                    functionBody += "    argType" + i + ".deleteObject(arg" + i + ");\n";
                }
            }
            if (!retType.isVoid) {
                functionBody += "    return retType.toWireType(destructors, rv);\n";
            }
            functionBody += "};\n";
            params.push(functionBody);
            var invokerFunction = new_(Function, params).apply(null, args);
            return __emval_addMethodCaller(invokerFunction);
        }
        function __emval_get_module_property(name) {
            name = getStringOrSymbol(name);
            return __emval_register(Module[name]);
        }
        function __emval_get_property(handle, key) {
            handle = requireHandle(handle);
            key = requireHandle(key);
            return __emval_register(handle[key]);
        }
        function __emval_incref(handle) {
            if (handle > 4) {
                emval_handle_array[handle].refcount += 1;
            }
        }
        function craftEmvalAllocator(argCount) {
            var argsList = "";
            for (var i = 0; i < argCount; ++i) {
                argsList += (i !== 0 ? ", " : "") + "arg" + i;
            }
            var functionBody = "return function emval_allocator_" + argCount + "(constructor, argTypes, args) {\n";
            for (var i = 0; i < argCount; ++i) {
                functionBody +=
                    "var argType" +
                    i +
                    " = requireRegisteredType(Module['HEAP32'][(argTypes >> 2) + " +
                    i +
                    '], "parameter ' +
                    i +
                    '");\n' +
                    "var arg" +
                    i +
                    " = argType" +
                    i +
                    ".readValueFromPointer(args);\n" +
                    "args += argType" +
                    i +
                    "['argPackAdvance'];\n";
            }
            functionBody += "var obj = new constructor(" + argsList + ");\n" + "return __emval_register(obj);\n" + "}\n";
            return new Function("requireRegisteredType", "Module", "__emval_register", functionBody)(requireRegisteredType, Module, __emval_register);
        }
        var emval_newers = {};
        function __emval_new(handle, argCount, argTypes, args) {
            handle = requireHandle(handle);
            var newer = emval_newers[argCount];
            if (!newer) {
                newer = craftEmvalAllocator(argCount);
                emval_newers[argCount] = newer;
            }
            return newer(handle, argTypes, args);
        }
        function __emval_new_cstring(v) {
            return __emval_register(getStringOrSymbol(v));
        }
        function __emval_new_object() {
            return __emval_register({});
        }
        function __emval_run_destructors(handle) {
            var destructors = emval_handle_array[handle].value;
            runDestructors(destructors);
            __emval_decref(handle);
        }
        function __emval_set_property(handle, key, value) {
            handle = requireHandle(handle);
            key = requireHandle(key);
            value = requireHandle(value);
            handle[key] = value;
        }
        function __emval_take_value(type, argv) {
            type = requireRegisteredType(type, "_emval_take_value");
            var v = type["readValueFromPointer"](argv);
            return __emval_register(v);
        }
        function _abort() {
            Module["abort"]();
        }
        function _emscripten_get_heap_size() {
            return HEAP8.length;
        }
        var GL = {
            counter: 1,
            lastError: 0,
            buffers: [],
            mappedBuffers: {},
            programs: [],
            framebuffers: [],
            renderbuffers: [],
            textures: [],
            uniforms: [],
            shaders: [],
            vaos: [],
            contexts: {},
            currentContext: null,
            offscreenCanvases: {},
            timerQueriesEXT: [],
            programInfos: {},
            stringCache: {},
            unpackAlignment: 4,
            init: function () {
                GL.miniTempBuffer = new Float32Array(GL.MINI_TEMP_BUFFER_SIZE);
                for (var i = 0; i < GL.MINI_TEMP_BUFFER_SIZE; i++) {
                    GL.miniTempBufferViews[i] = GL.miniTempBuffer.subarray(0, i + 1);
                }
            },
            recordError: function recordError(errorCode) {
                if (!GL.lastError) {
                    GL.lastError = errorCode;
                }
            },
            getNewId: function (table) {
                var ret = GL.counter++;
                for (var i = table.length; i < ret; i++) {
                    table[i] = null;
                }
                return ret;
            },
            MINI_TEMP_BUFFER_SIZE: 256,
            miniTempBuffer: null,
            miniTempBufferViews: [0],
            getSource: function (shader, count, string, length) {
                var source = "";
                for (var i = 0; i < count; ++i) {
                    var len = length ? HEAP32[(length + i * 4) >> 2] : -1;
                    source += UTF8ToString(HEAP32[(string + i * 4) >> 2], len < 0 ? undefined : len);
                }
                return source;
            },
            createContext: function (canvas, webGLContextAttributes) {
                if (Module["preinitializedWebGLContext"]) {
                    var ctx = Module["preinitializedWebGLContext"];
                    webGLContextAttributes.majorVersion = 1;
                } else {
                    var ctx = canvas.getContext("webgl", webGLContextAttributes) || canvas.getContext("experimental-webgl", webGLContextAttributes);
                }
                return ctx ? GL.registerContext(ctx, webGLContextAttributes) : 0;
            },
            registerContext: function (ctx, webGLContextAttributes) {
                var handle = _malloc(8);
                var context = { handle: handle, attributes: webGLContextAttributes, version: webGLContextAttributes.majorVersion, GLctx: ctx };
                if (ctx.canvas) ctx.canvas.GLctxObject = context;
                GL.contexts[handle] = context;
                if (typeof webGLContextAttributes.enableExtensionsByDefault === "undefined" || webGLContextAttributes.enableExtensionsByDefault) {
                    GL.initExtensions(context);
                }
                return handle;
            },
            makeContextCurrent: function (contextHandle) {
                GL.currentContext = GL.contexts[contextHandle];
                Module.ctx = GLctx = GL.currentContext && GL.currentContext.GLctx;
                return !(contextHandle && !GLctx);
            },
            getContext: function (contextHandle) {
                return GL.contexts[contextHandle];
            },
            deleteContext: function (contextHandle) {
                if (GL.currentContext === GL.contexts[contextHandle]) GL.currentContext = null;
                if (typeof JSEvents === "object") JSEvents.removeAllHandlersOnTarget(GL.contexts[contextHandle].GLctx.canvas);
                if (GL.contexts[contextHandle] && GL.contexts[contextHandle].GLctx.canvas) GL.contexts[contextHandle].GLctx.canvas.GLctxObject = undefined;
                _free(GL.contexts[contextHandle]);
                GL.contexts[contextHandle] = null;
            },
            acquireInstancedArraysExtension: function (ctx) {
                var ext = ctx.getExtension("ANGLE_instanced_arrays");
                if (ext) {
                    ctx["vertexAttribDivisor"] = function (index, divisor) {
                        ext["vertexAttribDivisorANGLE"](index, divisor);
                    };
                    ctx["drawArraysInstanced"] = function (mode, first, count, primcount) {
                        ext["drawArraysInstancedANGLE"](mode, first, count, primcount);
                    };
                    ctx["drawElementsInstanced"] = function (mode, count, type, indices, primcount) {
                        ext["drawElementsInstancedANGLE"](mode, count, type, indices, primcount);
                    };
                }
            },
            acquireVertexArrayObjectExtension: function (ctx) {
                var ext = ctx.getExtension("OES_vertex_array_object");
                if (ext) {
                    ctx["createVertexArray"] = function () {
                        return ext["createVertexArrayOES"]();
                    };
                    ctx["deleteVertexArray"] = function (vao) {
                        ext["deleteVertexArrayOES"](vao);
                    };
                    ctx["bindVertexArray"] = function (vao) {
                        ext["bindVertexArrayOES"](vao);
                    };
                    ctx["isVertexArray"] = function (vao) {
                        return ext["isVertexArrayOES"](vao);
                    };
                }
            },
            acquireDrawBuffersExtension: function (ctx) {
                var ext = ctx.getExtension("WEBGL_draw_buffers");
                if (ext) {
                    ctx["drawBuffers"] = function (n, bufs) {
                        ext["drawBuffersWEBGL"](n, bufs);
                    };
                }
            },
            initExtensions: function (context) {
                if (!context) context = GL.currentContext;
                if (context.initExtensionsDone) return;
                context.initExtensionsDone = true;
                var GLctx = context.GLctx;
                if (context.version < 2) {
                    GL.acquireInstancedArraysExtension(GLctx);
                    GL.acquireVertexArrayObjectExtension(GLctx);
                    GL.acquireDrawBuffersExtension(GLctx);
                }
                GLctx.disjointTimerQueryExt = GLctx.getExtension("EXT_disjoint_timer_query");
                var automaticallyEnabledExtensions = [
                    "OES_texture_float",
                    "OES_texture_half_float",
                    "OES_standard_derivatives",
                    "OES_vertex_array_object",
                    "WEBGL_compressed_texture_s3tc",
                    "WEBGL_depth_texture",
                    "OES_element_index_uint",
                    "EXT_texture_filter_anisotropic",
                    "EXT_frag_depth",
                    "WEBGL_draw_buffers",
                    "ANGLE_instanced_arrays",
                    "OES_texture_float_linear",
                    "OES_texture_half_float_linear",
                    "EXT_blend_minmax",
                    "EXT_shader_texture_lod",
                    "WEBGL_compressed_texture_pvrtc",
                    "EXT_color_buffer_half_float",
                    "WEBGL_color_buffer_float",
                    "EXT_sRGB",
                    "WEBGL_compressed_texture_etc1",
                    "EXT_disjoint_timer_query",
                    "WEBGL_compressed_texture_etc",
                    "WEBGL_compressed_texture_astc",
                    "EXT_color_buffer_float",
                    "WEBGL_compressed_texture_s3tc_srgb",
                    "EXT_disjoint_timer_query_webgl2",
                ];
                var exts = GLctx.getSupportedExtensions() || [];
                exts.forEach(function (ext) {
                    if (automaticallyEnabledExtensions.indexOf(ext) != -1) {
                        GLctx.getExtension(ext);
                    }
                });
            },
            populateUniformTable: function (program) {
                var p = GL.programs[program];
                var ptable = (GL.programInfos[program] = { uniforms: {}, maxUniformLength: 0, maxAttributeLength: -1, maxUniformBlockNameLength: -1 });
                var utable = ptable.uniforms;
                var numUniforms = GLctx.getProgramParameter(p, 35718);
                for (var i = 0; i < numUniforms; ++i) {
                    var u = GLctx.getActiveUniform(p, i);
                    var name = u.name;
                    ptable.maxUniformLength = Math.max(ptable.maxUniformLength, name.length + 1);
                    if (name.slice(-1) == "]") {
                        name = name.slice(0, name.lastIndexOf("["));
                    }
                    var loc = GLctx.getUniformLocation(p, name);
                    if (loc) {
                        var id = GL.getNewId(GL.uniforms);
                        utable[name] = [u.size, id];
                        GL.uniforms[id] = loc;
                        for (var j = 1; j < u.size; ++j) {
                            var n = name + "[" + j + "]";
                            loc = GLctx.getUniformLocation(p, n);
                            id = GL.getNewId(GL.uniforms);
                            GL.uniforms[id] = loc;
                        }
                    }
                }
            },
        };
        function _emscripten_glActiveTexture(x0) {
            GLctx["activeTexture"](x0);
        }
        function _emscripten_glAttachShader(program, shader) {
            GLctx.attachShader(GL.programs[program], GL.shaders[shader]);
        }
        function _emscripten_glBeginQueryEXT(target, id) {
            GLctx.disjointTimerQueryExt["beginQueryEXT"](target, GL.timerQueriesEXT[id]);
        }
        function _emscripten_glBindAttribLocation(program, index, name) {
            GLctx.bindAttribLocation(GL.programs[program], index, UTF8ToString(name));
        }
        function _emscripten_glBindBuffer(target, buffer) {
            GLctx.bindBuffer(target, GL.buffers[buffer]);
        }
        function _emscripten_glBindFramebuffer(target, framebuffer) {
            GLctx.bindFramebuffer(target, GL.framebuffers[framebuffer]);
        }
        function _emscripten_glBindRenderbuffer(target, renderbuffer) {
            GLctx.bindRenderbuffer(target, GL.renderbuffers[renderbuffer]);
        }
        function _emscripten_glBindTexture(target, texture) {
            GLctx.bindTexture(target, GL.textures[texture]);
        }
        function _emscripten_glBindVertexArrayOES(vao) {
            GLctx["bindVertexArray"](GL.vaos[vao]);
        }
        function _emscripten_glBlendColor(x0, x1, x2, x3) {
            GLctx["blendColor"](x0, x1, x2, x3);
        }
        function _emscripten_glBlendEquation(x0) {
            GLctx["blendEquation"](x0);
        }
        function _emscripten_glBlendEquationSeparate(x0, x1) {
            GLctx["blendEquationSeparate"](x0, x1);
        }
        function _emscripten_glBlendFunc(x0, x1) {
            GLctx["blendFunc"](x0, x1);
        }
        function _emscripten_glBlendFuncSeparate(x0, x1, x2, x3) {
            GLctx["blendFuncSeparate"](x0, x1, x2, x3);
        }
        function _emscripten_glBufferData(target, size, data, usage) {
            GLctx.bufferData(target, data ? HEAPU8.subarray(data, data + size) : size, usage);
        }
        function _emscripten_glBufferSubData(target, offset, size, data) {
            GLctx.bufferSubData(target, offset, HEAPU8.subarray(data, data + size));
        }
        function _emscripten_glCheckFramebufferStatus(x0) {
            return GLctx["checkFramebufferStatus"](x0);
        }
        function _emscripten_glClear(x0) {
            GLctx["clear"](x0);
        }
        function _emscripten_glClearColor(x0, x1, x2, x3) {
            GLctx["clearColor"](x0, x1, x2, x3);
        }
        function _emscripten_glClearDepthf(x0) {
            GLctx["clearDepth"](x0);
        }
        function _emscripten_glClearStencil(x0) {
            GLctx["clearStencil"](x0);
        }
        function _emscripten_glColorMask(red, green, blue, alpha) {
            GLctx.colorMask(!!red, !!green, !!blue, !!alpha);
        }
        function _emscripten_glCompileShader(shader) {
            GLctx.compileShader(GL.shaders[shader]);
        }
        function _emscripten_glCompressedTexImage2D(target, level, internalFormat, width, height, border, imageSize, data) {
            GLctx["compressedTexImage2D"](target, level, internalFormat, width, height, border, data ? HEAPU8.subarray(data, data + imageSize) : null);
        }
        function _emscripten_glCompressedTexSubImage2D(target, level, xoffset, yoffset, width, height, format, imageSize, data) {
            GLctx["compressedTexSubImage2D"](target, level, xoffset, yoffset, width, height, format, data ? HEAPU8.subarray(data, data + imageSize) : null);
        }
        function _emscripten_glCopyTexImage2D(x0, x1, x2, x3, x4, x5, x6, x7) {
            GLctx["copyTexImage2D"](x0, x1, x2, x3, x4, x5, x6, x7);
        }
        function _emscripten_glCopyTexSubImage2D(x0, x1, x2, x3, x4, x5, x6, x7) {
            GLctx["copyTexSubImage2D"](x0, x1, x2, x3, x4, x5, x6, x7);
        }
        function _emscripten_glCreateProgram() {
            var id = GL.getNewId(GL.programs);
            var program = GLctx.createProgram();
            program.name = id;
            GL.programs[id] = program;
            return id;
        }
        function _emscripten_glCreateShader(shaderType) {
            var id = GL.getNewId(GL.shaders);
            GL.shaders[id] = GLctx.createShader(shaderType);
            return id;
        }
        function _emscripten_glCullFace(x0) {
            GLctx["cullFace"](x0);
        }
        function _emscripten_glDeleteBuffers(n, buffers) {
            for (var i = 0; i < n; i++) {
                var id = HEAP32[(buffers + i * 4) >> 2];
                var buffer = GL.buffers[id];
                if (!buffer) continue;
                GLctx.deleteBuffer(buffer);
                buffer.name = 0;
                GL.buffers[id] = null;
                if (id == GL.currArrayBuffer) GL.currArrayBuffer = 0;
                if (id == GL.currElementArrayBuffer) GL.currElementArrayBuffer = 0;
            }
        }
        function _emscripten_glDeleteFramebuffers(n, framebuffers) {
            for (var i = 0; i < n; ++i) {
                var id = HEAP32[(framebuffers + i * 4) >> 2];
                var framebuffer = GL.framebuffers[id];
                if (!framebuffer) continue;
                GLctx.deleteFramebuffer(framebuffer);
                framebuffer.name = 0;
                GL.framebuffers[id] = null;
            }
        }
        function _emscripten_glDeleteProgram(id) {
            if (!id) return;
            var program = GL.programs[id];
            if (!program) {
                GL.recordError(1281);
                return;
            }
            GLctx.deleteProgram(program);
            program.name = 0;
            GL.programs[id] = null;
            GL.programInfos[id] = null;
        }
        function _emscripten_glDeleteQueriesEXT(n, ids) {
            for (var i = 0; i < n; i++) {
                var id = HEAP32[(ids + i * 4) >> 2];
                var query = GL.timerQueriesEXT[id];
                if (!query) continue;
                GLctx.disjointTimerQueryExt["deleteQueryEXT"](query);
                GL.timerQueriesEXT[id] = null;
            }
        }
        function _emscripten_glDeleteRenderbuffers(n, renderbuffers) {
            for (var i = 0; i < n; i++) {
                var id = HEAP32[(renderbuffers + i * 4) >> 2];
                var renderbuffer = GL.renderbuffers[id];
                if (!renderbuffer) continue;
                GLctx.deleteRenderbuffer(renderbuffer);
                renderbuffer.name = 0;
                GL.renderbuffers[id] = null;
            }
        }
        function _emscripten_glDeleteShader(id) {
            if (!id) return;
            var shader = GL.shaders[id];
            if (!shader) {
                GL.recordError(1281);
                return;
            }
            GLctx.deleteShader(shader);
            GL.shaders[id] = null;
        }
        function _emscripten_glDeleteTextures(n, textures) {
            for (var i = 0; i < n; i++) {
                var id = HEAP32[(textures + i * 4) >> 2];
                var texture = GL.textures[id];
                if (!texture) continue;
                GLctx.deleteTexture(texture);
                texture.name = 0;
                GL.textures[id] = null;
            }
        }
        function _emscripten_glDeleteVertexArraysOES(n, vaos) {
            for (var i = 0; i < n; i++) {
                var id = HEAP32[(vaos + i * 4) >> 2];
                GLctx["deleteVertexArray"](GL.vaos[id]);
                GL.vaos[id] = null;
            }
        }
        function _emscripten_glDepthFunc(x0) {
            GLctx["depthFunc"](x0);
        }
        function _emscripten_glDepthMask(flag) {
            GLctx.depthMask(!!flag);
        }
        function _emscripten_glDepthRangef(x0, x1) {
            GLctx["depthRange"](x0, x1);
        }
        function _emscripten_glDetachShader(program, shader) {
            GLctx.detachShader(GL.programs[program], GL.shaders[shader]);
        }
        function _emscripten_glDisable(x0) {
            GLctx["disable"](x0);
        }
        function _emscripten_glDisableVertexAttribArray(index) {
            GLctx.disableVertexAttribArray(index);
        }
        function _emscripten_glDrawArrays(mode, first, count) {
            GLctx.drawArrays(mode, first, count);
        }
        function _emscripten_glDrawArraysInstancedANGLE(mode, first, count, primcount) {
            GLctx["drawArraysInstanced"](mode, first, count, primcount);
        }
        var __tempFixedLengthArray = [];
        function _emscripten_glDrawBuffersWEBGL(n, bufs) {
            var bufArray = __tempFixedLengthArray[n];
            for (var i = 0; i < n; i++) {
                bufArray[i] = HEAP32[(bufs + i * 4) >> 2];
            }
            GLctx["drawBuffers"](bufArray);
        }
        function _emscripten_glDrawElements(mode, count, type, indices) {
            GLctx.drawElements(mode, count, type, indices);
        }
        function _emscripten_glDrawElementsInstancedANGLE(mode, count, type, indices, primcount) {
            GLctx["drawElementsInstanced"](mode, count, type, indices, primcount);
        }
        function _emscripten_glEnable(x0) {
            GLctx["enable"](x0);
        }
        function _emscripten_glEnableVertexAttribArray(index) {
            GLctx.enableVertexAttribArray(index);
        }
        function _emscripten_glEndQueryEXT(target) {
            GLctx.disjointTimerQueryExt["endQueryEXT"](target);
        }
        function _emscripten_glFinish() {
            GLctx["finish"]();
        }
        function _emscripten_glFlush() {
            GLctx["flush"]();
        }
        function _emscripten_glFramebufferRenderbuffer(target, attachment, renderbuffertarget, renderbuffer) {
            GLctx.framebufferRenderbuffer(target, attachment, renderbuffertarget, GL.renderbuffers[renderbuffer]);
        }
        function _emscripten_glFramebufferTexture2D(target, attachment, textarget, texture, level) {
            GLctx.framebufferTexture2D(target, attachment, textarget, GL.textures[texture], level);
        }
        function _emscripten_glFrontFace(x0) {
            GLctx["frontFace"](x0);
        }
        function __glGenObject(n, buffers, createFunction, objectTable) {
            for (var i = 0; i < n; i++) {
                var buffer = GLctx[createFunction]();
                var id = buffer && GL.getNewId(objectTable);
                if (buffer) {
                    buffer.name = id;
                    objectTable[id] = buffer;
                } else {
                    GL.recordError(1282);
                }
                HEAP32[(buffers + i * 4) >> 2] = id;
            }
        }
        function _emscripten_glGenBuffers(n, buffers) {
            __glGenObject(n, buffers, "createBuffer", GL.buffers);
        }
        function _emscripten_glGenFramebuffers(n, ids) {
            __glGenObject(n, ids, "createFramebuffer", GL.framebuffers);
        }
        function _emscripten_glGenQueriesEXT(n, ids) {
            for (var i = 0; i < n; i++) {
                var query = GLctx.disjointTimerQueryExt["createQueryEXT"]();
                if (!query) {
                    GL.recordError(1282);
                    while (i < n) HEAP32[(ids + i++ * 4) >> 2] = 0;
                    return;
                }
                var id = GL.getNewId(GL.timerQueriesEXT);
                query.name = id;
                GL.timerQueriesEXT[id] = query;
                HEAP32[(ids + i * 4) >> 2] = id;
            }
        }
        function _emscripten_glGenRenderbuffers(n, renderbuffers) {
            __glGenObject(n, renderbuffers, "createRenderbuffer", GL.renderbuffers);
        }
        function _emscripten_glGenTextures(n, textures) {
            __glGenObject(n, textures, "createTexture", GL.textures);
        }
        function _emscripten_glGenVertexArraysOES(n, arrays) {
            __glGenObject(n, arrays, "createVertexArray", GL.vaos);
        }
        function _emscripten_glGenerateMipmap(x0) {
            GLctx["generateMipmap"](x0);
        }
        function _emscripten_glGetActiveAttrib(program, index, bufSize, length, size, type, name) {
            program = GL.programs[program];
            var info = GLctx.getActiveAttrib(program, index);
            if (!info) return;
            var numBytesWrittenExclNull = bufSize > 0 && name ? stringToUTF8(info.name, name, bufSize) : 0;
            if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
            if (size) HEAP32[size >> 2] = info.size;
            if (type) HEAP32[type >> 2] = info.type;
        }
        function _emscripten_glGetActiveUniform(program, index, bufSize, length, size, type, name) {
            program = GL.programs[program];
            var info = GLctx.getActiveUniform(program, index);
            if (!info) return;
            var numBytesWrittenExclNull = bufSize > 0 && name ? stringToUTF8(info.name, name, bufSize) : 0;
            if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
            if (size) HEAP32[size >> 2] = info.size;
            if (type) HEAP32[type >> 2] = info.type;
        }
        function _emscripten_glGetAttachedShaders(program, maxCount, count, shaders) {
            var result = GLctx.getAttachedShaders(GL.programs[program]);
            var len = result.length;
            if (len > maxCount) {
                len = maxCount;
            }
            HEAP32[count >> 2] = len;
            for (var i = 0; i < len; ++i) {
                var id = GL.shaders.indexOf(result[i]);
                HEAP32[(shaders + i * 4) >> 2] = id;
            }
        }
        function _emscripten_glGetAttribLocation(program, name) {
            return GLctx.getAttribLocation(GL.programs[program], UTF8ToString(name));
        }
        function emscriptenWebGLGet(name_, p, type) {
            if (!p) {
                GL.recordError(1281);
                return;
            }
            var ret = undefined;
            switch (name_) {
                case 36346:
                    ret = 1;
                    break;
                case 36344:
                    if (type != 0 && type != 1) {
                        GL.recordError(1280);
                    }
                    return;
                case 36345:
                    ret = 0;
                    break;
                case 34466:
                    var formats = GLctx.getParameter(34467);
                    ret = formats ? formats.length : 0;
                    break;
            }
            if (ret === undefined) {
                var result = GLctx.getParameter(name_);
                switch (typeof result) {
                    case "number":
                        ret = result;
                        break;
                    case "boolean":
                        ret = result ? 1 : 0;
                        break;
                    case "string":
                        GL.recordError(1280);
                        return;
                    case "object":
                        if (result === null) {
                            switch (name_) {
                                case 34964:
                                case 35725:
                                case 34965:
                                case 36006:
                                case 36007:
                                case 32873:
                                case 34229:
                                case 34068: {
                                    ret = 0;
                                    break;
                                }
                                default: {
                                    GL.recordError(1280);
                                    return;
                                }
                            }
                        } else if (result instanceof Float32Array || result instanceof Uint32Array || result instanceof Int32Array || result instanceof Array) {
                            for (var i = 0; i < result.length; ++i) {
                                switch (type) {
                                    case 0:
                                        HEAP32[(p + i * 4) >> 2] = result[i];
                                        break;
                                    case 2:
                                        HEAPF32[(p + i * 4) >> 2] = result[i];
                                        break;
                                    case 4:
                                        HEAP8[(p + i) >> 0] = result[i] ? 1 : 0;
                                        break;
                                }
                            }
                            return;
                        } else {
                            try {
                                ret = result.name | 0;
                            } catch (e) {
                                GL.recordError(1280);
                                err("GL_INVALID_ENUM in glGet" + type + "v: Unknown object returned from WebGL getParameter(" + name_ + ")! (error: " + e + ")");
                                return;
                            }
                        }
                        break;
                    default:
                        GL.recordError(1280);
                        err("GL_INVALID_ENUM in glGet" + type + "v: Native code calling glGet" + type + "v(" + name_ + ") and it returns " + result + " of type " + typeof result + "!");
                        return;
                }
            }
            switch (type) {
                case 1:
                    (tempI64 = [
                        ret >>> 0,
                        ((tempDouble = ret),
                        +Math_abs(tempDouble) >= 1 ? (tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0) : 0),
                    ]),
                        (HEAP32[p >> 2] = tempI64[0]),
                        (HEAP32[(p + 4) >> 2] = tempI64[1]);
                    break;
                case 0:
                    HEAP32[p >> 2] = ret;
                    break;
                case 2:
                    HEAPF32[p >> 2] = ret;
                    break;
                case 4:
                    HEAP8[p >> 0] = ret ? 1 : 0;
                    break;
            }
        }
        function _emscripten_glGetBooleanv(name_, p) {
            emscriptenWebGLGet(name_, p, 4);
        }
        function _emscripten_glGetBufferParameteriv(target, value, data) {
            if (!data) {
                GL.recordError(1281);
                return;
            }
            HEAP32[data >> 2] = GLctx.getBufferParameter(target, value);
        }
        function _emscripten_glGetError() {
            var error = GLctx.getError() || GL.lastError;
            GL.lastError = 0;
            return error;
        }
        function _emscripten_glGetFloatv(name_, p) {
            emscriptenWebGLGet(name_, p, 2);
        }
        function _emscripten_glGetFramebufferAttachmentParameteriv(target, attachment, pname, params) {
            var result = GLctx.getFramebufferAttachmentParameter(target, attachment, pname);
            if (result instanceof WebGLRenderbuffer || result instanceof WebGLTexture) {
                result = result.name | 0;
            }
            HEAP32[params >> 2] = result;
        }
        function _emscripten_glGetIntegerv(name_, p) {
            emscriptenWebGLGet(name_, p, 0);
        }
        function _emscripten_glGetProgramInfoLog(program, maxLength, length, infoLog) {
            var log = GLctx.getProgramInfoLog(GL.programs[program]);
            if (log === null) log = "(unknown error)";
            var numBytesWrittenExclNull = maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
            if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
        }
        function _emscripten_glGetProgramiv(program, pname, p) {
            if (!p) {
                GL.recordError(1281);
                return;
            }
            if (program >= GL.counter) {
                GL.recordError(1281);
                return;
            }
            var ptable = GL.programInfos[program];
            if (!ptable) {
                GL.recordError(1282);
                return;
            }
            if (pname == 35716) {
                var log = GLctx.getProgramInfoLog(GL.programs[program]);
                if (log === null) log = "(unknown error)";
                HEAP32[p >> 2] = log.length + 1;
            } else if (pname == 35719) {
                HEAP32[p >> 2] = ptable.maxUniformLength;
            } else if (pname == 35722) {
                if (ptable.maxAttributeLength == -1) {
                    program = GL.programs[program];
                    var numAttribs = GLctx.getProgramParameter(program, 35721);
                    ptable.maxAttributeLength = 0;
                    for (var i = 0; i < numAttribs; ++i) {
                        var activeAttrib = GLctx.getActiveAttrib(program, i);
                        ptable.maxAttributeLength = Math.max(ptable.maxAttributeLength, activeAttrib.name.length + 1);
                    }
                }
                HEAP32[p >> 2] = ptable.maxAttributeLength;
            } else if (pname == 35381) {
                if (ptable.maxUniformBlockNameLength == -1) {
                    program = GL.programs[program];
                    var numBlocks = GLctx.getProgramParameter(program, 35382);
                    ptable.maxUniformBlockNameLength = 0;
                    for (var i = 0; i < numBlocks; ++i) {
                        var activeBlockName = GLctx.getActiveUniformBlockName(program, i);
                        ptable.maxUniformBlockNameLength = Math.max(ptable.maxUniformBlockNameLength, activeBlockName.length + 1);
                    }
                }
                HEAP32[p >> 2] = ptable.maxUniformBlockNameLength;
            } else {
                HEAP32[p >> 2] = GLctx.getProgramParameter(GL.programs[program], pname);
            }
        }
        function _emscripten_glGetQueryObjecti64vEXT(id, pname, params) {
            if (!params) {
                GL.recordError(1281);
                return;
            }
            var query = GL.timerQueriesEXT[id];
            var param = GLctx.disjointTimerQueryExt["getQueryObjectEXT"](query, pname);
            var ret;
            if (typeof param == "boolean") {
                ret = param ? 1 : 0;
            } else {
                ret = param;
            }
            (tempI64 = [
                ret >>> 0,
                ((tempDouble = ret), +Math_abs(tempDouble) >= 1 ? (tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0) : 0),
            ]),
                (HEAP32[params >> 2] = tempI64[0]),
                (HEAP32[(params + 4) >> 2] = tempI64[1]);
        }
        function _emscripten_glGetQueryObjectivEXT(id, pname, params) {
            if (!params) {
                GL.recordError(1281);
                return;
            }
            var query = GL.timerQueriesEXT[id];
            var param = GLctx.disjointTimerQueryExt["getQueryObjectEXT"](query, pname);
            var ret;
            if (typeof param == "boolean") {
                ret = param ? 1 : 0;
            } else {
                ret = param;
            }
            HEAP32[params >> 2] = ret;
        }
        function _emscripten_glGetQueryObjectui64vEXT(id, pname, params) {
            if (!params) {
                GL.recordError(1281);
                return;
            }
            var query = GL.timerQueriesEXT[id];
            var param = GLctx.disjointTimerQueryExt["getQueryObjectEXT"](query, pname);
            var ret;
            if (typeof param == "boolean") {
                ret = param ? 1 : 0;
            } else {
                ret = param;
            }
            (tempI64 = [
                ret >>> 0,
                ((tempDouble = ret), +Math_abs(tempDouble) >= 1 ? (tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0) : 0),
            ]),
                (HEAP32[params >> 2] = tempI64[0]),
                (HEAP32[(params + 4) >> 2] = tempI64[1]);
        }
        function _emscripten_glGetQueryObjectuivEXT(id, pname, params) {
            if (!params) {
                GL.recordError(1281);
                return;
            }
            var query = GL.timerQueriesEXT[id];
            var param = GLctx.disjointTimerQueryExt["getQueryObjectEXT"](query, pname);
            var ret;
            if (typeof param == "boolean") {
                ret = param ? 1 : 0;
            } else {
                ret = param;
            }
            HEAP32[params >> 2] = ret;
        }
        function _emscripten_glGetQueryivEXT(target, pname, params) {
            if (!params) {
                GL.recordError(1281);
                return;
            }
            HEAP32[params >> 2] = GLctx.disjointTimerQueryExt["getQueryEXT"](target, pname);
        }
        function _emscripten_glGetRenderbufferParameteriv(target, pname, params) {
            if (!params) {
                GL.recordError(1281);
                return;
            }
            HEAP32[params >> 2] = GLctx.getRenderbufferParameter(target, pname);
        }
        function _emscripten_glGetShaderInfoLog(shader, maxLength, length, infoLog) {
            var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
            if (log === null) log = "(unknown error)";
            var numBytesWrittenExclNull = maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
            if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
        }
        function _emscripten_glGetShaderPrecisionFormat(shaderType, precisionType, range, precision) {
            var result = GLctx.getShaderPrecisionFormat(shaderType, precisionType);
            HEAP32[range >> 2] = result.rangeMin;
            HEAP32[(range + 4) >> 2] = result.rangeMax;
            HEAP32[precision >> 2] = result.precision;
        }
        function _emscripten_glGetShaderSource(shader, bufSize, length, source) {
            var result = GLctx.getShaderSource(GL.shaders[shader]);
            if (!result) return;
            var numBytesWrittenExclNull = bufSize > 0 && source ? stringToUTF8(result, source, bufSize) : 0;
            if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
        }
        function _emscripten_glGetShaderiv(shader, pname, p) {
            if (!p) {
                GL.recordError(1281);
                return;
            }
            if (pname == 35716) {
                var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
                if (log === null) log = "(unknown error)";
                HEAP32[p >> 2] = log.length + 1;
            } else if (pname == 35720) {
                var source = GLctx.getShaderSource(GL.shaders[shader]);
                var sourceLength = source === null || source.length == 0 ? 0 : source.length + 1;
                HEAP32[p >> 2] = sourceLength;
            } else {
                HEAP32[p >> 2] = GLctx.getShaderParameter(GL.shaders[shader], pname);
            }
        }
        function stringToNewUTF8(jsString) {
            var length = lengthBytesUTF8(jsString) + 1;
            var cString = _malloc(length);
            stringToUTF8(jsString, cString, length);
            return cString;
        }
        function _emscripten_glGetString(name_) {
            if (GL.stringCache[name_]) return GL.stringCache[name_];
            var ret;
            switch (name_) {
                case 7939:
                    var exts = GLctx.getSupportedExtensions() || [];
                    exts = exts.concat(
                        exts.map(function (e) {
                            return "GL_" + e;
                        })
                    );
                    ret = stringToNewUTF8(exts.join(" "));
                    break;
                case 7936:
                case 7937:
                case 37445:
                case 37446:
                    var s = GLctx.getParameter(name_);
                    if (!s) {
                        GL.recordError(1280);
                    }
                    ret = stringToNewUTF8(s);
                    break;
                case 7938:
                    var glVersion = GLctx.getParameter(GLctx.VERSION);
                    {
                        glVersion = "OpenGL ES 2.0 (" + glVersion + ")";
                    }
                    ret = stringToNewUTF8(glVersion);
                    break;
                case 35724:
                    var glslVersion = GLctx.getParameter(GLctx.SHADING_LANGUAGE_VERSION);
                    var ver_re = /^WebGL GLSL ES ([0-9]\.[0-9][0-9]?)(?:$| .*)/;
                    var ver_num = glslVersion.match(ver_re);
                    if (ver_num !== null) {
                        if (ver_num[1].length == 3) ver_num[1] = ver_num[1] + "0";
                        glslVersion = "OpenGL ES GLSL ES " + ver_num[1] + " (" + glslVersion + ")";
                    }
                    ret = stringToNewUTF8(glslVersion);
                    break;
                default:
                    GL.recordError(1280);
                    return 0;
            }
            GL.stringCache[name_] = ret;
            return ret;
        }
        function _emscripten_glGetTexParameterfv(target, pname, params) {
            if (!params) {
                GL.recordError(1281);
                return;
            }
            HEAPF32[params >> 2] = GLctx.getTexParameter(target, pname);
        }
        function _emscripten_glGetTexParameteriv(target, pname, params) {
            if (!params) {
                GL.recordError(1281);
                return;
            }
            HEAP32[params >> 2] = GLctx.getTexParameter(target, pname);
        }
        function _emscripten_glGetUniformLocation(program, name) {
            name = UTF8ToString(name);
            var arrayIndex = 0;
            if (name[name.length - 1] == "]") {
                var leftBrace = name.lastIndexOf("[");
                arrayIndex = name[leftBrace + 1] != "]" ? parseInt(name.slice(leftBrace + 1)) : 0;
                name = name.slice(0, leftBrace);
            }
            var uniformInfo = GL.programInfos[program] && GL.programInfos[program].uniforms[name];
            if (uniformInfo && arrayIndex >= 0 && arrayIndex < uniformInfo[0]) {
                return uniformInfo[1] + arrayIndex;
            } else {
                return -1;
            }
        }
        function emscriptenWebGLGetUniform(program, location, params, type) {
            if (!params) {
                GL.recordError(1281);
                return;
            }
            var data = GLctx.getUniform(GL.programs[program], GL.uniforms[location]);
            if (typeof data == "number" || typeof data == "boolean") {
                switch (type) {
                    case 0:
                        HEAP32[params >> 2] = data;
                        break;
                    case 2:
                        HEAPF32[params >> 2] = data;
                        break;
                    default:
                        throw "internal emscriptenWebGLGetUniform() error, bad type: " + type;
                }
            } else {
                for (var i = 0; i < data.length; i++) {
                    switch (type) {
                        case 0:
                            HEAP32[(params + i * 4) >> 2] = data[i];
                            break;
                        case 2:
                            HEAPF32[(params + i * 4) >> 2] = data[i];
                            break;
                        default:
                            throw "internal emscriptenWebGLGetUniform() error, bad type: " + type;
                    }
                }
            }
        }
        function _emscripten_glGetUniformfv(program, location, params) {
            emscriptenWebGLGetUniform(program, location, params, 2);
        }
        function _emscripten_glGetUniformiv(program, location, params) {
            emscriptenWebGLGetUniform(program, location, params, 0);
        }
        function _emscripten_glGetVertexAttribPointerv(index, pname, pointer) {
            if (!pointer) {
                GL.recordError(1281);
                return;
            }
            HEAP32[pointer >> 2] = GLctx.getVertexAttribOffset(index, pname);
        }
        function emscriptenWebGLGetVertexAttrib(index, pname, params, type) {
            if (!params) {
                GL.recordError(1281);
                return;
            }
            var data = GLctx.getVertexAttrib(index, pname);
            if (pname == 34975) {
                HEAP32[params >> 2] = data["name"];
            } else if (typeof data == "number" || typeof data == "boolean") {
                switch (type) {
                    case 0:
                        HEAP32[params >> 2] = data;
                        break;
                    case 2:
                        HEAPF32[params >> 2] = data;
                        break;
                    case 5:
                        HEAP32[params >> 2] = Math.fround(data);
                        break;
                    default:
                        throw "internal emscriptenWebGLGetVertexAttrib() error, bad type: " + type;
                }
            } else {
                for (var i = 0; i < data.length; i++) {
                    switch (type) {
                        case 0:
                            HEAP32[(params + i * 4) >> 2] = data[i];
                            break;
                        case 2:
                            HEAPF32[(params + i * 4) >> 2] = data[i];
                            break;
                        case 5:
                            HEAP32[(params + i * 4) >> 2] = Math.fround(data[i]);
                            break;
                        default:
                            throw "internal emscriptenWebGLGetVertexAttrib() error, bad type: " + type;
                    }
                }
            }
        }
        function _emscripten_glGetVertexAttribfv(index, pname, params) {
            emscriptenWebGLGetVertexAttrib(index, pname, params, 2);
        }
        function _emscripten_glGetVertexAttribiv(index, pname, params) {
            emscriptenWebGLGetVertexAttrib(index, pname, params, 5);
        }
        function _emscripten_glHint(x0, x1) {
            GLctx["hint"](x0, x1);
        }
        function _emscripten_glIsBuffer(buffer) {
            var b = GL.buffers[buffer];
            if (!b) return 0;
            return GLctx.isBuffer(b);
        }
        function _emscripten_glIsEnabled(x0) {
            return GLctx["isEnabled"](x0);
        }
        function _emscripten_glIsFramebuffer(framebuffer) {
            var fb = GL.framebuffers[framebuffer];
            if (!fb) return 0;
            return GLctx.isFramebuffer(fb);
        }
        function _emscripten_glIsProgram(program) {
            program = GL.programs[program];
            if (!program) return 0;
            return GLctx.isProgram(program);
        }
        function _emscripten_glIsQueryEXT(id) {
            var query = GL.timerQueriesEXT[id];
            if (!query) return 0;
            return GLctx.disjointTimerQueryExt["isQueryEXT"](query);
        }
        function _emscripten_glIsRenderbuffer(renderbuffer) {
            var rb = GL.renderbuffers[renderbuffer];
            if (!rb) return 0;
            return GLctx.isRenderbuffer(rb);
        }
        function _emscripten_glIsShader(shader) {
            var s = GL.shaders[shader];
            if (!s) return 0;
            return GLctx.isShader(s);
        }
        function _emscripten_glIsTexture(id) {
            var texture = GL.textures[id];
            if (!texture) return 0;
            return GLctx.isTexture(texture);
        }
        function _emscripten_glIsVertexArrayOES(array) {
            var vao = GL.vaos[array];
            if (!vao) return 0;
            return GLctx["isVertexArray"](vao);
        }
        function _emscripten_glLineWidth(x0) {
            GLctx["lineWidth"](x0);
        }
        function _emscripten_glLinkProgram(program) {
            GLctx.linkProgram(GL.programs[program]);
            GL.populateUniformTable(program);
        }
        function _emscripten_glPixelStorei(pname, param) {
            if (pname == 3317) {
                GL.unpackAlignment = param;
            }
            GLctx.pixelStorei(pname, param);
        }
        function _emscripten_glPolygonOffset(x0, x1) {
            GLctx["polygonOffset"](x0, x1);
        }
        function _emscripten_glQueryCounterEXT(id, target) {
            GLctx.disjointTimerQueryExt["queryCounterEXT"](GL.timerQueriesEXT[id], target);
        }
        function __computeUnpackAlignedImageSize(width, height, sizePerPixel, alignment) {
            function roundedToNextMultipleOf(x, y) {
                return (x + y - 1) & -y;
            }
            var plainRowSize = width * sizePerPixel;
            var alignedRowSize = roundedToNextMultipleOf(plainRowSize, alignment);
            return height * alignedRowSize;
        }
        var __colorChannelsInGlTextureFormat = { 6402: 1, 6406: 1, 6407: 3, 6408: 4, 6409: 1, 6410: 2, 35904: 3, 35906: 4 };
        var __sizeOfGlTextureElementType = { 5121: 1, 5123: 2, 5125: 4, 5126: 4, 32819: 2, 32820: 2, 33635: 2, 34042: 4, 36193: 2 };
        function emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) {
            var sizePerPixel = __colorChannelsInGlTextureFormat[format] * __sizeOfGlTextureElementType[type];
            if (!sizePerPixel) {
                GL.recordError(1280);
                return;
            }
            var bytes = __computeUnpackAlignedImageSize(width, height, sizePerPixel, GL.unpackAlignment);
            var end = pixels + bytes;
            switch (type) {
                case 5121:
                    return HEAPU8.subarray(pixels, end);
                case 5126:
                    return HEAPF32.subarray(pixels >> 2, end >> 2);
                case 5125:
                case 34042:
                    return HEAPU32.subarray(pixels >> 2, end >> 2);
                case 5123:
                case 33635:
                case 32819:
                case 32820:
                case 36193:
                    return HEAPU16.subarray(pixels >> 1, end >> 1);
                default:
                    GL.recordError(1280);
            }
        }
        function _emscripten_glReadPixels(x, y, width, height, format, type, pixels) {
            var pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, format);
            if (!pixelData) {
                GL.recordError(1280);
                return;
            }
            GLctx.readPixels(x, y, width, height, format, type, pixelData);
        }
        function _emscripten_glReleaseShaderCompiler() {}
        function _emscripten_glRenderbufferStorage(x0, x1, x2, x3) {
            GLctx["renderbufferStorage"](x0, x1, x2, x3);
        }
        function _emscripten_glSampleCoverage(value, invert) {
            GLctx.sampleCoverage(value, !!invert);
        }
        function _emscripten_glScissor(x0, x1, x2, x3) {
            GLctx["scissor"](x0, x1, x2, x3);
        }
        function _emscripten_glShaderBinary() {
            GL.recordError(1280);
        }
        function _emscripten_glShaderSource(shader, count, string, length) {
            var source = GL.getSource(shader, count, string, length);
            GLctx.shaderSource(GL.shaders[shader], source);
        }
        function _emscripten_glStencilFunc(x0, x1, x2) {
            GLctx["stencilFunc"](x0, x1, x2);
        }
        function _emscripten_glStencilFuncSeparate(x0, x1, x2, x3) {
            GLctx["stencilFuncSeparate"](x0, x1, x2, x3);
        }
        function _emscripten_glStencilMask(x0) {
            GLctx["stencilMask"](x0);
        }
        function _emscripten_glStencilMaskSeparate(x0, x1) {
            GLctx["stencilMaskSeparate"](x0, x1);
        }
        function _emscripten_glStencilOp(x0, x1, x2) {
            GLctx["stencilOp"](x0, x1, x2);
        }
        function _emscripten_glStencilOpSeparate(x0, x1, x2, x3) {
            GLctx["stencilOpSeparate"](x0, x1, x2, x3);
        }
        function _emscripten_glTexImage2D(target, level, internalFormat, width, height, border, format, type, pixels) {
            GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixels ? emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) : null);
        }
        function _emscripten_glTexParameterf(x0, x1, x2) {
            GLctx["texParameterf"](x0, x1, x2);
        }
        function _emscripten_glTexParameterfv(target, pname, params) {
            var param = HEAPF32[params >> 2];
            GLctx.texParameterf(target, pname, param);
        }
        function _emscripten_glTexParameteri(x0, x1, x2) {
            GLctx["texParameteri"](x0, x1, x2);
        }
        function _emscripten_glTexParameteriv(target, pname, params) {
            var param = HEAP32[params >> 2];
            GLctx.texParameteri(target, pname, param);
        }
        function _emscripten_glTexSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixels) {
            var pixelData = null;
            if (pixels) pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, 0);
            GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixelData);
        }
        function _emscripten_glUniform1f(location, v0) {
            GLctx.uniform1f(GL.uniforms[location], v0);
        }
        function _emscripten_glUniform1fv(location, count, value) {
            if (count <= GL.MINI_TEMP_BUFFER_SIZE) {
                var view = GL.miniTempBufferViews[count - 1];
                for (var i = 0; i < count; ++i) {
                    view[i] = HEAPF32[(value + 4 * i) >> 2];
                }
            } else {
                var view = HEAPF32.subarray(value >> 2, (value + count * 4) >> 2);
            }
            GLctx.uniform1fv(GL.uniforms[location], view);
        }
        function _emscripten_glUniform1i(location, v0) {
            GLctx.uniform1i(GL.uniforms[location], v0);
        }
        function _emscripten_glUniform1iv(location, count, value) {
            GLctx.uniform1iv(GL.uniforms[location], HEAP32.subarray(value >> 2, (value + count * 4) >> 2));
        }
        function _emscripten_glUniform2f(location, v0, v1) {
            GLctx.uniform2f(GL.uniforms[location], v0, v1);
        }
        function _emscripten_glUniform2fv(location, count, value) {
            if (2 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
                var view = GL.miniTempBufferViews[2 * count - 1];
                for (var i = 0; i < 2 * count; i += 2) {
                    view[i] = HEAPF32[(value + 4 * i) >> 2];
                    view[i + 1] = HEAPF32[(value + (4 * i + 4)) >> 2];
                }
            } else {
                var view = HEAPF32.subarray(value >> 2, (value + count * 8) >> 2);
            }
            GLctx.uniform2fv(GL.uniforms[location], view);
        }
        function _emscripten_glUniform2i(location, v0, v1) {
            GLctx.uniform2i(GL.uniforms[location], v0, v1);
        }
        function _emscripten_glUniform2iv(location, count, value) {
            GLctx.uniform2iv(GL.uniforms[location], HEAP32.subarray(value >> 2, (value + count * 8) >> 2));
        }
        function _emscripten_glUniform3f(location, v0, v1, v2) {
            GLctx.uniform3f(GL.uniforms[location], v0, v1, v2);
        }
        function _emscripten_glUniform3fv(location, count, value) {
            if (3 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
                var view = GL.miniTempBufferViews[3 * count - 1];
                for (var i = 0; i < 3 * count; i += 3) {
                    view[i] = HEAPF32[(value + 4 * i) >> 2];
                    view[i + 1] = HEAPF32[(value + (4 * i + 4)) >> 2];
                    view[i + 2] = HEAPF32[(value + (4 * i + 8)) >> 2];
                }
            } else {
                var view = HEAPF32.subarray(value >> 2, (value + count * 12) >> 2);
            }
            GLctx.uniform3fv(GL.uniforms[location], view);
        }
        function _emscripten_glUniform3i(location, v0, v1, v2) {
            GLctx.uniform3i(GL.uniforms[location], v0, v1, v2);
        }
        function _emscripten_glUniform3iv(location, count, value) {
            GLctx.uniform3iv(GL.uniforms[location], HEAP32.subarray(value >> 2, (value + count * 12) >> 2));
        }
        function _emscripten_glUniform4f(location, v0, v1, v2, v3) {
            GLctx.uniform4f(GL.uniforms[location], v0, v1, v2, v3);
        }
        function _emscripten_glUniform4fv(location, count, value) {
            if (4 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
                var view = GL.miniTempBufferViews[4 * count - 1];
                for (var i = 0; i < 4 * count; i += 4) {
                    view[i] = HEAPF32[(value + 4 * i) >> 2];
                    view[i + 1] = HEAPF32[(value + (4 * i + 4)) >> 2];
                    view[i + 2] = HEAPF32[(value + (4 * i + 8)) >> 2];
                    view[i + 3] = HEAPF32[(value + (4 * i + 12)) >> 2];
                }
            } else {
                var view = HEAPF32.subarray(value >> 2, (value + count * 16) >> 2);
            }
            GLctx.uniform4fv(GL.uniforms[location], view);
        }
        function _emscripten_glUniform4i(location, v0, v1, v2, v3) {
            GLctx.uniform4i(GL.uniforms[location], v0, v1, v2, v3);
        }
        function _emscripten_glUniform4iv(location, count, value) {
            GLctx.uniform4iv(GL.uniforms[location], HEAP32.subarray(value >> 2, (value + count * 16) >> 2));
        }
        function _emscripten_glUniformMatrix2fv(location, count, transpose, value) {
            if (4 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
                var view = GL.miniTempBufferViews[4 * count - 1];
                for (var i = 0; i < 4 * count; i += 4) {
                    view[i] = HEAPF32[(value + 4 * i) >> 2];
                    view[i + 1] = HEAPF32[(value + (4 * i + 4)) >> 2];
                    view[i + 2] = HEAPF32[(value + (4 * i + 8)) >> 2];
                    view[i + 3] = HEAPF32[(value + (4 * i + 12)) >> 2];
                }
            } else {
                var view = HEAPF32.subarray(value >> 2, (value + count * 16) >> 2);
            }
            GLctx.uniformMatrix2fv(GL.uniforms[location], !!transpose, view);
        }
        function _emscripten_glUniformMatrix3fv(location, count, transpose, value) {
            if (9 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
                var view = GL.miniTempBufferViews[9 * count - 1];
                for (var i = 0; i < 9 * count; i += 9) {
                    view[i] = HEAPF32[(value + 4 * i) >> 2];
                    view[i + 1] = HEAPF32[(value + (4 * i + 4)) >> 2];
                    view[i + 2] = HEAPF32[(value + (4 * i + 8)) >> 2];
                    view[i + 3] = HEAPF32[(value + (4 * i + 12)) >> 2];
                    view[i + 4] = HEAPF32[(value + (4 * i + 16)) >> 2];
                    view[i + 5] = HEAPF32[(value + (4 * i + 20)) >> 2];
                    view[i + 6] = HEAPF32[(value + (4 * i + 24)) >> 2];
                    view[i + 7] = HEAPF32[(value + (4 * i + 28)) >> 2];
                    view[i + 8] = HEAPF32[(value + (4 * i + 32)) >> 2];
                }
            } else {
                var view = HEAPF32.subarray(value >> 2, (value + count * 36) >> 2);
            }
            GLctx.uniformMatrix3fv(GL.uniforms[location], !!transpose, view);
        }
        function _emscripten_glUniformMatrix4fv(location, count, transpose, value) {
            if (16 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
                var view = GL.miniTempBufferViews[16 * count - 1];
                for (var i = 0; i < 16 * count; i += 16) {
                    view[i] = HEAPF32[(value + 4 * i) >> 2];
                    view[i + 1] = HEAPF32[(value + (4 * i + 4)) >> 2];
                    view[i + 2] = HEAPF32[(value + (4 * i + 8)) >> 2];
                    view[i + 3] = HEAPF32[(value + (4 * i + 12)) >> 2];
                    view[i + 4] = HEAPF32[(value + (4 * i + 16)) >> 2];
                    view[i + 5] = HEAPF32[(value + (4 * i + 20)) >> 2];
                    view[i + 6] = HEAPF32[(value + (4 * i + 24)) >> 2];
                    view[i + 7] = HEAPF32[(value + (4 * i + 28)) >> 2];
                    view[i + 8] = HEAPF32[(value + (4 * i + 32)) >> 2];
                    view[i + 9] = HEAPF32[(value + (4 * i + 36)) >> 2];
                    view[i + 10] = HEAPF32[(value + (4 * i + 40)) >> 2];
                    view[i + 11] = HEAPF32[(value + (4 * i + 44)) >> 2];
                    view[i + 12] = HEAPF32[(value + (4 * i + 48)) >> 2];
                    view[i + 13] = HEAPF32[(value + (4 * i + 52)) >> 2];
                    view[i + 14] = HEAPF32[(value + (4 * i + 56)) >> 2];
                    view[i + 15] = HEAPF32[(value + (4 * i + 60)) >> 2];
                }
            } else {
                var view = HEAPF32.subarray(value >> 2, (value + count * 64) >> 2);
            }
            GLctx.uniformMatrix4fv(GL.uniforms[location], !!transpose, view);
        }
        function _emscripten_glUseProgram(program) {
            GLctx.useProgram(GL.programs[program]);
        }
        function _emscripten_glValidateProgram(program) {
            GLctx.validateProgram(GL.programs[program]);
        }
        function _emscripten_glVertexAttrib1f(x0, x1) {
            GLctx["vertexAttrib1f"](x0, x1);
        }
        function _emscripten_glVertexAttrib1fv(index, v) {
            GLctx.vertexAttrib1f(index, HEAPF32[v >> 2]);
        }
        function _emscripten_glVertexAttrib2f(x0, x1, x2) {
            GLctx["vertexAttrib2f"](x0, x1, x2);
        }
        function _emscripten_glVertexAttrib2fv(index, v) {
            GLctx.vertexAttrib2f(index, HEAPF32[v >> 2], HEAPF32[(v + 4) >> 2]);
        }
        function _emscripten_glVertexAttrib3f(x0, x1, x2, x3) {
            GLctx["vertexAttrib3f"](x0, x1, x2, x3);
        }
        function _emscripten_glVertexAttrib3fv(index, v) {
            GLctx.vertexAttrib3f(index, HEAPF32[v >> 2], HEAPF32[(v + 4) >> 2], HEAPF32[(v + 8) >> 2]);
        }
        function _emscripten_glVertexAttrib4f(x0, x1, x2, x3, x4) {
            GLctx["vertexAttrib4f"](x0, x1, x2, x3, x4);
        }
        function _emscripten_glVertexAttrib4fv(index, v) {
            GLctx.vertexAttrib4f(index, HEAPF32[v >> 2], HEAPF32[(v + 4) >> 2], HEAPF32[(v + 8) >> 2], HEAPF32[(v + 12) >> 2]);
        }
        function _emscripten_glVertexAttribDivisorANGLE(index, divisor) {
            GLctx["vertexAttribDivisor"](index, divisor);
        }
        function _emscripten_glVertexAttribPointer(index, size, type, normalized, stride, ptr) {
            GLctx.vertexAttribPointer(index, size, type, !!normalized, stride, ptr);
        }
        function _emscripten_glViewport(x0, x1, x2, x3) {
            GLctx["viewport"](x0, x1, x2, x3);
        }
        function _exit(status) {
            exit(status);
        }
        var ENV = {};
        function _getenv(name) {
            if (name === 0) return 0;
            name = UTF8ToString(name);
            if (!ENV.hasOwnProperty(name)) return 0;
            if (_getenv.ret) _free(_getenv.ret);
            _getenv.ret = allocateUTF8(ENV[name]);
            return _getenv.ret;
        }
        function _llvm_stackrestore(p) {
            var self = _llvm_stacksave;
            var ret = self.LLVM_SAVEDSTACKS[p];
            self.LLVM_SAVEDSTACKS.splice(p, 1);
            stackRestore(ret);
        }
        function _llvm_stacksave() {
            var self = _llvm_stacksave;
            if (!self.LLVM_SAVEDSTACKS) {
                self.LLVM_SAVEDSTACKS = [];
            }
            self.LLVM_SAVEDSTACKS.push(stackSave());
            return self.LLVM_SAVEDSTACKS.length - 1;
        }
        function _llvm_trap() {
            abort("trap!");
        }
        function _emscripten_memcpy_big(dest, src, num) {
            HEAPU8.set(HEAPU8.subarray(src, src + num), dest);
        }
        function _pthread_cond_wait() {
            return 0;
        }
        function abortOnCannotGrowMemory(requestedSize) {
            abort("OOM");
        }
        function emscripten_realloc_buffer(size) {
            try {
                wasmMemory.grow((size - buffer.byteLength + 65535) >> 16);
                updateGlobalBufferAndViews(wasmMemory.buffer);
                return 1;
            } catch (e) {}
        }
        function _emscripten_resize_heap(requestedSize) {
            var oldSize = _emscripten_get_heap_size();
            var PAGE_MULTIPLE = 65536;
            var LIMIT = 2147483648 - PAGE_MULTIPLE;
            if (requestedSize > LIMIT) {
                return false;
            }
            var MIN_TOTAL_MEMORY = 16777216;
            var newSize = Math.max(oldSize, MIN_TOTAL_MEMORY);
            while (newSize < requestedSize) {
                if (newSize <= 536870912) {
                    newSize = alignUp(2 * newSize, PAGE_MULTIPLE);
                } else {
                    newSize = Math.min(alignUp((3 * newSize + 2147483648) / 4, PAGE_MULTIPLE), LIMIT);
                }
            }
            var replacement = emscripten_realloc_buffer(newSize);
            if (!replacement) {
                return false;
            }
            return true;
        }
        function __isLeapYear(year) {
            return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
        }
        function __arraySum(array, index) {
            var sum = 0;
            for (var i = 0; i <= index; sum += array[i++]);
            return sum;
        }
        var __MONTH_DAYS_LEAP = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        var __MONTH_DAYS_REGULAR = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        function __addDays(date, days) {
            var newDate = new Date(date.getTime());
            while (days > 0) {
                var leap = __isLeapYear(newDate.getFullYear());
                var currentMonth = newDate.getMonth();
                var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
                if (days > daysInCurrentMonth - newDate.getDate()) {
                    days -= daysInCurrentMonth - newDate.getDate() + 1;
                    newDate.setDate(1);
                    if (currentMonth < 11) {
                        newDate.setMonth(currentMonth + 1);
                    } else {
                        newDate.setMonth(0);
                        newDate.setFullYear(newDate.getFullYear() + 1);
                    }
                } else {
                    newDate.setDate(newDate.getDate() + days);
                    return newDate;
                }
            }
            return newDate;
        }
        function _strftime(s, maxsize, format, tm) {
            var tm_zone = HEAP32[(tm + 40) >> 2];
            var date = {
                tm_sec: HEAP32[tm >> 2],
                tm_min: HEAP32[(tm + 4) >> 2],
                tm_hour: HEAP32[(tm + 8) >> 2],
                tm_mday: HEAP32[(tm + 12) >> 2],
                tm_mon: HEAP32[(tm + 16) >> 2],
                tm_year: HEAP32[(tm + 20) >> 2],
                tm_wday: HEAP32[(tm + 24) >> 2],
                tm_yday: HEAP32[(tm + 28) >> 2],
                tm_isdst: HEAP32[(tm + 32) >> 2],
                tm_gmtoff: HEAP32[(tm + 36) >> 2],
                tm_zone: tm_zone ? UTF8ToString(tm_zone) : "",
            };
            var pattern = UTF8ToString(format);
            var EXPANSION_RULES_1 = {
                "%c": "%a %b %d %H:%M:%S %Y",
                "%D": "%m/%d/%y",
                "%F": "%Y-%m-%d",
                "%h": "%b",
                "%r": "%I:%M:%S %p",
                "%R": "%H:%M",
                "%T": "%H:%M:%S",
                "%x": "%m/%d/%y",
                "%X": "%H:%M:%S",
                "%Ec": "%c",
                "%EC": "%C",
                "%Ex": "%m/%d/%y",
                "%EX": "%H:%M:%S",
                "%Ey": "%y",
                "%EY": "%Y",
                "%Od": "%d",
                "%Oe": "%e",
                "%OH": "%H",
                "%OI": "%I",
                "%Om": "%m",
                "%OM": "%M",
                "%OS": "%S",
                "%Ou": "%u",
                "%OU": "%U",
                "%OV": "%V",
                "%Ow": "%w",
                "%OW": "%W",
                "%Oy": "%y",
            };
            for (var rule in EXPANSION_RULES_1) {
                pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_1[rule]);
            }
            var WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            function leadingSomething(value, digits, character) {
                var str = typeof value === "number" ? value.toString() : value || "";
                while (str.length < digits) {
                    str = character[0] + str;
                }
                return str;
            }
            function leadingNulls(value, digits) {
                return leadingSomething(value, digits, "0");
            }
            function compareByDay(date1, date2) {
                function sgn(value) {
                    return value < 0 ? -1 : value > 0 ? 1 : 0;
                }
                var compare;
                if ((compare = sgn(date1.getFullYear() - date2.getFullYear())) === 0) {
                    if ((compare = sgn(date1.getMonth() - date2.getMonth())) === 0) {
                        compare = sgn(date1.getDate() - date2.getDate());
                    }
                }
                return compare;
            }
            function getFirstWeekStartDate(janFourth) {
                switch (janFourth.getDay()) {
                    case 0:
                        return new Date(janFourth.getFullYear() - 1, 11, 29);
                    case 1:
                        return janFourth;
                    case 2:
                        return new Date(janFourth.getFullYear(), 0, 3);
                    case 3:
                        return new Date(janFourth.getFullYear(), 0, 2);
                    case 4:
                        return new Date(janFourth.getFullYear(), 0, 1);
                    case 5:
                        return new Date(janFourth.getFullYear() - 1, 11, 31);
                    case 6:
                        return new Date(janFourth.getFullYear() - 1, 11, 30);
                }
            }
            function getWeekBasedYear(date) {
                var thisDate = __addDays(new Date(date.tm_year + 1900, 0, 1), date.tm_yday);
                var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
                var janFourthNextYear = new Date(thisDate.getFullYear() + 1, 0, 4);
                var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
                var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
                if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
                    if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
                        return thisDate.getFullYear() + 1;
                    } else {
                        return thisDate.getFullYear();
                    }
                } else {
                    return thisDate.getFullYear() - 1;
                }
            }
            var EXPANSION_RULES_2 = {
                "%a": function (date) {
                    return WEEKDAYS[date.tm_wday].substring(0, 3);
                },
                "%A": function (date) {
                    return WEEKDAYS[date.tm_wday];
                },
                "%b": function (date) {
                    return MONTHS[date.tm_mon].substring(0, 3);
                },
                "%B": function (date) {
                    return MONTHS[date.tm_mon];
                },
                "%C": function (date) {
                    var year = date.tm_year + 1900;
                    return leadingNulls((year / 100) | 0, 2);
                },
                "%d": function (date) {
                    return leadingNulls(date.tm_mday, 2);
                },
                "%e": function (date) {
                    return leadingSomething(date.tm_mday, 2, " ");
                },
                "%g": function (date) {
                    return getWeekBasedYear(date).toString().substring(2);
                },
                "%G": function (date) {
                    return getWeekBasedYear(date);
                },
                "%H": function (date) {
                    return leadingNulls(date.tm_hour, 2);
                },
                "%I": function (date) {
                    var twelveHour = date.tm_hour;
                    if (twelveHour == 0) twelveHour = 12;
                    else if (twelveHour > 12) twelveHour -= 12;
                    return leadingNulls(twelveHour, 2);
                },
                "%j": function (date) {
                    return leadingNulls(date.tm_mday + __arraySum(__isLeapYear(date.tm_year + 1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon - 1), 3);
                },
                "%m": function (date) {
                    return leadingNulls(date.tm_mon + 1, 2);
                },
                "%M": function (date) {
                    return leadingNulls(date.tm_min, 2);
                },
                "%n": function () {
                    return "\n";
                },
                "%p": function (date) {
                    if (date.tm_hour >= 0 && date.tm_hour < 12) {
                        return "AM";
                    } else {
                        return "PM";
                    }
                },
                "%S": function (date) {
                    return leadingNulls(date.tm_sec, 2);
                },
                "%t": function () {
                    return "\t";
                },
                "%u": function (date) {
                    return date.tm_wday || 7;
                },
                "%U": function (date) {
                    var janFirst = new Date(date.tm_year + 1900, 0, 1);
                    var firstSunday = janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7 - janFirst.getDay());
                    var endDate = new Date(date.tm_year + 1900, date.tm_mon, date.tm_mday);
                    if (compareByDay(firstSunday, endDate) < 0) {
                        var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth() - 1) - 31;
                        var firstSundayUntilEndJanuary = 31 - firstSunday.getDate();
                        var days = firstSundayUntilEndJanuary + februaryFirstUntilEndMonth + endDate.getDate();
                        return leadingNulls(Math.ceil(days / 7), 2);
                    }
                    return compareByDay(firstSunday, janFirst) === 0 ? "01" : "00";
                },
                "%V": function (date) {
                    var janFourthThisYear = new Date(date.tm_year + 1900, 0, 4);
                    var janFourthNextYear = new Date(date.tm_year + 1901, 0, 4);
                    var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
                    var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
                    var endDate = __addDays(new Date(date.tm_year + 1900, 0, 1), date.tm_yday);
                    if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
                        return "53";
                    }
                    if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
                        return "01";
                    }
                    var daysDifference;
                    if (firstWeekStartThisYear.getFullYear() < date.tm_year + 1900) {
                        daysDifference = date.tm_yday + 32 - firstWeekStartThisYear.getDate();
                    } else {
                        daysDifference = date.tm_yday + 1 - firstWeekStartThisYear.getDate();
                    }
                    return leadingNulls(Math.ceil(daysDifference / 7), 2);
                },
                "%w": function (date) {
                    return date.tm_wday;
                },
                "%W": function (date) {
                    var janFirst = new Date(date.tm_year, 0, 1);
                    var firstMonday = janFirst.getDay() === 1 ? janFirst : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7 - janFirst.getDay() + 1);
                    var endDate = new Date(date.tm_year + 1900, date.tm_mon, date.tm_mday);
                    if (compareByDay(firstMonday, endDate) < 0) {
                        var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth() - 1) - 31;
                        var firstMondayUntilEndJanuary = 31 - firstMonday.getDate();
                        var days = firstMondayUntilEndJanuary + februaryFirstUntilEndMonth + endDate.getDate();
                        return leadingNulls(Math.ceil(days / 7), 2);
                    }
                    return compareByDay(firstMonday, janFirst) === 0 ? "01" : "00";
                },
                "%y": function (date) {
                    return (date.tm_year + 1900).toString().substring(2);
                },
                "%Y": function (date) {
                    return date.tm_year + 1900;
                },
                "%z": function (date) {
                    var off = date.tm_gmtoff;
                    var ahead = off >= 0;
                    off = Math.abs(off) / 60;
                    off = (off / 60) * 100 + (off % 60);
                    return (ahead ? "+" : "-") + String("0000" + off).slice(-4);
                },
                "%Z": function (date) {
                    return date.tm_zone;
                },
                "%%": function () {
                    return "%";
                },
            };
            for (var rule in EXPANSION_RULES_2) {
                if (pattern.indexOf(rule) >= 0) {
                    pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_2[rule](date));
                }
            }
            var bytes = intArrayFromString(pattern, false);
            if (bytes.length > maxsize) {
                return 0;
            }
            writeArrayToMemory(bytes, s);
            return bytes.length - 1;
        }
        function _strftime_l(s, maxsize, format, tm) {
            return _strftime(s, maxsize, format, tm);
        }
        FS.staticInit();
        if (ENVIRONMENT_HAS_NODE) {
            var fs = require("fs");
            var NODEJS_PATH = require("path");
            NODEFS.staticInit();
        }
        InternalError = Module["InternalError"] = extendError(Error, "InternalError");
        embind_init_charCodes();
        BindingError = Module["BindingError"] = extendError(Error, "BindingError");
        init_ClassHandle();
        init_RegisteredPointer();
        init_embind();
        UnboundTypeError = Module["UnboundTypeError"] = extendError(Error, "UnboundTypeError");
        init_emval();
        var GLctx;
        GL.init();
        for (var i = 0; i < 32; i++) __tempFixedLengthArray.push(new Array(i));
        function intArrayFromString(stringy, dontAddNull, length) {
            var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
            var u8array = new Array(len);
            var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
            if (dontAddNull) u8array.length = numBytesWritten;
            return u8array;
        }
        var asmGlobalArg = {};
        var asmLibraryArg = {
            e: abort,
            Ra: setTempRet0,
            b: ___assert_fail,
            p: ___cxa_allocate_exception,
            Oa: ___cxa_pure_virtual,
            n: ___cxa_throw,
            Ea: ___cxa_uncaught_exceptions,
            A: ___lock,
            ja: ___map_file,
            z: ___setErrNo,
            Q: ___syscall140,
            ed: ___syscall145,
            F: ___syscall146,
            Lc: ___syscall54,
            Ac: ___syscall6,
            pc: ___syscall91,
            y: ___unlock,
            Wb: __embind_finalize_value_object,
            Lb: __embind_register_bool,
            Ab: __embind_register_class,
            pb: __embind_register_class_constructor,
            E: __embind_register_class_function,
            l: __embind_register_class_property,
            Qa: __embind_register_emval,
            m: __embind_register_enum,
            d: __embind_register_enum_value,
            D: __embind_register_float,
            h: __embind_register_integer,
            g: __embind_register_memory_view,
            C: __embind_register_std_string,
            Pa: __embind_register_std_wstring,
            Na: __embind_register_value_object,
            w: __embind_register_value_object_field,
            Ma: __embind_register_void,
            r: __emval_as,
            La: __emval_call_void_method,
            f: __emval_decref,
            Ka: __emval_get_method_caller,
            B: __emval_get_module_property,
            o: __emval_get_property,
            v: __emval_incref,
            Ja: __emval_new,
            i: __emval_new_cstring,
            Ia: __emval_new_object,
            q: __emval_run_destructors,
            u: __emval_set_property,
            t: __emval_take_value,
            c: _abort,
            Ha: _emscripten_get_heap_size,
            Ga: _emscripten_glActiveTexture,
            Fa: _emscripten_glAttachShader,
            Da: _emscripten_glBeginQueryEXT,
            Ca: _emscripten_glBindAttribLocation,
            Ba: _emscripten_glBindBuffer,
            Aa: _emscripten_glBindFramebuffer,
            za: _emscripten_glBindRenderbuffer,
            ya: _emscripten_glBindTexture,
            xa: _emscripten_glBindVertexArrayOES,
            wa: _emscripten_glBlendColor,
            va: _emscripten_glBlendEquation,
            ua: _emscripten_glBlendEquationSeparate,
            ta: _emscripten_glBlendFunc,
            sa: _emscripten_glBlendFuncSeparate,
            ra: _emscripten_glBufferData,
            qa: _emscripten_glBufferSubData,
            pa: _emscripten_glCheckFramebufferStatus,
            oa: _emscripten_glClear,
            na: _emscripten_glClearColor,
            ma: _emscripten_glClearDepthf,
            la: _emscripten_glClearStencil,
            ka: _emscripten_glColorMask,
            ia: _emscripten_glCompileShader,
            ha: _emscripten_glCompressedTexImage2D,
            ga: _emscripten_glCompressedTexSubImage2D,
            fa: _emscripten_glCopyTexImage2D,
            ea: _emscripten_glCopyTexSubImage2D,
            da: _emscripten_glCreateProgram,
            ca: _emscripten_glCreateShader,
            ba: _emscripten_glCullFace,
            aa: _emscripten_glDeleteBuffers,
            $: _emscripten_glDeleteFramebuffers,
            _: _emscripten_glDeleteProgram,
            Z: _emscripten_glDeleteQueriesEXT,
            Y: _emscripten_glDeleteRenderbuffers,
            X: _emscripten_glDeleteShader,
            W: _emscripten_glDeleteTextures,
            V: _emscripten_glDeleteVertexArraysOES,
            U: _emscripten_glDepthFunc,
            T: _emscripten_glDepthMask,
            S: _emscripten_glDepthRangef,
            R: _emscripten_glDetachShader,
            P: _emscripten_glDisable,
            O: _emscripten_glDisableVertexAttribArray,
            N: _emscripten_glDrawArrays,
            M: _emscripten_glDrawArraysInstancedANGLE,
            L: _emscripten_glDrawBuffersWEBGL,
            K: _emscripten_glDrawElements,
            J: _emscripten_glDrawElementsInstancedANGLE,
            I: _emscripten_glEnable,
            H: _emscripten_glEnableVertexAttribArray,
            G: _emscripten_glEndQueryEXT,
            dd: _emscripten_glFinish,
            cd: _emscripten_glFlush,
            bd: _emscripten_glFramebufferRenderbuffer,
            ad: _emscripten_glFramebufferTexture2D,
            $c: _emscripten_glFrontFace,
            _c: _emscripten_glGenBuffers,
            Zc: _emscripten_glGenFramebuffers,
            Yc: _emscripten_glGenQueriesEXT,
            Xc: _emscripten_glGenRenderbuffers,
            Wc: _emscripten_glGenTextures,
            Vc: _emscripten_glGenVertexArraysOES,
            Uc: _emscripten_glGenerateMipmap,
            Tc: _emscripten_glGetActiveAttrib,
            Sc: _emscripten_glGetActiveUniform,
            Rc: _emscripten_glGetAttachedShaders,
            Qc: _emscripten_glGetAttribLocation,
            Pc: _emscripten_glGetBooleanv,
            Oc: _emscripten_glGetBufferParameteriv,
            Nc: _emscripten_glGetError,
            Mc: _emscripten_glGetFloatv,
            Kc: _emscripten_glGetFramebufferAttachmentParameteriv,
            Jc: _emscripten_glGetIntegerv,
            Ic: _emscripten_glGetProgramInfoLog,
            Hc: _emscripten_glGetProgramiv,
            Gc: _emscripten_glGetQueryObjecti64vEXT,
            Fc: _emscripten_glGetQueryObjectivEXT,
            Ec: _emscripten_glGetQueryObjectui64vEXT,
            Dc: _emscripten_glGetQueryObjectuivEXT,
            Cc: _emscripten_glGetQueryivEXT,
            Bc: _emscripten_glGetRenderbufferParameteriv,
            zc: _emscripten_glGetShaderInfoLog,
            yc: _emscripten_glGetShaderPrecisionFormat,
            xc: _emscripten_glGetShaderSource,
            wc: _emscripten_glGetShaderiv,
            vc: _emscripten_glGetString,
            uc: _emscripten_glGetTexParameterfv,
            tc: _emscripten_glGetTexParameteriv,
            sc: _emscripten_glGetUniformLocation,
            rc: _emscripten_glGetUniformfv,
            qc: _emscripten_glGetUniformiv,
            oc: _emscripten_glGetVertexAttribPointerv,
            nc: _emscripten_glGetVertexAttribfv,
            mc: _emscripten_glGetVertexAttribiv,
            lc: _emscripten_glHint,
            kc: _emscripten_glIsBuffer,
            jc: _emscripten_glIsEnabled,
            ic: _emscripten_glIsFramebuffer,
            hc: _emscripten_glIsProgram,
            gc: _emscripten_glIsQueryEXT,
            fc: _emscripten_glIsRenderbuffer,
            ec: _emscripten_glIsShader,
            dc: _emscripten_glIsTexture,
            cc: _emscripten_glIsVertexArrayOES,
            bc: _emscripten_glLineWidth,
            ac: _emscripten_glLinkProgram,
            $b: _emscripten_glPixelStorei,
            _b: _emscripten_glPolygonOffset,
            Zb: _emscripten_glQueryCounterEXT,
            Yb: _emscripten_glReadPixels,
            Xb: _emscripten_glReleaseShaderCompiler,
            Vb: _emscripten_glRenderbufferStorage,
            Ub: _emscripten_glSampleCoverage,
            Tb: _emscripten_glScissor,
            Sb: _emscripten_glShaderBinary,
            Rb: _emscripten_glShaderSource,
            Qb: _emscripten_glStencilFunc,
            Pb: _emscripten_glStencilFuncSeparate,
            Ob: _emscripten_glStencilMask,
            Nb: _emscripten_glStencilMaskSeparate,
            Mb: _emscripten_glStencilOp,
            Kb: _emscripten_glStencilOpSeparate,
            Jb: _emscripten_glTexImage2D,
            Ib: _emscripten_glTexParameterf,
            Hb: _emscripten_glTexParameterfv,
            Gb: _emscripten_glTexParameteri,
            Fb: _emscripten_glTexParameteriv,
            Eb: _emscripten_glTexSubImage2D,
            Db: _emscripten_glUniform1f,
            Cb: _emscripten_glUniform1fv,
            Bb: _emscripten_glUniform1i,
            zb: _emscripten_glUniform1iv,
            yb: _emscripten_glUniform2f,
            xb: _emscripten_glUniform2fv,
            wb: _emscripten_glUniform2i,
            vb: _emscripten_glUniform2iv,
            ub: _emscripten_glUniform3f,
            tb: _emscripten_glUniform3fv,
            sb: _emscripten_glUniform3i,
            rb: _emscripten_glUniform3iv,
            qb: _emscripten_glUniform4f,
            ob: _emscripten_glUniform4fv,
            nb: _emscripten_glUniform4i,
            mb: _emscripten_glUniform4iv,
            lb: _emscripten_glUniformMatrix2fv,
            kb: _emscripten_glUniformMatrix3fv,
            jb: _emscripten_glUniformMatrix4fv,
            ib: _emscripten_glUseProgram,
            hb: _emscripten_glValidateProgram,
            gb: _emscripten_glVertexAttrib1f,
            fb: _emscripten_glVertexAttrib1fv,
            eb: _emscripten_glVertexAttrib2f,
            db: _emscripten_glVertexAttrib2fv,
            cb: _emscripten_glVertexAttrib3f,
            bb: _emscripten_glVertexAttrib3fv,
            ab: _emscripten_glVertexAttrib4f,
            $a: _emscripten_glVertexAttrib4fv,
            _a: _emscripten_glVertexAttribDivisorANGLE,
            Za: _emscripten_glVertexAttribPointer,
            Ya: _emscripten_glViewport,
            Xa: _emscripten_memcpy_big,
            Wa: _emscripten_resize_heap,
            x: _exit,
            s: _getenv,
            k: _llvm_stackrestore,
            j: _llvm_stacksave,
            Va: _llvm_trap,
            Ua: _pthread_cond_wait,
            Ta: _strftime_l,
            Sa: abortOnCannotGrowMemory,
            a: DYNAMICTOP_PTR,
        };
        var asm = Module["asm"](asmGlobalArg, asmLibraryArg, buffer);
        Module["asm"] = asm;
        var __ZSt18uncaught_exceptionv = (Module["__ZSt18uncaught_exceptionv"] = function () {
            return Module["asm"]["fd"].apply(null, arguments);
        });
        var ___embind_register_native_and_builtin_types = (Module["___embind_register_native_and_builtin_types"] = function () {
            return Module["asm"]["gd"].apply(null, arguments);
        });
        var ___errno_location = (Module["___errno_location"] = function () {
            return Module["asm"]["hd"].apply(null, arguments);
        });
        var ___getTypeName = (Module["___getTypeName"] = function () {
            return Module["asm"]["id"].apply(null, arguments);
        });
        var _free = (Module["_free"] = function () {
            return Module["asm"]["jd"].apply(null, arguments);
        });
        var _malloc = (Module["_malloc"] = function () {
            return Module["asm"]["kd"].apply(null, arguments);
        });
        var globalCtors = (Module["globalCtors"] = function () {
            return Module["asm"]["Wd"].apply(null, arguments);
        });
        var stackAlloc = (Module["stackAlloc"] = function () {
            return Module["asm"]["Xd"].apply(null, arguments);
        });
        var stackRestore = (Module["stackRestore"] = function () {
            return Module["asm"]["Yd"].apply(null, arguments);
        });
        var stackSave = (Module["stackSave"] = function () {
            return Module["asm"]["Zd"].apply(null, arguments);
        });
        var dynCall_i = (Module["dynCall_i"] = function () {
            return Module["asm"]["ld"].apply(null, arguments);
        });
        var dynCall_ii = (Module["dynCall_ii"] = function () {
            return Module["asm"]["md"].apply(null, arguments);
        });
        var dynCall_iidiiii = (Module["dynCall_iidiiii"] = function () {
            return Module["asm"]["nd"].apply(null, arguments);
        });
        var dynCall_iii = (Module["dynCall_iii"] = function () {
            return Module["asm"]["od"].apply(null, arguments);
        });
        var dynCall_iiii = (Module["dynCall_iiii"] = function () {
            return Module["asm"]["pd"].apply(null, arguments);
        });
        var dynCall_iiiii = (Module["dynCall_iiiii"] = function () {
            return Module["asm"]["qd"].apply(null, arguments);
        });
        var dynCall_iiiiid = (Module["dynCall_iiiiid"] = function () {
            return Module["asm"]["rd"].apply(null, arguments);
        });
        var dynCall_iiiiii = (Module["dynCall_iiiiii"] = function () {
            return Module["asm"]["sd"].apply(null, arguments);
        });
        var dynCall_iiiiiid = (Module["dynCall_iiiiiid"] = function () {
            return Module["asm"]["td"].apply(null, arguments);
        });
        var dynCall_iiiiiii = (Module["dynCall_iiiiiii"] = function () {
            return Module["asm"]["ud"].apply(null, arguments);
        });
        var dynCall_iiiiiiii = (Module["dynCall_iiiiiiii"] = function () {
            return Module["asm"]["vd"].apply(null, arguments);
        });
        var dynCall_iiiiiiiii = (Module["dynCall_iiiiiiiii"] = function () {
            return Module["asm"]["wd"].apply(null, arguments);
        });
        var dynCall_iiiiiijii = (Module["dynCall_iiiiiijii"] = function () {
            return Module["asm"]["xd"].apply(null, arguments);
        });
        var dynCall_iiiiij = (Module["dynCall_iiiiij"] = function () {
            return Module["asm"]["yd"].apply(null, arguments);
        });
        var dynCall_iij = (Module["dynCall_iij"] = function () {
            return Module["asm"]["zd"].apply(null, arguments);
        });
        var dynCall_jiji = (Module["dynCall_jiji"] = function () {
            return Module["asm"]["Ad"].apply(null, arguments);
        });
        var dynCall_v = (Module["dynCall_v"] = function () {
            return Module["asm"]["Bd"].apply(null, arguments);
        });
        var dynCall_vf = (Module["dynCall_vf"] = function () {
            return Module["asm"]["Cd"].apply(null, arguments);
        });
        var dynCall_vff = (Module["dynCall_vff"] = function () {
            return Module["asm"]["Dd"].apply(null, arguments);
        });
        var dynCall_vffff = (Module["dynCall_vffff"] = function () {
            return Module["asm"]["Ed"].apply(null, arguments);
        });
        var dynCall_vfi = (Module["dynCall_vfi"] = function () {
            return Module["asm"]["Fd"].apply(null, arguments);
        });
        var dynCall_vi = (Module["dynCall_vi"] = function () {
            return Module["asm"]["Gd"].apply(null, arguments);
        });
        var dynCall_vif = (Module["dynCall_vif"] = function () {
            return Module["asm"]["Hd"].apply(null, arguments);
        });
        var dynCall_viff = (Module["dynCall_viff"] = function () {
            return Module["asm"]["Id"].apply(null, arguments);
        });
        var dynCall_vifff = (Module["dynCall_vifff"] = function () {
            return Module["asm"]["Jd"].apply(null, arguments);
        });
        var dynCall_viffff = (Module["dynCall_viffff"] = function () {
            return Module["asm"]["Kd"].apply(null, arguments);
        });
        var dynCall_vii = (Module["dynCall_vii"] = function () {
            return Module["asm"]["Ld"].apply(null, arguments);
        });
        var dynCall_viif = (Module["dynCall_viif"] = function () {
            return Module["asm"]["Md"].apply(null, arguments);
        });
        var dynCall_viii = (Module["dynCall_viii"] = function () {
            return Module["asm"]["Nd"].apply(null, arguments);
        });
        var dynCall_viiii = (Module["dynCall_viiii"] = function () {
            return Module["asm"]["Od"].apply(null, arguments);
        });
        var dynCall_viiiii = (Module["dynCall_viiiii"] = function () {
            return Module["asm"]["Pd"].apply(null, arguments);
        });
        var dynCall_viiiiii = (Module["dynCall_viiiiii"] = function () {
            return Module["asm"]["Qd"].apply(null, arguments);
        });
        var dynCall_viiiiiii = (Module["dynCall_viiiiiii"] = function () {
            return Module["asm"]["Rd"].apply(null, arguments);
        });
        var dynCall_viiiiiiii = (Module["dynCall_viiiiiiii"] = function () {
            return Module["asm"]["Sd"].apply(null, arguments);
        });
        var dynCall_viiiiiiiii = (Module["dynCall_viiiiiiiii"] = function () {
            return Module["asm"]["Td"].apply(null, arguments);
        });
        var dynCall_viiiiiiiiii = (Module["dynCall_viiiiiiiiii"] = function () {
            return Module["asm"]["Ud"].apply(null, arguments);
        });
        var dynCall_viijii = (Module["dynCall_viijii"] = function () {
            return Module["asm"]["Vd"].apply(null, arguments);
        });
        Module["asm"] = asm;
        Module["GL"] = GL;
        var calledRun;
        Module["then"] = function (func) {
            if (calledRun) {
                func(Module);
            } else {
                var old = Module["onRuntimeInitialized"];
                Module["onRuntimeInitialized"] = function () {
                    if (old) old();
                    func(Module);
                };
            }
            return Module;
        };
        function ExitStatus(status) {
            this.name = "ExitStatus";
            this.message = "Program terminated with exit(" + status + ")";
            this.status = status;
        }
        dependenciesFulfilled = function runCaller() {
            if (!calledRun) run();
            if (!calledRun) dependenciesFulfilled = runCaller;
        };
        function run(args) {
            args = args || arguments_;
            if (runDependencies > 0) {
                return;
            }
            preRun();
            if (runDependencies > 0) return;
            function doRun() {
                if (calledRun) return;
                calledRun = true;
                if (ABORT) return;
                initRuntime();
                preMain();
                if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
                postRun();
            }
            if (Module["setStatus"]) {
                Module["setStatus"]("Running...");
                setTimeout(function () {
                    setTimeout(function () {
                        Module["setStatus"]("");
                    }, 1);
                    doRun();
                }, 1);
            } else {
                doRun();
            }
        }
        Module["run"] = run;
        function exit(status, implicit) {
            if (implicit && noExitRuntime && status === 0) {
                return;
            }
            if (noExitRuntime) {
            } else {
                ABORT = true;
                EXITSTATUS = status;
                exitRuntime();
                if (Module["onExit"]) Module["onExit"](status);
            }
            quit_(status, new ExitStatus(status));
        }
        function abort(what) {
            if (Module["onAbort"]) {
                Module["onAbort"](what);
            }
            what += "";
            out(what);
            err(what);
            ABORT = true;
            EXITSTATUS = 1;
            throw "abort(" + what + "). Build with -s ASSERTIONS=1 for more info.";
        }
        Module["abort"] = abort;
        if (Module["preInit"]) {
            if (typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]];
            while (Module["preInit"].length > 0) {
                Module["preInit"].pop()();
            }
        }
        noExitRuntime = true;
        run();

        return LIBKTX;
    };
})();
if (typeof exports === "object" && typeof module === "object") module.exports = LIBKTX;
else if (typeof define === "function" && define["amd"])
    define([], function () {
        return LIBKTX;
    });
else if (typeof exports === "object") exports["LIBKTX"] = LIBKTX;
