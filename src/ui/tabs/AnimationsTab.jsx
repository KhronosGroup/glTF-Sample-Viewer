import { Pause, Play } from "lucide-react";
import { uiEvents } from "../../logic/ui_events.js";
import { setViewerState, useViewerStore } from "../store.js";
import { Checkbox, Field, Panel, PlaybackControls, SectionLabel } from "../controls.jsx";

export function AnimationsTab() {
    const animations = useViewerStore((state) => state.animations);
    const selectedAnimations = useViewerStore((state) => state.selectedAnimations);
    const disabledAnimations = useViewerStore((state) => state.disabledAnimations);
    const animationState = useViewerStore((state) => state.animationState);

    const hasAnimations = animations.length !== 0;

    const toggleAnimation = (index, checked) => {
        const next = checked
            ? [...selectedAnimations, index]
            : selectedAnimations.filter((item) => item !== index);
        setViewerState({ selectedAnimations: next });
        uiEvents.selectedAnimationsChanged.emit(next);
    };

    return (
        <Panel title="Animations">
            <SectionLabel>Animation Controls</SectionLabel>

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

            {!hasAnimations && <SectionLabel>No animations available</SectionLabel>}

            {hasAnimations && (
                <Field label="Animations">
                    {animations.map((animation) => (
                        <div key={animation.index} className="mb-2">
                            <Checkbox
                                checked={selectedAnimations.includes(animation.index)}
                                disabled={disabledAnimations.includes(animation.index)}
                                onChange={(checked) => toggleAnimation(animation.index, checked)}
                            >
                                {animation.title}
                            </Checkbox>
                        </div>
                    ))}
                </Field>
            )}
        </Panel>
    );
}
