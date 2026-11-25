import { useEffect, useState } from "react";
import {
    Bone,
    Box,
    Boxes,
    Camera,
    ChevronDown,
    ChevronRight,
    CirclePlay,
    Copy,
    Eye,
    EyeOff,
    Folder,
    Layers,
    Lightbulb,
    Link,
    Move3d,
    MousePointerClick,
    PaintBucket,
    Pyramid
} from "lucide-react";
import { commands } from "../../logic/commands.js";
import { canonicalExtensionName, canonicalPropName } from "../../logic/material_naming.js";
import { updateSceneTree, useViewerStore } from "../store.js";
import { Field, Panel, SegmentedControl } from "../controls.jsx";
import { JsonTree } from "../JsonTree.jsx";

// Icon per entry kind, keyed by the `meta.type` built for each tree entry.
const TYPE_ICONS = {
    Mesh: Box,
    Camera: Camera,
    Light: Lightbulb,
    "External asset": Boxes,
    Node: Folder
};

// Icon per details-box type.
const BOX_ICONS = {
    Mesh: Box,
    Material: PaintBucket,
    Shape: Pyramid,
    Collider: Box,
    Trigger: Box,
    Motion: Box,
    Joint: Link,
    Camera: Camera,
    Light: Lightbulb,
    Transform: Move3d,
    Skin: Bone,
    Weights: Layers,
    "External Asset": Boxes,
    Animations: CirclePlay,
    Instancing: Copy
};

// Finds the entry whose `focus` is the given node, returning it plus the keys of
// its ancestors (so they can be expanded to reveal it).
function findEntryByFocus(entries, node, ancestors = []) {
    for (const entry of entries) {
        if (entry.focus === node) {
            return { entry, ancestors };
        }
        const found = findEntryByFocus(entry.children, node, [...ancestors, entry.key]);
        if (found !== undefined) {
            return found;
        }
    }
    return undefined;
}

/**
 * One row of the tree. Expansion is controlled by the parent (`expandedKeys`) so
 * ancestors can be revealed when the viewer selects a node. A single click selects
 * the entry (shown below the tree); double-clicking centres the viewer on it.
 */
function TreeRow({ entry, depth, selectedKey, expandedKeys, onToggleExpand, onSelect }) {
    const hasChildren = entry.children.length > 0;
    const selected = entry.key === selectedKey;
    const expanded = expandedKeys.has(entry.key);
    const TypeIcon = TYPE_ICONS[entry.meta.type] ?? Folder;

    return (
        <div>
            <div
                className={`flex min-w-max cursor-pointer items-center gap-1 rounded-md px-1 py-0.5 select-none ${
                    selected ? "bg-accent-dim" : "hover:bg-card"
                }`}
                style={{ paddingLeft: `${depth * 14 + 4}px` }}
                title={entry.name}
                onClick={() => onSelect(entry)}
                onDoubleClick={() => {
                    if (entry.focus) {
                        commands.focusObjectChanged(entry.focus);
                    }
                }}
            >
                {hasChildren ? (
                    <button
                        type="button"
                        aria-label={expanded ? "Collapse" : "Expand"}
                        aria-expanded={expanded}
                        onClick={(event) => {
                            event.stopPropagation();
                            onToggleExpand(entry.key);
                        }}
                        onDoubleClick={(event) => event.stopPropagation()}
                        className="text-ink-dim hover:bg-card-inner hover:text-ink active:bg-accent-dim -ml-1 flex size-5 shrink-0 items-center justify-center rounded transition-colors"
                    >
                        <ChevronRight
                            size={14}
                            aria-hidden="true"
                            className={`motion-safe:transition-transform ${expanded ? "rotate-90" : ""}`}
                        />
                    </button>
                ) : (
                    <span className="-ml-1 size-5 shrink-0" aria-hidden="true" />
                )}
                <TypeIcon size={14} className="text-ink-dim shrink-0" aria-hidden="true" />
                <span className="truncate text-sm">{entry.name}</span>
            </div>
            {expanded && hasChildren && (
                <div>
                    {entry.children.map((child) => (
                        <TreeRow
                            key={child.key}
                            entry={child}
                            depth={depth + 1}
                            selectedKey={selectedKey}
                            expandedKeys={expandedKeys}
                            onToggleExpand={onToggleExpand}
                            onSelect={onSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

/**
 * Toggles the visibility of the selected entry's node. Holds its own state so
 * the icon reflects the node's current visibility and remounts (via `key`)
 * when the selection changes.
 */
function VisibilityButton({ node }) {
    const [visible, setVisible] = useState(node.visible ?? true);

    return (
        <button
            type="button"
            aria-label={visible ? "Hide node" : "Show node"}
            title={visible ? "Hide node" : "Show node"}
            onClick={() => {
                const next = !visible;
                setVisible(next);
                commands.setNodeVisibility(node, next);
            }}
            className="text-accent hover:text-accent-hover shrink-0 rounded transition-colors"
        >
            {visible ? (
                <Eye size={16} aria-hidden="true" />
            ) : (
                <EyeOff size={16} aria-hidden="true" />
            )}
        </button>
    );
}

function toSrgb(value) {
    return value <= 0.0031308 ? 12.92 * value : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
}

/** A small swatch showing a linear glTF color converted to sRGB. */
function ColorSwatch({ color }) {
    const [r, g, b] = color;
    const a = color.length > 3 ? color[3] : 1;
    const backgroundColor = `rgba(${Math.round(toSrgb(r) * 255)}, ${Math.round(
        toSrgb(g) * 255
    )}, ${Math.round(toSrgb(b) * 255)}, ${a})`;
    return (
        <span
            className="border-ink/40 size-3.5 shrink-0 rounded-sm border"
            style={{ backgroundColor }}
            title={formatVectorFull(color)}
        />
    );
}

function formatVector(value, decimals) {
    return `[${value.map((item) => Number(item.toFixed(decimals))).join(", ")}]`;
}

function formatScalar(value) {
    return typeof value === "number" ? Number(value.toFixed(2)).toString() : String(value);
}

function formatVectorFull(value) {
    return `[${value.join("; ")}]`;
}

/** A set of grouped values, one group per generic / metallic-roughness / extension. */
function GroupedProps({ values }) {
    return (
        <div className="flex flex-col gap-3">
            {Object.entries(values).map(([group, props]) => (
                <PropsGroup key={group} name={group} props={props} header={group !== "generic"} />
            ))}
        </div>
    );
}

function PropsGroup({ name, props, header = true }) {
    return (
        <div>
            {header && (
                <p className="text-ink/70 text-xs font-medium uppercase tracking-wide">
                    {canonicalExtensionName(name) ?? canonicalPropName(name)}
                </p>
            )}
            <div className="mt-0.5 flex flex-col gap-0.5">
                {Object.entries(props).map(([key, value]) => (
                    <PropsValue key={key} name={key} value={value} />
                ))}
            </div>
        </div>
    );
}

// Whether a vector prop name denotes a color. Vector-valued factors and anything
// named *color* are colors; velocities, positions, etc. are not.
function isColorName(name) {
    const lower = name.toLowerCase();
    return lower.includes("color") || lower.endsWith("factor");
}

function isNodeReference(value) {
    return value !== null && typeof value === "object" && value.kind === "node";
}

function PropsValue({ name, value }) {
    if (isNodeReference(value)) {
        return (
            <div className="flex flex-wrap items-center gap-x-1.5">
                <span className="font-light text-sm" title={name}>
                    {canonicalPropName(name)}
                    <span className="text-ink/60">:</span>
                </span>
                <NodeLink value={value} />
            </div>
        );
    }

    const isVector = Array.isArray(value) && value.every((item) => typeof item === "number");
    const isColor = isVector && (value.length === 3 || value.length === 4) && isColorName(name);

    return (
        <div className="flex flex-wrap items-center gap-x-1.5">
            <span className="font-light" title={name}>
                {canonicalPropName(name)}
                <span className="text-ink/60">:</span>
            </span>
            {isColor ? (
                <ColorSwatch color={value} />
            ) : (
                <span
                    className="text-ink/70 font-mono text-xs"
                    title={
                        isVector
                            ? formatVectorFull(value)
                            : typeof value === "number"
                              ? String(value)
                              : undefined
                    }
                >
                    {isVector ? formatVector(value, 2) : formatScalar(value)}
                </span>
            )}
        </div>
    );
}

// A clickable reference to a node (e.g. a joint's connected node).
function NodeLink({ value }) {
    const nodeTree = useViewerStore((state) => state.published.nodeTree);
    const expandedKeys = useViewerStore((state) => state.sceneTree.expandedKeys);

    const select = () => {
        if (value.node === undefined) {
            return;
        }
        const found = findEntryByFocus(nodeTree, value.node);
        if (found !== undefined) {
            updateSceneTree({
                mode: "nodes",
                selectedEntry: found.entry,
                expandedKeys: [...new Set([...expandedKeys, ...found.ancestors])]
            });
        }
    };

    return (
        <button
            type="button"
            onClick={select}
            className="text-accent hover:underline inline-flex items-center gap-1 font-mono text-sm"
        >
            <Link size={12} className="shrink-0" aria-hidden="true" />
            {value.label}
        </button>
    );
}

/**
 * One collapsible details box: a type + name header, optional texture previews,
 * and grouped values.
 */
function DetailBox({ box, open, onToggle }) {
    const Icon = BOX_ICONS[box.type] ?? Folder;

    return (
        <div className="rounded-md bg-card px-2 py-1.5">
            <button
                type="button"
                aria-expanded={open}
                onClick={onToggle}
                className="flex w-full items-center gap-2 text-left"
            >
                <Icon size={14} className="text-ink-dim shrink-0" aria-hidden="true" />
                <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-ink/70 text-xs">{box.type}</span>
                    {box.name !== undefined && (
                        <span className="truncate font-light">{box.name}</span>
                    )}
                </span>
                <ChevronDown
                    size={16}
                    aria-hidden="true"
                    className={`shrink-0 motion-safe:transition-transform ${open ? "" : "rotate-90"}`}
                />
            </button>

            {open && (
                <div className="mt-1.5">
                    {box.previews !== undefined && box.previews.length > 0 && (
                        <div className="mb-1.5 flex flex-wrap gap-2">
                            {box.previews.map((preview) => (
                                <div key={preview.label} className="w-14">
                                    <img
                                        src={preview.src}
                                        alt={preview.label}
                                        className="h-14 w-14 rounded-md object-cover"
                                    />
                                    <p
                                        className="text-ink/70 mt-0.5 text-center text-[10px]"
                                        title={preview.label}
                                    >
                                        {preview.label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                    <GroupedProps values={box.values} />
                </div>
            )}
        </div>
    );
}

/**
 * A collapsible tree of the scene's nodes, or of its external assets, switchable
 * with a segmented control. The selected entry's details are shown below the tree.
 */
export function SceneTreeTab() {
    const mode = useViewerStore((state) => state.sceneTree.mode);
    const selectedEntry = useViewerStore((state) => state.sceneTree.selectedEntry);
    const expandedKeys = useViewerStore((state) => state.sceneTree.expandedKeys);
    const collapsedBoxes = useViewerStore((state) => state.sceneTree.collapsedBoxes);
    const nodeTree = useViewerStore((state) => state.published.nodeTree);
    const assetTree = useViewerStore((state) => state.published.assetTree);
    const focusedNode = useViewerStore((state) => state.selection.focusedNode);
    const tree = mode === "nodes" ? nodeTree : assetTree;
    const expandedSet = new Set(expandedKeys);
    const hasExternalAssets = assetTree.length > 0;

    // Double-clicking a node in the viewer selects it here, revealing its ancestors.
    useEffect(() => {
        if (focusedNode === undefined) {
            return;
        }
        const found = findEntryByFocus(nodeTree, focusedNode);
        if (found !== undefined) {
            const base = mode === "nodes" ? expandedKeys : nodeTree.map((entry) => entry.key);
            updateSceneTree({
                mode: "nodes",
                selectedEntry: found.entry,
                expandedKeys: [...new Set([...base, ...found.ancestors])]
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [focusedNode]);

    const switchMode = (next) => {
        if (next === mode) return;
        const nextTree = next === "nodes" ? nodeTree : assetTree;
        updateSceneTree({
            mode: next,
            selectedEntry: undefined,
            expandedKeys: nextTree.map((entry) => entry.key)
        });
    };

    const toggleExpand = (key) => {
        const next = new Set(expandedKeys);
        if (next.has(key)) {
            next.delete(key);
        } else {
            next.add(key);
        }
        updateSceneTree({ expandedKeys: [...next] });
    };

    const toggleBox = (key) => {
        updateSceneTree({
            collapsedBoxes: collapsedBoxes.includes(key)
                ? collapsedBoxes.filter((item) => item !== key)
                : [...collapsedBoxes, key]
        });
    };

    const SelectedTypeIcon =
        selectedEntry === undefined ? null : (TYPE_ICONS[selectedEntry.meta.type] ?? Folder);

    return (
        <Panel title="Scene">
            {hasExternalAssets && (
                <Field>
                    <SegmentedControl
                        label="Tree view"
                        options={[
                            { label: "Nodes", value: "nodes" },
                            { label: "Assets", value: "assets" }
                        ]}
                        value={mode}
                        onChange={switchMode}
                    />
                </Field>
            )}

            <div className={hasExternalAssets ? "mt-4 overflow-x-auto" : "overflow-x-auto"}>
                {tree.length === 0 ? (
                    <p className="text-ink-dim text-sm">
                        {mode === "nodes"
                            ? "No nodes in this scene."
                            : "No external assets in this scene."}
                    </p>
                ) : (
                    tree.map((entry) => (
                        <TreeRow
                            key={entry.key}
                            entry={entry}
                            depth={0}
                            selectedKey={selectedEntry?.key}
                            expandedKeys={expandedSet}
                            onToggleExpand={toggleExpand}
                            onSelect={(entry) => updateSceneTree({ selectedEntry: entry })}
                        />
                    ))
                )}
            </div>

            <div
                className="text-ink/50 mt-6 flex items-center justify-end gap-1.5 text-xs"
                title="Double click to focus node"
            >
                <MousePointerClick size={12} aria-hidden="true" />
                <span>Focus node</span>
            </div>

            {selectedEntry !== undefined && (
                <div className="mt-6 border-t border-ink/20 pt-4">
                    <div className="flex items-center gap-2">
                        {SelectedTypeIcon && (
                            <SelectedTypeIcon
                                size={16}
                                className="text-ink-dim shrink-0"
                                aria-hidden="true"
                            />
                        )}
                        <h3
                            className="min-w-0 flex-1 truncate font-medium"
                            title={selectedEntry.name}
                        >
                            {selectedEntry.name}
                        </h3>
                        {selectedEntry.focus !== undefined && (
                            <VisibilityButton key={selectedEntry.key} node={selectedEntry.focus} />
                        )}
                    </div>
                    {selectedEntry.uid !== undefined && (
                        <p className="mt-1 flex items-center gap-1.5">
                            <Link size={12} className="text-ink-dim shrink-0" aria-hidden="true" />
                            <span className="text-ink-dim truncate font-mono text-xs">
                                {selectedEntry.uid}
                            </span>
                        </p>
                    )}
                    {selectedEntry.meta.boxes.length > 0 && (
                        <div className="mt-3 flex flex-col gap-1">
                            {selectedEntry.meta.boxes.map((box) => (
                                <DetailBox
                                    key={box.key}
                                    box={box}
                                    open={!collapsedBoxes.includes(box.key)}
                                    onToggle={() => toggleBox(box.key)}
                                />
                            ))}
                        </div>
                    )}
                    {selectedEntry.meta.extras != null &&
                        Object.keys(selectedEntry.meta.extras).length > 0 && (
                            <>
                                <p className="mt-3 text-sm font-medium">Extras</p>
                                <JsonTree data={selectedEntry.meta.extras} />
                            </>
                        )}
                </div>
            )}
        </Panel>
    );
}
