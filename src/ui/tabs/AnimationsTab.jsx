import { useState } from "react";
import { Pause, Play } from "lucide-react";
import { uiEvents } from "../../logic/ui_events.js";
import { setViewerState, useViewerStore } from "../store.js";
import { Field, Input, Panel, PlaybackControls, Switch } from "../controls.jsx";
import { Slider } from "../Slider.jsx";

const formatTime = (value) => `${value.toFixed(2)} s`;

export function AnimationsTab() {
    const animations = useViewerStore((state) => state.animations);
    const selectedAnimations = useViewerStore((state) => state.selectedAnimations);
    const disabledAnimations = useViewerStore((state) => state.disabledAnimations);
    const animationState = useViewerStore((state) => state.animationState);
    const animationTimeOverride = useViewerStore((state) => state.animationTimeOverride);
    const timeOverrideEnabled = useViewerStore((state) => state.timeOverrideEnabled);
    const animationDuration = useViewerStore((state) => state.animationDuration);

    // The numeric input keeps its own draft while focused, so editing it is not
    // rewritten as the underlying value changes.
    const [timeDraft, setTimeDraft] = useState(null);

    const hasAnimations = animations.length !== 0;
    const canOverride = hasAnimations && animationDuration > 0;

    const toggleAnimation = (index, checked) => {
        const next = checked
            ? [...selectedAnimations, index]
            : selectedAnimations.filter((item) => item !== index);
        setViewerState({ selectedAnimations: next });
        uiEvents.selectedAnimationsChanged.emit(next);
    };

    const setTimeOverride = (value) => {
        if (value === null || value === undefined) {
            setViewerState({ animationTimeOverride: null });
            uiEvents.animationTimeChanged.emit(null);
            return;
        }
        const clamped = Math.min(Math.max(value, 0), animationDuration);
        setViewerState({ animationTimeOverride: clamped });
        uiEvents.animationTimeChanged.emit(clamped);
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
                        setViewerState({ animationState: on });
                        uiEvents.animationPlayChanged.emit(on);
                    }}
                    onReset={() => uiEvents.animationResetChanged.emit(true)}
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
                                setViewerState({ timeOverrideEnabled: checked });
                                if (!checked) {
                                    setTimeOverride(null);
                                }
                            }}
                        >
                            <span className="sr-only">Time Override</span>
                        </Switch>
                    </div>
                    {timeOverrideEnabled && (
                        <div className="flex items-center gap-3">
                            <Slider
                                className="my-0! mx-2! flex-1"
                                label="Time Override"
                                value={animationTimeOverride}
                                min={0}
                                max={animationDuration}
                                step={0.01}
                                formatter={formatTime}
                                onChange={setTimeOverride}
                            />
                            <Input
                                aria-label="Time Override"
                                className="w-24 shrink-0 py-0.5 text-sm"
                                type="number"
                                min={0}
                                max={animationDuration}
                                step="any"
                                placeholder="-"
                                value={timeDraft ?? animationTimeOverride ?? ""}
                                onFocus={() =>
                                    setTimeDraft(
                                        animationTimeOverride === null
                                            ? ""
                                            : String(animationTimeOverride)
                                    )
                                }
                                onBlur={() => setTimeDraft(null)}
                                onChange={(event) => {
                                    setTimeDraft(event.target.value);
                                    if (event.target.value === "") {
                                        setTimeOverride(null);
                                    } else if (event.target.validity.valid) {
                                        setTimeOverride(event.target.valueAsNumber);
                                    }
                                }}
                            />
                        </div>
                    )}
                </div>
            )}
        </Panel>
    );
}
