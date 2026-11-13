import { Fragment } from "react";
import { Download, RotateCcw } from "lucide-react";
import { updateSelection, useViewerStore } from "../store.js";
import {
    Button,
    Field,
    IconButton,
    Panel,
    SegmentedControl,
    Select,
    Switch
} from "../controls.jsx";
import { Slider } from "../Slider.jsx";
import { StatList } from "../StatList.jsx";
import { MorphWeights } from "../MorphWeights.jsx";
import { commands } from "../../logic/commands.js";

const RENDERING_TOGGLES = [
    { key: "skinning", label: "Skinning" },
    { key: "morphing", label: "Morphing" }
];

const INSPECTION_TOGGLES = [
    { key: "lightGizmos", label: "Light Gizmos" },
    { key: "cameraGizmos", label: "Camera Gizmos" },
    { key: "jointGizmos", label: "Joint Gizmos" },
    { key: "aabbGizmos", label: "AABB Gizmos" }
];

const EXTENSION_TOGGLES = [
    {
        key: "interactivity",
        label: "Interactivity",
        extension: "KHR_interactivity"
    },
    {
        key: "hoverability",
        label: "Node Hoverability",
        extension: "KHR_node_hoverability"
    },
    {
        key: "selectability",
        label: "Node Selectability",
        extension: "KHR_node_selectability"
    },
    {
        key: "nodeVisibility",
        label: "Node Visibility",
        extension: "KHR_node_visibility"
    },
    {
        key: "gaussianSplatting",
        label: "Gaussian Splatting",
        extension: "KHR_gaussian_splatting"
    }
];

const MATERIAL_EXTENSIONS = [
    {
        key: "anisotropy",
        label: "Anisotropy",
        extension: "KHR_materials_anisotropy"
    },
    {
        key: "clearcoat",
        label: "Clearcoat",
        extension: "KHR_materials_clearcoat"
    },
    {
        key: "diffuseTransmission",
        label: "Diffuse Transmission",
        extension: "KHR_materials_diffuse_transmission"
    },
    {
        key: "dispersion",
        label: "Dispersion",
        extension: "KHR_materials_dispersion"
    },
    {
        key: "emissiveStrength",
        label: "Emissive Strength",
        extension: "KHR_materials_emissive_strength"
    },
    {
        key: "ior",
        label: "Index of Refraction",
        extension: "KHR_materials_ior"
    },
    {
        key: "iridescence",
        label: "Iridescence",
        extension: "KHR_materials_iridescence"
    },
    {
        key: "retroreflection",
        label: "Retroreflection",
        extension: "KHR_materials_retroreflection"
    },
    {
        key: "scattering",
        label: "Scattering",
        extension: "KHR_materials_scatter"
    },
    {
        key: "sheen",
        label: "Sheen",
        extension: "KHR_materials_sheen"
    },
    {
        key: "specular",
        label: "Specular",
        extension: "KHR_materials_specular"
    },
    {
        key: "transmission",
        label: "Transmission",
        extension: "KHR_materials_transmission"
    },
    {
        key: "volume",
        label: "Volume",
        extension: "KHR_materials_volume"
    }
];

const CLIPPING_AXES = ["X", "Y", "Z"];

const formatClippingBound = (value) => `${Math.round(value * 100)}%`;

/**
 * Six planes forming a cuboid around the model. The bounds are fractions of the
 * scene extents, so they mean the same thing whatever is loaded.
 */
function ClippingControls({ clipping, onChange }) {
    const orientations = useViewerStore((state) => state.published.clippingOrientations);
    const supportsClipping = useViewerStore((state) => state.published.supportsClipping);

    const update = (partial) => {
        onChange(partial);
    };

    // Pushing one bound past the other carries it along rather than inverting the cuboid.
    const setBound = (bound, axis) => (value) => {
        const bounds = { min: [...clipping.min], max: [...clipping.max] };
        bounds[bound][axis] = value;
        if (bounds.min[axis] > bounds.max[axis]) {
            bounds[bound === "min" ? "max" : "min"][axis] = value;
        }
        update(bounds);
    };

    return (
        <div className="mt-6">
            <div className="mb-2 flex items-center justify-between gap-3">
                <span className="font-medium">Clipping Planes</span>
                <Switch
                    className="mt-0! w-auto!"
                    data-testid="switch-clipping"
                    checked={clipping.enabled}
                    disabled={!supportsClipping}
                    onChange={(checked) => update({ enabled: checked })}
                >
                    <span className="sr-only">Clipping Planes</span>
                </Switch>
            </div>
            {!supportsClipping && (
                <p className="text-ink/60 text-sm">Unsupported by this browser</p>
            )}

            {clipping.enabled && (
                <>
                    <div className="flex items-center gap-2">
                        <SegmentedControl
                            label="Clipping Orientation"
                            options={orientations.map((orientation) => ({
                                label: orientation.split(" ")[0],
                                value: orientation
                            }))}
                            value={clipping.orientation}
                            onChange={(value) => update({ orientation: value })}
                        />
                        <IconButton
                            label="Reset clipping planes"
                            onClick={() => update({ min: [0, 0, 0], max: [1, 1, 1] })}
                        >
                            <RotateCcw size={16} aria-hidden="true" />
                        </IconButton>
                    </div>

                    <div className="mt-1 grid grid-cols-[1ch_1fr_1fr] items-center gap-x-3 text-sm font-light">
                        <span />
                        <span>Min</span>
                        <span>Max</span>
                        {CLIPPING_AXES.map((axis, index) => (
                            <Fragment key={axis}>
                                <span>{axis}</span>
                                {["min", "max"].map((bound) => (
                                    <Slider
                                        key={bound}
                                        label={`Clipping ${axis} ${bound}`}
                                        value={clipping[bound][index]}
                                        min={0}
                                        max={1}
                                        step={0.01}
                                        formatter={formatClippingBound}
                                        onChange={setBound(bound, index)}
                                    />
                                ))}
                            </Fragment>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export function AdvancedTab({
    extensions,
    onExtensionsChange,
    debugChannel,
    onDebugChannelChange,
    clipping,
    onClippingChange
}) {
    const debugchannels = useViewerStore((state) => state.published.debugchannels);
    const statistics = useViewerStore((state) => state.published.statistics);
    const hasMorphTargets = useViewerStore((state) => state.published.morphWeights.length > 0);
    const supportsFloatingPointFramebuffer = useViewerStore(
        (state) => state.published.supportsFloatingPointFramebuffer
    );
    const supportsWireframe = useViewerStore((state) => state.published.supportsWireframe);

    const toggle =
        ({ key }) =>
        (checked) =>
            onExtensionsChange({ [key]: checked });

    const disabledFor = (key) => {
        if (key === "volume") {
            return !extensions.transmission && !extensions.diffuseTransmission;
        }
        if (key === "scattering") {
            return !extensions.transmission;
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
                title={entry.extension}
            >
                {entry.label}
            </Switch>
        ));

    return (
        <Panel title="Advanced Controls">
            <Field label="Debug Channels">
                <Select
                    data-testid="select-debug-channel"
                    value={debugChannel}
                    onChange={(value) => {
                        onDebugChannelChange(value);
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
                        key: "floatingPointFramebuffer"
                    })}
                >
                    32-bit Framebuffer
                </Switch>
            </Field>

            <Field label="Inspection" grouped>
                {renderToggles(INSPECTION_TOGGLES)}
                <Switch
                    data-testid="switch-wireframe"
                    checked={extensions.wireframe}
                    disabled={!supportsWireframe}
                    onChange={toggle({ key: "wireframe" })}
                >
                    {supportsWireframe ? "Wireframe" : "Wireframe (unsupported by this browser)"}
                </Switch>
            </Field>

            {hasMorphTargets && (
                <div className="mt-6">
                    <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="font-medium">Morph Overrides</span>
                        <Switch
                            className="mt-0! w-auto!"
                            checked={extensions.morphOverrides}
                            disabled={!extensions.morphing}
                            onChange={(checked) => {
                                onExtensionsChange({ morphOverrides: checked });
                                if (!checked) {
                                    updateSelection({ morphWeightOverrides: {} });
                                }
                            }}
                        >
                            <span className="sr-only">Morph Overrides</span>
                        </Switch>
                    </div>
                    {extensions.morphOverrides && (
                        <MorphWeights
                            disabled={!extensions.morphing}
                            signedRange={extensions.morphSignedRange}
                            onSignedRangeChange={(value) =>
                                onExtensionsChange({ morphSignedRange: value })
                            }
                        />
                    )}
                </div>
            )}

            <ClippingControls clipping={clipping} onChange={onClippingChange} />

            <Field label="Extensions" grouped>
                {renderToggles(EXTENSION_TOGGLES)}
            </Field>

            <Field label="Material Extensions" grouped>
                {renderToggles(MATERIAL_EXTENSIONS)}
            </Field>

            <Field label="Current Camera Values">
                <Button onClick={() => commands.cameraExport()}>
                    <Download size={16} aria-hidden="true" />
                    Download as glTF
                </Button>
            </Field>

            <Field label="Statistics">
                <StatList data={statistics} />
            </Field>
        </Panel>
    );
}
