import { GltfState, instantiatedDocuments } from "@khronosgroup/gltf-viewer";
import {
    getViewerState,
    updateConfig,
    updatePublished,
    updateSceneTree,
    updateSelection,
    updateUi,
    viewerStore
} from "./viewer_store.js";
import { setCommand } from "./commands.js";
import { attachCanvasInput, partitionDroppedFiles } from "./canvas_input.js";
import { canonicalPropName } from "./material_naming.js";
import {
    loadDroppedAsset,
    loadDroppedEnvironment,
    saveDroppedAsset,
    saveDroppedEnvironment
} from "./dropped_asset_store.js";

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

// Converts a gl-matrix/typed-array value to a plain array.
function toArray(value) {
    return value === undefined ? undefined : Array.from(value);
}

// The image source URL backing a texture info, if it can be previewed.
function previewFor(document, textureInfo) {
    if (textureInfo === undefined) {
        return undefined;
    }
    const texture = document.textures?.[textureInfo.index];
    const image = document.images?.[texture?.source];
    const src = image?.image?.src;
    if (typeof src !== "string") {
        return undefined;
    }
    const label = canonicalPropName(
        (textureInfo.samplerName ?? "Texture").replace(/^u_/, "").replace(/Sampler$/, "")
    );
    return { label, src };
}

// Serializes a GltfObject to plain JSON, skipping texture infos (shown as a
// preview instead) and internal bookkeeping.
function toPlain(value) {
    if (value === null || value === undefined) {
        return undefined;
    }
    if (typeof value !== "object") {
        return value;
    }
    if (ArrayBuffer.isView(value)) {
        return Array.from(value);
    }
    if (Array.isArray(value)) {
        const result = value.map(toPlain).filter((item) => item !== undefined);
        return result.length > 0 ? result : undefined;
    }
    if (typeof value.index === "number") {
        return undefined;
    }
    const result = {};
    for (const key of Object.keys(value)) {
        if (key === "animatedPropertyObjects" || key === "gltfObjectIndex") {
            continue;
        }
        const item = toPlain(value[key]);
        if (item !== undefined) {
            result[key] = item;
        }
    }
    // Animated properties are non-enumerable getters, so they are read by name.
    for (const key of value.constructor?.animatedProperties ?? []) {
        const item = toPlain(value[key]);
        if (item !== undefined) {
            result[key] = item;
        }
    }
    return Object.keys(result).length > 0 ? result : undefined;
}

// A summary of one material: its texture previews plus its values grouped into
// generic / metallic-roughness and one group per extension.
function materialInfo(document, material) {
    const generic = { alphaMode: material.alphaMode };
    if (material.alphaMode === "MASK") {
        generic.alphaCutoff = material.alphaCutoff;
    }
    generic.doubleSided = material.doubleSided;
    const emissive = toArray(material.emissiveFactor);
    if (emissive !== undefined && emissive.some((value) => value !== 0)) {
        generic.emissiveFactor = emissive;
    }
    if (material.hasEmissiveStrength && material.emissiveStrength !== 1) {
        generic.emissiveStrength = material.emissiveStrength;
    }

    const values = {};
    if (Object.keys(generic).length > 0) {
        values.generic = generic;
    }
    const metallicRoughness = toPlain(material.pbrMetallicRoughness);
    if (metallicRoughness !== undefined && Object.keys(metallicRoughness).length > 0) {
        values.metallicRoughness = metallicRoughness;
    }
    // Extensions become top-level groups keyed by their glTF extension name, so
    // the details panel can title each with its canonical name.
    const extensions = toPlain(material.extensions);
    if (extensions !== undefined) {
        Object.assign(values, extensions);
    }

    const previews = (material.textures ?? [])
        .map((texture) => previewFor(document, texture))
        .filter((preview) => preview !== undefined);

    return {
        name: material.name ?? "Unnamed material",
        previews,
        values
    };
}

// Camera details: its projection parameters.
function cameraBox(camera) {
    if (camera === undefined) {
        return undefined;
    }
    const projection = camera.type === "perspective" ? "perspective" : "orthographic";
    const values = {};
    const props = toPlain(camera[projection]);
    if (props !== undefined && Object.keys(props).length > 0) {
        values[projection] = props;
    }
    return { key: "camera", type: "Camera", name: camera.name, values };
}

// Light details: type, color, intensity, range, and spot angles for spot lights.
function lightBox(light) {
    if (light === undefined) {
        return undefined;
    }
    const values = {};
    const generic = { type: canonicalPropName(light.type) };
    const color = toArray(light.color);
    if (color !== undefined) {
        generic.color = color;
    }
    if (light.intensity !== undefined) {
        generic.intensity = light.intensity;
    }
    if (typeof light.range === "number" && light.range >= 0) {
        generic.range = light.range;
    }
    values.generic = generic;
    if (light.type === "spot") {
        const spot = toPlain(light.spot);
        if (spot !== undefined && Object.keys(spot).length > 0) {
            values.spot = spot;
        }
    }
    return { key: "light", type: "Light", name: light.name ?? light.type, values };
}

// A shape's name and parameters, with mesh references resolved to names.
function shapeBox(document, shapeIndex) {
    if (shapeIndex === undefined) {
        return undefined;
    }
    const shape = document.shapes?.[shapeIndex];
    if (shape === undefined) {
        return undefined;
    }
    const parameters = toPlain(shape.parameters()) ?? {};
    if (typeof parameters.mesh === "number") {
        parameters.mesh = document.meshes?.[parameters.mesh]?.name ?? parameters.mesh;
    }
    return { name: canonicalPropName(shape.type), values: { generic: parameters } };
}

// The node's bounding volume: a shape box.
function boundingVolumeBox(document, boundingVolume) {
    if (boundingVolume === undefined) {
        return undefined;
    }
    const shape = shapeBox(document, boundingVolume.shape);
    if (shape === undefined) {
        return undefined;
    }
    return { key: "boundingVolume", type: "Shape", name: shape.name, values: shape.values };
}

// The node's physics: separate boxes for motion, collider, trigger, and joint.
function physicsBoxes(document, physics) {
    if (physics === undefined) {
        return [];
    }
    const boxes = [];

    if (physics.collider !== undefined) {
        const shape = shapeBox(document, physics.collider.geometry?.shape);
        if (shape !== undefined) {
            boxes.push({
                key: "collider",
                type: "Collider",
                name: shape.name,
                values: shape.values
            });
        }
    }
    if (physics.trigger !== undefined) {
        const shape = shapeBox(document, physics.trigger.geometry?.shape);
        if (shape !== undefined) {
            boxes.push({
                key: "trigger",
                type: "Trigger",
                name: shape.name,
                values: shape.values
            });
        }
    }
    const motion = toPlain(physics.motion);
    if (motion !== undefined && Object.keys(motion).length > 0) {
        boxes.push({ key: "motion", type: "Motion", values: { generic: motion } });
    }
    if (physics.joint !== undefined) {
        const joint = {};
        if (physics.joint.connectedNode !== undefined) {
            joint.connectedNode = nodeReference(document, physics.joint.connectedNode);
        }
        if (physics.joint.joint !== undefined) {
            const jointDef =
                document.extensions?.KHR_physics_rigid_bodies?.physicsJoints?.[physics.joint.joint];
            joint.joint = jointDef?.name ?? physics.joint.joint;
        }
        if (physics.joint.enableCollision !== undefined) {
            joint.enableCollision = physics.joint.enableCollision;
        }
        if (Object.keys(joint).length > 0) {
            boxes.push({ key: "joint", type: "Joint", values: { generic: joint } });
        }
    }

    return boxes;
}

// A clickable reference to a node by index, for props like `connectedNode`.
function nodeReference(document, nodeIndex) {
    const node = document.nodes?.[nodeIndex];
    return {
        kind: "node",
        node,
        label: node?.name ?? `#${nodeIndex}`
    };
}

function primitiveModeName(mode) {
    switch (mode) {
        case 0:
            return "Points";
        case 1:
            return "Lines";
        case 2:
            return "Line Loop";
        case 3:
            return "Line Strip";
        case 4:
            return "Triangles";
        case 5:
            return "Triangle Strip";
        case 6:
            return "Triangle Fan";
        default:
            return `Mode ${mode}`;
    }
}

// The mesh a node renders: per-primitive mode, vertex/indices counts, material.
function meshBox(document, mesh) {
    if (mesh === undefined) {
        return undefined;
    }
    const primitives = mesh.primitives.map((primitive) => {
        const info = { mode: primitiveModeName(primitive.mode) };
        if (primitive.attributes?.POSITION !== undefined) {
            const count = document.accessors?.[primitive.attributes.POSITION]?.count;
            if (count !== undefined) {
                info.vertices = count;
            }
        }
        if (primitive.indices !== undefined) {
            const count = document.accessors?.[primitive.indices]?.count;
            if (count !== undefined) {
                info.indices = count;
            }
        }
        const material = document.materials?.[primitive.material];
        if (material?.name !== undefined) {
            info.material = material.name;
        }
        return info;
    });

    const values =
        primitives.length === 1
            ? { generic: primitives[0] }
            : Object.fromEntries(
                  primitives.map((primitive, index) => [`Primitive ${index + 1}`, primitive])
              );

    return { key: "mesh", type: "Mesh", name: mesh.name, values };
}

// The node's local transform, shown only when it differs from the identity.
function transformBox(node) {
    const translation = toArray(node.translation);
    const rotation = toArray(node.rotation);
    const scale = toArray(node.scale);
    const isIdentity =
        (translation === undefined || translation.every((value) => value === 0)) &&
        (rotation === undefined ||
            (rotation[0] === 0 && rotation[1] === 0 && rotation[2] === 0 && rotation[3] === 1)) &&
        (scale === undefined || scale.every((value) => value === 1));
    if (isIdentity) {
        return undefined;
    }
    const values = { generic: {} };
    if (translation !== undefined) {
        values.generic.translation = translation;
    }
    if (rotation !== undefined) {
        values.generic.rotation = rotation;
    }
    if (scale !== undefined) {
        values.generic.scale = scale;
    }
    return { key: "transform", type: "Transform", values };
}

// The skin a skinned node uses: joint count and the skeleton root node.
function skinBox(document, node) {
    if (node.skin === undefined) {
        return undefined;
    }
    const skin = document.skins?.[node.skin];
    if (skin === undefined) {
        return undefined;
    }
    const values = { generic: { joints: skin.joints?.length ?? 0 } };
    if (skin.skeleton !== undefined) {
        values.generic.skeleton = nodeReference(document, skin.skeleton);
    }
    return { key: "skin", type: "Skin", name: skin.name || undefined, values };
}

// The morph target weights: the node's overrides, falling back to the mesh's
// defaults, for a mesh that has morph targets.
function weightsBox(document, node) {
    const mesh = node.mesh !== undefined ? document.meshes?.[node.mesh] : undefined;
    const targetCount = mesh?.primitives?.[0]?.targets?.length ?? 0;
    if (targetCount === 0) {
        return undefined;
    }
    const weights = node.weights ?? mesh?.weights;
    if (weights === undefined) {
        return undefined;
    }
    return {
        key: "weights",
        type: "Weights",
        values: { generic: { weights: toArray(weights) } }
    };
}

// A details box for an external asset: its name and the file it references.
// Used both for instance nodes and for the assets view.
function externalAssetBox(document, asset) {
    const file = document.files?.[asset.file];
    const values = { generic: {} };
    if (file?.name !== undefined) {
        values.generic.file = file.name;
    } else if (file?.uri !== undefined) {
        values.generic.file = file.uri;
    }
    return {
        key: "externalAsset",
        type: "External Asset",
        name: asset.name,
        values
    };
}

// The animations whose channels target this node, and the paths they animate.
function animationsBox(document, node) {
    const nodeIndex = node.gltfObjectIndex;
    if (nodeIndex === undefined) {
        return undefined;
    }
    const generic = {};
    for (const animation of document.animations ?? []) {
        const paths = [];
        for (const channel of animation.channels ?? []) {
            if (channel.target?.node === nodeIndex) {
                paths.push(channel.target.path);
            }
        }
        if (paths.length === 0) {
            continue;
        }
        const name = animation.name || `Animation ${animation.gltfObjectIndex + 1}`;
        generic[name] = paths.map((path) => canonicalPropName(path)).join(", ");
    }
    if (Object.keys(generic).length === 0) {
        return undefined;
    }
    return { key: "animations", type: "Animations", values: { generic } };
}

// The EXT_mesh_gpu_instancing extension on a node: instance count and which
// attributes are instanced.
function instancingBox(document, node) {
    const attributes = node.extensions?.EXT_mesh_gpu_instancing?.attributes;
    if (attributes === undefined) {
        return undefined;
    }
    const firstAccessor = Object.values(attributes)[0];
    const count = document.accessors?.[firstAccessor]?.count;
    const generic = {};
    if (count !== undefined) {
        generic.count = count;
    }
    const instanced = Object.keys(attributes).filter((key) => attributes[key] !== undefined);
    if (instanced.length > 0) {
        generic.attributes = instanced
            .map((key) => canonicalPropName(key.toLowerCase()))
            .join(", ");
    }
    if (Object.keys(generic).length === 0) {
        return undefined;
    }
    return { key: "instancing", type: "Instancing", values: { generic } };
}

/**
 * Describes a node for the scene-tree details panel: its kind and the collapsible
 * detail boxes to show. `boxes` is always an array, so the panel renders every
 * entry uniformly (see `SceneTreeNode.meta` in viewer_store.js).
 * @param {Object} document
 * @param {Object} node
 * @returns {{type: string, boxes: DetailBox[], extras: unknown}}
 */
function nodeMeta(document, node) {
    let type = "Node";
    const boxes = [];

    const transform = transformBox(node);
    if (transform !== undefined) {
        boxes.push(transform);
    }

    if (node.externalAsset !== undefined) {
        type = "External asset";
        const asset = document.externalAssets?.[node.externalAsset];
        if (asset !== undefined) {
            boxes.push(externalAssetBox(document, asset));
        }
    } else if (node.mesh !== undefined) {
        type = "Mesh";
        const mesh = document.meshes?.[node.mesh];
        const box = meshBox(document, mesh);
        if (box !== undefined) {
            boxes.push(box);
        }
        const materialSeen = new Set();
        for (const primitive of mesh?.primitives ?? []) {
            if (primitive.material === undefined || materialSeen.has(primitive.material)) {
                continue;
            }
            materialSeen.add(primitive.material);
            const material = document.materials?.[primitive.material];
            if (material !== undefined) {
                const info = materialInfo(document, material);
                boxes.push({
                    key: `material:${info.name}`,
                    type: "Material",
                    name: info.name,
                    values: info.values,
                    previews: info.previews
                });
            }
        }
    } else if (node.camera !== undefined) {
        type = "Camera";
        const box = cameraBox(document.cameras?.[node.camera]);
        if (box !== undefined) {
            boxes.push(box);
        }
    } else if (node.extensions?.KHR_lights_punctual?.light !== undefined) {
        type = "Light";
        const light =
            document.extensions?.KHR_lights_punctual?.lights?.[
                node.extensions.KHR_lights_punctual.light
            ];
        const box = lightBox(light);
        if (box !== undefined) {
            boxes.push(box);
        }
    }

    const skin = skinBox(document, node);
    if (skin !== undefined) {
        boxes.push(skin);
    }
    const weights = weightsBox(document, node);
    if (weights !== undefined) {
        boxes.push(weights);
    }
    const animations = animationsBox(document, node);
    if (animations !== undefined) {
        boxes.push(animations);
    }
    const instancing = instancingBox(document, node);
    if (instancing !== undefined) {
        boxes.push(instancing);
    }

    const boundingVolume = boundingVolumeBox(document, node.boundingVolume);
    if (boundingVolume !== undefined) {
        boxes.push(boundingVolume);
    }
    boxes.push(...physicsBoxes(document, node.extensions?.KHR_physics_rigid_bodies));

    return { type, boxes, extras: node.extras };
}

/**
 * A node entry for the scene tree. `focus` is the live node itself, whose world
 * transform is resolved again when the entry is double-clicked so the camera can
 * follow a moving (e.g. simulated) node.
 * @returns {SceneTreeNode}
 */
function nodeTreeEntry(document, nodeIndex, key) {
    const node = document.nodes[nodeIndex];
    const entry = {
        key,
        name: node.name ?? `Node ${nodeIndex}`,
        uid: document.uidAt(`/nodes/${nodeIndex}`),
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

/**
 * The default scene's root nodes, each as a scene-tree entry.
 * @returns {SceneTreeNode[]}
 */
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

/**
 * One entry per external asset, recursively including nested assets. Each entry
 * uses the same `meta` shape as node entries (a `boxes` array).
 * @returns {SceneTreeNode[]}
 */
function buildAssetTree(document, path = []) {
    return (document?.externalAssets ?? []).map((asset, index) => {
        const assetPath = [...path, index];
        return {
            key: `a:${assetPath.join(":")}`,
            name: asset.name ?? `Asset ${index}`,
            uid: document.uidAt(`/externalAssets/${index}`),
            focus: undefined,
            meta: {
                type: "External asset",
                boxes: [externalAssetBox(document, asset)],
                extras: asset.extras
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
        // Shared selection read once so a reload restores the shared scene,
        // camera and variant. Consumed by the first loaded asset.
        const urlParams = new URLSearchParams(window.location.search);
        this.pendingSelection = {
            scene: urlParams.get("scene"),
            camera: urlParams.get("camera"),
            variant: urlParams.get("variant")
        };

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
            setCommand("addEnvironmentChanged", (hdr) => this.addEnvironment(hdr)),
            viewerStore.subscribe(
                (state) => state.selection.selectedScene,
                () => this.syncSelectionUrl()
            ),
            viewerStore.subscribe(
                (state) => state.selection.selectedCamera,
                () => this.syncSelectionUrl()
            ),
            viewerStore.subscribe(
                (state) => state.selection.selectedVariant,
                () => this.syncSelectionUrl()
            )
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
    async start() {
        // Restore a dropped environment, else the initial sample environment.
        const persistedEnvironment = await loadDroppedEnvironment().catch(() => undefined);
        if (persistedEnvironment !== undefined) {
            this.addEnvironment({ hdr_path: persistedEnvironment });
        } else {
            this.emitHdr(this.environments[INITIAL_ENVIRONMENT]);
        }
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
            return;
        }

        // Restore the last dropped asset so a reload does not require dropping it
        // again. Only applied when the URL does not already name a sample model.
        const persisted = await loadDroppedAsset().catch(() => undefined);
        if (persisted !== undefined) {
            this.registerDroppedFilename(persisted.mainFile[1].name);
            this.emitModel(persisted);
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

    /** Removes the sample model from the URL so a reload restores the dropped asset. */
    clearModelUrl() {
        const url = new URL(window.location.href);
        url.searchParams.delete("model");
        window.history.replaceState(null, "", url);
    }

    /** Returns the shared scene/camera/variant overrides and forgets them. */
    consumeSelectionUrl() {
        const pending = this.pendingSelection;
        this.pendingSelection = undefined;
        return pending;
    }

    /**
     * Reflects the shared scene, camera and material variant in the URL, but only
     * for non-default values so a default view keeps a clean link.
     */
    syncSelectionUrl() {
        // Skip intermediate writes while the shared selection is being applied,
        // so the URL does not momentarily drop the other params.
        if (this.applyingUrlSelection) {
            return;
        }

        const url = new URL(window.location.href);
        const { selectedScene, selectedCamera, selectedVariant } = getViewerState().selection;

        // The scene and camera pickers report strings while the loader reports
        // numbers; coerce both before comparing against their defaults. The `{}`
        // placeholder `selectedScene` starts as coerces to NaN and is ignored.
        const scene = Number(selectedScene);
        if (Number.isInteger(scene) && scene !== (this.defaultSceneIndex ?? 0)) {
            url.searchParams.set("scene", String(scene));
        } else {
            url.searchParams.delete("scene");
        }

        const camera = Number(selectedCamera);
        if (Number.isInteger(camera) && camera !== -1) {
            url.searchParams.set("camera", String(camera));
        } else {
            url.searchParams.delete("camera");
        }

        if (typeof selectedVariant === "string" && selectedVariant !== "None") {
            url.searchParams.set("variant", selectedVariant);
        } else {
            url.searchParams.delete("variant");
        }

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
            saveDroppedEnvironment(hdrFile[1]).catch((error) =>
                console.warn("Could not persist the dropped environment", error)
            );
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

        // Persist the drop so a reload restores it instead of the default sample.
        this.clearModelUrl();
        saveDroppedAsset(mainFile, additionalFiles).catch((error) =>
            console.warn("Could not persist the dropped asset", error)
        );
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
        // A shared link may select a scene, camera or variant; apply them to the
        // first loaded asset, then let later loads fall back to the defaults.
        const pending = this.consumeSelectionUrl();
        this.applyingUrlSelection = true;

        const gltf = state.gltf;
        // The scene the asset declares as its default; the scene param is only
        // encoded when the selection differs from it.
        this.defaultSceneIndex = gltf.scene ?? 0;
        const hasVariants = gltf?.extensions?.KHR_materials_variants?.variants !== undefined;
        const variants = hasVariants
            ? [
                  "None",
                  ...gltf.extensions.KHR_materials_variants.variants.map(
                      (variant) => variant?.name ?? "Unnamed"
                  )
              ]
            : ["None"];

        const sceneIndex = Number(pending?.scene);
        const sceneOverride =
            pending?.scene != null &&
            Number.isInteger(sceneIndex) &&
            sceneIndex >= 0 &&
            sceneIndex < gltf.scenes.length
                ? sceneIndex
                : state.sceneIndex;
        const variantOverride =
            pending?.variant != null && variants.includes(pending.variant)
                ? pending.variant
                : "None";
        const cameraIndex = Number(pending?.camera);
        const cameraOverride =
            pending?.camera != null && Number.isInteger(cameraIndex) ? cameraIndex : undefined;

        this.publishCameras(state, cameraOverride);
        this.publishMorphWeights(state);
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

        const nodeTree = buildNodeTree(gltf);
        const assetTree = buildAssetTreeWithFocus(gltf);

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
            nodeTree,
            assetTree,

            materialVariants: variants,

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
            selectedScene: sceneOverride,
            selectedVariant: variantOverride,
            selectedAnimations: state.animationIndices,
            morphWeightOverrides: {},
            animationState: true,
            animationTimeOverride: null,
            animationDuration,
            graphState: true,
            physicsState: true,
            focusedNode: undefined
        });
        // A new asset rebuilds the tree, so any previous scene-tree selection and
        // expansion no longer apply; expand the top level of the node tree.
        updateSceneTree({
            mode: "nodes",
            selectedEntry: undefined,
            expandedKeys: nodeTree.map((entry) => entry.key),
            collapsedBoxes: ["transform"]
        });

        if (selectedDebugChannel !== getViewerState().config.debugChannel) {
            updateConfig({ debugChannel: selectedDebugChannel });
        }

        if (hasInteractivity && state.graphController.graphIndex !== undefined) {
            updateSelection({ selectedGraph: state.graphController.graphIndex });
        }

        this.applyingUrlSelection = false;
        this.syncSelectionUrl();
    }

    publishCameras(state, cameraOverride) {
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

        // A shared link may select a camera; only honour it when the asset offers it.
        const defaultCamera = state.cameraNodeIndex !== undefined ? state.cameraNodeIndex : -1;
        const camera =
            cameraOverride !== undefined && cameras.some((item) => item.index === cameraOverride)
                ? cameraOverride
                : defaultCamera;

        updatePublished({ cameras });
        updateSelection({ selectedCamera: camera });
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
