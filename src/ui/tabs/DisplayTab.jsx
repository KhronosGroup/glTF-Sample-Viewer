import { Download, Image, Upload } from "lucide-react";
import { commands } from "../../logic/commands.js";
import { updateSelection, useViewerStore } from "../store.js";
import {
    Button,
    Field,
    Panel,
    RevertButton,
    SegmentedControl,
    Select,
    Switch
} from "../controls.jsx";
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
const formatExposure = (value) => String(Math.round((1.0 / Math.pow(2.0, value)) * 100) / 100);

export function DisplayTab({ lighting, onLightingChange }) {
    const tonemaps = useViewerStore((state) => state.published.tonemaps);
    const environments = useViewerStore((state) => state.published.environments);
    const selectedEnvironment = useViewerStore((state) => state.selection.selectedEnvironment);
    const clearColor = useViewerStore((state) => state.selection.clearColor);
    const environmentPrecisionLimited = useViewerStore(
        (state) => state.published.environmentPrecisionLimited
    );

    const { ibl, punctualLights, renderEnv, blurEnv, iblIntensity, exposure, toneMap, rotation } =
        lighting;

    return (
        <Panel title="Display" icon={Image}>
            <Field label="Capture Canvas">
                <Button onClick={() => commands.captureCanvas()}>
                    <Download size={16} aria-hidden="true" />
                    Download as PNG
                </Button>
            </Field>

            <Field label="Lighting" grouped>
                <Switch
                    checked={punctualLights}
                    onChange={(checked) => {
                        onLightingChange({ punctualLights: checked });
                    }}
                >
                    Punctual Lights
                </Switch>
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
                        onLightingChange({ exposure: value });
                    }}
                    onReset={() => {
                        onLightingChange({ exposure: 0 });
                    }}
                    resetLabel="Reset exposure"
                />
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

            <Field
                label="Environment Lighting"
                toggle={ibl}
                onToggleChange={(checked) => {
                    onLightingChange({ ibl: checked });
                }}
                toggleTestId="switch-ibl"
            >
                <SegmentedControl
                    label="Environment"
                    options={[
                        { label: "IBL", value: "environment" },
                        { label: "Color", value: "color" }
                    ]}
                    value={renderEnv ? "environment" : "color"}
                    onChange={(mode) => {
                        onLightingChange({ renderEnv: mode === "environment" });
                    }}
                />
                {renderEnv ? (
                    <Switch
                        className="mt-4"
                        checked={blurEnv}
                        disabled={!ibl}
                        onChange={(checked) => {
                            onLightingChange({ blurEnv: checked });
                        }}
                    >
                        Blur
                    </Switch>
                ) : (
                    <div className="mt-4 flex items-center gap-3">
                        <label className="flex items-center gap-3">
                            <input
                                className="border-ink-dim [&::-webkit-color-swatch]:border-ink-dim h-8 w-12 appearance-none rounded-md border p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border"
                                type="color"
                                value={clearColor}
                                onChange={(event) => {
                                    updateSelection({ clearColor: event.target.value });
                                }}
                            />
                            <span className="text-base font-light">Background Color</span>
                        </label>
                        <RevertButton
                            label="Reset color"
                            onClick={() => updateSelection({ clearColor: "#8f9dc1" })}
                        />
                    </div>
                )}
                <Field label="Intensity">
                    <Slider
                        label="Intensity"
                        value={iblIntensity}
                        min={-2}
                        max={5}
                        step={0.01}
                        ticks={IBL_INTENSITY_TICKS}
                        formatter={formatIblIntensity}
                        onChange={(value) => {
                            onLightingChange({ iblIntensity: value });
                        }}
                        onReset={() => {
                            onLightingChange({ iblIntensity: 0 });
                        }}
                        resetLabel="Reset intensity"
                    />
                </Field>
                {environmentPrecisionLimited && (
                    <p className="text-amber-400 mt-2 text-sm">
                        This HDR&apos;s range exceeds the device&apos;s texture precision;
                        highlights are approximate.
                    </p>
                )}
            </Field>

            {renderEnv && (
                <>
                    <Field label="HDR" grouped>
                        <Select
                            aria-label="Active Environment"
                            value={selectedEnvironment}
                            onChange={(name) => {
                                updateSelection({ selectedEnvironment: name });
                                commands.selectedEnvironmentChanged(name);
                            }}
                        >
                            {Object.entries(environments).map(([name, environment]) => (
                                <option key={name} value={name}>
                                    {environment.title}
                                </option>
                            ))}
                        </Select>

                        <label className="bg-accent text-ink-dim hover:bg-accent-hover mt-2 inline-flex cursor-pointer items-center justify-center gap-2 self-start rounded-full px-4 py-1.5 transition-colors">
                            <input
                                className="sr-only"
                                type="file"
                                accept=".hdr"
                                onChange={(event) =>
                                    commands.addEnvironmentChanged({
                                        hdr_path: event.target.files[0]
                                    })
                                }
                            />
                            <Upload size={16} aria-hidden="true" />
                            Browse HDRs ...
                        </label>
                    </Field>

                    <Field label="Orientation">
                        <SegmentedControl
                            label="Orientation"
                            options={ENVIRONMENT_ROTATIONS.map((item) => ({
                                label: item,
                                value: item
                            }))}
                            value={rotation}
                            onChange={(value) => {
                                onLightingChange({ rotation: value });
                            }}
                        />
                    </Field>
                </>
            )}
        </Panel>
    );
}
