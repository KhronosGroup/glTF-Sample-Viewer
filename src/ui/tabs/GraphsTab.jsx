import { Pause, Play } from "lucide-react";
import { commands } from "../../logic/commands.js";
import { updateSelection, useViewerStore } from "../store.js";
import { Field, Panel, PlaybackControls, Radio, RadioGroup, SectionLabel } from "../controls.jsx";

export function GraphsTab() {
    const graphs = useViewerStore((state) => state.published.graphs);
    const selectedGraph = useViewerStore((state) => state.selection.selectedGraph);
    const graphState = useViewerStore((state) => state.selection.graphState);
    const customEvents = useViewerStore((state) => state.published.customEvents);
    const hasInteractivity = useViewerStore((state) => state.published.hasInteractivity);

    return (
        <Panel title="Interactivity Graphs">
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
                                {group.events.map((event) => (
                                    <button
                                        key={event.id}
                                        type="button"
                                        title={`Dispatch '${event.id}'`}
                                        onClick={() =>
                                            commands.customEventSendClicked({
                                                asset: group.asset,
                                                eventId: event.id
                                            })
                                        }
                                        className="bg-card hover:bg-card-inner focus-visible:outline-accent flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left transition-colors focus-visible:outline"
                                    >
                                        <span className="font-light">{event.name}</span>
                                        <span className="text-ink-dim shrink-0 rounded-full bg-black/20 px-2 py-0.5 text-xs tabular-nums">
                                            {event.count}×
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Panel>
    );
}
