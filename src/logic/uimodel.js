import { GltfState } from "@khronosgroup/gltf-viewer";
import { getViewerState, setViewerState } from "./viewer_store.js";
import { uiEvents } from "./ui_events.js";
import { attachCanvasInput, partitionDroppedFiles } from "./canvas_input.js";

/**
 * Splits an SPDX licence file into parts the UI can render as elements. It used
 * to be assembled into an HTML string and injected with v-html, which meant
 * remote text reached innerHTML.
 */
function parseEnvironmentLicense(text, hdr) {
    const licenseName = text.split("SPDX-License-Identifier: ")[1]?.trim();
    const copyright = text
        .replace("SPDX-FileCopyrightText: ", "")
        .replace(/SPDX-License-Identifier:(.)*/g, "")
        .replaceAll("\n", "")
        .trim()
        .replace(/,$/, "");

    return {
        copyright,
        sourceUrl: hdr.hdr_path,
        licenseName,
        licenseUrl: `${hdr.base_path}/LICENSES/${licenseName}.txt`
    };
}

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

const INITIAL_ENVIRONMENT = "Cannon_Exterior";
const INITIAL_CLEAR_COLOR = "#303542";

/**
 * Bridges the UI and the viewer: resolves selections into things to load, and
 * publishes what the loader produces back into the store.
 *
 * `start()` must be called after the caller has registered its handlers, since
 * it emits the initial model and environment.
 */
class UIModel {
    constructor(modelPathProvider, environments, canvas) {
        this.modelPathProvider = modelPathProvider;
        this.environments = environments;
        this.lastDroppedFilename = undefined;
        this.modelHandlers = [];
        this.hdrHandlers = [];

        this.modelURL = new URLSearchParams(window.location.search).get("model");

        setViewerState({
            models: modelPathProvider.getAllKeys(),
            environments,
            selectedEnvironment: INITIAL_ENVIRONMENT,
            clearColor: INITIAL_CLEAR_COLOR,
            tonemaps: Object.keys(GltfState.ToneMaps).map((key) => ({
                title: GltfState.ToneMaps[key]
            })),
            debugchannels: Object.keys(GltfState.DebugOutput).map((key) => ({
                title: GltfState.DebugOutput[key]
            }))
        });

        uiEvents.modelChanged.on((name) => this.selectModel(name));
        uiEvents.flavourChanged.on((flavour) => {
            this.emitModel({
                mainFile: modelPathProvider.resolve(getViewerState().selectedModel, flavour)
            });
        });

        uiEvents.selectedEnvironmentChanged.on((name) => {
            this.emitHdr(getViewerState().environments[name]);
        });
        uiEvents.addEnvironmentChanged.on((hdr) => this.addEnvironment(hdr));

        canvas.addEventListener("dragenter", () => setViewerState({ showDropDownOverlay: true }));
        canvas.addEventListener("dragleave", () => setViewerState({ showDropDownOverlay: false }));

        this.detachInput = attachCanvasInput(canvas, {
            onOrbit: (delta) => this.orbitHandler?.(delta),
            onPan: (delta) => this.panHandler?.(delta),
            onZoom: (delta) => this.zoomHandler?.(delta),
            onSelect: (position) => this.selectionHandler?.(position),
            onHover: (position) => this.hoverHandler?.(position),
            onDrop: (entries) => this.handleDrop(entries),
            onDropError: () => setViewerState({ showDropDownOverlay: false })
        });
    }

    onModel(handler) {
        this.modelHandlers.push(handler);
    }

    onHdr(handler) {
        this.hdrHandlers.push(handler);
    }

    onOrbit(handler) {
        this.orbitHandler = handler;
    }

    onPan(handler) {
        this.panHandler = handler;
    }

    onZoom(handler) {
        this.zoomHandler = handler;
    }

    onSelection(handler) {
        this.selectionHandler = handler;
    }

    onHover(handler) {
        this.hoverHandler = handler;
    }

    /** Emits the initial model and environment, replacing RxJS `startWith`. */
    start() {
        this.emitHdr(this.environments[INITIAL_ENVIRONMENT]);
        setViewerState({
            clearColor: INITIAL_CLEAR_COLOR
        });
        this.clearColorHandler?.(hexToLinearColor(INITIAL_CLEAR_COLOR));

        if (this.modelURL !== null) {
            this.registerDroppedFilename(this.modelURL);
            this.emitModel({ mainFile: this.modelURL });
        } else {
            this.selectModel("DamagedHelmet");
        }
    }

    onClearColor(handler) {
        this.clearColorHandler = handler;
        uiEvents.colorChanged.on((hex) => {
            const color = hexToLinearColor(hex);
            if (color !== undefined) {
                handler(color);
            }
        });
    }

    selectModel(name) {
        const flavours = this.modelPathProvider.getModelFlavours(name);
        const selectedFlavour = flavours.includes("glTF") ? "glTF" : flavours[0];
        setViewerState({ flavours, selectedFlavour });
        this.emitModel({ mainFile: this.modelPathProvider.resolve(name, selectedFlavour) });
    }

    emitModel(model) {
        // A dropped file adds a temporary entry to the model list; picking
        // anything else removes it again.
        if (getViewerState().models.at(-1) === this.lastDroppedFilename) {
            setViewerState({ models: getViewerState().models.slice(0, -1) });
            this.lastDroppedFilename = undefined;
        }
        for (const handler of this.modelHandlers) {
            handler(model);
        }
    }

    emitHdr(hdr) {
        for (const handler of this.hdrHandlers) {
            handler(hdr);
        }
        this.publishEnvironmentLicense(hdr);
    }

    addEnvironment(hdr) {
        const hdrPath = hdr.hdr_path;
        setViewerState({
            environments: {
                ...getViewerState().environments,
                [hdrPath.name]: { title: hdrPath.name, hdr_path: hdrPath }
            },
            selectedEnvironment: hdrPath.name
        });
        this.emitHdr(hdr);
    }

    handleDrop(entries) {
        setViewerState({ showDropDownOverlay: false });
        const { mainFile, additionalFiles, hdrFile } = partitionDroppedFiles(entries);

        if (hdrFile !== undefined && mainFile === undefined) {
            this.addEnvironment({ hdr_path: hdrFile[1] });
            return;
        }
        if (mainFile === undefined) {
            return;
        }

        // mainFile is [path, File]; the File carries the name to show.
        if (mainFile.length > 1) {
            this.registerDroppedFilename(mainFile[1].name);
        }
        this.emitModel({ mainFile, additionalFiles });
    }

    registerDroppedFilename(path) {
        let filename = path.split("/").pop();
        const fileExtension = filename.split(".").pop();
        filename = filename.substr(0, filename.lastIndexOf("."));

        setViewerState({
            models: [...getViewerState().models, filename],
            selectedModel: filename,
            flavours: [fileExtension],
            selectedFlavour: fileExtension
        });
        this.lastDroppedFilename = filename;
    }

    async publishEnvironmentLicense(hdr) {
        if (hdr?.license_path === undefined) {
            setViewerState({ environmentLicense: null });
            return;
        }
        try {
            const response = await fetch(hdr.license_path);
            if (!response.ok) {
                throw new Error("License file not found");
            }
            setViewerState({
                environmentLicense: parseEnvironmentLicense(await response.text(), hdr)
            });
            // eslint-disable-next-line no-unused-vars
        } catch (error) {
            setViewerState({ environmentLicense: null });
        }
    }

    publishGltfLoaded(state) {
        this.publishCameras(state);

        const gltf = state.gltf;
        const hasVariants = gltf?.extensions?.KHR_materials_variants?.variants !== undefined;
        const hasInteractivity =
            gltf?.extensions?.KHR_interactivity?.graphs !== undefined &&
            state.renderingParameters.enabledExtensions.KHR_interactivity;

        setViewerState({
            assetCopyright: gltf.asset.copyright ?? "N/A",
            assetGenerator: gltf.asset.generator ?? "N/A",

            selectedScene: state.sceneIndex,
            scenes: gltf.scenes.map((scene, index) => ({
                title: scene.name ?? `Scene ${index}`,
                index: index
            })),

            selectedAnimations: state.animationIndices,
            animationState: true,
            graphState: true,
            physicsState: true,

            materialVariants: hasVariants
                ? [
                      "None",
                      ...gltf.extensions.KHR_materials_variants.variants.map(
                          (variant) => variant?.name ?? "Unnamed"
                      )
                  ]
                : ["None"],

            animations: gltf.animations.map((animation, index) => ({
                title: animation.name ?? `Animation ${index}`,
                index: index
            })),

            graphs: hasInteractivity
                ? gltf.extensions.KHR_interactivity.graphs.map((graph, index) => ({
                      title: graph.name ?? `Graph ${index}`,
                      index: index
                  }))
                : [],
            customEvents: hasInteractivity ? state.graphController.customEvents || [] : [],

            hasPhysics: gltf?.extensionsUsed?.includes("KHR_physics_rigid_bodies"),

            xmp:
                gltf?.extensions?.KHR_xmp_json_ld?.packets[
                    gltf?.asset?.extensions?.KHR_xmp_json_ld.packet
                ] ?? null
        });

        if (hasInteractivity) {
            setViewerState({ selectedGraph: state.graphController.graphIndex });
        }
    }

    publishCameras(state) {
        const gltf = state.gltf;
        const cameras = [{ title: "User Camera", index: -1 }];

        if (gltf.scenes[state.sceneIndex] !== undefined) {
            gltf.nodes.forEach((node, index) => {
                if (
                    node.camera === undefined ||
                    !gltf.scenes[state.sceneIndex].includesNode(gltf, index)
                ) {
                    return;
                }
                const camera = gltf.cameras[node.camera];
                const suffix =
                    camera.name !== undefined && camera.name !== ""
                        ? camera.name
                        : `Camera ${node.camera}`;
                cameras.push({ title: `${node.name ?? "Node " + index}: ${suffix}`, index });
            });
        }

        setViewerState({
            cameras,
            selectedCamera: state.cameraNodeIndex !== undefined ? state.cameraNodeIndex : -1
        });
    }

    publishStatistics(data) {
        setViewerState({
            statistics: {
                "Mesh Count": data.meshCount,
                "Triangle Count": data.faceCount,
                "Opaque Material Count": data.opaqueMaterialsCount,
                "Transparent Material Count": data.transparentMaterialsCount
            }
        });
    }

    publishDisabledAnimations(indices) {
        setViewerState({ disabledAnimations: indices });
    }

    /**
     * Creates a descriptive summary of the given validation report.
     *
     * If there are no issues, messages, or warnings in the given
     * report, then an empty object is returned.
     *
     * Otherwise, the result will be an object that contains
     * `numIgnoredWarnings:number` that counts the number of warnings
     * that are ignored by the sample viewer, and a `message:string`
     * that explains why these warnings are ignored.
     *
     * @param {any} validationReport The glTF validator validation report
     * @returns The description
     */
    createValidationReportDescription(validationReport) {
        const issues = validationReport?.issues;
        const messages = issues?.messages;
        const numWarnings = issues?.numWarnings ?? 0;
        if (!issues || !messages || numWarnings === 0) {
            return {};
        }
        let numIgnoredWarnings = 0;
        for (const message of messages) {
            if (message.code === "MESH_PRIMITIVE_GENERATED_TANGENT_SPACE") {
                numIgnoredWarnings++;
            }
        }
        if (numIgnoredWarnings === 0) {
            return {};
        }
        return {
            numIgnoredWarnings: numIgnoredWarnings,
            message:
                `The validation generated ${issues.numWarnings} warnings. ` +
                `${numIgnoredWarnings} of these warnings have been about missing ` +
                `tangent space information. Omitting the tangent space information ` +
                `may be a conscious decision by the designer, but it may limit ` +
                `the portability of the asset. The glTF-Sample-Viewer generates ` +
                `tangents using the default MikkTSpace algorithm in this case.`
        };
    }

    publishValidationReport(data) {
        setViewerState({
            validationReport: data,
            validationReportDescription: this.createValidationReportDescription(data)
        });
    }

    goToLoadingState() {
        setViewerState({ isLoading: true });
    }

    exitLoadingState() {
        setViewerState({ isLoading: false });
    }

    dispose() {
        this.detachInput?.();
    }
}

export { UIModel };
