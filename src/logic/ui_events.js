/**
 * Every UI input the viewer reacts to, as a plain module-level event bus.
 *
 * These were RxJS Subjects, but nothing here needed stream composition: each is
 * published by one control and consumed by one or two handlers.
 */

function createEvent() {
    const listeners = new Set();
    return {
        emit(value) {
            // Copied so a listener may unsubscribe itself while being called.
            for (const listener of [...listeners]) {
                listener(value);
            }
        },
        on(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        }
    };
}

const eventNames = [
    "modelChanged",
    "flavourChanged",
    "sceneChanged",
    "cameraChanged",
    "variantChanged",
    "selectedGraphChanged",
    "selectedAnimationsChanged",
    "selectedEnvironmentChanged",
    "addEnvironmentChanged",
    "environmentRotationChanged",

    "debugchannelChanged",
    "debugShapesChanged",
    "cullByBoundingVolumeChanged",
    "tonemapChanged",
    "exposureChanged",
    "colorChanged",

    "iblChanged",
    "iblIntensityChanged",
    "punctualLightsChanged",
    "renderEnvChanged",
    "blurEnvChanged",

    "skinningChanged",
    "morphingChanged",
    "inputSmoothingChanged",
    "interactivityChanged",
    "floatingPointFramebufferChanged",

    "clearcoatChanged",
    "sheenChanged",
    "transmissionChanged",
    "diffuseTransmissionChanged",
    "volumeChanged",
    "volumeScatteringChanged",
    "iorChanged",
    "iridescenceChanged",
    "retroreflectionChanged",
    "anisotropyChanged",
    "dispersionChanged",
    "specularChanged",
    "emissiveStrengthChanged",
    "hoverabilityChanged",
    "selectabilityChanged",
    "nodeVisibilityChanged",
    "gaussianSplattingChanged",

    "animationPlayChanged",
    "animationResetChanged",
    "graphPlayChanged",
    "graphResetChanged",
    "customEventSendClicked",

    "physicsEnabledChanged",
    "physicsResetChanged",
    "physicsEngineChanged",
    "physicsStepChanged",
    "physicsColliderDebugChanged",
    "physicsJointDebugChanged",

    "captureCanvas",
    "cameraExport"
];

export const uiEvents = Object.fromEntries(eventNames.map((name) => [name, createEvent()]));
