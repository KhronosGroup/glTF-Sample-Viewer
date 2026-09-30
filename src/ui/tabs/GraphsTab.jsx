import { Pause, Play, Send } from "lucide-react";
import { useState } from "react";
import { uiEvents } from "../../logic/ui_events.js";
import { notify } from "../../logic/notifications.js";
import { setViewerState, useViewerStore } from "../store.js";
import {
    Button,
    Field,
    Panel,
    PlaybackControls,
    Radio,
    SectionLabel,
    Select
} from "../controls.jsx";
import { CustomEventInput, defaultValueForType } from "./CustomEventInput.jsx";

function initialValues(event) {
    if (!event?.values) {
        return {};
    }
    return Object.fromEntries(
        Object.entries(event.values).map(([key, definition]) => [
            key,
            definition.value !== undefined ? definition.value : defaultValueForType(definition.type)
        ])
    );
}

export function GraphsTab() {
    const graphs = useViewerStore((state) => state.graphs);
    const selectedGraph = useViewerStore((state) => state.selectedGraph);
    const graphState = useViewerStore((state) => state.graphState);
    const customEvents = useViewerStore((state) => state.customEvents);

    const [selectedEventId, setSelectedEventId] = useState(null);
    const [editedValues, setEditedValues] = useState({ eventId: null, values: {} });

    // The selected event has to survive the asset changing under it, so it is
    // resolved against the current list rather than corrected in an effect.
    const currentEvent =
        customEvents.find((event) => event.id === selectedEventId) ?? customEvents[0];
    const currentEventId = currentEvent?.id ?? null;

    if (editedValues.eventId !== currentEventId) {
        setEditedValues({ eventId: currentEventId, values: initialValues(currentEvent) });
    }

    const hasGraphs = graphs.length !== 0;

    const sendCustomEvent = () => {
        uiEvents.customEventSendClicked.emit({
            eventId: currentEventId,
            values: editedValues.values
        });
        notify(`Custom event '${currentEventId}' sent successfully!`, "success");
    };

    return (
        <Panel title="Interactivity Graphs">
            <SectionLabel>Graph Controls</SectionLabel>

            {hasGraphs && (
                <PlaybackControls
                    active={graphState}
                    onText="Pause"
                    offText="Play"
                    onIcon={<Pause size={16} aria-hidden="true" />}
                    offIcon={<Play size={16} aria-hidden="true" />}
                    onToggle={(on) => {
                        setViewerState({ graphState: on });
                        uiEvents.graphPlayChanged.emit(on);
                    }}
                    onReset={() => uiEvents.graphResetChanged.emit(true)}
                />
            )}

            {!hasGraphs && <SectionLabel>No graphs available</SectionLabel>}

            {hasGraphs && (
                <Field label="Graphs">
                    {graphs.map((graph) => (
                        <div key={graph.index} className="mb-2">
                            <Radio
                                name="interactivity-graph"
                                value={graph.index}
                                checked={selectedGraph === graph.index}
                                onChange={(value) => {
                                    setViewerState({ selectedGraph: value });
                                    uiEvents.selectedGraphChanged.emit(value);
                                }}
                            >
                                {graph.title}
                            </Radio>
                        </div>
                    ))}
                </Field>
            )}

            {customEvents.length > 0 && (
                <div className="mt-10 mb-6">
                    <SectionLabel>Custom events</SectionLabel>
                    <Field>
                        <Select value={currentEventId ?? ""} onChange={setSelectedEventId}>
                            {customEvents.map((event) => (
                                <option key={event.id} value={event.id}>
                                    {event.id}
                                </option>
                            ))}
                        </Select>
                    </Field>

                    {currentEvent && (
                        <form id="customEventForm">
                            {Object.entries(currentEvent.values ?? {}).map(([name, definition]) => (
                                <div key={name} className="mt-4">
                                    <CustomEventInput
                                        name={name}
                                        type={definition.type}
                                        value={editedValues.values[name]}
                                        onChange={(value) =>
                                            setEditedValues((current) => ({
                                                ...current,
                                                values: { ...current.values, [name]: value }
                                            }))
                                        }
                                    />
                                </div>
                            ))}
                        </form>
                    )}
                </div>
            )}

            {currentEventId && (
                <div className="mt-8 flex justify-end">
                    <Button className="w-28" onClick={sendCustomEvent}>
                        <Send size={16} aria-hidden="true" />
                        Send
                    </Button>
                </div>
            )}
        </Panel>
    );
}
