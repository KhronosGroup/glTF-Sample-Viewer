import { useEffect, useRef, useState } from "react";
import {
    Atom,
    Box,
    Braces,
    CirclePlay,
    FolderOpen,
    Image,
    PanelRightOpen,
    ShieldCheck,
    SlidersHorizontal
} from "lucide-react";
import { notify } from "../logic/notifications.js";
import { uiEvents } from "../logic/ui_events.js";
import { useViewerStore } from "./store.js";
import { IconButton } from "./controls.jsx";
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

// Definition of mobile, inherited from the stylesheet this UI replaced.
const MOBILE_BREAKPOINT = 768;

const TAB_META = [
    { id: "models", label: "Models", icon: Box },
    { id: "display", label: "Display", icon: Image },
    { id: "validator", label: "Validator", icon: ShieldCheck },
    { id: "animations", label: "Animations", icon: CirclePlay },
    { id: "physics", label: "Physics", icon: Atom, needsPhysics: true },
    { id: "credits", label: "Credits", icon: Braces },
    { id: "advanced", label: "Advanced Controls", icon: SlidersHorizontal }
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
                ? () => <ValidationCounter isMobile={layout.isMobile} />
                : undefined
    }));

    const canToggleUi = !(layout.isMobile && !collapsed) && !layout.noUi;

    return (
        <>
            <Toasts />
            <LoadingOverlay active={isLoading} />

            {!uiVisible && canToggleUi && (
                <div className="fixed top-4 right-4 z-20">
                    <IconButton
                        label="Show the control panel"
                        onClick={() => setUiVisible(true)}
                        className="bg-rail/80 hover:bg-rail p-2 backdrop-blur-sm"
                    >
                        <PanelRightOpen size={22} aria-hidden="true" />
                    </IconButton>
                </div>
            )}

            <div className="h-full" style={uiVisible ? undefined : { display: "none" }}>
                <div
                    className={`pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm transition-opacity duration-200 ${
                        showDropDownOverlay ? "opacity-100" : "opacity-0"
                    }`}
                >
                    <div className="border-accent text-ink flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed px-16 py-12 text-center">
                        <FolderOpen size={72} strokeWidth={1.25} aria-hidden="true" />
                        <p className="text-3xl font-light">Drag and drop files here</p>
                        <p className="text-ink/70 text-lg">Supported files: glTF, glb &amp; hdr</p>
                    </div>
                </div>

                <Tabs
                    tabs={tabs}
                    activeTab={activeTab}
                    onSelect={select}
                    collapsed={collapsed}
                    isMobile={layout.isMobile}
                    canHide={canToggleUi}
                    onHide={() => setUiVisible(false)}
                />
            </div>
        </>
    );
}
