import { useEffect, useRef, useState } from "react";
import { notify } from "../logic/notifications.js";
import { uiEvents } from "../logic/ui_events.js";
import { useViewerStore } from "./store.js";
import { Tabs, useTabState } from "./Tabs.jsx";
import { LoadingOverlay, Toasts } from "./Notices.jsx";
import { ModelsTab } from "./tabs/ModelsTab.jsx";
import { DisplayTab } from "./tabs/DisplayTab.jsx";
import { ValidationCounter, ValidatorTab } from "./tabs/ValidatorTab.jsx";
import { CreditsTab } from "./tabs/CreditsTab.jsx";
import { AnimationsTab } from "./tabs/AnimationsTab.jsx";
import { GraphsTab } from "./tabs/GraphsTab.jsx";
import { PhysicsTab } from "./tabs/PhysicsTab.jsx";
import { AdvancedTab } from "./tabs/AdvancedTab.jsx";

// Definition of mobile: https://bulma.io/documentation/start/responsiveness/
const MOBILE_BREAKPOINT = 768;

const TAB_META = [
    { id: "models", label: "Models", icon: "Model" },
    { id: "display", label: "Display", icon: "Display" },
    { id: "validator", label: "Validator", icon: "Capture" },
    { id: "animations", label: "Animations", icon: "Animation" },
    { id: "physics", label: "Physics", icon: "Physics", needsPhysics: true },
    { id: "credits", label: "Credits", icon: "XMP" },
    { id: "advanced", label: "Advanced Controls", icon: "Developer" }
];

const INITIAL_LIGHTING = {
    ibl: true,
    punctualLights: true,
    renderEnv: true,
    blurEnv: true,
    iblIntensity: 0.0,
    exposure: 0,
    toneMap: "Khronos PBR Neutral",
    rotation: "+Z"
};

// Owned by the Advanced panel; the Graphs tab depends on `interactivity`.
const INITIAL_EXTENSIONS = {
    inputSmoothing: true,
    skinning: true,
    morphing: true,
    interactivity: true,
    hoverability: true,
    selectability: true,
    nodeVisibility: true,
    floatingPointFramebuffer: true,
    clearcoat: true,
    sheen: true,
    transmission: true,
    diffuseTransmission: true,
    volume: true,
    volumeScattering: true,
    ior: true,
    specular: true,
    emissiveStrength: true,
    iridescence: true,
    retroreflection: true,
    anisotropy: true,
    dispersion: true,
    gaussianSplatting: true
};

const INITIAL_PHYSICS_DEBUG = {
    engine: "nvidia-physx",
    colliders: false,
    joints: false
};

function readInitialLayout() {
    const isMobile = document.documentElement.clientWidth <= MOBILE_BREAKPOINT;
    const noUi = new URLSearchParams(window.location.search).get("noUI") !== null;
    return { isMobile, noUi, uiVisible: !isMobile && !noUi };
}

export function App() {
    const [layout] = useState(readInitialLayout);
    const [uiVisible, setUiVisible] = useState(layout.uiVisible);
    const [selectedVariant, setSelectedVariant] = useState("None");
    const [lighting, setLighting] = useState(INITIAL_LIGHTING);
    const [extensions, setExtensions] = useState(INITIAL_EXTENSIONS);
    const [physicsDebug, setPhysicsDebug] = useState(INITIAL_PHYSICS_DEBUG);
    const [debugChannel, setDebugChannel] = useState("None");
    const environmentVisiblePref = useRef(INITIAL_LIGHTING.renderEnv);
    const volumePref = useRef(INITIAL_EXTENSIONS.volume);

    const isLoading = useViewerStore((state) => state.isLoading);
    const showDropDownOverlay = useViewerStore((state) => state.showDropDownOverlay);
    const graphs = useViewerStore((state) => state.graphs);
    const hasPhysics = useViewerStore((state) => state.hasPhysics);

    // The Animations tab becomes the Graphs tab when the asset carries
    // KHR_interactivity and the extension is enabled.
    const showGraphs = graphs.length > 0 && extensions.interactivity;

    const tabMeta = TAB_META.filter((tab) => !tab.needsPhysics || hasPhysics).map((tab) =>
        tab.id === "animations" && showGraphs ? { ...tab, label: "Graphs" } : tab
    );
    const tabIds = tabMeta.map((tab) => tab.id);
    const { activeTab, collapsed, select, collapse } = useTabState(tabIds);

    useEffect(() => {
        const canvas = document.getElementById("canvas");
        const context = canvas.getContext("webgl2", { alpha: false, antialias: true });
        if (context === undefined || context === null) {
            notify(
                "The sample viewer requires WebGL 2.0, which is not supported by this browser or device. " +
                    "Please try again with another browser, or check https://get.webgl.org/webgl2/ " +
                    "if you believe you are seeing this message in error.",
                "error"
            );
        }
    }, []);

    // Turning IBL off hides the background and remembers the previous choice, so
    // turning it back on restores it rather than forcing it visible.
    const updateLighting = (partial) => {
        let next = partial;
        if (partial.ibl === false) {
            environmentVisiblePref.current = lighting.renderEnv;
            next = { ...partial, renderEnv: false };
            uiEvents.renderEnvChanged.emit(false);
        } else if (partial.ibl === true) {
            next = { ...partial, renderEnv: environmentVisiblePref.current };
            uiEvents.renderEnvChanged.emit(environmentVisiblePref.current);
        }
        setLighting((current) => ({ ...current, ...next }));
    };

    // Volume is meaningless without either transmission, so it follows them and
    // remembers the user's choice. Like the Vue original this only moves the
    // switch; the renderer is not notified until volume is toggled directly.
    const updateExtensions = (partial) => {
        let next = partial;
        const otherTransmission = (key) =>
            key === "transmission" ? extensions.diffuseTransmission : extensions.transmission;

        for (const key of ["transmission", "diffuseTransmission"]) {
            if (partial[key] === undefined || otherTransmission(key)) {
                continue;
            }
            if (partial[key] === false) {
                volumePref.current = extensions.volume;
                next = { ...next, volume: false };
            } else {
                next = { ...next, volume: volumePref.current };
            }
        }

        setExtensions((current) => ({ ...current, ...next }));
    };

    const renderTab = (id) => {
        switch (id) {
            case "models":
                return (
                    <ModelsTab
                        onCollapse={collapse}
                        selectedVariant={selectedVariant}
                        onSelectVariant={setSelectedVariant}
                    />
                );
            case "display":
                return (
                    <DisplayTab
                        onCollapse={collapse}
                        lighting={lighting}
                        onLightingChange={updateLighting}
                    />
                );
            case "validator":
                return <ValidatorTab onCollapse={collapse} />;
            case "animations":
                return showGraphs ? (
                    <GraphsTab onCollapse={collapse} />
                ) : (
                    <AnimationsTab onCollapse={collapse} />
                );
            case "credits":
                return <CreditsTab onCollapse={collapse} />;
            case "physics":
                return (
                    <PhysicsTab
                        onCollapse={collapse}
                        debug={physicsDebug}
                        onDebugChange={(partial) =>
                            setPhysicsDebug((current) => ({ ...current, ...partial }))
                        }
                    />
                );
            case "advanced":
                return (
                    <AdvancedTab
                        onCollapse={collapse}
                        extensions={extensions}
                        onExtensionsChange={updateExtensions}
                        debugChannel={debugChannel}
                        onDebugChannelChange={setDebugChannel}
                    />
                );
            default:
                return null;
        }
    };

    const tabs = tabMeta.map((tab) => ({
        ...tab,
        render: () => renderTab(tab.id),
        renderHeader:
            tab.id === "validator"
                ? (expanded) => <ValidationCounter expanded={expanded} isMobile={layout.isMobile} />
                : undefined
    }));

    return (
        <>
            <Toasts />
            <LoadingOverlay active={isLoading} />

            <div className="fixed bottom-[25px] left-[25px] z-20">
                {!(layout.isMobile && !collapsed) && !layout.noUi && (
                    <img
                        src={
                            uiVisible ? "assets/ui/Icon_Expand.svg" : "assets/ui/Icon_Collapse.svg"
                        }
                        onClick={() => setUiVisible((visible) => !visible)}
                        className="w-[30px] cursor-pointer transition-transform hover:scale-125"
                        alt={uiVisible ? "Hide panel" : "Show panel"}
                    />
                )}
            </div>

            <div className="h-full" style={uiVisible ? undefined : { display: "none" }}>
                {showDropDownOverlay && (
                    <div
                        id="dropZone"
                        className="pointer-events-none fixed inset-0 z-[999] flex items-center justify-center"
                    >
                        <div className="rounded-[30px] bg-white/60 p-12 text-center text-black">
                            <svg
                                width="96"
                                height="96"
                                viewBox="0 0 24 24"
                                className="mx-auto"
                                fill="currentColor"
                                aria-hidden="true"
                            >
                                <path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2z" />
                            </svg>
                            <p className="text-4xl font-light">Drag and drop files here</p>
                            <p className="text-xl">Supported files: glTF, glb &amp; hdr</p>
                        </div>
                    </div>
                )}

                <Tabs
                    tabs={tabs}
                    activeTab={activeTab}
                    onSelect={select}
                    collapsed={collapsed}
                    isMobile={layout.isMobile}
                />
            </div>
        </>
    );
}
