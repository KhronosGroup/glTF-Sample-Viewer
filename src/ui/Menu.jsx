import { useLayoutEffect, useRef } from "react";
import {
    Atom,
    Box,
    Braces,
    Camera,
    CirclePlay,
    Image,
    ShieldCheck,
    SlidersHorizontal
} from "lucide-react";
import { updateConfig, updateSelection, useViewerStore } from "./store.js";
import { deriveExtensions, deriveLighting } from "../logic/config_derivations.js";
import { Tabs, useTabState } from "./Tabs.jsx";
import { ModelsTab } from "./tabs/ModelsTab.jsx";
import { CameraTab } from "./tabs/CameraTab.jsx";
import { DisplayTab } from "./tabs/DisplayTab.jsx";
import { ValidationCounter, ValidatorTab } from "./tabs/ValidatorTab.jsx";
import { CreditsTab } from "./tabs/CreditsTab.jsx";
import { AnimationsTab } from "./tabs/AnimationsTab.jsx";
import { GraphsTab } from "./tabs/GraphsTab.jsx";
import { PhysicsTab } from "./tabs/PhysicsTab.jsx";
import { AdvancedTab } from "./tabs/AdvancedTab.jsx";

const TAB_META = [
    { id: "models", label: "Models", icon: Box },
    { id: "camera", label: "Camera", icon: Camera },
    { id: "display", label: "Display", icon: Image },
    { id: "validator", label: "Validator", icon: ShieldCheck },
    { id: "animations", label: "Animations", icon: CirclePlay },
    { id: "physics", label: "Physics", icon: Atom, needsPhysics: true },
    { id: "credits", label: "Credits", icon: Braces },
    { id: "advanced", label: "Advanced Controls", icon: SlidersHorizontal }
];

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
 * from `sm` up. Collapsing the open tab leaves only the rail.
 *
 * Hiding it keeps it mounted: the switches here mirror state the renderer
 * already holds, and unmounting would reset them while the render stayed as it
 * was.
 */
export function Menu({ visible }) {
    const environmentVisiblePref = useRef(true);
    const volumePref = useRef(true);

    const selectedVariant = useViewerStore((state) => state.selection.selectedVariant);
    const lighting = useViewerStore((state) => state.config.lighting);
    const extensions = useViewerStore((state) => state.config.extensions);
    const physicsDebug = useViewerStore((state) => state.config.physicsDebug);
    const clipping = useViewerStore((state) => state.config.clipping);
    const debugChannel = useViewerStore((state) => state.config.debugChannel);
    const debugShapes = useViewerStore((state) => state.config.debugShapes);
    const cullByBoundingVolume = useViewerStore((state) => state.config.cullByBoundingVolume);

    const graphs = useViewerStore((state) => state.published.graphs);
    const hasPhysics = useViewerStore((state) => state.published.hasPhysics);
    const hasAnimations = useViewerStore((state) => state.published.hasAnimations);

    // The Animations tab becomes the Graphs tab when the asset carries
    // KHR_interactivity and the extension is enabled.
    const showGraphs = graphs.length > 0 && extensions.interactivity;

    const tabMeta = TAB_META.filter((tab) => {
        if (tab.id === "animations") {
            return showGraphs || hasAnimations;
        }
        return !tab.needsPhysics || hasPhysics;
    }).map((tab) => (tab.id === "animations" && showGraphs ? { ...tab, label: "Graphs" } : tab));
    const { activeTab, select } = useTabState(tabMeta.map((tab) => tab.id));

    // Turning IBL off hides the background and remembers the previous choice, so
    // turning it back on restores it rather than forcing it visible.
    const updateLighting = (partial) => {
        const { next, preference } = deriveLighting(
            lighting,
            partial,
            environmentVisiblePref.current
        );
        environmentVisiblePref.current = preference;
        updateConfig({ lighting: { ...lighting, ...next } });
    };

    // Volume is meaningless without either transmission, so it follows them and
    // remembers the user's choice. This only moves the switch; the renderer is
    // not notified until volume is toggled directly.
    const updateExtensions = (partial) => {
        const { next, preference } = deriveExtensions(extensions, partial, volumePref.current);
        volumePref.current = preference;
        updateConfig({ extensions: { ...extensions, ...next } });
    };

    // The Display tab's "Collider Shapes" and the Physics tab's "Show Colliders"
    // are the same control: both move `debugShapes.allShapes` and the physics
    // collider debug visualisation together.
    const updateColliderShapes = (checked) => {
        updateConfig({
            debugShapes: { ...debugShapes, allShapes: checked },
            physicsDebug: { ...physicsDebug, colliders: checked }
        });
    };

    const renderTab = (id) => {
        switch (id) {
            case "models":
                return (
                    <ModelsTab
                        selectedVariant={selectedVariant}
                        onSelectVariant={(value) => updateSelection({ selectedVariant: value })}
                    />
                );
            case "camera":
                return <CameraTab />;
            case "display":
                return (
                    <DisplayTab
                        lighting={lighting}
                        onLightingChange={updateLighting}
                        debugShapes={debugShapes}
                        cullByBoundingVolume={cullByBoundingVolume}
                        onCullByBoundingVolumeChange={(value) =>
                            updateConfig({ cullByBoundingVolume: value })
                        }
                        onColliderShapesChange={updateColliderShapes}
                    />
                );
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
                            updateConfig({ physicsDebug: { ...physicsDebug, ...partial } })
                        }
                        colliderShapes={debugShapes.allShapes}
                        onColliderShapesChange={updateColliderShapes}
                    />
                );
            case "advanced":
                return (
                    <AdvancedTab
                        extensions={extensions}
                        onExtensionsChange={updateExtensions}
                        debugChannel={debugChannel}
                        onDebugChannelChange={(value) => updateConfig({ debugChannel: value })}
                        clipping={clipping}
                        onClippingChange={(partial) =>
                            updateConfig({ clipping: { ...clipping, ...partial } })
                        }
                        debugShapes={debugShapes}
                        onDebugShapesChange={(partial) =>
                            updateConfig({ debugShapes: { ...debugShapes, ...partial } })
                        }
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

    const shape = () => {
        if (!visible) {
            return "hidden";
        }
        return collapsed
            ? "flex shrink-0"
            : "fixed inset-0 bg-surface z-20 flex sm:static sm:w-96 sm:shrink-0";
    };

    return (
        <div data-testid="menu" className={shape()}>
            {!collapsed && <OpenPanel key={activeTab}>{renderTab(activeTab)}</OpenPanel>}

            <Tabs tabs={tabs} activeTab={activeTab} onSelect={select} />
        </div>
    );
}
