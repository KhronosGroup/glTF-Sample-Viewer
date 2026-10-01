import { CirclePause, CirclePlay, StepForward } from "lucide-react";
import { uiEvents } from "../../logic/ui_events.js";
import { setViewerState, useViewerStore } from "../store.js";
import {
    Field,
    OutlineButton,
    Panel,
    PlaybackControls,
    SectionLabel,
    Select,
    Switch
} from "../controls.jsx";

export function PhysicsTab({ debug, onDebugChange }) {
    const physicsState = useViewerStore((state) => state.physicsState);

    return (
        <Panel title="Physics">
            <SectionLabel>Physics Controls</SectionLabel>

            <PlaybackControls
                active={physicsState}
                onText="Disable"
                offText="Enable"
                onIcon={<CirclePause size={16} aria-hidden="true" />}
                offIcon={<CirclePlay size={16} aria-hidden="true" />}
                onToggle={(on) => {
                    setViewerState({ physicsState: on });
                    uiEvents.physicsEnabledChanged.emit(on);
                }}
                onReset={() => uiEvents.physicsResetChanged.emit(true)}
            />

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
                <OutlineButton onClick={() => uiEvents.physicsStepChanged.emit(true)}>
                    <StepForward size={16} aria-hidden="true" />
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
