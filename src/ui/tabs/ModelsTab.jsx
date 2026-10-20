import { Funnel } from "lucide-react";
import { useState } from "react";

import { uiEvents } from "../../logic/ui_events.js";
import { setViewerState, useViewerStore } from "../store.js";
import { Field, OutlineButton, Panel, Radio, Select } from "../controls.jsx";

// Above this many variants the radio list is replaced by a dropdown.
const VARIANT_LIST_LIMIT = 5;

/** A tag the model list can be filtered by. */
function Tag({ tag, selected, onToggle }) {
    return (
        <button
            type="button"
            aria-pressed={selected}
            onClick={() => onToggle(tag)}
            className={
                "cursor-pointer rounded-full border px-3 py-0.5 text-sm transition-colors " +
                (selected
                    ? "bg-accent text-ink-dim border-accent"
                    : "border-ink/60 hover:border-ink")
            }
        >
            {tag}
        </button>
    );
}

export function ModelsTab() {
    const models = useViewerStore((state) => state.models);
    const modelCount = useViewerStore((state) => state.modelCount);
    const modelTags = useViewerStore((state) => state.modelTags);
    const selectedModelTags = useViewerStore((state) => state.selectedModelTags);
    const flavours = useViewerStore((state) => state.flavours);
    const scenes = useViewerStore((state) => state.scenes);
    const showScenes = useViewerStore((state) => state.showScenes);
    const cameras = useViewerStore((state) => state.cameras);
    const materialVariants = useViewerStore((state) => state.materialVariants);
    const selectedModel = useViewerStore((state) => state.selectedModel);
    const selectedFlavour = useViewerStore((state) => state.selectedFlavour);
    const selectedScene = useViewerStore((state) => state.selectedScene);
    const selectedCamera = useViewerStore((state) => state.selectedCamera);
    const selectedVariant = useViewerStore((state) => state.selectedVariant);
    const [showTags, setShowTags] = useState(false);

    const selectVariant = (value) => {
        setViewerState({ selectedVariant: value });
        uiEvents.variantChanged.emit(value);
    };

    const toggleTag = (tag) => {
        uiEvents.modelTagsChanged.emit(
            selectedModelTags.includes(tag)
                ? selectedModelTags.filter((item) => item !== tag)
                : [...selectedModelTags, tag]
        );
    };

    return (
        <Panel title="Models">
            <Field label="Models">
                <Select
                    data-testid="model-select"
                    value={selectedModel}
                    onChange={(value) => {
                        setViewerState({ selectedModel: value });
                        uiEvents.modelChanged.emit(value);
                    }}
                >
                    {models.map((item) => (
                        <option key={item} value={item}>
                            {item}
                        </option>
                    ))}
                </Select>

                {modelTags.length > 0 && (
                    <>
                        <div className="mt-3 flex items-center gap-3">
                            <OutlineButton
                                data-testid="model-filter"
                                aria-expanded={showTags}
                                onClick={() => setShowTags(!showTags)}
                            >
                                <Funnel size={16} aria-hidden="true" />
                                Filter
                            </OutlineButton>
                            {showTags && (
                                <p data-testid="model-count" className="text-ink/60 text-sm">
                                    {modelCount} {modelCount === 1 ? "asset" : "assets"}
                                </p>
                            )}
                        </div>

                        {showTags && (
                            <div data-testid="model-tags" className="mt-3 flex flex-wrap gap-2">
                                {modelTags.map((tag) => (
                                    <Tag
                                        key={tag}
                                        tag={tag}
                                        selected={selectedModelTags.includes(tag)}
                                        onToggle={toggleTag}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </Field>

            <Field label="Flavor">
                <Select
                    data-testid="flavour-select"
                    value={selectedFlavour}
                    onChange={(value) => {
                        setViewerState({ selectedFlavour: value });
                        uiEvents.flavourChanged.emit(value);
                    }}
                >
                    {flavours.map((item) => (
                        <option key={item} value={item}>
                            {item}
                        </option>
                    ))}
                </Select>
            </Field>

            {showScenes && (
                <Field label="Scenes">
                    <Select
                        value={selectedScene}
                        onChange={(value) => {
                            setViewerState({ selectedScene: value });
                            uiEvents.sceneChanged.emit(value);
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

            <Field label="Cameras">
                <Select
                    value={selectedCamera}
                    onChange={(value) => {
                        setViewerState({ selectedCamera: value });
                        uiEvents.cameraChanged.emit(parseInt(value));
                    }}
                >
                    {cameras.map((item, index) => (
                        <option key={item.index ?? index} value={item.index}>
                            {item.title}
                        </option>
                    ))}
                </Select>
            </Field>

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
                        materialVariants.map((item) => (
                            <Field key={item}>
                                <Radio
                                    name="material-variant"
                                    value={item}
                                    checked={selectedVariant === item}
                                    onChange={selectVariant}
                                >
                                    {item}
                                </Radio>
                            </Field>
                        ))
                    )}
                </Field>
            )}
        </Panel>
    );
}
