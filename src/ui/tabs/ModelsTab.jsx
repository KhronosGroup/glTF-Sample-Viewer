import { Funnel } from "lucide-react";
import { useState } from "react";

import { commands } from "../../logic/commands.js";
import { updateSelection, useViewerStore } from "../store.js";
import {
    Field,
    Panel,
    Radio,
    RadioGroup,
    Select,
    ThumbnailSelect,
    ToggleButton
} from "../controls.jsx";

// Above this many variants the radio list is replaced by a dropdown.
const VARIANT_LIST_LIMIT = 5;

/** A value the model list can be filtered by. */
function Chip({ label, selected, disabled, onToggle }) {
    return (
        <button
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => onToggle(label, !selected)}
            className={
                "rounded-full border px-3 py-0.5 text-sm transition-colors " +
                (disabled ? "cursor-not-allowed opacity-40 " : "cursor-pointer ") +
                (selected
                    ? "bg-accent text-ink-dim border-accent"
                    : "border-ink/60 " + (disabled ? "" : "hover:border-ink"))
            }
        >
            {label}
        </button>
    );
}

export function ModelsTab({ selectedVariant, onSelectVariant }) {
    const models = useViewerStore((state) => state.published.models);
    const modelCount = useViewerStore((state) => state.published.modelCount);
    const modelTags = useViewerStore((state) => state.published.modelTags);
    const modelFlavours = useViewerStore((state) => state.published.modelFlavours);
    const disabledModelTags = useViewerStore((state) => state.published.disabledModelTags);
    const disabledModelFlavours = useViewerStore((state) => state.published.disabledModelFlavours);
    const modelThumbnails = useViewerStore((state) => state.published.modelThumbnails);
    const selectedModelTags = useViewerStore((state) => state.selection.selectedModelTags);
    const selectedModelFlavours = useViewerStore((state) => state.selection.selectedModelFlavours);
    const flavours = useViewerStore((state) => state.published.flavours);
    const scenes = useViewerStore((state) => state.published.scenes);
    const cameras = useViewerStore((state) => state.published.cameras);
    const materialVariants = useViewerStore((state) => state.published.materialVariants);
    const selectedModel = useViewerStore((state) => state.selection.selectedModel);
    const selectedModelExcluded = useViewerStore((state) => state.selection.selectedModelExcluded);
    const selectedModelIsDropped = useViewerStore((state) => state.selection.selectedModelIsDropped);
    const selectedFlavour = useViewerStore((state) => state.selection.selectedFlavour);
    const selectedScene = useViewerStore((state) => state.selection.selectedScene);
    const selectedCamera = useViewerStore((state) => state.selection.selectedCamera);
    const [showTags, setShowTags] = useState(false);

    const selectVariant = (value) => {
        onSelectVariant(value);
    };

    const toggleTag = (tag, enabled) => {
        commands.modelTagsChanged(
            enabled ? [...selectedModelTags, tag] : selectedModelTags.filter((item) => item !== tag)
        );
    };

    const toggleFlavour = (flavour, enabled) => {
        commands.modelFlavoursChanged(
            enabled
                ? [...selectedModelFlavours, flavour]
                : selectedModelFlavours.filter((item) => item !== flavour)
        );
    };

    return (
        <Panel title="Models">
            <Field label="Models">
                <ThumbnailSelect
                    data-testid="model-select"
                    label="Models"
                    value={selectedModel}
                    onChange={(value) => {
                        updateSelection({ selectedModel: value });
                        commands.modelChanged(value);
                    }}
                    options={models.map((item) => ({
                        value: item,
                        label: item,
                        thumbnail: modelThumbnails[item],
                        muted: selectedModelExcluded && item === selectedModel
                    }))}
                />

                {modelTags.length > 0 && (
                    <>
                        <div className="mt-3 flex items-center gap-3">
                            <ToggleButton
                                data-testid="model-filter"
                                pressed={showTags}
                                onToggle={setShowTags}
                            >
                                <Funnel size={16} aria-hidden="true" />
                                Filter
                            </ToggleButton>
                            {showTags && (
                                <p data-testid="model-count" className="text-ink/60 text-sm">
                                    {modelCount} {modelCount === 1 ? "asset" : "assets"}
                                </p>
                            )}
                        </div>

                        {showTags && (
                            <>
                                <div data-testid="model-tags" className="flex mt-4 flex-wrap gap-2">
                                    {modelTags.map((tag) => (
                                        <Chip
                                            key={tag}
                                            label={tag}
                                            selected={selectedModelTags.includes(tag)}
                                            disabled={disabledModelTags.includes(tag)}
                                            onToggle={toggleTag}
                                        />
                                    ))}
                                </div>

                                <div
                                    data-testid="model-flavours"
                                    className="mt-6 flex flex-wrap gap-2"
                                >
                                    {modelFlavours.map((flavour) => (
                                        <Chip
                                            key={flavour}
                                            label={flavour}
                                            selected={selectedModelFlavours.includes(flavour)}
                                            disabled={disabledModelFlavours.includes(flavour)}
                                            onToggle={toggleFlavour}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                )}
            </Field>

            {!selectedModelIsDropped && (
                <Field label="Flavor">
                    <Select
                        data-testid="flavour-select"
                        value={selectedFlavour}
                        onChange={(value) => {
                            updateSelection({ selectedFlavour: value });
                            commands.flavourChanged(value);
                        }}
                    >
                        {flavours.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </Select>
                </Field>
            )}

            {scenes.length > 1 && (
                <Field label="Scenes">
                    <Select
                        value={selectedScene}
                        onChange={(value) => {
                            updateSelection({ selectedScene: value });
                        }}
                    >
                        {scenes.map((item, index) => (
                            <option key={item.index ?? index} value={item.index}>
                                {item.title}
                            </option>
                        ))}
                    </Select>
                </Field>
            )}

            {cameras.length > 1 && (
                <Field label="Cameras">
                    <Select
                        data-testid="camera-select"
                        value={selectedCamera}
                        onChange={(value) => {
                            const camera = parseInt(value);
                            updateSelection({ selectedCamera: camera });
                        }}
                    >
                        {cameras.map((item, index) => (
                            <option key={item.index ?? index} value={item.index}>
                                {item.title}
                            </option>
                        ))}
                    </Select>
                </Field>
            )}

            {materialVariants.length > 1 && (
                <Field label="Variants">
                    {materialVariants.length > VARIANT_LIST_LIMIT ? (
                        <Select value={selectedVariant} onChange={selectVariant}>
                            {materialVariants.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </Select>
                    ) : (
                        <RadioGroup>
                            {materialVariants.map((item) => (
                                <Radio
                                    key={item}
                                    name="material-variant"
                                    value={item}
                                    checked={selectedVariant === item}
                                    onChange={selectVariant}
                                >
                                    {item}
                                </Radio>
                            ))}
                        </RadioGroup>
                    )}
                </Field>
            )}
        </Panel>
    );
}
