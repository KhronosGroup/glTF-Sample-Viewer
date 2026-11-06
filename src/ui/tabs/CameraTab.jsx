import { uiEvents } from "../../logic/ui_events.js";
import { setViewerState, useViewerStore } from "../store.js";
import { Field, Panel, SegmentedControl } from "../controls.jsx";

const LOOK_AXES = ["+X", "-X", "+Y", "-Y", "+Z", "-Z"];

export function CameraTab() {
    const cameraMode = useViewerStore((state) => state.cameraMode);
    const cameraProjection = useViewerStore((state) => state.cameraProjection);
    const selectedCamera = useViewerStore((state) => state.selectedCamera);

    // Camera controls only affect the user camera, so they are disabled while a
    // glTF camera node is selected.
    const userCameraActive = selectedCamera === -1;

    return (
        <Panel title="Camera">
            <Field label="Camera Mode">
                <SegmentedControl
                    label="Camera Mode"
                    disabled={!userCameraActive}
                    options={[
                        { label: "Orbit", value: "orbit" },
                        { label: "Fly", value: "fly" }
                    ]}
                    value={cameraMode}
                    onChange={(value) => {
                        setViewerState({ cameraMode: value });
                        uiEvents.cameraModeChanged.emit(value);
                    }}
                />
            </Field>

            <Field label="Projection">
                <SegmentedControl
                    label="Projection"
                    disabled={!userCameraActive}
                    options={[
                        { label: "Perspective", value: "perspective" },
                        { label: "Orthographic", value: "orthographic" }
                    ]}
                    value={cameraProjection}
                    onChange={(value) => {
                        setViewerState({ cameraProjection: value });
                        uiEvents.cameraProjectionChanged.emit(value);
                    }}
                />
            </Field>

            <Field label="Look At">
                <div className="grid grid-cols-3 gap-2">
                    {LOOK_AXES.map((axis) => (
                        <button
                            key={axis}
                            type="button"
                            disabled={!userCameraActive}
                            onClick={() => uiEvents.cameraLookAtChanged.emit(axis)}
                            className="border-ink/60 hover:border-ink rounded-md border px-2 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {axis}
                        </button>
                    ))}
                </div>
            </Field>
        </Panel>
    );
}
