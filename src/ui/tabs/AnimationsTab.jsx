import { uiEvents } from "../../logic/ui_events.js";
import { setViewerState, useViewerStore } from "../store.js";
import { Checkbox, Field, OutlineButton, Panel, SectionLabel, ToggleButton } from "../controls.jsx";

export function AnimationsTab({ onCollapse }) {
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
        <Panel title="Animations" onCollapse={onCollapse}>
            <SectionLabel>Animation Controls</SectionLabel>

            {hasAnimations && (
                <div className="mt-4 mb-6 flex items-center gap-4">
                    <ToggleButton
                        on={animationState}
                        onText="Pause"
                        offText="Play"
                        className="w-[90px]"
                        onToggle={(on) => {
                            setViewerState({ animationState: on });
                            uiEvents.animationPlayChanged.emit(on);
                        }}
                    />
                    <OutlineButton
                        className="min-w-[70px]"
                        onClick={() => uiEvents.animationResetChanged.emit(true)}
                    >
                        Reset
                    </OutlineButton>
                </div>
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
