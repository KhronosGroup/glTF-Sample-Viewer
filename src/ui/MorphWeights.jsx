import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { uiEvents } from "../logic/ui_events.js";
import { useViewerStore } from "./store.js";
import { Field, Input, OutlineButton } from "./controls.jsx";

function MorphWeightInput({ node, target, targetIndex, disabled }) {
    const [draft, setDraft] = useState(null);
    return (
        <label className="flex items-center justify-between gap-3">
            <span className="min-w-0 break-words">
                {target.name}
                {target.overridden && <span className="text-ink/60"> (override)</span>}
            </span>
            <Input
                aria-label={`${node.title}: ${target.name}`}
                className="w-28 shrink-0 disabled:opacity-50"
                type="number"
                step="any"
                disabled={disabled}
                value={draft ?? target.value}
                onFocus={() => setDraft(String(target.value))}
                onBlur={() => setDraft(null)}
                onChange={(event) => {
                    setDraft(event.target.value);
                    if (event.target.value !== "" && event.target.validity.valid) {
                        uiEvents.morphWeightChanged.emit({
                            nodeIndex: node.nodeIndex,
                            targetIndex,
                            value: event.target.valueAsNumber
                        });
                    }
                }}
            />
        </label>
    );
}

export function MorphWeights({ disabled }) {
    const nodes = useViewerStore((state) => state.morphWeights);
    const isLoading = useViewerStore((state) => state.isLoading);
    const hasOverrides = useViewerStore((state) => state.hasMorphWeightOverrides);
    if (nodes.length === 0) {
        return null;
    }
    return (
        <Field label="Morph Target Weights">
            <p className="mb-3 text-sm text-ink/60">
                Edits override individual weights, including animated weights, until reset. Values
                are not limited to 0-1.
            </p>
            <OutlineButton
                className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading || !hasOverrides}
                onClick={() => uiEvents.morphWeightsReset.emit()}
            >
                <RotateCcw size={16} aria-hidden="true" />
                Reset Morph Weights
            </OutlineButton>
            {nodes.map((node) => (
                <div key={node.nodeIndex} className="mt-4">
                    <h3 className="mb-2 break-words font-medium">{node.title}</h3>
                    <div className="flex flex-col gap-2">
                        {node.targets.map((target, targetIndex) => (
                            <MorphWeightInput
                                key={targetIndex}
                                node={node}
                                target={target}
                                targetIndex={targetIndex}
                                disabled={disabled || isLoading}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </Field>
    );
}
