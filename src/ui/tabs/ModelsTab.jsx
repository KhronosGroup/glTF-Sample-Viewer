import { uiEvents } from "../../logic/ui_events.js";
import { setViewerState, useViewerStore } from "../store.js";
import { Field, Panel, Radio, Select } from "../controls.jsx";

// Above this many variants the radio list is replaced by a dropdown.
const VARIANT_LIST_LIMIT = 5;

export function ModelsTab({ onCollapse, selectedVariant, onSelectVariant }) {
    const models = useViewerStore((state) => state.models);
    const flavours = useViewerStore((state) => state.flavours);
    const scenes = useViewerStore((state) => state.scenes);
    const cameras = useViewerStore((state) => state.cameras);
    const materialVariants = useViewerStore((state) => state.materialVariants);
    const selectedModel = useViewerStore((state) => state.selectedModel);
    const selectedFlavour = useViewerStore((state) => state.selectedFlavour);
    const selectedScene = useViewerStore((state) => state.selectedScene);
    const selectedCamera = useViewerStore((state) => state.selectedCamera);

    const selectVariant = (value) => {
        onSelectVariant(value);
        uiEvents.variantChanged.emit(value);
    };

    return (
        <Panel title="Models" onCollapse={onCollapse}>
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
            </Field>

            <Field label="Flavor">
                <Select
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
