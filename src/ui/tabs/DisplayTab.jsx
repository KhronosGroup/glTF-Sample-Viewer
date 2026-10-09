import { Download, Plus } from "lucide-react";
import { GltfState } from "@khronosgroup/gltf-viewer";
import { uiEvents } from "../../logic/ui_events.js";
import { setViewerState, useViewerStore } from "../store.js";
import { Button, Field, Panel, Select, Switch } from "../controls.jsx";
import { Slider } from "../Slider.jsx";
import { Dropdown } from "../Dropdown.jsx";

const ENVIRONMENT_ROTATIONS = ["+Z", "-X", "-Z", "+X"];

const IBL_INTENSITY_TICKS = [
    { value: -2, label: "0.01" },
    { value: 0, label: "1" },
    { value: 2, label: "100" },
    { value: 4, label: "10000" }
];

const EXPOSURE_TICKS = [
    { value: -6, label: "64" },
    { value: 0, label: "1" },
    { value: 9.966, label: "0.001" },
    { value: 21, label: "0" }
];

const formatIblIntensity = (value) => String(Math.round(Math.pow(10, value) * 100.0) / 100.0);
const formatExposure = (value) =>
    String(Math.round((1.0 / Math.pow(2.0, value)) * 100000) / 100000);

export function DisplayTab({ lighting, onLightingChange }) {
    const tonemaps = useViewerStore((state) => state.tonemaps);
    const environments = useViewerStore((state) => state.environments);
    const selectedEnvironment = useViewerStore((state) => state.selectedEnvironment);
    const clearColor = useViewerStore((state) => state.clearColor);
    const debugShapes = useViewerStore((state) => state.debugShapes);
    const cullByBoundingVolume = useViewerStore((state) => state.cullByBoundingVolume);

    const { ibl, punctualLights, renderEnv, blurEnv, iblIntensity, exposure, toneMap, rotation } =
        lighting;

    const shapesVisible = debugShapes.boundingVolumes || debugShapes.allShapes;
    const updateDebugShapes = (patch) => {
        const next = { ...debugShapes, ...patch };
        setViewerState({ debugShapes: next });
        uiEvents.debugShapesChanged.emit({
            ...next,
            boundingVolumes: next.boundingVolumes
                ? GltfState.BoundingVolumeMode.ALL
                : GltfState.BoundingVolumeMode.NONE
        });
    };

    const environmentItems = Object.keys(environments).map((name) => ({
        value: name,
        label: environments[name].title
    }));

    return (
        <Panel title="Display">
            <Field label="Lighting" grouped>
                <Switch
                    data-testid="switch-ibl"
                    checked={ibl}
                    onChange={(checked) => {
                        uiEvents.iblChanged.emit(checked);
                        onLightingChange({ ibl: checked });
                    }}
                >
                    Image Based{" "}
                </Switch>
                <Switch
                    checked={punctualLights}
                    onChange={(checked) => {
                        uiEvents.punctualLightsChanged.emit(checked);
                        onLightingChange({ punctualLights: checked });
                    }}
                >
                    Punctual Lighting
                </Switch>
            </Field>

            <Field label="IBL Intensity">
                <Slider
                    label="IBL Intensity"
                    value={iblIntensity}
                    min={-2}
                    max={5}
                    step={0.01}
                    ticks={IBL_INTENSITY_TICKS}
                    formatter={formatIblIntensity}
                    onChange={(value) => {
                        uiEvents.iblIntensityChanged.emit(value);
                        onLightingChange({ iblIntensity: value });
                    }}
                />
            </Field>

            <Field label="Exposure">
                <Slider
                    label="Exposure"
                    value={exposure}
                    min={21}
                    max={-6}
                    step={0.1}
                    ticks={EXPOSURE_TICKS}
                    formatter={formatExposure}
                    onChange={(value) => {
                        uiEvents.exposureChanged.emit(value);
                        onLightingChange({ exposure: value });
                    }}
                />
            </Field>

            <Field label="Tone Map">
                <Select
                    value={toneMap}
                    onChange={(value) => {
                        uiEvents.tonemapChanged.emit(value);
                        onLightingChange({ toneMap: value });
                    }}
                >
                    {tonemaps.map((item) => (
                        <option key={item.title} value={item.title}>
                            {item.title}
                        </option>
                    ))}
                </Select>
            </Field>

            <Field label="Background" grouped>
                <Switch
                    checked={renderEnv}
                    disabled={!ibl}
                    onChange={(checked) => {
                        uiEvents.renderEnvChanged.emit(checked);
                        onLightingChange({ renderEnv: checked });
                    }}
                >
                    Environment Map
                </Switch>
                <Switch
                    checked={blurEnv}
                    disabled={!ibl}
                    onChange={(checked) => {
                        uiEvents.blurEnvChanged.emit(checked);
                        onLightingChange({ blurEnv: checked });
                    }}
                >
                    Blur
                </Switch>
                <label className="mt-4 flex items-center gap-3">
                    <input
                        className="color-swatch h-8 w-12 rounded-md"
                        type="color"
                        value={clearColor}
                        onChange={(event) => {
                            setViewerState({ clearColor: event.target.value });
                            uiEvents.colorChanged.emit(event.target.value);
                        }}
                    />
                    <span className="text-base font-light">Background Color</span>
                </label>
            </Field>

            <Field label="Environment Rotation">
                <Select
                    value={rotation}
                    onChange={(value) => {
                        uiEvents.environmentRotationChanged.emit(value);
                        onLightingChange({ rotation: value });
                    }}
                >
                    {ENVIRONMENT_ROTATIONS.map((item) => (
                        <option key={item} value={item}>
                            {item}
                        </option>
                    ))}
                </Select>
            </Field>

            <Field label="Image Based Lighting" grouped>
                <label className="bg-accent text-ink-dim hover:bg-accent-hover inline-flex cursor-pointer items-center justify-center gap-2 self-start rounded-full px-4 py-1.5 transition-colors">
                    <input
                        className="sr-only"
                        type="file"
                        accept=".hdr"
                        onChange={(event) =>
                            uiEvents.addEnvironmentChanged.emit({
                                hdr_path: event.target.files[0]
                            })
                        }
                    />
                    <Plus size={16} aria-hidden="true" />
                    Add New HDR
                </label>

                <Field label="Active Environment">
                    <Dropdown
                        label={environments[selectedEnvironment]?.title}
                        items={environmentItems}
                        value={selectedEnvironment}
                        onSelect={(name) => {
                            setViewerState({ selectedEnvironment: name });
                            uiEvents.selectedEnvironmentChanged.emit(name);
                        }}
                    />
                </Field>
            </Field>

            <Field label="Shapes (2.1 core)" grouped>
                <Switch
                    data-testid="switch-cull-bounding-volumes"
                    checked={cullByBoundingVolume}
                    onChange={(checked) => {
                        setViewerState({ cullByBoundingVolume: checked });
                        uiEvents.cullByBoundingVolumeChanged.emit(checked);
                    }}
                >
                    Cull by Bounding Volume
                </Switch>
                <Switch
                    data-testid="switch-bounding-volumes"
                    checked={debugShapes.boundingVolumes}
                    onChange={(checked) => updateDebugShapes({ boundingVolumes: checked })}
                >
                    Bounding Volumes
                </Switch>
                <Switch
                    data-testid="switch-collider-shapes"
                    checked={debugShapes.allShapes}
                    onChange={(checked) => updateDebugShapes({ allShapes: checked })}
                >
                    Collider Shapes
                </Switch>
                <Switch
                    data-testid="switch-shapes-xray"
                    checked={!debugShapes.depthTest}
                    disabled={!shapesVisible}
                    onChange={(checked) => updateDebugShapes({ depthTest: !checked })}
                >
                    See Through Geometry
                </Switch>
                <Switch
                    checked={debugShapes.highlightNonEnclosing}
                    disabled={!debugShapes.boundingVolumes}
                    onChange={(checked) => updateDebugShapes({ highlightNonEnclosing: checked })}
                >
                    Flag Non-Enclosing
                </Switch>
            </Field>

            <Field label="Shape Style">
                <Select
                    data-testid="select-shape-style"
                    value={debugShapes.style}
                    disabled={!shapesVisible}
                    onChange={(value) => updateDebugShapes({ style: value })}
                >
                    {Object.values(GltfState.DebugShapeStyle).map((item) => (
                        <option key={item} value={item}>
                            {item}
                        </option>
                    ))}
                </Select>
            </Field>

            <Field label="Shape Color">
                <Select
                    data-testid="select-shape-color"
                    value={debugShapes.colorMode}
                    disabled={!shapesVisible}
                    onChange={(value) => updateDebugShapes({ colorMode: value })}
                >
                    {Object.values(GltfState.DebugShapeColor).map((item) => (
                        <option key={item} value={item}>
                            {item}
                        </option>
                    ))}
                </Select>
            </Field>

            <Field label="Capture Canvas">
                <Button onClick={() => uiEvents.captureCanvas.emit(true)}>
                    <Download size={16} aria-hidden="true" />
                    Download as .png
                </Button>
            </Field>
        </Panel>
    );
}
