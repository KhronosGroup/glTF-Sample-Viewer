import { subscribeWithSelector } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

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
        xmp: [{ title: "xmp" }],
        statistics: [],
        validationReport: {},
        validationReportDescription: {},

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
        clipping: { enabled: false, orientation: "Axis Aligned", min: [0, 0, 0], max: [1, 1, 1] },
        debugChannel: "None"
    },

    ui: {
        isLoading: false,
        showDropDownOverlay: false
    }
};

export const viewerStore = createStore(subscribeWithSelector(() => ({ ...initialState })));

export const getViewerState = () => viewerStore.getState();

export const setViewerState = (partial) => viewerStore.setState(partial);

// Slice-aware updaters, so callers don't have to rebuild a slice object each time.
const updateSlice = (slice) => (partial) =>
    viewerStore.setState((state) => ({ [slice]: { ...state[slice], ...partial } }));

export const updatePublished = updateSlice("published");
export const updateSelection = updateSlice("selection");
export const updateConfig = updateSlice("config");
export const updateUi = updateSlice("ui");

