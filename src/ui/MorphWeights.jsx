import { useState } from "react";
import { uiEvents } from "../logic/ui_events.js";
import { useViewerStore } from "./store.js";
import { Input, Select } from "./controls.jsx";
import { Slider } from "./Slider.jsx";

const formatWeight = (value) => value.toFixed(2);
const classNames = (...values) => values.filter(Boolean).join(" ");

const emitWeight = (node, targetIndex, value) =>
    uiEvents.morphWeightChanged.emit({ nodeIndex: node.nodeIndex, targetIndex, value });

function WeightSlider({ node, target, targetIndex }) {
    return (
        <Slider
            className="my-0! mx-2! flex-1"
            label={`${node.title}: ${target.name}`}
            value={target.value}
            min={0}
            max={1}
            step={0.01}
            formatter={formatWeight}
            onChange={(value) => emitWeight(node, targetIndex, value)}
        />
    );
}

// An empty box is the unset state: typing a number overrides the target and
// clearing the box removes the override again.
function WeightInput({ node, target, targetIndex }) {
    const [draft, setDraft] = useState(null);
    return (
        <Input
            aria-label={`${node.title}: ${target.name}`}
            className="min-w-0 flex-1 py-0.5 text-sm"
            type="number"
            step="any"
            placeholder="Not set"
            value={draft ?? target.value ?? ""}
            onFocus={() => setDraft(target.value === null ? "" : String(target.value))}
            onBlur={() => setDraft(null)}
            onChange={(event) => {
                setDraft(event.target.value);
                if (event.target.value === "") {
                    emitWeight(node, targetIndex, null);
                } else if (event.target.validity.valid) {
                    emitWeight(node, targetIndex, event.target.valueAsNumber);
                }
            }}
        />
    );
}

function MorphWeightRow({ node, target, targetIndex, disabled, mode }) {
    const Control = mode === "numeric" ? WeightInput : WeightSlider;
    return (
        <div
            className={classNames(
                "flex items-center gap-3",
                disabled && "pointer-events-none opacity-50"
            )}
            aria-disabled={disabled}
            inert={disabled}
        >
            <span className="w-1/5 shrink-0 truncate text-sm" title={target.name}>
                {target.name}
            </span>
            <Control node={node} target={target} targetIndex={targetIndex} />
        </div>
    );
}

export function MorphWeights({ disabled, mode, onModeChange }) {
    const nodes = useViewerStore((state) => state.morphWeights);
    const isLoading = useViewerStore((state) => state.isLoading);
    return (
        <div className="mt-2 mb-2 ml-14">
            <Select
                aria-label="Morph override input"
                className="mb-3"
                value={mode}
                onChange={onModeChange}
            >
                <option value="sliders">Sliders</option>
                <option value="numeric">Numeric</option>
            </Select>
            {nodes.map((node) => (
                <div key={node.nodeIndex} className="mt-3 first:mt-0">
                    <h3 className="mb-1 truncate text-sm font-medium" title={node.title}>
                        {node.title}
                    </h3>
                    <div className="flex flex-col gap-2">
                        {node.targets.map((target, targetIndex) => (
                            <MorphWeightRow
                                key={targetIndex}
                                node={node}
                                target={target}
                                targetIndex={targetIndex}
                                disabled={disabled || isLoading}
                                mode={mode}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
