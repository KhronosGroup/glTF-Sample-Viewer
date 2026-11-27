import { SlidersHorizontal } from "lucide-react";
import { Fragment } from "react";
import { updateSelection, useViewerStore } from "../store.js";
import {
    Field,
    Panel,
    RevertButton,
    SegmentedControl,
    SelectWithReset,
    Switch,
    UnsupportedBadge
} from "../controls.jsx";
import { Slider } from "../Slider.jsx";
import { StatList } from "../StatList.jsx";
import { MorphWeights } from "../MorphWeights.jsx";
import { canonicalExtensionName } from "../../logic/material_naming.js";

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
    },
    {
        key: "physics",
        label: "Physics",
        extension: "KHR_physics_rigid_bodies"
    }
];

const MATERIAL_EXTENSIONS = [
    { key: "anisotropy", extension: "KHR_materials_anisotropy" },
    { key: "clearcoat", extension: "KHR_materials_clearcoat" },
    { key: "diffuseTransmission", extension: "KHR_materials_diffuse_transmission" },
    { key: "dispersion", extension: "KHR_materials_dispersion" },
    { key: "emissiveStrength", extension: "KHR_materials_emissive_strength" },
    { key: "ior", extension: "KHR_materials_ior" },
    { key: "iridescence", extension: "KHR_materials_iridescence" },
    { key: "retroreflection", extension: "KHR_materials_retroreflection" },
    { key: "scattering", extension: "KHR_materials_scatter" },
    { key: "sheen", extension: "KHR_materials_sheen" },
    { key: "specular", extension: "KHR_materials_specular" },
    { key: "transmission", extension: "KHR_materials_transmission" },
    { key: "volume", extension: "KHR_materials_volume" }
].map((entry) => ({ ...entry, label: canonicalExtensionName(entry.extension) }));

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
        <>
            <Field
                label="Clipping Planes"
                toggle={clipping.enabled}
                onToggleChange={(checked) => update({ enabled: checked })}
                toggleDisabled={!supportsClipping}
                toggleTestId="switch-clipping"
            >
                <div className="flex items-center justify-center gap-2">
                    <SegmentedControl
                        label="Clipping Orientation"
                        options={orientations.map((orientation) => ({
                            label: orientation.split(" ")[0],
                            value: orientation
                        }))}
                        value={clipping.orientation}
                        onChange={(value) => update({ orientation: value })}
                    />
                    <RevertButton
                        label="Reset clipping planes"
                        onClick={() => update({ min: [0, 0, 0], max: [1, 1, 1] })}
                    />
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
            </Field>
            {!supportsClipping && <UnsupportedBadge className="block text-sm" />}
        </>
    );
}

export function AdvancedTab({
    extensions,
    onExtensionsChange,
    debugChannel,
    onDebugChannelChange,
    clipping,
    onClippingChange,
    debugShapes,
    onDebugShapesChange,
    cullByBoundingVolume,
    onCullByBoundingVolumeChange
}) {
    const debugchannels = useViewerStore((state) => state.published.debugchannels);
    const usedExtensions = useViewerStore((state) => state.published.usedExtensions);
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
                disabled={
                    (disabledFor(entry.key) ||
                        (entry.extension !== undefined &&
                            !usedExtensions.includes(entry.extension))) &&
                    false
                }
                onChange={toggle(entry)}
                title={entry.extension}
            >
                {entry.label}
            </Switch>
        ));

    return (
        <Panel title="Settings" icon={SlidersHorizontal}>
            <Field label="Debug Channels">
                <SelectWithReset
                    data-testid="select-debug-channel"
                    label="Reset debug channel"
                    value={debugChannel}
                    defaultValue="None"
                    onChange={onDebugChannelChange}
                    onReset={() => onDebugChannelChange("None")}
                >
                    {debugchannels
                        .filter((item) => typeof item.title === "string")
                        .map((item) => (
                            <option key={item.title} value={item.title} label={item.title} />
                        ))}
                    {debugchannels
                        .filter((item) => typeof item.title === "object")
                        .map((item) => (
                            <optgroup key={item.label} label={item.label}>
                                {Object.values(item.title).map((subitem) => (
                                    <option key={subitem} value={subitem} label={subitem} />
                                ))}
                            </optgroup>
                        ))}
                </SelectWithReset>
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
                <Switch
                    data-testid="switch-cull-bounding-volumes"
                    checked={cullByBoundingVolume}
                    onChange={(checked) => onCullByBoundingVolumeChange(checked)}
                >
                    Cull by Shapes
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
                    Wireframe
                    {!supportsWireframe && <UnsupportedBadge className="ml-1.5 text-xs" />}
                </Switch>
                <Switch
                    data-testid="switch-bounding-shapes"
                    checked={debugShapes.boundingVolumes}
                    onChange={(checked) => onDebugShapesChange({ boundingVolumes: checked })}
                >
                    Bounding Shapes
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

            <Field label="Statistics">
                <StatList data={statistics} />
            </Field>
        </Panel>
    );
}
