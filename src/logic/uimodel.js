import { GltfState, instantiatedDocuments } from "@khronosgroup/gltf-viewer";
import {
    getViewerState,
    updateConfig,
    updatePublished,
    updateSelection,
    updateUi
} from "./viewer_store.js";
import { setCommand } from "./commands.js";
import { attachCanvasInput, partitionDroppedFiles } from "./canvas_input.js";

/**
 * Splits an SPDX licence file into parts the UI can render as elements, so the
 * remote text is never handed to innerHTML.
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

// The heading shown for each debug channel block in the dropdown. The key mirrors the
// block keys of GltfState.DebugOutput; the texture coordinate block is added by
// debugChannelsFor below.
const DEBUG_CHANNEL_HEADINGS = {
    generic: "Generic",
    shading: "Shading",
    mr: "Metallic-Roughness",
    clearcoat: "Clearcoat",
    sheen: "Sheen",
    specular: "Specular",
    transmission: "Transmission",
    volume: "Volume",
    ior: "IOR",
    dispersion: "Dispersion",
    diffuseTransmission: "Diffuse Transmission",
    iridescence: "Iridescence",
    retroreflection: "Retroreflection",
    anisotropy: "Anisotropy",
    scatter: "Scatter",
    emissiveStrength: "Emissive Strength",
    gaussianSplatting: "Gaussian Splatting",
    misc: "Miscellaneous"
};

// The glTF extension each extension-specific debug block belongs to. Blocks not
// listed here (generic, shading, mr, misc) are always relevant regardless of the
// loaded asset.
const DEBUG_BLOCK_EXTENSION = {
    clearcoat: "KHR_materials_clearcoat",
    sheen: "KHR_materials_sheen",
    specular: "KHR_materials_specular",
    transmission: "KHR_materials_transmission",
    volume: "KHR_materials_volume",
    ior: "KHR_materials_ior",
    dispersion: "KHR_materials_dispersion",
    diffuseTransmission: "KHR_materials_diffuse_transmission",
    iridescence: "KHR_materials_iridescence",
    retroreflection: "KHR_materials_retroreflection",
    anisotropy: "KHR_materials_anisotropy",
    scatter: "KHR_materials_scatter",
    emissiveStrength: "KHR_materials_emissive_strength",
    gaussianSplatting: "KHR_gaussian_splatting"
};

// The extension names declared in the document tree's `extensionsUsed`, so the
// UI can hide debug views and grey out toggles for extensions the asset does
// not use.
function usedExtensionNames(gltf) {
    const used = new Set();
    if (gltf === undefined) return used;
    for (const document of [gltf, ...instantiatedDocuments(gltf)]) {
        for (const extension of document.extensionsUsed ?? []) {
            used.add(extension);
        }
    }
    return used;
}

/**
 * The debug channels on offer for a loaded asset.
 *
 * All but the texture coordinate ones are fixed. Those depend on the asset, because
 * glTF 2.1 lets a primitive number its sets freely, so they are rebuilt on every load
 * and sit where they used to, at the head of the list.
 *
 * Each entry is either a plain channel ({ title: string }) or a block
 * ({ title: object, label: string }); the label is the optgroup heading.
 */
function debugChannelsFor(gltf) {
    const used = usedExtensionNames(gltf);
    const channels = Object.keys(GltfState.DebugOutput)
        .filter(
            (key) =>
                DEBUG_BLOCK_EXTENSION[key] === undefined || used.has(DEBUG_BLOCK_EXTENSION[key])
        )
        .map((key) => ({
            title: GltfState.DebugOutput[key],
            label: DEBUG_CHANNEL_HEADINGS[key]
        }));
    const texCoords = GltfState.textureCoordinateDebugOutputs(gltf);
    if (texCoords.length > 0) {
        channels.splice(1, 0, {
            title: Object.fromEntries(texCoords.map((n) => [n, n])),
            label: "Texture Coordinates"
        });
    }
    return channels;
}

// Plain entries and grouped ones are rendered separately, so what is on offer is the two
// kinds flattened together.
function offeredDebugChannels(channels) {
    return channels.flatMap((item) =>
        typeof item.title === "string" ? [item.title] : Object.values(item.title)
    );
}

// ---- scene tree ------------------------------------------------------------

// A short description of what a node represents, for the scene-tree detail panel.
function nodeMeta(document, node) {
    let type = "Node";
    let reference;
    if (node.externalAsset !== undefined) {
        type = "External asset";
        reference = document.externalAssets?.[node.externalAsset]?.name;
    } else if (node.mesh !== undefined) {
        type = "Mesh";
        reference = document.meshes?.[node.mesh]?.name;
    } else if (node.camera !== undefined) {
        type = "Camera";
        reference = document.cameras?.[node.camera]?.name;
    } else if (node.extensions?.KHR_lights_punctual?.light !== undefined) {
        const light =
            document.extensions?.KHR_lights_punctual?.lights?.[
                node.extensions.KHR_lights_punctual.light
            ];
        type = "Light";
        reference = light?.name ?? light?.type;
    }

    // Materials and extensions come from the node itself, its mesh, and the
    // materials that mesh uses.
    const mesh = node.mesh !== undefined ? document.meshes?.[node.mesh] : undefined;
    const materials = new Set();
    const extensions = new Set(Object.keys(node.extensions ?? {}));
    if (mesh !== undefined) {
        if (mesh.extensions !== undefined) {
            for (const name of Object.keys(mesh.extensions)) extensions.add(name);
        }
        for (const primitive of mesh.primitives) {
            if (primitive.material === undefined) continue;
            const material = document.materials?.[primitive.material];
            if (material?.name !== undefined) materials.add(material.name);
            if (material?.extensions !== undefined) {
                for (const name of Object.keys(material.extensions)) extensions.add(name);
            }
        }
    }

    return {
        type,
        reference,
        materials: [...materials],
        extensions: [...extensions]
    };
}

// A node entry for the scene tree. `focus` is the live node itself, whose world
// transform is resolved again when the entry is double-clicked so the camera can
// follow a moving (e.g. simulated) node.
function nodeTreeEntry(document, nodeIndex, key) {
    const node = document.nodes[nodeIndex];
    const entry = {
        key,
        name: node.name ?? `Node ${nodeIndex}`,
        uid: node.uid,
        focus: node,
        meta: nodeMeta(document, node),
        children: []
    };
    for (const child of node.children) {
        entry.children.push(nodeTreeEntry(document, child, `${key}/${child}`));
    }
    // An instantiated external asset hangs below the node that holds it, so its
    // default-scene roots continue the hierarchy from there.
    const instance = node.externalAssetInstance;
    if (instance !== undefined) {
        const scene = instance.scenes[instance.scene ?? 0];
        for (const root of scene?.nodes ?? []) {
            entry.children.push(nodeTreeEntry(instance, root, `${key}@${root}`));
        }
    }
    return entry;
}

function buildNodeTree(gltf) {
    const scene = gltf?.scenes?.[gltf.scene ?? 0];
    return (scene?.nodes ?? []).map((index) => nodeTreeEntry(gltf, index, `n${index}`));
}

// Records the first live node that instantiates each external asset, keyed by the
// asset's index path through the document tree. Cloned instance documents are walked
// so nested assets resolve to a node with a real world transform.
function collectAssetFocus(document, path, map) {
    for (const node of document.nodes) {
        if (node.externalAsset === undefined) {
            continue;
        }
        const assetPath = [...path, node.externalAsset];
        const key = `a:${assetPath.join(":")}`;
        if (!map.has(key)) {
            map.set(key, node);
        }
        if (node.externalAssetInstance !== undefined) {
            collectAssetFocus(node.externalAssetInstance, assetPath, map);
        }
    }
}

function buildAssetTree(document, path = []) {
    return (document?.externalAssets ?? []).map((asset, index) => {
        const assetPath = [...path, index];
        const file = document.files?.[asset.file];
        return {
            key: `a:${assetPath.join(":")}`,
            name: asset.name ?? `Asset ${index}`,
            uid: asset.uid,
            focus: undefined,
            meta: {
                type: "External asset",
                reference: file?.name ?? file?.uri,
                materials: [],
                extensions: []
            },
            children: buildAssetTree(asset.document, assetPath)
        };
    });
}

function buildAssetTreeWithFocus(gltf) {
    const focus = new Map();
    collectAssetFocus(gltf, [], focus);
    const fill = (entries) =>
        entries.map((entry) => ({
            ...entry,
            focus: focus.get(entry.key),
            children: fill(entry.children)
        }));
    return fill(buildAssetTree(gltf));
}

const INITIAL_ENVIRONMENT = "Cannon_Exterior";
const INITIAL_CLEAR_COLOR = "#8f9dc1";

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
        this.subscriptions = [];
        this.canvas = canvas;

        this.modelURL = new URLSearchParams(window.location.search).get("model");

        const models = modelPathProvider.getAllKeys();
        updatePublished({
            models,
            modelCount: models.length,
            modelTags: modelPathProvider.getAllTags(),
            modelFlavours: modelPathProvider.getAllFlavours(),
            modelThumbnails: modelPathProvider.getAllScreenshots(),
            environments,
            tonemaps: Object.keys(GltfState.ToneMaps).map((key) => ({
                title: GltfState.ToneMaps[key]
            })),
            debugchannels: debugChannelsFor(undefined),
            clippingOrientations: Object.values(GltfState.ClippingOrientations)
        });
        updateSelection({
            selectedEnvironment: INITIAL_ENVIRONMENT,
            clearColor: INITIAL_CLEAR_COLOR
        });
        this.publishModels();

        this.subscriptions.push(
            setCommand("modelChanged", (name) => this.selectModel(name)),
            setCommand("modelTagsChanged", (tags) =>
                this.filterModels({ selectedModelTags: tags })
            ),
            setCommand("modelFlavoursChanged", (flavours) =>
                this.filterModels({ selectedModelFlavours: flavours })
            ),
            setCommand("flavourChanged", (flavour) => {
                this.emitModel({
                    mainFile: modelPathProvider.resolve(
                        getViewerState().selection.selectedModel,
                        flavour
                    )
                });
            }),
            setCommand("selectedEnvironmentChanged", (name) => {
                this.emitHdr(getViewerState().published.environments[name]);
            }),
            setCommand("addEnvironmentChanged", (hdr) => this.addEnvironment(hdr))
        );

        this.showOverlay = () => updateUi({ showDropDownOverlay: true });
        this.hideOverlay = () => updateUi({ showDropDownOverlay: false });
        canvas.addEventListener("dragenter", this.showOverlay);
        canvas.addEventListener("dragleave", this.hideOverlay);

        this.detachInput = attachCanvasInput(canvas, {
            onOrbit: (delta) => this.orbitHandler?.(delta),
            onPan: (delta) => this.panHandler?.(delta),
            onZoom: (delta) => this.zoomHandler?.(delta),
            onSelect: (position) => this.selectionHandler?.(position),
            onFocus: (position) => this.focusHandler?.(position),
            onHover: (position) => this.hoverHandler?.(position)
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

    onFocus(handler) {
        this.focusHandler = handler;
    }

    onHover(handler) {
        this.hoverHandler = handler;
    }

    /** Emits the initial model and environment, replacing RxJS `startWith`. */
    start() {
        this.emitHdr(this.environments[INITIAL_ENVIRONMENT]);
        updateSelection({
            clearColor: INITIAL_CLEAR_COLOR
        });

        if (this.modelURL !== null) {
            if (this.modelPathProvider.hasModel(this.modelURL)) {
                this.selectModel(this.modelURL, false);
            } else {
                this.registerDroppedFilename(this.modelURL);
                this.emitModel({ mainFile: this.modelURL });
            }
        } else {
            this.selectModel("DamagedHelmet", false);
        }
    }

    selectModel(name, updateUrl = true) {
        const flavours = this.modelPathProvider.getModelFlavours(name);
        const selectedFlavour = flavours.includes("glTF") ? "glTF" : flavours[0];
        updateSelection({
            selectedModel: name,
            selectedFlavour,
            selectedModelIsDropped: false
        });
        updatePublished({ flavours });
        if (updateUrl) {
            this.updateModelUrl(name);
        }
        this.emitModel({ mainFile: this.modelPathProvider.resolve(name, selectedFlavour) });
        // After emitModel, which needs the list as it was to drop a dropped file.
        this.publishModels();
    }

    /** Reflects the current sample asset in the URL so a reload keeps it. */
    updateModelUrl(name) {
        const url = new URL(window.location.href);
        url.searchParams.set("model", name);
        window.history.replaceState(null, "", url);
    }

    /** Narrows the model list to the models matching the tag and flavour filters. */
    filterModels(selection) {
        updateSelection(selection);
        this.publishModels();
    }

    publishModels() {
        const { modelTags, modelFlavours } = getViewerState().published;
        const { selectedModelTags, selectedModelFlavours, selectedModel } =
            getViewerState().selection;
        const models = this.modelPathProvider.getAllKeys(selectedModelTags, selectedModelFlavours);
        // The loaded model stays listed even when filtered out, so that filtering
        // never changes what is shown. It is not part of the count.
        const modelCount = models.length;
        const selectedModelExcluded = !models.includes(selectedModel);
        if (selectedModelExcluded) {
            models.push(selectedModel);
        }
        updatePublished({
            models,
            modelCount,
            disabledModelTags: modelTags.filter(
                (tag) =>
                    !selectedModelTags.includes(tag) &&
                    this.modelPathProvider.getAllKeys(
                        [...selectedModelTags, tag],
                        selectedModelFlavours
                    ).length === 0
            ),
            disabledModelFlavours: modelFlavours.filter(
                (flavour) =>
                    !selectedModelFlavours.includes(flavour) &&
                    this.modelPathProvider.getAllKeys(selectedModelTags, [
                        ...selectedModelFlavours,
                        flavour
                    ]).length === 0
            )
        });
        updateSelection({ selectedModelExcluded });
    }

    emitModel(model) {
        // A dropped file adds a temporary entry to the model list; picking
        // anything else removes it again.
        if (getViewerState().published.models.at(-1) === this.lastDroppedFilename) {
            updatePublished({ models: getViewerState().published.models.slice(0, -1) });
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
        updatePublished({
            environments: {
                ...getViewerState().published.environments,
                [hdrPath.name]: { title: hdrPath.name, hdr_path: hdrPath }
            }
        });
        updateSelection({ selectedEnvironment: hdrPath.name });
        this.emitHdr(hdr);
    }

    async handleDrop(entries) {
        updateUi({ showDropDownOverlay: false });
        const { mainFile, additionalFiles, hdrFile } = await partitionDroppedFiles(entries);

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

        updatePublished({
            models: [...getViewerState().published.models, filename],
            flavours: [fileExtension]
        });
        updateSelection({
            selectedModel: filename,
            selectedModelExcluded: false,
            selectedModelIsDropped: true,
            selectedFlavour: fileExtension
        });
        this.lastDroppedFilename = filename;
    }

    async publishEnvironmentLicense(hdr) {
        if (hdr?.license_path === undefined) {
            updatePublished({ environmentLicense: null });
            return;
        }
        try {
            const response = await fetch(hdr.license_path);
            if (!response.ok) {
                throw new Error("License file not found");
            }
            updatePublished({
                environmentLicense: parseEnvironmentLicense(await response.text(), hdr)
            });
            // eslint-disable-next-line no-unused-vars
        } catch (error) {
            updatePublished({ environmentLicense: null });
        }
    }

    /**
     * Publishes a thumbnail produced by ResourceLoader.loadThumbnail, taking ownership
     * of its object URL and revoking whatever it replaces.
     */
    publishThumbnail(thumbnail) {
        const previous = getViewerState().published.assetThumbnail;
        if (previous !== undefined && previous.startsWith("blob:")) {
            URL.revokeObjectURL(previous);
        }
        updatePublished({ assetThumbnail: thumbnail?.url });
    }

    /** Discards a thumbnail that arrived too late to be shown. */
    releaseThumbnail(thumbnail) {
        if (thumbnail?.url?.startsWith("blob:")) {
            URL.revokeObjectURL(thumbnail.url);
        }
    }

    publishGltfLoaded(state) {
        this.publishCameras(state);
        this.publishMorphWeights(state);

        const gltf = state.gltf;
        const hasVariants = gltf?.extensions?.KHR_materials_variants?.variants !== undefined;
        // Interactivity may live in the root document or in an instantiated external
        // asset (a wrapper that only embeds an interactive asset), so gather the
        // graphs across the whole document tree.
        const interactivityGraphs = [gltf, ...instantiatedDocuments(gltf)]
            .filter((document) => document.extensions?.KHR_interactivity?.graphs !== undefined)
            .flatMap((document) =>
                document.extensions.KHR_interactivity.graphs.map((graph, index) => ({
                    title: graph.name ?? `Graph ${index}`,
                    index: index
                }))
            );
        const hasInteractivity =
            interactivityGraphs.length > 0 &&
            state.renderingParameters.enabledExtensions.KHR_interactivity;

        // The texture coordinate channels depend on the sets this asset declares, so a
        // channel chosen for the previous one may no longer exist. Keeping it would leave
        // the select showing a value it has no option for, and the renderer on a view the
        // asset cannot produce.
        const debugchannels = debugChannelsFor(gltf);
        const offeredDebug = offeredDebugChannels(debugchannels);
        const selectedDebugChannel = offeredDebug.includes(getViewerState().config.debugChannel)
            ? getViewerState().config.debugChannel
            : GltfState.DebugOutput.NONE;

        const usedExtensions = [...usedExtensionNames(gltf)];

        let animationDuration = 0;
        for (const animation of gltf.animations) {
            animation.computeMinMaxTime(gltf);
            animationDuration = Math.max(animationDuration, animation.maxTime ?? 0);
        }

        updatePublished({
            assetCopyright: gltf.asset.copyright ?? "N/A",
            assetGenerator: gltf.asset.generator ?? "N/A",
            assetVersion: gltf.asset.version ?? "N/A",

            scenes: gltf.scenes.map((scene, index) => ({
                title: scene.name ?? `Scene ${index}`,
                index: index
            })),
            // The scene picker is only meaningful when there is more than one scene to
            // choose between, regardless of the glTF version.
            showScenes: gltf.scenes.length > 1,
            debugchannels,
            usedExtensions,
            nodeTree: buildNodeTree(gltf),
            assetTree: buildAssetTreeWithFocus(gltf),

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

            graphs: hasInteractivity ? interactivityGraphs : [],
            customEvents: hasInteractivity ? state.graphController.customEvents || [] : [],

            // Physics may live in the root document or in any instantiated external asset.
            hasPhysics: [gltf, ...instantiatedDocuments(gltf)].some(
                (document) => document.extensionsUsed?.includes("KHR_physics_rigid_bodies") ?? false
            ),
            hasAnimations: gltf.animations.length > 0,

            xmp:
                gltf?.extensions?.KHR_xmp_json_ld?.packets[
                    gltf?.asset?.extensions?.KHR_xmp_json_ld.packet
                ] ?? null
        });
        updateSelection({
            selectedScene: state.sceneIndex,
            selectedVariant: "None",
            selectedAnimations: state.animationIndices,
            morphWeightOverrides: {},
            animationState: true,
            animationTimeOverride: null,
            animationDuration,
            graphState: true,
            physicsState: true,
            focusedNode: undefined
        });

        if (selectedDebugChannel !== getViewerState().config.debugChannel) {
            updateConfig({ debugChannel: selectedDebugChannel });
        }

        if (hasInteractivity && state.graphController.graphIndex !== undefined) {
            updateSelection({ selectedGraph: state.graphController.graphIndex });
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

        updatePublished({ cameras });
        updateSelection({
            selectedCamera: state.cameraNodeIndex !== undefined ? state.cameraNodeIndex : -1
        });
    }

    publishMorphWeights(state) {
        const gltf = state.gltf;
        const scene = gltf.scenes[state.sceneIndex];
        const morphWeights = [];
        gltf.nodes.forEach((node, nodeIndex) => {
            const mesh = gltf.meshes[node.mesh];
            const targetCount = mesh?.primitives[0]?.targets.length ?? 0;
            if (targetCount === 0 || !scene?.includesNode(gltf, nodeIndex)) {
                return;
            }
            const name = node.name || mesh.name;
            morphWeights.push({
                nodeIndex,
                title: name ? `${name} (Node ${nodeIndex})` : `Node ${nodeIndex}`,
                targets: Array.from({ length: targetCount }, (_, index) => ({
                    name: mesh.extras?.targetNames?.[index] || `Target ${index}`,
                    value: node.morphWeightOverrides?.[index] ?? null
                }))
            });
        });

        const previous = getViewerState().published.morphWeights;
        if (
            morphWeights.length !== previous.length ||
            morphWeights.some(
                (node, index) =>
                    node.nodeIndex !== previous[index].nodeIndex ||
                    node.title !== previous[index].title ||
                    node.targets.length !== previous[index].targets.length ||
                    node.targets.some(
                        (target, targetIndex) =>
                            target.name !== previous[index].targets[targetIndex].name ||
                            target.value !== previous[index].targets[targetIndex].value
                    )
            )
        ) {
            updatePublished({ morphWeights });
        }
    }

    publishStatistics(data) {
        updatePublished({
            statistics: {
                Meshes: data.meshCount,
                Triangles: data.faceCount,
                "Opaque Materials": data.opaqueMaterialsCount,
                "Transparent Materials": data.transparentMaterialsCount
            }
        });
    }

    publishDisabledAnimations(indices) {
        updatePublished({ disabledAnimations: indices });
    }

    publishValidationReport(data) {
        updatePublished({ validationReport: data });
    }

    goToLoadingState() {
        updateUi({ isLoading: true });
    }

    exitLoadingState() {
        updateUi({ isLoading: false });
    }

    dispose() {
        this.detachInput?.();
        for (const unsubscribe of this.subscriptions) {
            unsubscribe();
        }
        this.subscriptions.length = 0;
        this.canvas.removeEventListener("dragenter", this.showOverlay);
        this.canvas.removeEventListener("dragleave", this.hideOverlay);
        this.modelHandlers.length = 0;
        this.hdrHandlers.length = 0;
    }
}

export { UIModel };
