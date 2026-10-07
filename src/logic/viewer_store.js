import { createStore } from "zustand/vanilla";

/**
 * Shared viewer state, owned by neither the UI framework nor the renderer.
 *
 * Everything the loading/rendering layer needs to publish to the UI lives here,
 * along with the selections the UI and that layer both need to read. It is a
 * vanilla store on purpose: the render loop and `UIModel` both touch it with no
 * React or Vue in scope.
 *
 * It deliberately does not own renderer-owned objects such as
 * `state.renderingParameters`. Those stay mutable and are written by the
 * subscriptions in `main.js`.
 */
const initialState = {
    // Published by the model path provider and the drop handler.
    models: ["DamagedHelmet"],
    flavours: ["glTF", "glTF-Binary", "glTF-Quantized", "glTF-Draco", "glTF-pbrSpecularGlossiness"],

    // Published once a glTF has finished loading.
    scenes: [{ title: "0" }, { title: "1" }],
    cameras: [{ title: "User Camera", index: -1 }],
    materialVariants: ["None"],
    animations: [{ title: "None" }],
    disabledAnimations: [],
    graphs: [],
    customEvents: [],
    hasPhysics: false,
    assetCopyright: "",
    assetGenerator: "",
    assetVersion: "",
    assetThumbnail: undefined,
    xmp: [{ title: "xmp" }],
    statistics: [],
    validationReport: {},
    validationReportDescription: {},

    // Published by the renderer and the environment loader.
    tonemaps: [{ title: "None" }],
    debugchannels: [{ title: "None" }],
    environments: [{ index: 0, name: "" }],
    environmentLicense: undefined,
    supportsFloatingPointFramebuffer: true,

    // Selections. Written by the UI, read back by the loading layer.
    selectedModel: "DamagedHelmet",
    selectedFlavour: "",
    selectedScene: {},
    selectedCamera: {},
    selectedAnimations: [],
    selectedGraph: null,
    selectedEnvironment: 0,
    clearColor: "",
    animationState: true,
    graphState: true,
    physicsState: true,

    // Transient UI state that the render loop and drop handler need to read.
    isLoading: false,
    showDropDownOverlay: false
};

export const viewerStore = createStore(() => ({ ...initialState }));

export const getViewerState = () => viewerStore.getState();

export const setViewerState = (partial) => viewerStore.setState(partial);
