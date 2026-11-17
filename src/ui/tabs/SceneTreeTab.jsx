import { useState } from "react";
import { Box, Boxes, Camera, ChevronDown, ChevronRight, Folder, Lightbulb } from "lucide-react";
import { commands } from "../../logic/commands.js";
import { useViewerStore } from "../store.js";
import { Field, Panel, SegmentedControl } from "../controls.jsx";

// Icon per entry kind, keyed by the `meta.type` built for each tree entry.
const TYPE_ICONS = {
    Mesh: Box,
    Camera: Camera,
    Light: Lightbulb,
    "External asset": Boxes,
    Group: Folder
};

/**
 * One row of the tree. Holds its own expand/collapse state so toggling a branch
 * does not reset the rest of the tree. A single click selects the entry (shown
 * below the tree); double-clicking centres the viewer on it.
 */
function TreeRow({ entry, depth, selectedKey, onSelect }) {
    const [expanded, setExpanded] = useState(depth < 1);
    const hasChildren = entry.children.length > 0;
    const selected = entry.key === selectedKey;
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
                        setExpanded((value) => !value);
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
                {entry.uid !== undefined && (
                    <span
                        className="text-ink-dim ml-1 shrink-0 font-mono text-[11px]"
                        title={entry.uid}
                    >
                        {entry.uid}
                    </span>
                )}
            </div>
            {expanded && hasChildren && (
                <div>
                    {entry.children.map((child) => (
                        <TreeRow
                            key={child.key}
                            entry={child}
                            depth={depth + 1}
                            selectedKey={selectedKey}
                            onSelect={onSelect}
                        />
                    ))}
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
    const [mode, setMode] = useState("nodes");
    const [selectedEntry, setSelectedEntry] = useState(undefined);
    const nodeTree = useViewerStore((state) => state.published.nodeTree);
    const assetTree = useViewerStore((state) => state.published.assetTree);
    const tree = mode === "nodes" ? nodeTree : assetTree;

    // When the tree is rebuilt (a new asset, or switching view), drop the selection
    // rather than showing details for an entry that no longer exists.
    const [previousTree, setPreviousTree] = useState(tree);
    if (tree !== previousTree) {
        setPreviousTree(tree);
        setSelectedEntry(undefined);
    }

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
                            onSelect={setSelectedEntry}
                        />
                    ))
                )}
            </div>

            {selectedEntry !== undefined && (
                <div className="mt-6 border-t border-ink/20 pt-4">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                        <h3 className="truncate font-medium">{selectedEntry.name}</h3>
                        {selectedEntry.uid !== undefined && (
                            <span className="text-ink-dim font-mono text-xs">
                                {selectedEntry.uid}
                            </span>
                        )}
                    </div>
                    <p className="text-ink-dim mt-1 text-sm">
                        {selectedEntry.meta.type}
                        {selectedEntry.meta.reference !== undefined &&
                            ` — ${selectedEntry.meta.reference}`}
                    </p>
                </div>
            )}
        </Panel>
    );
}
