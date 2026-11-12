/**
 * Imperative commands the UI issues to the non-React layer (`UIModel` and the
 * viewer's `initViewer`). Each entry is a function slot assigned by its single
 * consumer; components call it directly rather than going through a pub/sub bus.
 */
const commandNames = [
    "modelChanged",
    "modelTagsChanged",
    "modelFlavoursChanged",
    "flavourChanged",
    "selectedEnvironmentChanged",
    "addEnvironmentChanged",
    "cameraLookAtChanged",
    "cameraResetChanged",
    "animationResetChanged",
    "graphResetChanged",
    "customEventSendClicked",
    "physicsResetChanged",
    "physicsStepChanged",
    "captureCanvas",
    "cameraExport"
];

const noop = () => {};

export const commands = Object.fromEntries(commandNames.map((name) => [name, noop]));

/** Assigns a command handler and returns a reset that restores the no-op. */
export function setCommand(name, handler) {
    commands[name] = handler;
    return () => {
        commands[name] = noop;
    };
}
