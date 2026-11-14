import { Pause, Play } from "lucide-react";
import { commands } from "../../logic/commands.js";
import { updateSelection, useViewerStore } from "../store.js";
import { Field, Panel, PlaybackControls, Switch } from "../controls.jsx";
import { Slider } from "../Slider.jsx";

const formatTime = (value) => `${value.toFixed(2)} s`;

export function AnimationsTab() {
    const animations = useViewerStore((state) => state.published.animations);
    const selectedAnimations = useViewerStore((state) => state.selection.selectedAnimations);
    const disabledAnimations = useViewerStore((state) => state.published.disabledAnimations);
    const animationState = useViewerStore((state) => state.selection.animationState);
    const animationTimeOverride = useViewerStore((state) => state.selection.animationTimeOverride);
    const timeOverrideEnabled = useViewerStore((state) => state.selection.timeOverrideEnabled);
    const animationDuration = useViewerStore((state) => state.selection.animationDuration);

    const hasAnimations = animations.length !== 0;
    const canOverride = hasAnimations && animationDuration > 0;

    const toggleAnimation = (index, checked) => {
        const next = checked
            ? [...selectedAnimations, index]
            : selectedAnimations.filter((item) => item !== index);
        updateSelection({ selectedAnimations: next });
    };

    const setTimeOverride = (value) => {
        if (value === null || value === undefined) {
            updateSelection({ animationTimeOverride: null });
            return;
        }
        const clamped = Math.min(Math.max(value, 0), animationDuration);
        updateSelection({ animationTimeOverride: clamped });
    };

    return (
        <Panel title="Animations">
            {hasAnimations && (
                <PlaybackControls
                    active={animationState}
                    onText="Pause"
                    offText="Play"
                    onIcon={<Pause size={16} aria-hidden="true" />}
                    offIcon={<Play size={16} aria-hidden="true" />}
                    onToggle={(on) => {
                        updateSelection({ animationState: on });
                    }}
                    onReset={() => commands.animationResetChanged()}
                />
            )}

            {hasAnimations && (
                <Field label="Animations" grouped>
                    {animations.map((animation) => (
                        <Switch
                            key={animation.index}
                            checked={selectedAnimations.includes(animation.index)}
                            disabled={disabledAnimations.includes(animation.index)}
                            onChange={(checked) => toggleAnimation(animation.index, checked)}
                        >
                            {animation.title}
                        </Switch>
                    ))}
                </Field>
            )}

            {canOverride && (
                <div className="mt-6">
                    <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="font-medium">Time Override</span>
                        <Switch
                            className="mt-0! w-auto!"
                            checked={timeOverrideEnabled}
                            onChange={(checked) => {
                                updateSelection({ timeOverrideEnabled: checked });
                                if (!checked) {
                                    setTimeOverride(null);
                                }
                            }}
                        >
                            <span className="sr-only">Time Override</span>
                        </Switch>
                    </div>
                    {timeOverrideEnabled && (
                        <Slider
                            className="my-0!"
                            label="Time Override"
                            value={animationTimeOverride}
                            min={0}
                            max={animationDuration}
                            step={0.01}
                            formatter={formatTime}
                            onChange={setTimeOverride}
                            showInput
                            inputPlaceholder="-"
                            inputSuffix="s"
                            inputClassName="w-24 shrink-0 py-0.5 text-sm"
                        />
                    )}
                </div>
            )}
        </Panel>
    );
}
