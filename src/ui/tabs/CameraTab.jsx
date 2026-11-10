import { Keyboard, Mouse, MousePointerClick, RotateCcw } from "lucide-react";
import { uiEvents } from "../../logic/ui_events.js";
import { setViewerState, useViewerStore } from "../store.js";
import { Button, Field, Panel, SegmentedControl } from "../controls.jsx";

const LOOK_AXES = ["+X", "+Y", "+Z", "-X", "-Y", "-Z"];

function Key({ children }) {
    return (
        <kbd className="border-ink/40 bg-card inline-flex h-6 min-w-6 items-center justify-center rounded-md border px-1.5 font-mono text-[11px] leading-none">
            {children}
        </kbd>
    );
}

function MouseButton({ children }) {
    return (
        <span className="border-ink/40 bg-card inline-flex h-6 items-center gap-1 rounded-md border px-1.5 text-[11px] leading-none">
            <Mouse size={11} aria-hidden="true" />
            {children}
        </span>
    );
}

function ShortcutGroup({ icon: Icon, title, rows }) {
    return (
        <div>
            <div className="text-ink-dim mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide">
                <Icon size={14} aria-hidden="true" />
                {title}
            </div>
            <div className="space-y-1.5">
                {rows.map((row, index) => (
                    <div key={index} className="flex flex-wrap items-center gap-1.5">
                        {row.chips}
                        <span className="text-ink-dim ml-1">{row.action}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function shortcutSections(mode) {
    const rotate = mode === "trackball" ? "Rotate" : "Orbit";
    const arrows = (
        <>
            <Key>←</Key>
            <Key>↑</Key>
            <Key>↓</Key>
            <Key>→</Key>
        </>
    );
    const panMouse = (
        <>
            <MouseButton>M</MouseButton>
            <MouseButton>R</MouseButton>
            <Key>Shift</Key>
        </>
    );

    if (mode === "fly") {
        return {
            mouse: [
                { chips: <MouseButton>L</MouseButton>, action: "Look" },
                { chips: panMouse, action: "Strafe" },
                { chips: <MouseButton>Wheel</MouseButton>, action: "Dolly" }
            ],
            keyboard: [
                {
                    chips: (
                        <>
                            <Key>W</Key>
                            <Key>S</Key>
                        </>
                    ),
                    action: "Forward / Back"
                },
                {
                    chips: (
                        <>
                            <Key>A</Key>
                            <Key>D</Key>
                        </>
                    ),
                    action: "Strafe"
                },
                {
                    chips: (
                        <>
                            <Key>Q</Key>
                            <Key>E</Key>
                        </>
                    ),
                    action: "Down / Up"
                },
                { chips: arrows, action: "Look" },
                {
                    chips: (
                        <>
                            <Key>+</Key>
                            <Key>−</Key>
                        </>
                    ),
                    action: "Dolly"
                }
            ]
        };
    }

    return {
        mouse: [
            { chips: <MouseButton>L</MouseButton>, action: rotate },
            { chips: panMouse, action: "Pan" },
            { chips: <MouseButton>Wheel</MouseButton>, action: "Zoom" }
        ],
        keyboard: [
            {
                chips: (
                    <>
                        <Key>W</Key>
                        <Key>A</Key>
                        <Key>S</Key>
                        <Key>D</Key>
                    </>
                ),
                action: rotate
            },
            { chips: arrows, action: "Pan" },
            {
                chips: (
                    <>
                        <Key>+</Key>
                        <Key>−</Key>
                    </>
                ),
                action: "Zoom"
            }
        ]
    };
}

export function CameraTab() {
    const cameraMode = useViewerStore((state) => state.cameraMode);
    const cameraProjection = useViewerStore((state) => state.cameraProjection);
    const selectedCamera = useViewerStore((state) => state.selectedCamera);

    // Camera controls only affect the user camera, so they are disabled while a
    // glTF camera node is selected.
    const userCameraActive = selectedCamera === -1;
    const sections = shortcutSections(cameraMode);

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
                <div className="space-y-4 text-sm">
                    <ShortcutGroup icon={Mouse} title="Mouse" rows={sections.mouse} />
                    <ShortcutGroup icon={Keyboard} title="Keyboard" rows={sections.keyboard} />
                    <div className="text-ink-dim flex items-center gap-1.5">
                        <MousePointerClick size={14} aria-hidden="true" />
                        Double-click a node to focus on it
                    </div>
                </div>
            </Field>
        </Panel>
    );
}
