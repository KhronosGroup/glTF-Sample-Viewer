import { GltfState, GltfView, ResourceLoaderUtils } from "@khronosgroup/gltf-viewer";
import createDracoDecoderModule from "draco3d/draco_decoder_nodejs.js";
import dracoDecoderWasmUrl from "draco3d/draco_decoder.wasm?url";

import { createCameraController } from "./logic/camera_controller.js";
import { UIModel } from "./logic/uimodel.js";
import { GltfModelPathProvider, fillEnvironmentWithPaths } from "./model_path_provider.js";
import { getViewerState, updatePublished, updateUi, viewerStore } from "./logic/viewer_store.js";
import { setCommand } from "./logic/commands.js";
import { notify } from "./logic/notifications.js";
import { attachDropZone } from "./logic/canvas_input.js";

import { validateBytes } from "gltf-validator";

// Toggles that only flip a flag in renderingParameters.enabledExtensions.
// Maps the Advanced panel extension keys to their renderingParameters.enabledExtensions keys.
const EXTENSION_KEYS = {
    clearcoat: "KHR_materials_clearcoat",
    sheen: "KHR_materials_sheen",
    transmission: "KHR_materials_transmission",
    diffuseTransmission: "KHR_materials_diffuse_transmission",
    volume: "KHR_materials_volume",
    scattering: "KHR_materials_scatter",
    ior: "KHR_materials_ior",
    iridescence: "KHR_materials_iridescence",
    retroreflection: "KHR_materials_retroreflection",
    anisotropy: "KHR_materials_anisotropy",
    dispersion: "KHR_materials_dispersion",
    specular: "KHR_materials_specular",
    emissiveStrength: "KHR_materials_emissive_strength",
    hoverability: "KHR_node_hoverability",
    selectability: "KHR_node_selectability",
    nodeVisibility: "KHR_node_visibility",
    gaussianSplatting: "KHR_gaussian_splatting"
};

const ENVIRONMENT_ROTATIONS = { "+Z": 90.0, "-X": 180.0, "-Z": 270.0, "+X": 0.0 };

/**
 * One mirror entry: the store field, the `renderingParameters` field, and an
 * optional transform applied to the store value before assignment.
 * @typedef {[string, string, ((value: any) => any)?]} MirrorEntry
 */

/**
 * Declarative mirror of `config.lighting` onto the renderer's mutable
 * `renderingParameters`.
 * @type {MirrorEntry[]}
 */
const LIGHTING_FIELDS = [
    ["ibl", "useIBL"],
    ["punctualLights", "usePunctual"],
    ["renderEnv", "renderEnvironmentMap"],
    ["blurEnv", "blurEnvironmentMap"],
    ["iblIntensity", "iblIntensity", (value) => Math.pow(10, value)],
    ["exposure", "exposure", (value) => 1.0 / Math.pow(2.0, value)],
    ["toneMap", "toneMap"],
    ["rotation", "environmentRotation", (value) => ENVIRONMENT_ROTATIONS[value]]
];

/**
 * Direct one-to-one mirrors of `config.extensions` onto `renderingParameters`.
 * @type {MirrorEntry[]}
 */
const EXTENSION_FIELDS = [
    ["skinning", "skinning"],
    ["morphing", "morphing"],
    ["wireframe", "wireframe"],
    ["lightGizmos", "lightGizmos"],
    ["cameraGizmos", "cameraGizmos"],
    ["jointGizmos", "jointGizmos"],
    ["aabbGizmos", "aabbGizmos"],
    ["floatingPointFramebuffer", "floatingPointFramebuffer"]
];

function hexToLinearColor(hex) {
    const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (match === null) {
        return undefined;
    }
    return [
        parseInt(match[1], 16) / 255.0,
        parseInt(match[2], 16) / 255.0,
        parseInt(match[3], 16) / 255.0,
        1.0
    ];
}

// The decoder's Emscripten glue looks for its .wasm next to itself, which is not where
// the bundler puts it.
const dracoDecoderLib = (moduleOptions) =>
    createDracoDecoderModule({ ...moduleOptions, locateFile: () => dracoDecoderWasmUrl });

// Transforms a local-space point by a column-major mat4.
const transformPoint = (matrix, point) => {
    const x = point[0];
    const y = point[1];
    const z = point[2];
    const w = matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15] || 1;
    return [
        (matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12]) / w,
        (matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13]) / w,
        (matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14]) / w
    ];
};

// Averages the world-space centroids of a node's mesh primitives.
const nodeWorldCentroid = (gltf, node) => {
    const mesh = node?.mesh !== undefined ? gltf?.meshes?.[node.mesh] : undefined;
    if (!mesh) return undefined;
    const worldTransform = node.getRenderedWorldTransform();
    if (!worldTransform) return undefined;

    const sum = [0, 0, 0];
    let count = 0;
    for (const primitive of mesh.primitives) {
        if (!primitive.centroid) continue;
        const point = transformPoint(worldTransform, primitive.centroid);
        sum[0] += point[0];
        sum[1] += point[1];
        sum[2] += point[2];
        count += 1;
    }
    return count > 0 ? [sum[0] / count, sum[1] / count, sum[2] / count] : undefined;
};

/**
 * Boots the viewer against a canvas and returns a teardown function.
 *
 * Everything acquired here — the render loop, the WebGL context, the physics
 * engine, the canvas listeners and the event subscriptions — is released again,
 * so the whole thing can be started twice in a row without leaking. React's
 * StrictMode does exactly that in development.
 */
export const initViewer = async (canvas) => {
    // The drop zone is attached before the slow startup awaits below, so a file
    // dropped while the viewer is still initialising is captured and buffered
    // rather than landing on a canvas with no handler yet.
    const pendingDrops = [];
    let dropHandler = (entries) => pendingDrops.push(entries);
    const detachDropZone = attachDropZone(
        canvas,
        (entries) => dropHandler(entries),
        () => updateUi({ showDropDownOverlay: false })
    );

    const context = canvas.getContext("webgl2", {
        alpha: false,
        antialias: true
    });
    updatePublished({
        supportsFloatingPointFramebuffer:
            !!context.getExtension("EXT_color_buffer_half_float") ||
            !!context.getExtension("EXT_color_buffer_float"),
        supportsWireframe: !!context.getExtension("WEBGL_polygon_mode"),
        supportsClipping: !!context.getExtension("WEBGL_clip_cull_distance")
    });

    const view = new GltfView(context);
    const resourceLoader = view.createResourceLoader(dracoDecoderLib);
    const state = view.createState();
    const cameraController = createCameraController(state);

    await state.physicsController.initializeEngine("NvidiaPhysX");
    updatePublished({ physicsEngineVersion: state.physicsController.getEngineVersion() });

    state.renderingParameters.useDirectionalLightsWithDisabledIBL = true;
    state.renderingParameters.toneMap = GltfState.ToneMaps.KHR_PBR_NEUTRAL;
    state.renderingParameters.debugOutput = GltfState.DebugOutput.NONE;

    state.graphController.addCustomEventListener("test/onSuccess", () => {
        const message = "Interactivity test succeeded";
        notify(message, "success");
    });
    state.graphController.addCustomEventListener("test/onFailed", () => {
        const message = "Interactivity test failed";
        console.error(message);
    });

    const emptyGltf = await resourceLoader.loadGltf(undefined, undefined, false);

    const pathProvider = new GltfModelPathProvider(
        "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main"
    );
    await pathProvider.initialize();
    const environmentPaths = fillEnvironmentWithPaths(
        {
            Cannon_Exterior: "Cannon Exterior",
            footprint_court: "Footprint Court",
            pisa: "Pisa",
            doge2: "Doge's palace",
            ennis: "Dining room",
            field: "Field",
            helipad: "Helipad Goldenhour",
            papermill: "Papermill Ruins",
            neutral: "Studio Neutral",
            Colorful_Studio: "Colorful Studio",
            Wide_Street: "Wide Street"
        },
        "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Environments/low_resolution_hdrs/"
    );

    const uiModel = new UIModel(pathProvider, environmentPaths, canvas);

    // Collected so every store subscription and command can be removed again on teardown.
    const subscriptions = [];

    // Applies a store change to the renderer and asks for a repaint.
    const applyRenderChange = (selector, apply) =>
        subscriptions.push(viewerStore.subscribe(selector, (next, previous) => {
            apply(next, previous);
            redraw = true;
        }));

    // True once torn down, so in-flight async work stops applying state.
    let disposed = false;

    // Only redraw glTF view upon user inputs, or when an animation is playing.
    let redraw = false;

    // A double-click asks the camera to focus on the picked node; the picking
    // result arrives on the next frame via the renderer's selection callback.
    let pendingFocus = false;
    state.selectionCallback = (result) => {
        if (!pendingFocus) return;
        const focus = nodeWorldCentroid(state.gltf, result.node) ?? result.position;
        if (focus) {
            cameraController.focusOn(focus);
            pendingFocus = false;
            redraw = true;
        }
    };

    // ---------------------------------------------------------------- loading

    // Validation and loading both consume model selections. A newer selection
    // makes an older result irrelevant, so each carries an id and anything
    // stale is dropped rather than applied.
    let latestValidationId = 0;

    const validateModel = async (model) => {
        const validationId = ++latestValidationId;
        // TODO: Remove ignoredIssues once validator is updated to support KHR_gaussian_splatting extension
        const validateOptions = { ignoredIssues: ["MESH_PRIMITIVE_INVALID_ATTRIBUTE"] };
        let report;

        try {
            if (typeof model.mainFile === "string") {
                const parent = model.mainFile.substring(0, model.mainFile.lastIndexOf("/") + 1);
                validateOptions.uri = model.mainFile;
                validateOptions.externalResourceFunction = async (uri) =>
                    new Uint8Array(await (await fetch(parent + uri)).arrayBuffer());

                const buffer = await (await fetch(model.mainFile)).arrayBuffer();
                report = await validateBytes(new Uint8Array(buffer), validateOptions);
            } else if (Array.isArray(model.mainFile)) {
                validateOptions.uri = model.mainFile[0];
                validateOptions.externalResourceFunction = async (uri) => {
                    let actualPath = uri;
                    if (!ResourceLoaderUtils.isAbsoluteUrl(uri)) {
                        const parentPath = ResourceLoaderUtils.getContainingFolder(
                            model.mainFile[0]
                        );
                        actualPath = ResourceLoaderUtils.cleanRelativePath(parentPath + uri);
                    }
                    const found = model.additionalFiles.find(([path]) => path === actualPath);
                    if (found === undefined) {
                        throw new Error(`Missing file '${uri}'`);
                    }
                    return new Uint8Array(await found[1].arrayBuffer());
                };

                const buffer = await model.mainFile[1].arrayBuffer();
                report = await validateBytes(new Uint8Array(buffer), validateOptions);
            }
        } catch (error) {
            console.error(`Validation failed: ${error}`);
            report = { error: `Validation failed: ${error}` };
        }

        if (validationId === latestValidationId && !disposed) {
            uiModel.publishValidationReport(report);
        }
    };

    // A glTF load cannot be cancelled once it has started, and two of them running at the
    // same time corrupt each other's texture state. Queue the loads instead, and discard
    // any result that a newer selection has already superseded.
    let queuedLoads = Promise.resolve();
    let latestLoadId = 0;

    const applyLoadedGltf = (gltf) => {
        state.gltf = gltf;
        const defaultScene = state.gltf.scene;
        state.sceneIndex = defaultScene === undefined ? 0 : defaultScene;
        state.cameraNodeIndex = undefined;

        if (state.gltf.scenes.length != 0) {
            if (state.sceneIndex > state.gltf.scenes.length - 1) {
                state.sceneIndex = 0;
            }
            const scene = state.gltf.scenes[state.sceneIndex];
            scene.applyTransformHierarchy(state.gltf);
            state.userCamera.perspective.aspectRatio = canvas.width / canvas.height;
            state.userCamera.resetView(state.gltf, state.sceneIndex);

            const urlParams = new URLSearchParams(window.location.search);
            const yaw = urlParams.get("yaw") ?? 0;
            const pitch = urlParams.get("pitch") ?? 0;
            const distance = urlParams.get("distance") ?? 0;
            state.userCamera.orbit(
                (yaw * (Math.PI / 180)) / state.userCamera.orbitSpeed,
                (pitch * (Math.PI / 180)) / state.userCamera.orbitSpeed
            );
            state.userCamera.zoomBy(distance);
            cameraController.syncProjection();

            state.animationIndices = [];
            for (let i = 0; i < gltf.animations.length; i++) {
                if (!gltf.nonDisjointAnimations(state.animationIndices).includes(i)) {
                    state.animationIndices.push(i);
                }
            }
            state.animationTimer.clearTimeOverride();
            state.animationTimer.start();
            if (state.gltf?.extensions?.KHR_interactivity?.graphs !== undefined) {
                state.graphController.initializeGraphs(state);
                const graphIndex = state.gltf.extensions.KHR_interactivity.graph ?? 0;
                state.graphController.loadGraph(graphIndex);
                state.graphController.resumeGraph();
            } else {
                state.graphController.stopGraphEngine();
            }

            state.physicsController.loadScene(state, state.sceneIndex);
            state.physicsController.resumeSimulation();
        }
    };

    const loadModel = (model) => {
        const loadId = ++latestLoadId;
        uiModel.goToLoadingState();

        const run = queuedLoads.then(async () => {
            if (loadId !== latestLoadId || disposed) {
                return;
            }

            // Workaround for errors in ktx lib after loading an asset with ktx2 files for the second time:
            resourceLoader.initKtxLib();

            try {
                const gltf = await resourceLoader.loadGltf(
                    model.mainFile,
                    model.additionalFiles,
                    true
                );
                if (loadId !== latestLoadId) {
                    return;
                }
                applyLoadedGltf(gltf);
            } catch (error) {
                console.error("Loading failed: " + error);
                if (loadId !== latestLoadId) {
                    return;
                }
                state.gltf = emptyGltf;
                state.sceneIndex = 0;
                state.cameraNodeIndex = undefined;
            }

            uiModel.publishGltfLoaded(state);
            uiModel.publishStatistics(view.gatherStatistics(state));
            uiModel.exitLoadingState();
            redraw = true;
        });

        queuedLoads = run.catch((error) => {
            console.error(error);
            uiModel.exitLoadingState();
        });
    };

    uiModel.onModel((model) => validateModel(model));
    uiModel.onModel((model) => loadModel(model));

    uiModel.onHdr((hdr) => {
        resourceLoader.loadEnvironment(hdr.hdr_path).then((environment) => {
            state.environment = environment;
            // We need to wait until the environment is loaded to redraw
            redraw = true;
        });
    });

    // ------------------------------------------------------------ user inputs

    const applyInteractivity = (enabled) => {
        state.renderingParameters.enabledExtensions.KHR_interactivity = enabled;
        if (state.gltf?.extensions?.KHR_interactivity === undefined) {
            return;
        }
        if (enabled) {
            state.graphController.initializeGraphs(state);
            state.graphController.loadGraph(state.gltf.extensions.KHR_interactivity.graph ?? 0);
            if (getViewerState().selection.graphState) {
                state.graphController.resumeGraph();
                state.animationTimer.unpause();
            } else {
                state.graphController.pauseGraph();
                state.animationTimer.pause();
            }
        } else {
            state.graphController.stopGraphEngine();
            if (getViewerState().selection.animationState) {
                state.animationTimer.unpause();
            } else {
                state.animationTimer.pause();
            }
        }
    };

    /**
     * @param {import("./logic/viewer_store.js").LightingConfig} lighting
     */
    const applyLighting = (lighting) => {
        for (const [from, to, transform] of LIGHTING_FIELDS) {
            state.renderingParameters[to] = transform ? transform(lighting[from]) : lighting[from];
        }
    };

    /**
     * @param {import("./logic/viewer_store.js").ExtensionsConfig} extensions
     * @param {import("./logic/viewer_store.js").ExtensionsConfig} [previous]
     */
    const applyExtensions = (extensions, previous) => {
        for (const [from, to] of EXTENSION_FIELDS) {
            state.renderingParameters[to] = extensions[from];
        }
        for (const [key, extension] of Object.entries(EXTENSION_KEYS)) {
            state.renderingParameters.enabledExtensions[extension] = extensions[key];
        }
        if (extensions.interactivity !== previous?.interactivity) {
            applyInteractivity(extensions.interactivity);
        }
    };

    applyRenderChange((s) => s.config.lighting, applyLighting);
    applyRenderChange((s) => s.config.extensions, applyExtensions);
    applyRenderChange((s) => s.config.debugChannel, (v) => {
        state.renderingParameters.debugOutput = v;
    });
    applyRenderChange((s) => s.config.clipping, (v) => {
        state.renderingParameters.clipping = { ...state.renderingParameters.clipping, ...v };
    });
    applyRenderChange((s) => s.config.physicsDebug, (debug) => {
        state.physicsController.enableDebugColliders(debug.colliders);
        state.physicsController.enableDebugJoints(debug.joints);
    });
    applyRenderChange((s) => s.selection.selectedVariant, (v) => {
        state.variant = v;
    });

    const applyMorphWeightOverrides = (overrides) => {
        state.gltf.nodes.forEach((node, nodeIndex) => {
            const nodeOverrides = overrides[nodeIndex];
            const targetCount = state.gltf.meshes[node.mesh]?.primitives[0]?.targets.length ?? 0;
            if (nodeOverrides === undefined || targetCount === 0) {
                node.morphWeightOverrides = undefined;
                return;
            }
            const weights = Array.from(
                { length: targetCount },
                (_, targetIndex) => nodeOverrides[targetIndex] ?? undefined
            );
            node.morphWeightOverrides = weights.every((weight) => weight === undefined)
                ? undefined
                : weights;
        });
        uiModel.publishMorphWeights(state);
    };

    applyRenderChange((s) => s.selection.morphWeightOverrides, applyMorphWeightOverrides);

    applyRenderChange((s) => s.selection.clearColor, (hex) => {
        const color = hexToLinearColor(hex);
        if (color !== undefined) {
            state.renderingParameters.clearColor = color;
        }
    });

    subscriptions.push(viewerStore.subscribe((s) => s.selection.selectedScene, (value) => {
        const sceneIndex = Number(value);
        // A model load republishes the scene the renderer is already showing,
        // so only apply a change the renderer has not applied yet.
        if (sceneIndex === state.sceneIndex) {
            return;
        }
        state.sceneIndex = sceneIndex !== -1 ? sceneIndex : undefined;
        state.cameraNodeIndex = undefined;

        const scene = state.gltf.scenes[state.sceneIndex];
        if (scene !== undefined) {
            scene.applyTransformHierarchy(state.gltf);
            state.userCamera.resetView(state.gltf, state.sceneIndex);
            state.physicsController.loadScene(state, state.sceneIndex);
        }

        uiModel.publishCameras(state);
        uiModel.publishMorphWeights(state);
        uiModel.publishStatistics(view.gatherStatistics(state));
        redraw = true;
    }));

    applyRenderChange((s) => s.selection.selectedCamera, (camera) => {
        state.cameraNodeIndex = camera !== -1 ? camera : undefined;
    });

    applyRenderChange((s) => s.selection.selectedAnimations, (indices) => {
        // Disable all animations which are not disjoint to the current selection.
        uiModel.publishDisabledAnimations(state.gltf.nonDisjointAnimations(indices));
        state.animationIndices = indices;
    });

    subscriptions.push(viewerStore.subscribe((s) => s.selection.animationState, (playing) => {
        if (playing) {
            state.animationTimer.unpause();
        } else {
            state.animationTimer.pause();
        }
    }));

    subscriptions.push(setCommand("animationResetChanged", () => {
        state.animationTimer.reset();
        redraw = true;
    }));

    applyRenderChange((s) => s.selection.animationTimeOverride, (time) => {
        if (time === null || time === undefined) {
            state.animationTimer.clearTimeOverride();
        } else {
            state.animationTimer.setTimeOverride(time);
        }
    });

    subscriptions.push(viewerStore.subscribe((s) => s.selection.graphState, (playing) => {
        if (playing) {
            state.graphController.resumeGraph();
            state.animationTimer.unpause();
        } else {
            state.graphController.pauseGraph();
            state.animationTimer.pause();
        }
    }));

    subscriptions.push(setCommand("graphResetChanged", () => {
        state.graphController.resetGraph();
        redraw = true;
    }));

    subscriptions.push(viewerStore.subscribe((s) => s.selection.selectedGraph, (graphIndex) => {
        if (graphIndex === null || graphIndex === undefined) {
            return;
        }
        // A model load republishes the graph the renderer is already running,
        // so only apply a change the renderer has not applied yet.
        if (graphIndex === state.graphController.graphIndex) {
            return;
        }
        state.graphController.loadGraph(graphIndex);
    }));

    subscriptions.push(setCommand("customEventSendClicked", (eventData) => {
        if (eventData && eventData.eventId) {
            state.graphController.dispatchEvent(eventData.eventId, { ...eventData.values });
        }
    }));

    subscriptions.push(viewerStore.subscribe((s) => s.selection.physicsState, (enabled) => {
        if (enabled) {
            state.physicsController.resumeSimulation();
        } else {
            state.physicsController.pauseSimulation();
        }
    }));

    subscriptions.push(setCommand("physicsResetChanged", () => {
        state.physicsController.resetScene(state.gltf);
        state.gltf.resetAnimatedProperties(state.sceneIndex);
        state.physicsController.loadScene(state, state.sceneIndex);
        redraw = true;
    }));

    subscriptions.push(setCommand("physicsStepChanged", () => {
        state.physicsController.simulateStep(state, 1 / 60);
        state.gltf.resetAllDirtyFlags();
        redraw = true;
    }));

    // ------------------------------------------------------------- downloads

    const downloadDataURL = (filename, dataURL) => {
        const element = document.createElement("a");
        element.setAttribute("href", dataURL);
        element.setAttribute("download", filename);
        element.style.display = "none";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    subscriptions.push(setCommand("cameraExport", () => {
        const camera =
            state.cameraNodeIndex === undefined
                ? state.userCamera
                : state.gltf.cameras[state.cameraNodeIndex];
        const gltf = JSON.stringify(camera.getDescription(state.gltf), undefined, 4);
        downloadDataURL("camera.gltf", "data:text/plain;charset=utf-8," + encodeURIComponent(gltf));
    }));

    subscriptions.push(setCommand("captureCanvas", () => {
        view.renderFrame(state, canvas.width, canvas.height);
        downloadDataURL("capture.png", canvas.toDataURL());
    }));

    // Camera controls arrive as commands; the controller owns the camera
    // state, while the input handlers below only push raw deltas into it.
    applyRenderChange((s) => s.selection.cameraMode, (mode) => {
        cameraController.setMode(mode);
    });
    applyRenderChange((s) => s.selection.cameraProjection, (type) => {
        cameraController.setProjection(type);
    });
    subscriptions.push(setCommand("cameraLookAtChanged", (axis) => {
        cameraController.lookAt(axis);
        redraw = true;
    }));
    subscriptions.push(setCommand("cameraResetChanged", () => {
        cameraController.reset();
        redraw = true;
    }));

    uiModel.onOrbit((orbit) => {
        cameraController.pushOrbit(orbit.deltaPhi, orbit.deltaTheta);
        redraw = true;
    });
    uiModel.onPan((pan) => {
        cameraController.pushPan(pan.deltaX, -pan.deltaY);
        redraw = true;
    });
    uiModel.onZoom((zoom) => {
        cameraController.pushZoom(zoom.deltaZoom);
        redraw = true;
    });

    uiModel.onSelection((selection) => {
        pendingFocus = false;
        const devicePixelRatio = window.devicePixelRatio || 1;
        state.selectionPositions[0].x = Math.floor(selection.x * devicePixelRatio);
        state.selectionPositions[0].y = Math.floor(selection.y * devicePixelRatio);
        state.triggerSelection = true;
        redraw = true;
    });

    uiModel.onFocus((position) => {
        pendingFocus = true;
        const devicePixelRatio = window.devicePixelRatio || 1;
        state.selectionPositions[0].x = Math.floor(position.x * devicePixelRatio);
        state.selectionPositions[0].y = Math.floor(position.y * devicePixelRatio);
        state.triggerSelection = true;
        redraw = true;
    });

    uiModel.onHover((selection) => {
        if (selection.x === undefined || selection.y === undefined) {
            state.hoverPositions[0].x = undefined;
            state.hoverPositions[0].y = undefined;
        } else {
            const devicePixelRatio = window.devicePixelRatio || 1;
            state.hoverPositions[0].x = Math.floor(selection.x * devicePixelRatio);
            state.hoverPositions[0].y = Math.floor(selection.y * devicePixelRatio);
        }
        redraw = true;
    });

    // Handlers are registered, so the initial model and environment can go out.
    uiModel.start();

    // Route drops to the now-ready model layer, then replay any that arrived
    // during startup. Reassigning first means a drop between the two statements
    // is handled directly rather than buffered and never drained.
    dropHandler = (entries) =>
        Promise.resolve(uiModel.handleDrop(entries)).catch((error) =>
            console.error(`Reading the dropped files failed: ${error}`)
        );
    for (const entries of pendingDrops.splice(0)) {
        dropHandler(entries);
    }

    // ------------------------------------------------------------ render loop

    const past = {};
    let animationFrame = null;
    const update = () => {
        const devicePixelRatio = window.devicePixelRatio || 1;

        redraw |= cameraController.tick();

        // set the size of the drawingBuffer based on the size it's displayed.
        canvas.width = Math.floor(canvas.clientWidth * devicePixelRatio);
        canvas.height = Math.floor(canvas.clientHeight * devicePixelRatio);
        redraw |= !state.animationTimer.paused && state.animationIndices.length > 0;
        redraw |= state.graphController.playing;
        redraw |= past.width != canvas.width || past.height != canvas.height;
        redraw |= state.physicsController.enabled && state.physicsController.playing;
        redraw |= state.needsRedraw;

        // Do not redraw when loading is in progress
        if (getViewerState().ui.isLoading) {
            redraw = false;
        }

        // Refit view if canvas changes significantly
        if (
            canvas.width / past.width < 0.5 ||
            canvas.width / past.width > 2.0 ||
            canvas.height / past.height < 0.5 ||
            canvas.height / past.height > 2.0
        ) {
            state.userCamera.perspective.aspectRatio = canvas.width / canvas.height;
            state.userCamera.fitViewToScene(state.gltf, state.sceneIndex);
            cameraController.syncProjection();
        }

        past.width = canvas.width;
        past.height = canvas.height;

        if (redraw) {
            redraw = false;
            view.renderFrame(state, canvas.width, canvas.height);
        }

        animationFrame = window.requestAnimationFrame(update);
    };

    // After this start executing animation loop.
    animationFrame = window.requestAnimationFrame(update);

    return () => {
        disposed = true;
        if (animationFrame !== null) {
            window.cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
        for (const unsubscribe of subscriptions) {
            unsubscribe();
        }
        subscriptions.length = 0;
        detachDropZone();
        uiModel.dispose();
        state.graphController.stopGraphEngine();
        state.physicsController.pauseSimulation();
        updateUi({ isLoading: false });
    };
};
