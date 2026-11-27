import { ChevronRight, DiagramFlowHorizontal, Pause, Play, Send } from "lucide-react";
import { useState } from "react";
import { commands } from "../../logic/commands.js";
import { updateSelection, useViewerStore } from "../store.js";
import {
    Button,
    Field,
    Panel,
    PlaybackControls,
    Radio,
    RadioGroup,
    SectionLabel
} from "../controls.jsx";
import { CustomEventInput, defaultValueForType } from "./CustomEventInput.jsx";

// Scalar argument types are declared as single-element arrays in the event, but
// the inputs work with the bare value.
const SCALAR_TYPES = new Set(["bool", "int", "float", "ref"]);

function initialValue(definition) {
    if (definition.value === undefined) {
        return defaultValueForType(definition.type);
    }
    return SCALAR_TYPES.has(definition.type) ? definition.value[0] : definition.value;
}

function initialValues(event) {
    return Object.fromEntries(
        Object.entries(event?.values ?? {}).map(([name, definition]) => [
            name,
            initialValue(definition)
        ])
    );
}

export function GraphsTab() {
    const graphs = useViewerStore((state) => state.published.graphs);
    const selectedGraph = useViewerStore((state) => state.selection.selectedGraph);
    const graphState = useViewerStore((state) => state.selection.graphState);
    const customEvents = useViewerStore((state) => state.published.customEvents);
    const hasInteractivity = useViewerStore((state) => state.published.hasInteractivity);

    const [expanded, setExpanded] = useState(null);
    const [editedValues, setEditedValues] = useState({ key: null, values: {} });

    const allEvents = customEvents.flatMap((group) =>
        group.events.map((event) => ({ ...event, asset: group.asset }))
    );
    const keyOf = (event) => `${event.asset ?? "root"}:${event.id}`;

    // The expanded event has to survive the asset changing under it, so it is
    // resolved against the current list rather than corrected in an effect.
    const currentEvent =
        (expanded && allEvents.find((event) => keyOf(event) === keyOf(expanded))) || null;
    const currentKey = currentEvent ? keyOf(currentEvent) : null;

    if (editedValues.key !== currentKey) {
        setEditedValues({ key: currentKey, values: initialValues(currentEvent) });
    }

    const send = () => {
        if (!currentEvent) {
            return;
        }
        commands.customEventSendClicked({
            asset: currentEvent.asset,
            eventId: currentEvent.id,
            values: editedValues.values
        });
    };

    return (
        <Panel title="Interactivity" icon={DiagramFlowHorizontal}>
            {hasInteractivity && (
                <PlaybackControls
                    active={graphState}
                    onText="Pause"
                    offText="Play"
                    onIcon={<Pause size={16} aria-hidden="true" />}
                    offIcon={<Play size={16} aria-hidden="true" />}
                    onToggle={(on) => {
                        updateSelection({ graphState: on });
                    }}
                    onReset={() => commands.graphResetChanged()}
                />
            )}

            {graphs.length > 1 && (
                <Field label="Graphs">
                    <RadioGroup label="Graphs">
                        {graphs.map((graph) => (
                            <Radio
                                key={graph.index}
                                name="interactivity-graph"
                                value={graph.index}
                                checked={selectedGraph === graph.index}
                                onChange={(value) => {
                                    updateSelection({ selectedGraph: value });
                                }}
                            >
                                {graph.title}
                            </Radio>
                        ))}
                    </RadioGroup>
                </Field>
            )}

            {customEvents.length > 0 && (
                <div className="mt-10 mb-6">
                    <SectionLabel>Custom events</SectionLabel>
                    {customEvents.map((group) => (
                        <div key={group.asset ?? "root"} className="mt-4">
                            {group.asset !== undefined && (
                                <div className="text-ink-dim mb-2 text-xs font-medium uppercase tracking-wide">
                                    {group.asset}
                                </div>
                            )}
                            <div className="flex flex-col gap-1">
                                {group.events.map((event) => {
                                    const isExpanded =
                                        currentKey === keyOf({ ...event, asset: group.asset });
                                    return (
                                        <div key={event.id} className="bg-card rounded-md">
                                            <button
                                                type="button"
                                                aria-expanded={isExpanded}
                                                onClick={() =>
                                                    setExpanded(
                                                        isExpanded
                                                            ? null
                                                            : { asset: group.asset, id: event.id }
                                                    )
                                                }
                                                className="focus-visible:outline-accent flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition-colors hover:bg-card-inner focus-visible:outline"
                                            >
                                                <ChevronRight
                                                    size={14}
                                                    aria-hidden="true"
                                                    className={`text-ink-dim shrink-0 motion-safe:transition-transform ${
                                                        isExpanded ? "rotate-90" : ""
                                                    }`}
                                                />
                                                <span className="min-w-0 flex-1 truncate font-light">
                                                    {event.name}
                                                </span>
                                                <span className="text-ink-dim shrink-0 rounded-full bg-black/20 px-2 py-0.5 text-xs tabular-nums">
                                                    {event.count}×
                                                </span>
                                            </button>
                                            {isExpanded && (
                                                <div className="px-3 pt-1 pb-3">
                                                    <div className="space-y-3">
                                                        {Object.entries(
                                                            currentEvent.values ?? {}
                                                        ).map(([name, definition]) => (
                                                            <CustomEventInput
                                                                key={name}
                                                                name={name}
                                                                type={definition.type}
                                                                value={editedValues.values[name]}
                                                                onChange={(value) =>
                                                                    setEditedValues((current) => ({
                                                                        ...current,
                                                                        values: {
                                                                            ...current.values,
                                                                            [name]: value
                                                                        }
                                                                    }))
                                                                }
                                                            />
                                                        ))}
                                                    </div>
                                                    <div className="mt-4 flex justify-end">
                                                        <Button className="w-28" onClick={send}>
                                                            <Send size={16} aria-hidden="true" />
                                                            Send
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Panel>
    );
}
