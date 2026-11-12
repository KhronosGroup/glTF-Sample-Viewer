/**
 * The names of every command the UI can issue; `setCommand` only accepts these.
 * @typedef {"modelChanged"|"modelTagsChanged"|"modelFlavoursChanged"|"flavourChanged"|
 *     "selectedEnvironmentChanged"|"addEnvironmentChanged"|"cameraLookAtChanged"|
 *     "cameraResetChanged"|"animationResetChanged"|"graphResetChanged"|"customEventSendClicked"|
 *     "physicsResetChanged"|"physicsStepChanged"|"captureCanvas"|"cameraExport"} CommandName
 */

/**
 * A command handler. Each command has its own argument list, so the handler is
 * typed loosely.
 * @typedef {(...args: any[]) => void} CommandHandler
 */

/**
 * Imperative commands the UI issues to the non-React layer (`UIModel` and the
 * viewer's `initViewer`). Each entry is a function slot assigned by its single
 * consumer; components call it directly rather than going through a pub/sub bus.
 */

/** @type {CommandName[]} */
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

/** The registry of command handlers, keyed by command name. @type {Record<CommandName, CommandHandler>} */
export const commands = Object.fromEntries(commandNames.map((name) => [name, noop]));

/**
 * Assigns a command handler and returns a reset that restores the no-op.
 * @param {CommandName} name
 * @param {CommandHandler} handler
 * @returns {() => void}
 */
export function setCommand(name, handler) {
    commands[name] = handler;
    return () => {
        commands[name] = noop;
    };
}
