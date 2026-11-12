import { subscribeWithSelector } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

/**
 * Shared viewer state, owned by neither the UI framework nor the renderer.
 *
 * Everything the loading/rendering layer needs to publish to the UI lives here,
 * along with the selections the UI and that layer both need to read. It is a
 * vanilla store on purpose: the render loop and `UIModel` both touch it with no
 * React in scope.
 *
 * It deliberately does not own renderer-owned objects such as
 * `state.renderingParameters`. Those stay mutable and are written by the
 * subscriptions in `main.js`.
 */
const initialState = {
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
    morphWeightOverrides: {},
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
    supportsClipping: true,

    // Selections. Written by the UI, read back by the loading layer.
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
    animationState: true,
    animationTimeOverride: null,
    timeOverrideEnabled: false,
    animationDuration: 0,
    graphState: true,
    physicsState: true,

    // Renderer configuration owned by the UI. main.js mirrors these into the
    // renderer's mutable state.
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
    debugChannel: "None",
    selectedVariant: "None",

    // Transient UI state that the render loop and drop handler need to read.
    isLoading: false,
    showDropDownOverlay: false
};

export const viewerStore = createStore(subscribeWithSelector(() => ({ ...initialState })));

export const getViewerState = () => viewerStore.getState();

export const setViewerState = (partial) => viewerStore.setState(partial);
