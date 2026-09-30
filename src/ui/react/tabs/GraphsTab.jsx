import { useState } from "react";
import { uiEvents } from "../../../logic/ui_events.js";
import { notify } from "../../../logic/notifications.js";
import { setViewerState, useViewerStore } from "../store.js";
import { Field, Radio, Select, ToggleButton } from "../controls.jsx";
import { CustomEventInput, defaultValueForType } from "./CustomEventInput.jsx";

const RESET_BUTTON_STYLE = {
    border: "1.5px solid #87c540",
    color: "#f2f2f2",
    background: "transparent",
    minWidth: "70px"
};

const CONTROL_ROW_STYLE = {
    display: "flex",
    gap: "1em",
    alignItems: "center",
    marginBottom: "1.5em",
    marginTop: "1em"
};

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

export function GraphsTab({ onCollapse }) {
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
        uiEvents.customEventSendClicked.next({
            eventId: currentEventId,
            values: editedValues.values
        });
        notify(`Custom event '${currentEventId}' sent successfully!`, "is-success");
    };

    return (
        <div className="tabContent">
            <img src="assets/ui/Navigation_right_20px.svg" width="30px" onClick={onCollapse} />
            <h2 className="title is-spaced" style={{ marginBottom: "0.5em" }}>
                Interactivity Graphs
            </h2>
            <label className="subtitle">Graph Controls</label>

            <div style={CONTROL_ROW_STYLE}>
                <ToggleButton
                    on={graphState}
                    onText="Pause"
                    offText="Play"
                    className="round-green-btn"
                    style={hasGraphs ? undefined : { display: "none" }}
                    onToggle={(on) => {
                        setViewerState({ graphState: on });
                        uiEvents.graphPlayChanged.next(on);
                    }}
                />
                <button
                    className="button is-rounded reset-btn-green"
                    style={
                        hasGraphs ? RESET_BUTTON_STYLE : { ...RESET_BUTTON_STYLE, display: "none" }
                    }
                    onClick={() => uiEvents.graphResetChanged.next(true)}
                >
                    Reset
                </button>
            </div>

            {!hasGraphs && <label className="subtitle">No graphs available</label>}

            {hasGraphs && (
                <Field label="Graphs">
                    {graphs.map((graph) => (
                        <div key={graph.index} style={{ marginBottom: "0.5em" }}>
                            <Radio
                                name="interactivity-graph"
                                value={graph.index}
                                checked={selectedGraph === graph.index}
                                onChange={(value) => {
                                    setViewerState({ selectedGraph: value });
                                    uiEvents.selectedGraphChanged.next(value);
                                }}
                            >
                                {graph.title}
                            </Radio>
                        </div>
                    ))}
                </Field>
            )}

            {customEvents.length > 0 && (
                <div style={{ marginTop: "2.5em", marginBottom: "1.5em" }}>
                    <label className="subtitle" style={{ marginBottom: "0.5em", display: "block" }}>
                        Custom events
                    </label>
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
                                <div key={name} style={{ marginTop: "1em" }}>
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
                <div style={{ marginTop: "2em", display: "flex", justifyContent: "flex-end" }}>
                    <button className="button is-rounded round-green-btn" onClick={sendCustomEvent}>
                        Send
                    </button>
                </div>
            )}
        </div>
    );
}
