import { Download, Plus, RotateCcw } from "lucide-react";
import { uiEvents } from "../../logic/ui_events.js";
import { setViewerState, useViewerStore } from "../store.js";
import { Button, Field, IconButton, Panel, SegmentedControl, Select, Switch } from "../controls.jsx";
import { Slider } from "../Slider.jsx";

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

    const { ibl, punctualLights, renderEnv, blurEnv, iblIntensity, exposure, toneMap, rotation } =
        lighting;

    return (
        <Panel title="Display">
            <Field label="Lighting" grouped>
                <Switch
                    data-testid="switch-ibl"
                    checked={ibl}
                    onChange={(checked) => {
                        onLightingChange({ ibl: checked });
                    }}
                >
                    Image Based
                </Switch>
                <Switch
                    checked={punctualLights}
                    onChange={(checked) => {
                        onLightingChange({ punctualLights: checked });
                    }}
                >
                    Punctual Lighting
                </Switch>
            </Field>

            <Field label="IBL Intensity">
                <div className="flex items-start">
                    <Slider
                        className="min-w-0 flex-1"
                        label="IBL Intensity"
                        value={iblIntensity}
                        min={-2}
                        max={5}
                        step={0.01}
                        ticks={IBL_INTENSITY_TICKS}
                        formatter={formatIblIntensity}
                        onChange={(value) => {
                            onLightingChange({ iblIntensity: value });
                        }}
                    />
                    <IconButton
                        label="Reset IBL intensity"
                        className="mt-1 shrink-0"
                        onClick={() => {
                            onLightingChange({ iblIntensity: 0 });
                        }}
                    >
                        <RotateCcw size={16} aria-hidden="true" />
                    </IconButton>
                </div>
            </Field>

            <Field label="Exposure">
                <div className="flex items-start">
                    <Slider
                        className="min-w-0 flex-1"
                        label="Exposure"
                        value={exposure}
                        min={21}
                        max={-6}
                        step={0.1}
                        ticks={EXPOSURE_TICKS}
                        formatter={formatExposure}
                        onChange={(value) => {
                            onLightingChange({ exposure: value });
                        }}
                    />
                    <IconButton
                        label="Reset exposure"
                        className="mt-1 shrink-0"
                        onClick={() => {
                            onLightingChange({ exposure: 0 });
                        }}
                    >
                        <RotateCcw size={16} aria-hidden="true" />
                    </IconButton>
                </div>
            </Field>

            <Field label="Tone Map">
                <Select
                    value={toneMap}
                    onChange={(value) => {
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
                        onLightingChange({ renderEnv: checked });
                    }}
                >
                    Environment Map
                </Switch>
                <Switch
                    checked={blurEnv}
                    disabled={!ibl}
                    onChange={(checked) => {
                        onLightingChange({ blurEnv: checked });
                    }}
                >
                    Blur
                </Switch>
                <label className="mt-4 flex items-center gap-3">
                    <input
                        className="border-ink-dim [&::-webkit-color-swatch]:border-ink-dim h-8 w-12 appearance-none rounded-md border p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border"
                        type="color"
                        value={clearColor}
                        onChange={(event) => {
                            setViewerState({ clearColor: event.target.value });
                        }}
                    />
                    <span className="text-base font-light">Background Color</span>
                </label>
            </Field>

            <Field label="Environment Orientation">
                <SegmentedControl
                    label="Environment Orientation"
                    options={ENVIRONMENT_ROTATIONS.map((item) => ({ label: item, value: item }))}
                    value={rotation}
                    onChange={(value) => {
                        onLightingChange({ rotation: value });
                    }}
                />
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
                    <Select
                        value={selectedEnvironment}
                        onChange={(name) => {
                            setViewerState({ selectedEnvironment: name });
                            uiEvents.selectedEnvironmentChanged.emit(name);
                        }}
                    >
                        {Object.entries(environments).map(([name, environment]) => (
                            <option key={name} value={name}>
                                {environment.title}
                            </option>
                        ))}
                    </Select>
                </Field>
            </Field>

            <Field label="Capture Canvas">
                <Button onClick={() => uiEvents.captureCanvas.emit(true)}>
                    <Download size={16} aria-hidden="true" />
                    Download as PNG
                </Button>
            </Field>
        </Panel>
    );
}
