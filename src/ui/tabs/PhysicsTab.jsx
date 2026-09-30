import { uiEvents } from "../../logic/ui_events.js";
import { setViewerState, useViewerStore } from "../store.js";
import {
    Field,
    OutlineButton,
    Panel,
    SectionLabel,
    Select,
    Switch,
    ToggleButton
} from "../controls.jsx";

export function PhysicsTab({ onCollapse, debug, onDebugChange }) {
    const physicsState = useViewerStore((state) => state.physicsState);

    return (
        <Panel title="Physics" onCollapse={onCollapse}>
            <SectionLabel>Physics Controls</SectionLabel>

            <div className="mt-4 mb-6 flex items-center gap-4">
                <ToggleButton
                    on={physicsState}
                    onText="Disable"
                    offText="Enable"
                    className="w-[90px]"
                    onToggle={(on) => {
                        setViewerState({ physicsState: on });
                        uiEvents.physicsEnabledChanged.emit(on);
                    }}
                />
                <OutlineButton
                    className="min-w-[70px]"
                    onClick={() => uiEvents.physicsResetChanged.emit(true)}
                >
                    Reset
                </OutlineButton>
            </div>

            <Field label="Physics Engine">
                <Select
                    value={debug.engine}
                    onChange={(value) => {
                        onDebugChange({ engine: value });
                        uiEvents.physicsEngineChanged.emit(value);
                    }}
                >
                    <option value="nvidia-physx">Nvidia PhysX</option>
                </Select>
            </Field>

            <SectionLabel>Debug</SectionLabel>
            <div className="mb-4 flex flex-col items-start gap-2">
                <OutlineButton
                    className="min-w-[70px]"
                    onClick={() => uiEvents.physicsStepChanged.emit(true)}
                >
                    Step
                </OutlineButton>
                <Switch
                    checked={debug.colliders}
                    onChange={(checked) => {
                        onDebugChange({ colliders: checked });
                        uiEvents.physicsColliderDebugChanged.emit(checked);
                    }}
                >
                    Show Colliders
                </Switch>
                <Switch
                    checked={debug.joints}
                    onChange={(checked) => {
                        onDebugChange({ joints: checked });
                        uiEvents.physicsJointDebugChanged.emit(checked);
                    }}
                >
                    Show Joints
                </Switch>
            </div>
        </Panel>
    );
}
