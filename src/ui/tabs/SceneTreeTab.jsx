import { useState } from "react";
import {
    Box,
    Boxes,
    Camera,
    ChevronDown,
    ChevronRight,
    Folder,
    Lightbulb,
    Link
} from "lucide-react";
import { commands } from "../../logic/commands.js";
import { useViewerStore } from "../store.js";
import { Field, Panel, SegmentedControl, Switch } from "../controls.jsx";

// Icon per entry kind, keyed by the `meta.type` built for each tree entry.
const TYPE_ICONS = {
    Mesh: Box,
    Camera: Camera,
    Light: Lightbulb,
    "External asset": Boxes,
    Group: Folder
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
                className={`flex cursor-default items-center gap-1 rounded-md px-1 py-0.5 select-none ${
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
                <button
                    type="button"
                    aria-label={expanded ? "Collapse" : "Expand"}
                    aria-expanded={expanded}
                    disabled={!hasChildren}
                    onClick={(event) => {
                        event.stopPropagation();
                        onToggleExpand(entry.key);
                    }}
                    className="text-ink-dim hover:text-ink -ml-1 flex size-5 shrink-0 items-center justify-center rounded transition-colors disabled:opacity-30"
                >
                    {hasChildren &&
                        (expanded ? (
                            <ChevronDown size={14} aria-hidden="true" />
                        ) : (
                            <ChevronRight size={14} aria-hidden="true" />
                        ))}
                </button>
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
 * the switch reflects the node's current visibility and remounts (via `key`)
 * when the selection changes.
 */
function VisibilityToggle({ node }) {
    const [visible, setVisible] = useState(node.visible ?? true);

    return (
        <Switch
            checked={visible}
            onChange={(checked) => {
                setVisible(checked);
                commands.setNodeVisibility(node, checked);
            }}
        >
            Visible
        </Switch>
    );
}

/**
 * A collapsible tree of the scene's nodes, or of its external assets, switchable
 * with a segmented control. The selected entry's details are shown below the tree.
 */
export function SceneTreeTab() {
    const [mode, setMode] = useState("nodes");
    const [selectedEntry, setSelectedEntry] = useState(undefined);
    const [expandedKeys, setExpandedKeys] = useState(() => new Set());
    const nodeTree = useViewerStore((state) => state.published.nodeTree);
    const assetTree = useViewerStore((state) => state.published.assetTree);
    const focusedNode = useViewerStore((state) => state.selection.focusedNode);
    const tree = mode === "nodes" ? nodeTree : assetTree;

    // When the tree is rebuilt (a new asset, or switching view), drop the selection
    // and expand only the top level.
    const [previousTree, setPreviousTree] = useState(tree);
    if (tree !== previousTree) {
        setPreviousTree(tree);
        setSelectedEntry(undefined);
        setExpandedKeys(new Set(tree.map((entry) => entry.key)));
    }

    // Double-clicking a node in the viewer selects it here, revealing its ancestors.
    const [previousFocusedNode, setPreviousFocusedNode] = useState(focusedNode);
    if (focusedNode !== previousFocusedNode) {
        setPreviousFocusedNode(focusedNode);
        if (focusedNode !== undefined) {
            const found = findEntryByFocus(nodeTree, focusedNode);
            if (found !== undefined) {
                if (mode === "nodes") {
                    setSelectedEntry(found.entry);
                    setExpandedKeys((keys) => new Set([...keys, ...found.ancestors]));
                } else {
                    setMode("nodes");
                    setSelectedEntry(found.entry);
                    setExpandedKeys(new Set([...nodeTree.map((e) => e.key), ...found.ancestors]));
                    setPreviousTree(nodeTree);
                }
            }
        }
    }

    const toggleExpand = (key) => {
        setExpandedKeys((keys) => {
            const next = new Set(keys);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    const SelectedTypeIcon =
        selectedEntry === undefined ? null : (TYPE_ICONS[selectedEntry.meta.type] ?? Folder);

    return (
        <Panel title="Scene">
            <Field label="Tree">
                <SegmentedControl
                    label="Tree view"
                    options={[
                        { label: "Nodes", value: "nodes" },
                        { label: "Assets", value: "assets" }
                    ]}
                    value={mode}
                    onChange={setMode}
                />
            </Field>

            <div className="mt-4">
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
                            expandedKeys={expandedKeys}
                            onToggleExpand={toggleExpand}
                            onSelect={setSelectedEntry}
                        />
                    ))
                )}
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
                        <h3 className="truncate font-medium">{selectedEntry.name}</h3>
                    </div>
                    {selectedEntry.uid !== undefined && (
                        <p className="mt-1 flex items-center gap-1.5">
                            <Link size={12} className="text-ink-dim shrink-0" aria-hidden="true" />
                            <span className="text-ink-dim truncate font-mono text-xs">
                                {selectedEntry.uid}
                            </span>
                        </p>
                    )}
                    <p className="text-ink-dim mt-1 text-sm">
                        {selectedEntry.meta.type}
                        {selectedEntry.meta.reference !== undefined &&
                            ` — ${selectedEntry.meta.reference}`}
                    </p>
                    {selectedEntry.focus !== undefined && (
                        <VisibilityToggle key={selectedEntry.key} node={selectedEntry.focus} />
                    )}
                    {selectedEntry.meta.materials.length > 0 && (
                        <p className="text-ink-dim mt-1 text-sm">
                            Materials: {selectedEntry.meta.materials.join(", ")}
                        </p>
                    )}
                    {selectedEntry.meta.extensions.length > 0 && (
                        <p className="text-ink-dim mt-1 text-sm">
                            Extensions: {selectedEntry.meta.extensions.join(", ")}
                        </p>
                    )}
                </div>
            )}
        </Panel>
    );
}
