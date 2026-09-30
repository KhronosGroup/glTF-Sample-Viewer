import { uiEvents } from "../../../logic/ui_events.js";
import { setViewerState, useViewerStore } from "../store.js";
import { Field, Select, Switch, ToggleButton } from "../controls.jsx";

const OUTLINE_BUTTON_STYLE = {
    border: "1.5px solid #87c540",
    color: "#f2f2f2",
    background: "transparent",
    minWidth: "70px"
};

export function PhysicsTab({ onCollapse, debug, onDebugChange }) {
    const physicsState = useViewerStore((state) => state.physicsState);

    return (
        <div className="tabContent">
            <img
                src="assets/ui/Navigation_right_20px.svg"
                className="tabNavigationIcon"
                width="30px"
                onClick={onCollapse}
            />
            <h2 className="title is-spaced" style={{ marginBottom: "0.5em" }}>
                Physics
            </h2>
            <label className="subtitle">Physics Controls</label>

            <div
                style={{
                    display: "flex",
                    gap: "1em",
                    alignItems: "center",
                    marginBottom: "1.5em",
                    marginTop: "1em"
                }}
            >
                <ToggleButton
                    on={physicsState}
                    onText="Disable"
                    offText="Enable"
                    className="round-green-btn"
                    onToggle={(on) => {
                        setViewerState({ physicsState: on });
                        uiEvents.physicsEnabledChanged.next(on);
                    }}
                />
                <button
                    className="button is-rounded reset-btn-green"
                    style={OUTLINE_BUTTON_STYLE}
                    onClick={() => uiEvents.physicsResetChanged.next(true)}
                >
                    Reset
                </button>
            </div>

            <Field label="Physics Engine">
                <Select
                    value={debug.engine}
                    onChange={(value) => {
                        onDebugChange({ engine: value });
                        uiEvents.physicsEngineChanged.next(value);
                    }}
                >
                    <option value="nvidia-physx">Nvidia PhysX</option>
                </Select>
            </Field>

            <div className="subtitle">Debug</div>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5em",
                    marginBottom: "1em"
                }}
            >
                <button
                    className="button is-rounded"
                    style={OUTLINE_BUTTON_STYLE}
                    onClick={() => uiEvents.physicsStepChanged.next(true)}
                >
                    Step
                </button>
                <Switch
                    checked={debug.colliders}
                    onChange={(checked) => {
                        onDebugChange({ colliders: checked });
                        uiEvents.physicsColliderDebugChanged.next(checked);
                    }}
                >
                    Show Colliders
                </Switch>
                <Switch
                    checked={debug.joints}
                    onChange={(checked) => {
                        onDebugChange({ joints: checked });
                        uiEvents.physicsJointDebugChanged.next(checked);
                    }}
                >
                    Show Joints
                </Switch>
            </div>
        </div>
    );
}
