import { Pause, Play, StepForward } from "lucide-react";
import { commands } from "../../logic/commands.js";
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
    const physicsEngineVersion = useViewerStore((state) => state.physicsEngineVersion);
    const physxLabel = `Nvidia PhysX${physicsEngineVersion !== undefined ? ` ${physicsEngineVersion}` : ""}`;

    return (
        <Panel title="Physics">
            <PlaybackControls
                active={physicsState}
                onText="Pause"
                offText="Play"
                onIcon={<Pause size={16} aria-hidden="true" />}
                offIcon={<Play size={16} aria-hidden="true" />}
                onToggle={(on) => {
                    setViewerState({ physicsState: on });
                }}
                onReset={() => commands.physicsResetChanged()}
            />

            <OutlineButton
                disabled={physicsState}
                className="disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => commands.physicsStepChanged()}
            >
                <StepForward size={16} aria-hidden="true" />
                Step
            </OutlineButton>

            <Field label="Physics Engine">
                <Select
                    value={debug.engine}
                    onChange={(value) => {
                        onDebugChange({ engine: value });
                    }}
                >
                    <option value="nvidia-physx">{physxLabel}</option>
                </Select>
            </Field>

            <SectionLabel>Debug</SectionLabel>
            <div className="mb-4 flex flex-col items-start gap-2">
                <Switch
                    checked={debug.colliders}
                    onChange={(checked) => {
                        onDebugChange({ colliders: checked });
                    }}
                >
                    Show Colliders
                </Switch>
                <Switch
                    checked={debug.joints}
                    onChange={(checked) => {
                        onDebugChange({ joints: checked });
                    }}
                >
                    Show Joints
                </Switch>
            </div>
        </Panel>
    );
}
