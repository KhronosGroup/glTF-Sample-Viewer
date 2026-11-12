import { useState } from "react";
import { setViewerState, useViewerStore } from "./store.js";
import { Input, SegmentedControl } from "./controls.jsx";
import { Slider } from "./Slider.jsx";

const formatWeight = (value) => value.toFixed(2);
const classNames = (...values) => values.filter(Boolean).join(" ");

// Switches the slider range between the conventional [0, 1] and a signed
// [-1, 1] interval for negative weights.
function RangeToggle({ signed, onChange }) {
    const options = [
        { label: "[0, 1]", value: false },
        { label: "[-1, 1]", value: true }
    ];
    return (
        <SegmentedControl
            label="Morph weight range"
            options={options}
            value={signed}
            onChange={onChange}
        />
    );
}

// The slider covers the selected range; the box beside it takes any value.
// Both are empty while the target is unset, and clearing the box unsets it.
function MorphWeightRow({ node, target, targetIndex, disabled, signedRange }) {
    const [draft, setDraft] = useState(null);
    const label = `${node.title}: ${target.name}`;
    const emit = (value) =>
        setViewerState((state) => {
            const nodeOverrides = state.morphWeightOverrides[node.nodeIndex] ?? {};
            const nextNodeOverrides = { ...nodeOverrides };
            if (value === null || value === undefined) {
                delete nextNodeOverrides[targetIndex];
            } else {
                nextNodeOverrides[targetIndex] = value;
            }
            const next = { ...state.morphWeightOverrides };
            if (Object.keys(nextNodeOverrides).length === 0) {
                delete next[node.nodeIndex];
            } else {
                next[node.nodeIndex] = nextNodeOverrides;
            }
            return { morphWeightOverrides: next };
        });
    const min = signedRange ? -1 : 0;
    return (
        <div
            className={classNames(
                "flex items-center gap-3",
                disabled && "pointer-events-none opacity-50"
            )}
            aria-disabled={disabled}
            inert={disabled}
        >
            <span className="w-18 shrink-0 truncate text-sm" title={target.name}>
                {target.name}
            </span>
            <Slider
                className="my-0! mx-2! flex-1"
                label={label}
                value={target.value}
                min={min}
                max={1}
                step={0.01}
                formatter={formatWeight}
                onChange={emit}
            />
            <Input
                aria-label={label}
                className="w-12 shrink-0 py-0.5 text-sm"
                type="number"
                step="any"
                placeholder="-"
                value={draft ?? target.value ?? ""}
                onFocus={() => setDraft(target.value === null ? "" : String(target.value))}
                onBlur={() => setDraft(null)}
                onChange={(event) => {
                    setDraft(event.target.value);
                    if (event.target.value === "") {
                        emit(null);
                    } else if (event.target.validity.valid) {
                        emit(event.target.valueAsNumber);
                    }
                }}
            />
        </div>
    );
}

export function MorphWeights({ disabled, signedRange, onSignedRangeChange }) {
    const nodes = useViewerStore((state) => state.morphWeights);
    const isLoading = useViewerStore((state) => state.isLoading);
    return (
        <div>
            <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-sm font-light">Slider range</span>
                <RangeToggle signed={signedRange} onChange={onSignedRangeChange} />
            </div>
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
                                signedRange={signedRange}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
