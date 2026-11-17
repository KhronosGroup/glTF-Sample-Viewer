import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { commands } from "../../logic/commands.js";
import { useViewerStore } from "../store.js";
import { Field, Panel, SegmentedControl } from "../controls.jsx";

/**
 * One row of the tree. Holds its own expand/collapse state so toggling a branch
 * does not reset the rest of the tree. Double-clicking centres the viewer on the
 * entry's node.
 */
function TreeRow({ entry, depth }) {
    const [expanded, setExpanded] = useState(depth < 1);
    const hasChildren = entry.children.length > 0;

    return (
        <div>
            <div
                className="hover:bg-card flex cursor-default items-center gap-1 rounded-md px-1 py-0.5 select-none"
                style={{ paddingLeft: `${depth * 14 + 4}px` }}
                title={entry.name}
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
                        <TreeRow key={child.key} entry={child} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}

/**
 * A collapsible tree of the scene's nodes, or of its external assets, switchable
 * with a segmented control.
 */
export function SceneTreeTab() {
    const [mode, setMode] = useState("nodes");
    const nodeTree = useViewerStore((state) => state.published.nodeTree);
    const assetTree = useViewerStore((state) => state.published.assetTree);
    const tree = mode === "nodes" ? nodeTree : assetTree;

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
                    tree.map((entry) => <TreeRow key={entry.key} entry={entry} depth={0} />)
                )}
            </div>
        </Panel>
    );
}
