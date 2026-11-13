import {
    ArrowBigUp,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    ArrowUpDown,
    Keyboard,
    Minus,
    Mouse,
    MouseLeft,
    MousePointerClick,
    MouseRight,
    Move,
    Plus,
    RotateCcw
} from "lucide-react";
import { commands } from "../../logic/commands.js";
import { updateSelection, useViewerStore } from "../store.js";
import { Button, Field, IconButton, Panel, SegmentedControl } from "../controls.jsx";
import { Slider } from "../Slider.jsx";

const LOOK_AXES = ["+X", "+Y", "+Z", "-X", "-Y", "-Z"];

const COMMON_ASPECT_RATIOS = [
    { label: "1:1", value: 1 },
    { label: "4:3", value: 4 / 3 },
    { label: "16:9", value: 16 / 9 },
    { label: "21:9", value: 21 / 9 }
];

function Chip({ children, label }) {
    return (
        <span
            aria-label={label}
            title={label}
            className="border-ink/40 bg-card inline-flex h-6 min-w-6 items-center justify-center gap-1 rounded-md border px-1.5 font-mono text-[11px] leading-none"
        >
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
            <Chip label="Arrow Left">
                <ArrowLeft size={13} aria-hidden="true" />
            </Chip>
            <Chip label="Arrow Up">
                <ArrowUp size={13} aria-hidden="true" />
            </Chip>
            <Chip label="Arrow Down">
                <ArrowDown size={13} aria-hidden="true" />
            </Chip>
            <Chip label="Arrow Right">
                <ArrowRight size={13} aria-hidden="true" />
            </Chip>
        </>
    );
    const leftDrag = (
        <Chip label="Left mouse button drag">
            <MouseLeft size={14} aria-hidden="true" />
            <Move size={11} aria-hidden="true" />
        </Chip>
    );
    const rightDrag = (
        <Chip label="Right mouse button drag">
            <MouseRight size={14} aria-hidden="true" />
            <Move size={11} aria-hidden="true" />
        </Chip>
    );
    const scroll = (
        <Chip label="Scroll">
            <Mouse size={12} aria-hidden="true" />
            <ArrowUpDown size={12} aria-hidden="true" />
        </Chip>
    );
    const zoom = (
        <>
            <Chip label="Plus">
                <Plus size={13} aria-hidden="true" />
            </Chip>
            <Chip label="Minus">
                <Minus size={13} aria-hidden="true" />
            </Chip>
        </>
    );
    const focus = (
        <Chip label="Double click">
            <MousePointerClick size={13} aria-hidden="true" />
        </Chip>
    );
    const shift = (
        <Chip label="Shift">
            <ArrowBigUp size={13} aria-hidden="true" />
        </Chip>
    );

    if (mode === "fly") {
        return {
            mouse: [
                { chips: leftDrag, action: "Look" },
                { chips: rightDrag, action: "Strafe" },
                { chips: scroll, action: "Dolly" },
                { chips: focus, action: "Focus node" }
            ],
            keyboard: [
                {
                    chips: (
                        <>
                            <Chip>W</Chip>
                            <Chip>S</Chip>
                        </>
                    ),
                    action: "Forward / Back"
                },
                {
                    chips: (
                        <>
                            <Chip>A</Chip>
                            <Chip>D</Chip>
                        </>
                    ),
                    action: "Strafe"
                },
                {
                    chips: (
                        <>
                            <Chip>Q</Chip>
                            <Chip>E</Chip>
                        </>
                    ),
                    action: "Down / Up"
                },
                { chips: arrows, action: "Look" },
                { chips: zoom, action: "Dolly" },
                { chips: shift, action: "Increase speed" }
            ]
        };
    }

    return {
        mouse: [
            { chips: leftDrag, action: rotate },
            { chips: rightDrag, action: "Pan" },
            { chips: scroll, action: "Zoom" },
            { chips: focus, action: "Focus node" }
        ],
        keyboard: [
            {
                chips: (
                    <>
                        <Chip>W</Chip>
                        <Chip>A</Chip>
                        <Chip>S</Chip>
                        <Chip>D</Chip>
                    </>
                ),
                action: rotate
            },
            { chips: arrows, action: "Pan" },
            { chips: zoom, action: "Zoom" },
            { chips: shift, action: "Increase speed" }
        ]
    };
}

export function CameraTab() {
    const cameraMode = useViewerStore((state) => state.selection.cameraMode);
    const cameraProjection = useViewerStore((state) => state.selection.cameraProjection);
    const selectedCamera = useViewerStore((state) => state.selection.selectedCamera);
    const cameraFov = useViewerStore((state) => state.selection.cameraFov);
    const enforceAspectRatio = useViewerStore((state) => state.selection.enforceAspectRatio);
    const cameraAspectRatio = useViewerStore((state) => state.selection.cameraAspectRatio);

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
                        updateSelection({ cameraMode: value });
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
                        updateSelection({ cameraProjection: value });
                    }}
                />
            </Field>

            <Field label="Vertical FOV">
                <div className="flex items-start">
                    <Slider
                        className="min-w-0 flex-1"
                        label="Vertical FOV"
                        value={cameraFov}
                        min={1}
                        max={120}
                        step={1}
                        formatter={(value) => `${value}°`}
                        onChange={(value) => updateSelection({ cameraFov: value })}
                    />
                    <IconButton
                        label="Reset FOV"
                        className="mt-1 shrink-0"
                        onClick={() => updateSelection({ cameraFov: 45 })}
                    >
                        <RotateCcw size={16} aria-hidden="true" />
                    </IconButton>
                </div>
            </Field>

            <Field
                label="Aspect Ratio"
                toggle={enforceAspectRatio}
                onToggleChange={(checked) => updateSelection({ enforceAspectRatio: checked })}
            >
                {enforceAspectRatio && (
                    <>
                        <div className="mb-2 grid grid-cols-4 gap-2">
                            {COMMON_ASPECT_RATIOS.map(({ label, value }) => {
                                const active = Math.abs(cameraAspectRatio - value) < 0.01;
                                return (
                                    <button
                                        key={label}
                                        type="button"
                                        onClick={() => updateSelection({ cameraAspectRatio: value })}
                                        className={`rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
                                            active
                                                ? "border-accent bg-accent text-ink-dim"
                                                : "border-ink/60 hover:border-ink"
                                        }`}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                        <Slider
                            label="Aspect Ratio"
                            value={cameraAspectRatio}
                            min={0.5}
                            max={3}
                            step={0.01}
                            formatter={(value) => value.toFixed(2)}
                            onChange={(value) => updateSelection({ cameraAspectRatio: value })}
                        />
                    </>
                )}
            </Field>

            <Field label="Look At">
                <div className="grid grid-cols-3 gap-2">
                    {LOOK_AXES.map((axis) => (
                        <button
                            key={axis}
                            type="button"
                            disabled={!userCameraActive}
                            onClick={() => commands.cameraLookAtChanged(axis)}
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
                    onClick={() => commands.cameraResetChanged()}
                >
                    <RotateCcw size={16} aria-hidden="true" />
                    Reset
                </Button>
            </Field>

            <Field label="Shortcuts">
                <div className="space-y-4 text-sm">
                    <ShortcutGroup icon={Mouse} title="Mouse" rows={sections.mouse} />
                    <ShortcutGroup icon={Keyboard} title="Keyboard" rows={sections.keyboard} />
                </div>
            </Field>
        </Panel>
    );
}
