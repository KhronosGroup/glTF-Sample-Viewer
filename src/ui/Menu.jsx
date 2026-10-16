import { useLayoutEffect, useRef, useState } from "react";
import { Atom, Box, Braces, CirclePlay, Image, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { uiEvents } from "../logic/ui_events.js";
import { useViewerStore } from "./store.js";
import { Tabs, useTabState } from "./Tabs.jsx";
import { ModelsTab } from "./tabs/ModelsTab.jsx";
import { DisplayTab } from "./tabs/DisplayTab.jsx";
import { ValidationCounter, ValidatorTab } from "./tabs/ValidatorTab.jsx";
import { CreditsTab } from "./tabs/CreditsTab.jsx";
import { AnimationsTab } from "./tabs/AnimationsTab.jsx";
import { GraphsTab } from "./tabs/GraphsTab.jsx";
import { PhysicsTab } from "./tabs/PhysicsTab.jsx";
import { AdvancedTab } from "./tabs/AdvancedTab.jsx";

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

/**
 * The open panel, sliding in from the right when a tab is selected.
 *
 * Driven by the animation API rather than a class so the element's own styles
 * stay the end state: if the animation never runs, the panel is simply there.
 * It animates the scroll container itself because an extra wrapper would break
 * the `min-h-full` chain the panels size themselves with.
 */
function OpenPanel({ children }) {
    const ref = useRef(null);

    useLayoutEffect(() => {
        const animation = ref.current.animate(
            [
                { opacity: 0, transform: "translateX(8px)" },
                { opacity: 1, transform: "none" }
            ],
            { duration: 180, easing: "ease-out" }
        );
        return () => animation.cancel();
    }, []);

    return (
        <section ref={ref} className="grow overflow-x-hidden overflow-y-auto">
            {children}
        </section>
    );
}

/**
 * The control surface: the tab rail plus the panel of whichever tab is open.
 *
 * Takes the full screen on mobile and a fixed-width column beside the viewer
 * from `md` up. Collapsing the open tab leaves only the rail.
 */
export function Menu() {
    const [selectedVariant, setSelectedVariant] = useState("None");
    const [lighting, setLighting] = useState(INITIAL_LIGHTING);
    const [extensions, setExtensions] = useState(INITIAL_EXTENSIONS);
    const [physicsDebug, setPhysicsDebug] = useState(INITIAL_PHYSICS_DEBUG);
    const [debugChannel, setDebugChannel] = useState("None");
    const environmentVisiblePref = useRef(INITIAL_LIGHTING.renderEnv);
    const volumePref = useRef(INITIAL_EXTENSIONS.volume);

    const graphs = useViewerStore((state) => state.graphs);
    const hasPhysics = useViewerStore((state) => state.hasPhysics);

    // The Animations tab becomes the Graphs tab when the asset carries
    // KHR_interactivity and the extension is enabled.
    const showGraphs = graphs.length > 0 && extensions.interactivity;

    const tabMeta = TAB_META.filter((tab) => !tab.needsPhysics || hasPhysics).map((tab) =>
        tab.id === "animations" && showGraphs ? { ...tab, label: "Graphs" } : tab
    );
    const { activeTab, select } = useTabState(tabMeta.map((tab) => tab.id));

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
    // remembers the user's choice. This only moves the switch; the renderer is
    // not notified until volume is toggled directly.
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
                        selectedVariant={selectedVariant}
                        onSelectVariant={setSelectedVariant}
                    />
                );
            case "display":
                return <DisplayTab lighting={lighting} onLightingChange={updateLighting} />;
            case "validator":
                return <ValidatorTab />;
            case "animations":
                return showGraphs ? <GraphsTab /> : <AnimationsTab />;
            case "credits":
                return <CreditsTab />;
            case "physics":
                return (
                    <PhysicsTab
                        debug={physicsDebug}
                        onDebugChange={(partial) =>
                            setPhysicsDebug((current) => ({ ...current, ...partial }))
                        }
                    />
                );
            case "advanced":
                return (
                    <AdvancedTab
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
        renderHeader: tab.id === "validator" ? () => <ValidationCounter /> : undefined
    }));

    const collapsed = activeTab === null;

    return (
        <div
            data-testid="menu"
            className={
                collapsed
                    ? "flex shrink-0"
                    : "fixed inset-0 bg-surface z-20 flex sm:static sm:w-96 sm:shrink-0"
            }
        >
            {!collapsed && <OpenPanel key={activeTab}>{renderTab(activeTab)}</OpenPanel>}

            <Tabs tabs={tabs} activeTab={activeTab} onSelect={select} />
        </div>
    );
}
