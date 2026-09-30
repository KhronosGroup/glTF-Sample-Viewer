import { Subject } from "rxjs";

/**
 * Every UI input the viewer reacts to, as a plain module-level event bus.
 *
 * These used to live in the Vue root component's `data()`, which meant the
 * logic layer could only reach them through a component instance. Keeping them
 * here lets any UI implementation publish to the same streams.
 */
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

export const uiEvents = Object.fromEntries(eventNames.map((name) => [name, new Subject()]));
