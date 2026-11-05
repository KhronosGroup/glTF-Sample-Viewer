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
    const animationTime = useViewerStore((state) => state.animationTime);
    const animationDuration = useViewerStore((state) => state.animationDuration);

    // The numeric input keeps its own draft while focused, so the live playhead
    // does not rewrite the value mid-keystroke.
    const [timeDraft, setTimeDraft] = useState(null);

    const hasAnimations = animations.length !== 0;
    const canScrub = hasAnimations && animationDuration > 0;

    const toggleAnimation = (index, checked) => {
        const next = checked
            ? [...selectedAnimations, index]
            : selectedAnimations.filter((item) => item !== index);
        setViewerState({ selectedAnimations: next });
        uiEvents.selectedAnimationsChanged.emit(next);
    };

    const setAnimationTime = (value) => {
        const clamped = Math.min(Math.max(value, 0), animationDuration);
        setViewerState({ animationTime: clamped });
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

            {!hasAnimations && <p className="text-ink/60">No animations available</p>}

            {canScrub && (
                <Field label="Current Time">
                    <div className="flex items-center gap-3">
                        <Slider
                            className="my-0! mx-2! flex-1"
                            label="Animation time"
                            value={animationTime}
                            min={0}
                            max={animationDuration}
                            step={0.01}
                            formatter={formatTime}
                            onChange={setAnimationTime}
                        />
                        <Input
                            aria-label="Animation time"
                            className="w-24 shrink-0 py-0.5 text-sm"
                            type="number"
                            min={0}
                            max={animationDuration}
                            step="any"
                            value={
                                timeDraft ??
                                (Number.isFinite(animationTime) ? animationTime.toFixed(2) : "0")
                            }
                            onFocus={() => setTimeDraft(String(animationTime))}
                            onBlur={() => setTimeDraft(null)}
                            onChange={(event) => {
                                setTimeDraft(event.target.value);
                                if (event.target.value !== "" && event.target.validity.valid) {
                                    setAnimationTime(event.target.valueAsNumber);
                                }
                            }}
                        />
                    </div>
                </Field>
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
        </Panel>
    );
}
