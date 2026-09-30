import { Download } from "lucide-react";
import { useViewerStore } from "../store.js";
import { Button, Field, Panel, Select, Switch } from "../controls.jsx";
import { StatList } from "../StatList.jsx";
import { uiEvents } from "../../logic/ui_events.js";

const RENDERING_TOGGLES = [
    { key: "skinning", label: "Skinning", event: "skinningChanged" },
    { key: "morphing", label: "Morphing", event: "morphingChanged" }
];

const EXTENSION_TOGGLES = [
    { key: "interactivity", label: "KHR_interactivity", event: "interactivityChanged" },
    { key: "hoverability", label: "KHR_node_hoverability", event: "hoverabilityChanged" },
    { key: "selectability", label: "KHR_node_selectability", event: "selectabilityChanged" },
    { key: "nodeVisibility", label: "KHR_node_visibility", event: "nodeVisibilityChanged" }
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

    const renderToggles = (entries) =>
        entries.map((entry) => (
            <Switch
                key={entry.key}
                checked={extensions[entry.key]}
                disabled={disabledFor(entry.key)}
                onChange={toggle(entry)}
            >
                {entry.label}
            </Switch>
        ));

    return (
        <Panel title="Advanced Controls">
            <Switch
                checked={extensions.inputSmoothing}
                onChange={toggle({ key: "inputSmoothing", event: "inputSmoothingChanged" })}
            >
                Input Smoothing
            </Switch>

            <Field label="Debug Channels">
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

            <Field label="Rendering" grouped>
                {renderToggles(RENDERING_TOGGLES)}
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
            </Field>

            <Field label="Extensions" grouped>
                {renderToggles(EXTENSION_TOGGLES)}
            </Field>

            <Field label="Material Extensions" grouped>
                {renderToggles(MATERIAL_EXTENSIONS)}
            </Field>

            <Field label="Current Camera Values">
                <Button onClick={() => uiEvents.cameraExport.emit(true)}>
                    <Download size={16} aria-hidden="true" />
                    Download as .gltf
                </Button>
            </Field>

            <Field label="Statistics">
                <StatList data={statistics} />
            </Field>
        </Panel>
    );
}
