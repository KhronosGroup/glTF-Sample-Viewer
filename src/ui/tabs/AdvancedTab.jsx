import { Fragment } from "react";
import { uiEvents } from "../../logic/ui_events.js";
import { useViewerStore } from "../store.js";
import { Field, Select, Switch } from "../controls.jsx";
import { JsonTree } from "../JsonTree.jsx";

// The Vue template repeated a near-identical switch for each of these.
// `breakAfter` reproduces where it placed <br> between groups.
const FEATURE_TOGGLES = [
    {
        key: "inputSmoothing",
        label: "Input Smoothing",
        event: "inputSmoothingChanged",
        breakAfter: true
    },
    { key: "skinning", label: "Skinning", event: "skinningChanged", breakAfter: true },
    { key: "morphing", label: "Morphing", event: "morphingChanged" },
    { key: "interactivity", label: "KHR_interactivity", event: "interactivityChanged" },
    { key: "hoverability", label: "KHR_node_hoverability", event: "hoverabilityChanged" },
    { key: "selectability", label: "KHR_node_selectability", event: "selectabilityChanged" },
    {
        key: "nodeVisibility",
        label: "KHR_node_visibility",
        event: "nodeVisibilityChanged",
        breakAfter: true
    }
];

const MATERIAL_EXTENSIONS = [
    { key: "clearcoat", label: "Clearcoat", event: "clearcoatChanged" },
    { key: "sheen", label: "Sheen", event: "sheenChanged" },
    { key: "transmission", label: "Transmission", event: "transmissionChanged" },
    {
        key: "diffuseTransmission",
        label: "Diffuse Transmission",
        event: "diffuseTransmissionChanged"
    },
    { key: "volume", label: "Volume", event: "volumeChanged" },
    { key: "volumeScattering", label: "Volume Scattering", event: "volumeScatteringChanged" },
    { key: "ior", label: "IOR", event: "iorChanged" },
    { key: "specular", label: "Specular", event: "specularChanged" },
    { key: "emissiveStrength", label: "Emissive Strength", event: "emissiveStrengthChanged" },
    { key: "iridescence", label: "Iridescence", event: "iridescenceChanged" },
    { key: "retroreflection", label: "Retroreflection", event: "retroreflectionChanged" },
    { key: "anisotropy", label: "Anisotropy", event: "anisotropyChanged" },
    { key: "dispersion", label: "Dispersion", event: "dispersionChanged" },
    { key: "gaussianSplatting", label: "Gaussian Splatting", event: "gaussianSplattingChanged" }
];

export function AdvancedTab({
    onCollapse,
    extensions,
    onExtensionsChange,
    debugChannel,
    onDebugChannelChange
}) {
    const debugchannels = useViewerStore((state) => state.debugchannels);
    const statistics = useViewerStore((state) => state.statistics);
    const supportsFloatingPointFramebuffer = useViewerStore(
        (state) => state.supportsFloatingPointFramebuffer
    );

    const toggle =
        ({ key, event }) =>
        (checked) => {
            onExtensionsChange({ [key]: checked });
            uiEvents[event].emit(checked);
        };

    const disabledFor = (key) => {
        if (key === "volume") {
            return !extensions.transmission && !extensions.diffuseTransmission;
        }
        if (key === "volumeScattering") {
            return !extensions.volume;
        }
        return false;
    };

    return (
        <div className="tabContent">
            <img
                src="assets/ui/Navigation_right_20px.svg"
                className="tabNavigationIcon"
                width="30px"
                onClick={onCollapse}
            />
            <h2 className="title is-spaced">Advanced Controls</h2>

            <Field label="Capture Canvas" className="subtitle">
                <button
                    type="button"
                    className="button is-rounded"
                    onClick={() => uiEvents.captureCanvas.emit(true)}
                >
                    <i className="fa fa-download downloadIcon" />
                    Download as .png
                </button>
            </Field>

            <Field label="Debug Channels" className="subtitle">
                <Select
                    value={debugChannel}
                    onChange={(value) => {
                        onDebugChannelChange(value);
                        uiEvents.debugchannelChanged.emit(value);
                    }}
                >
                    {debugchannels
                        .filter((item) => typeof item.title === "string")
                        .map((item) => (
                            <option key={item.title} value={item.title} label={item.title} />
                        ))}
                    {debugchannels
                        .filter((item) => typeof item.title === "object")
                        .map((item, index) => (
                            <optgroup key={index}>
                                {Object.values(item.title).map((subitem) => (
                                    <option key={subitem} value={subitem} label={subitem} />
                                ))}
                            </optgroup>
                        ))}
                </Select>
            </Field>

            {FEATURE_TOGGLES.map((entry) => (
                <Fragment key={entry.key}>
                    <Switch checked={extensions[entry.key]} onChange={toggle(entry)}>
                        {entry.label}
                    </Switch>
                    {entry.breakAfter && <br />}
                </Fragment>
            ))}

            <Switch
                checked={extensions.floatingPointFramebuffer}
                disabled={!supportsFloatingPointFramebuffer}
                onChange={toggle({
                    key: "floatingPointFramebuffer",
                    event: "floatingPointFramebufferChanged"
                })}
            >
                Floating-Point Framebuffer
            </Switch>

            <Field label="Current Camera Values" className="subtitle">
                <button
                    type="button"
                    className="button is-rounded"
                    onClick={() => uiEvents.cameraExport.emit(true)}
                >
                    <i className="fa fa-download downloadIcon" />
                    Download as .gltf
                </button>
            </Field>

            <Field label="KHR Materials Extensions" className="subtitle" grouped>
                {MATERIAL_EXTENSIONS.map((entry) => (
                    <Switch
                        key={entry.key}
                        className="smallerLabel"
                        checked={extensions[entry.key]}
                        disabled={disabledFor(entry.key)}
                        onChange={toggle(entry)}
                    >
                        {entry.label}
                    </Switch>
                ))}
            </Field>

            <Field label="Statistics" className="subtitle">
                <JsonTree data={statistics} />
            </Field>

            <div className="pb-6" />
        </div>
    );
}
