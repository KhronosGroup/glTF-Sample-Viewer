import { uiEvents } from "../../../logic/ui_events.js";
import { setViewerState, useViewerStore } from "../store.js";
import { Field, Select, Switch } from "../controls.jsx";
import { Slider } from "../Slider.jsx";
import { Dropdown } from "../Dropdown.jsx";

const ENVIRONMENT_ROTATIONS = ["+Z", "-X", "-Z", "+X"];

const IBL_INTENSITY_TICKS = [
    { value: -2, label: "0.01", className: "iblIntensitySliderMarker" },
    { value: 0, label: "1", className: "iblIntensitySliderMarker" },
    { value: 2, label: "100", className: "iblIntensitySliderMarker" },
    { value: 4, label: "10000", className: "iblIntensitySliderMarker" }
];

const EXPOSURE_TICKS = [
    { value: -6, label: "64", className: "exposureSliderMarker" },
    { value: 0, label: "1", className: "exposureSliderMarker" },
    { value: 9.966, label: "0.001", className: "exposureSliderMarker" },
    { value: 21, label: "0", className: "exposureSliderMarker" }
];

const formatIblIntensity = (value) => String(Math.round(Math.pow(10, value) * 100.0) / 100.0);
const formatExposure = (value) =>
    String(Math.round((1.0 / Math.pow(2.0, value)) * 100000) / 100000);

export function DisplayTab({ onCollapse, lighting, onLightingChange }) {
    const tonemaps = useViewerStore((state) => state.tonemaps);
    const environments = useViewerStore((state) => state.environments);
    const selectedEnvironment = useViewerStore((state) => state.selectedEnvironment);
    const clearColor = useViewerStore((state) => state.clearColor);

    const { ibl, punctualLights, renderEnv, blurEnv, iblIntensity, exposure, toneMap, rotation } =
        lighting;

    const environmentItems = Object.keys(environments).map((name) => ({
        value: name,
        label: environments[name].title
    }));

    return (
        <div className="tabContent">
            <img
                src="assets/ui/Navigation_right_20px.svg"
                className="tabNavigationIcon"
                width="30px"
                onClick={onCollapse}
            />
            <h2 className="title is-spaced">Display</h2>

            <Field label="Lighting" className="subtitle" grouped>
                <Switch
                    data-testid="switch-ibl"
                    className="smallerLabel"
                    checked={ibl}
                    onChange={(checked) => {
                        uiEvents.iblChanged.next(checked);
                        onLightingChange({ ibl: checked });
                    }}
                >
                    Image Based{" "}
                </Switch>
                <Switch
                    className="smallerLabel"
                    checked={punctualLights}
                    onChange={(checked) => {
                        uiEvents.punctualLightsChanged.next(checked);
                        onLightingChange({ punctualLights: checked });
                    }}
                >
                    Punctual Lighting
                </Switch>
            </Field>

            <Field label="IBL Intensity" className="smallerLabel">
                <Slider
                    className="iblIntensitySlider"
                    value={iblIntensity}
                    min={-2}
                    max={5}
                    step={0.01}
                    ticks={IBL_INTENSITY_TICKS}
                    formatter={formatIblIntensity}
                    onChange={(value) => {
                        uiEvents.iblIntensityChanged.next(value);
                        onLightingChange({ iblIntensity: value });
                    }}
                />
            </Field>

            <Field label="Exposure" className="subtitle" />
            <Slider
                className="exposureSlider"
                value={exposure}
                min={21}
                max={-6}
                step={0.1}
                ticks={EXPOSURE_TICKS}
                formatter={formatExposure}
                onChange={(value) => {
                    uiEvents.exposureChanged.next(value);
                    onLightingChange({ exposure: value });
                }}
            />

            <Field label="Tone Map" className="subtitle">
                <Select
                    value={toneMap}
                    onChange={(value) => {
                        uiEvents.tonemapChanged.next(value);
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

            <Field label="Background" className="subtitle" grouped>
                <Switch
                    className="smallerLabel"
                    checked={renderEnv}
                    disabled={!ibl}
                    onChange={(checked) => {
                        uiEvents.renderEnvChanged.next(checked);
                        onLightingChange({ renderEnv: checked });
                    }}
                >
                    Environment Map
                </Switch>
                <Switch
                    className="smallerLabel"
                    checked={blurEnv}
                    disabled={!ibl}
                    onChange={(checked) => {
                        uiEvents.blurEnvChanged.next(checked);
                        onLightingChange({ blurEnv: checked });
                    }}
                >
                    Blur
                </Switch>
                <Field label="Background Color" className="smallerLabel" />
                <div className="control is-clearfix" id="clearColorPicker">
                    <input
                        className="colorInput"
                        type="color"
                        value={clearColor}
                        onChange={(event) => {
                            setViewerState({ clearColor: event.target.value });
                            uiEvents.colorChanged.next(event.target.value);
                        }}
                    />
                </div>
            </Field>

            <Field label="Environment Rotation" className="smallerLabel">
                <Select
                    value={rotation}
                    onChange={(value) => {
                        uiEvents.environmentRotationChanged.next(value);
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

            <Field label="Image Based Lighting" className="subtitle" grouped>
                <button className="button is-rounded">
                    <input
                        className="file-input"
                        type="file"
                        accept=".hdr"
                        onChange={(event) =>
                            uiEvents.addEnvironmentChanged.next({
                                hdr_path: event.target.files[0]
                            })
                        }
                    />
                    <i className="fas fa-plus" /> Add New HDR
                </button>

                <Field label="Active Environment" className="subtitle">
                    <Dropdown
                        label={environments[selectedEnvironment]?.title}
                        items={environmentItems}
                        value={selectedEnvironment}
                        onSelect={(name) => {
                            setViewerState({ selectedEnvironment: name });
                            uiEvents.selectedEnvironmentChanged.next(name);
                        }}
                    />
                </Field>
            </Field>

            <div className="pb-6" />
        </div>
    );
}
