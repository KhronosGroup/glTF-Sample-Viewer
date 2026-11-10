import { RotateCcw } from "lucide-react";
import { uiEvents } from "../../logic/ui_events.js";
import { setViewerState, useViewerStore } from "../store.js";
import { Button, Field, Panel, SegmentedControl } from "../controls.jsx";

const LOOK_AXES = ["+X", "-X", "+Y", "-Y", "+Z", "-Z"];

const SHORTCUTS = {
    orbit: {
        mouse: "Drag to orbit · Shift-drag, middle-drag or right-drag to pan · Wheel to zoom",
        keys: "Arrow keys to orbit · Shift + Arrow keys to pan · +/− to zoom"
    },
    trackball: {
        mouse: "Drag to rotate · Shift-drag, middle-drag or right-drag to pan · Wheel to zoom",
        keys: "Arrow keys to rotate · Shift + Arrow keys to pan · +/− to zoom"
    },
    fly: {
        mouse: "Drag to look · Shift-drag, middle-drag or right-drag to strafe · Wheel to dolly",
        keys: "W/A/S/D to move · Q/E up/down · Arrow keys to look · Shift + Arrow keys to strafe · +/− to dolly"
    }
};

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
                        { label: "Trackball", value: "trackball" },
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

            <Field label="Reset View">
                <Button
                    disabled={!userCameraActive}
                    className={!userCameraActive ? "cursor-not-allowed opacity-50" : ""}
                    onClick={() => uiEvents.cameraResetChanged.emit(true)}
                >
                    <RotateCcw size={16} aria-hidden="true" />
                    Reset
                </Button>
            </Field>

            <Field label="Shortcuts">
                <div className="text-ink-dim space-y-1 text-sm font-light">
                    <p>{SHORTCUTS[cameraMode]?.mouse}</p>
                    <p>{SHORTCUTS[cameraMode]?.keys}</p>
                    <p>Double-click a node to focus on it</p>
                </div>
            </Field>
        </Panel>
    );
}
