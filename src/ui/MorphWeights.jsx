import { uiEvents } from "../logic/ui_events.js";
import { useViewerStore } from "./store.js";
import { Slider } from "./Slider.jsx";

const formatWeight = (value) => value.toFixed(2);
const classNames = (...values) => values.filter(Boolean).join(" ");

function MorphWeightSlider({ node, target, targetIndex, disabled }) {
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
            <Slider
                className="my-0! mx-2! flex-1"
                label={`${node.title}: ${target.name}`}
                value={target.value}
                min={0}
                max={1}
                step={0.01}
                formatter={formatWeight}
                onChange={(value) =>
                    uiEvents.morphWeightChanged.emit({
                        nodeIndex: node.nodeIndex,
                        targetIndex,
                        value
                    })
                }
            />
        </div>
    );
}

export function MorphWeights({ disabled }) {
    const nodes = useViewerStore((state) => state.morphWeights);
    const isLoading = useViewerStore((state) => state.isLoading);
    return (
        <div className="mt-2 mb-2 ml-14">
            {nodes.map((node) => (
                <div key={node.nodeIndex} className="mt-3 first:mt-0">
                    <h3 className="mb-1 truncate text-sm font-medium" title={node.title}>
                        {node.title}
                    </h3>
                    <div className="flex flex-col gap-2">
                        {node.targets.map((target, targetIndex) => (
                            <MorphWeightSlider
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
        </div>
    );
}
