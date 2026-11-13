import { subscribeWithSelector } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

/**
 * An entry in a selectable list published to the UI.
 * @typedef {{ title: string, index: number }} SelectableEntry
 */

/**
 * An environment the environment loader can display, keyed by name in
 * `PublishedState.environments`.
 * @typedef {Object} EnvironmentEntry
 * @property {number} [index]
 * @property {string} [name]
 * @property {string} [title]
 * @property {string|Object} [hdr_path]
 * @property {string} [jpg_path]
 * @property {string} [license_path]
 * @property {string} [base_path]
 */

/**
 * Per-model screenshot lookup, keyed by model name.
 * @typedef {Record<string, string>} ModelThumbnails
 */

/**
 * A glTF validator report, as produced by gltf-validator.
 * @typedef {Object} ValidationReport
 */

/**
 * A single morph target within a morphable node.
 * @typedef {Object} MorphTargetEntry
 * @property {string} name
 * @property {number} value
 */

/**
 * A morphable node and its targets, published for the morph sliders.
 * @typedef {Object} MorphWeightEntry
 * @property {number} nodeIndex
 * @property {string} title
 * @property {MorphTargetEntry[]} targets
 */

/**
 * Renderer lighting configuration, mirrored into `state.renderingParameters`
 * by `main.js`.
 * @typedef {Object} LightingConfig
 * @property {boolean} ibl
 * @property {boolean} punctualLights
 * @property {boolean} renderEnv
 * @property {boolean} blurEnv
 * @property {number} iblIntensity
 * @property {number} exposure
 * @property {string} toneMap
 * @property {string} rotation
 */

/**
 * Renderer extension toggles, mirrored into `state.renderingParameters` by
 * `main.js`.
 * @typedef {Object} ExtensionsConfig
 * @property {boolean} skinning
 * @property {boolean} morphing
 * @property {boolean} morphOverrides
 * @property {boolean} morphSignedRange
 * @property {boolean} wireframe
 * @property {boolean} lightGizmos
 * @property {boolean} cameraGizmos
 * @property {boolean} jointGizmos
 * @property {boolean} aabbGizmos
 * @property {boolean} interactivity
 * @property {boolean} hoverability
 * @property {boolean} selectability
 * @property {boolean} nodeVisibility
 * @property {boolean} floatingPointFramebuffer
 * @property {boolean} clearcoat
 * @property {boolean} sheen
 * @property {boolean} transmission
 * @property {boolean} diffuseTransmission
 * @property {boolean} volume
 * @property {boolean} scattering
 * @property {boolean} ior
 * @property {boolean} specular
 * @property {boolean} emissiveStrength
 * @property {boolean} iridescence
 * @property {boolean} retroreflection
 * @property {boolean} anisotropy
 * @property {boolean} dispersion
 * @property {boolean} gaussianSplatting
 */

/**
 * Physics debug visualisation toggles.
 * @typedef {Object} PhysicsDebugConfig
 * @property {string} engine
 * @property {boolean} colliders
 * @property {boolean} joints
 */

/**
 * Clipping plane configuration.
 * @typedef {Object} ClippingConfig
 * @property {boolean} enabled
 * @property {string} orientation
 * @property {number[]} min
 * @property {number[]} max
 */

/**
 * Facts the loader/renderer publish for the UI to display.
 * @typedef {Object} PublishedState
 * @property {string[]} models
 * @property {number} modelCount
 * @property {string[]} modelTags
 * @property {string[]} modelFlavours
 * @property {string[]} disabledModelTags
 * @property {string[]} disabledModelFlavours
 * @property {ModelThumbnails} modelThumbnails
 * @property {string[]} flavours
 * @property {SelectableEntry[]} scenes
 * @property {SelectableEntry[]} cameras
 * @property {string[]} materialVariants
 * @property {SelectableEntry[]} animations
 * @property {MorphWeightEntry[]} morphWeights
 * @property {number[]} disabledAnimations
 * @property {SelectableEntry[]} graphs
 * @property {unknown[]} customEvents
 * @property {boolean} hasPhysics
 * @property {boolean} hasAnimations
 * @property {string|undefined} physicsEngineVersion
 * @property {string} assetCopyright
 * @property {string} assetGenerator
 * @property {unknown} xmp
 * @property {Record<string, number>} statistics
 * @property {ValidationReport} validationReport
 * @property {SelectableEntry[]} tonemaps
 * @property {SelectableEntry[]} debugchannels
 * @property {string[]} clippingOrientations
 * @property {Record<string, EnvironmentEntry>} environments
 * @property {Object|null} environmentLicense
 * @property {boolean} supportsFloatingPointFramebuffer
 * @property {boolean} supportsWireframe
 * @property {boolean} supportsClipping
 * @property {boolean} showScenes
 * @property {string} assetVersion
 * @property {string|undefined} assetThumbnail
 */

/**
 * What the user has selected or toggled.
 * @typedef {Object} SelectionState
 * @property {string} selectedModel
 * @property {boolean} selectedModelExcluded
 * @property {boolean} selectedModelIsDropped
 * @property {string[]} selectedModelTags
 * @property {string[]} selectedModelFlavours
 * @property {string} selectedFlavour
 * @property {number} selectedScene
 * @property {number} selectedCamera
 * @property {string} cameraMode
 * @property {string} cameraProjection
 * @property {number[]} selectedAnimations
 * @property {number|null} selectedGraph
 * @property {string} selectedEnvironment
 * @property {string} clearColor
 * @property {string} selectedVariant
 * @property {boolean} animationState
 * @property {number|null} animationTimeOverride
 * @property {boolean} timeOverrideEnabled
 * @property {number} animationDuration
 * @property {boolean} graphState
 * @property {boolean} physicsState
 * @property {Record<string, Record<string, number>>} morphWeightOverrides
 */

/**
 * glTF 2.1 shape debug visualisation, mirrored into
 * `state.renderingParameters.debugShapes` by `main.js`.
 * @typedef {Object} DebugShapesConfig
 * @property {boolean} boundingVolumes
 * @property {boolean} allShapes
 * @property {string} style
 * @property {string} colorMode
 * @property {boolean} depthTest
 * @property {boolean} highlightNonEnclosing
 */

/**
 * Renderer configuration owned by the UI.
 * @typedef {Object} ConfigState
 * @property {LightingConfig} lighting
 * @property {ExtensionsConfig} extensions
 * @property {PhysicsDebugConfig} physicsDebug
 * @property {DebugShapesConfig} debugShapes
 * @property {boolean} cullByBoundingVolume
 * @property {ClippingConfig} clipping
 * @property {string} debugChannel
 */

/**
 * Transient UI state the render loop and drop handler read.
 * @typedef {Object} UiState
 * @property {boolean} isLoading
 * @property {boolean} showDropDownOverlay
 */

/**
 * The complete store shape.
 * @typedef {Object} ViewerState
 * @property {PublishedState} published
 * @property {SelectionState} selection
 * @property {ConfigState} config
 * @property {UiState} ui
 */

/**
 * Shared viewer state, owned by neither the UI framework nor the renderer.
 *
 * It is split into four slices:
 * - `published`: facts the loader/renderer publish for the UI to display.
 * - `selection`: what the user has selected or toggled.
 * - `config`: renderer configuration the UI owns; `main.js` mirrors it into the
 *   renderer's mutable state.
 * - `ui`: transient UI state the render loop and drop handler read.
 *
 * It is a vanilla store on purpose: the render loop and `UIModel` both touch it
 * with no React in scope. It deliberately does not own renderer-owned objects
 * such as `state.renderingParameters`; those stay mutable and are written by
 * the subscriptions in `main.js`.
 */
/** @type {ViewerState} */
const initialState = {
    published: {
        // Published by the model path provider and the drop handler.
        models: ["DamagedHelmet"],
        modelCount: 1,
        modelTags: [],
        modelFlavours: [],
        disabledModelTags: [],
        disabledModelFlavours: [],
        modelThumbnails: {},
        flavours: ["glTF"],

        // Published once a glTF has finished loading.
        scenes: [{ title: "0" }, { title: "1" }],
        showScenes: true,
        cameras: [{ title: "User Camera", index: -1 }],
        materialVariants: ["None"],
        animations: [{ title: "None" }],
        morphWeights: [],
        disabledAnimations: [],
        graphs: [],
        customEvents: [],
        hasPhysics: false,
        hasAnimations: false,
        physicsEngineVersion: undefined,
        assetCopyright: "",
        assetGenerator: "",
        assetVersion: "",
        assetThumbnail: undefined,
        xmp: [{ title: "xmp" }],
        statistics: [],
        validationReport: {},

        // Published by the renderer and the environment loader.
        tonemaps: [{ title: "None" }],
        debugchannels: [{ title: "None" }],
        clippingOrientations: ["Axis Aligned"],
        environments: [{ index: 0, name: "" }],
        environmentLicense: undefined,
        supportsFloatingPointFramebuffer: true,
        supportsWireframe: true,
        supportsClipping: true
    },

    selection: {
        // Written by the UI, read back by the loading layer.
        selectedModel: "DamagedHelmet",
        selectedModelExcluded: false,
        selectedModelIsDropped: false,
        selectedModelTags: [],
        selectedModelFlavours: [],
        selectedFlavour: "glTF",
        selectedScene: {},
        selectedCamera: -1,
        cameraMode: "orbit",
        cameraProjection: "perspective",
        cameraFov: 45,
        enforceAspectRatio: false,
        cameraAspectRatio: 16 / 9,
        selectedAnimations: [],
        selectedGraph: null,
        selectedEnvironment: 0,
        clearColor: "",
        selectedVariant: "None",
        animationState: true,
        animationTimeOverride: null,
        timeOverrideEnabled: false,
        animationDuration: 0,
        graphState: true,
        physicsState: true,
        morphWeightOverrides: {}
    },

    config: {
        lighting: {
            ibl: true,
            punctualLights: true,
            renderEnv: true,
            blurEnv: true,
            iblIntensity: 0.0,
            exposure: 0,
            toneMap: "Khronos PBR Neutral",
            rotation: "+Z"
        },
        extensions: {
            skinning: true,
            morphing: true,
            morphOverrides: false,
            morphSignedRange: false,
            wireframe: false,
            lightGizmos: false,
            cameraGizmos: false,
            jointGizmos: false,
            aabbGizmos: false,
            interactivity: true,
            hoverability: true,
            selectability: true,
            nodeVisibility: true,
            floatingPointFramebuffer: true,
            clearcoat: true,
            sheen: true,
            transmission: true,
            diffuseTransmission: true,
            volume: true,
            scattering: true,
            ior: true,
            specular: true,
            emissiveStrength: true,
            iridescence: true,
            retroreflection: true,
            anisotropy: true,
            dispersion: true,
            gaussianSplatting: true
        },
        physicsDebug: { engine: "nvidia-physx", colliders: false, joints: false },
        debugShapes: {
            boundingVolumes: false,
            allShapes: false,
            style: "Both",
            colorMode: "Uniform",
            depthTest: true,
            highlightNonEnclosing: true
        },
        cullByBoundingVolume: true,
        clipping: { enabled: false, orientation: "Axis Aligned", min: [0, 0, 0], max: [1, 1, 1] },
        debugChannel: "None"
    },

    ui: {
        isLoading: false,
        showDropDownOverlay: false
    }
};

/** @type {import("zustand/vanilla").StoreApi<ViewerState>} */
export const viewerStore = createStore(subscribeWithSelector(() => ({ ...initialState })));

/** @returns {ViewerState} */
export const getViewerState = () => viewerStore.getState();

/**
 * Merges a partial into the store, the same way zustand's `setState` does.
 * @param {Partial<ViewerState>} partial
 * @returns {void}
 */
export const setViewerState = (partial) => viewerStore.setState(partial);

/**
 * Returns an updater that shallow-merges a partial into one slice, so callers
 * don't have to rebuild the whole slice object each time.
 * @param {"published"|"selection"|"config"|"ui"} slice
 * @returns {(partial: Object) => void}
 */
const updateSlice = (slice) => (partial) =>
    viewerStore.setState((state) => ({ [slice]: { ...state[slice], ...partial } }));

/** Merges a partial into the `published` slice. @type {(partial: Partial<PublishedState>) => void} */
export const updatePublished = updateSlice("published");
/** Merges a partial into the `selection` slice. @type {(partial: Partial<SelectionState>) => void} */
export const updateSelection = updateSlice("selection");
/** Merges a partial into the `config` slice. @type {(partial: Partial<ConfigState>) => void} */
export const updateConfig = updateSlice("config");
/** Merges a partial into the `ui` slice. @type {(partial: Partial<UiState>) => void} */
export const updateUi = updateSlice("ui");
