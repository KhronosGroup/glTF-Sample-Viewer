import { uiEvents } from "../../logic/ui_events.js";
import { setViewerState, useViewerStore } from "../store.js";
import { Field, Panel, SegmentedControl } from "../controls.jsx";

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
        </Panel>
    );
}
