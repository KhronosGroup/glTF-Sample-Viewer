import { uiEvents } from "../../logic/ui_events.js";
import { setViewerState, useViewerStore } from "../store.js";
import { Checkbox, Field, ToggleButton } from "../controls.jsx";

const RESET_BUTTON_STYLE = {
    border: "1.5px solid #87c540",
    color: "#f2f2f2",
    background: "transparent",
    minWidth: "70px"
};

const CONTROL_ROW_STYLE = {
    display: "flex",
    gap: "1em",
    alignItems: "center",
    marginBottom: "1.5em",
    marginTop: "1em"
};

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
        <div className="tabContent">
            <img
                src="assets/ui/Navigation_right_20px.svg"
                className="tabNavigationIcon"
                width="30px"
                onClick={onCollapse}
            />
            <h2 className="title is-spaced" style={{ marginBottom: "0.5em" }}>
                Animations
            </h2>
            <label className="subtitle">Animation Controls</label>

            <div style={CONTROL_ROW_STYLE}>
                <ToggleButton
                    on={animationState}
                    onText="Pause"
                    offText="Play"
                    className="round-green-btn"
                    style={hasAnimations ? undefined : { display: "none" }}
                    onToggle={(on) => {
                        setViewerState({ animationState: on });
                        uiEvents.animationPlayChanged.emit(on);
                    }}
                />
                <button
                    className="button is-rounded reset-btn-green"
                    style={
                        hasAnimations
                            ? RESET_BUTTON_STYLE
                            : { ...RESET_BUTTON_STYLE, display: "none" }
                    }
                    onClick={() => uiEvents.animationResetChanged.emit(true)}
                >
                    Reset
                </button>
            </div>

            {!hasAnimations && <label className="subtitle">No animations available</label>}

            {hasAnimations && (
                <Field label="Animations">
                    {animations.map((animation) => (
                        <div key={animation.index} style={{ marginBottom: "0.5em" }}>
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
        </div>
    );
}
