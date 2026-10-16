import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { notify } from "../logic/notifications.js";
import { useViewerStore, subscribeToViewerState } from "./store.js";
import { IconButton } from "./controls.jsx";
import { Toasts } from "./Toasts.jsx";
import { Overlay } from "./Overlay.jsx";
import { Menu } from "./Menu.jsx";
import { Viewer } from "./Viewer.jsx";

// The width at which Menu stops covering the viewer and becomes a column
// beside it, so "not this" is what the menu-hiding behaviour means by mobile.
const DESKTOP_QUERY = "(min-width: 40rem)";

function isMobile() {
    return !window.matchMedia(DESKTOP_QUERY).matches;
}

function readInitialLayout() {
    const noUi = new URLSearchParams(window.location.search).get("noUI") !== null;
    // The menu covers the whole screen on a phone, so it starts out of the way.
    return { noUi, menuVisible: !noUi && !isMobile() };
}

export function App() {
    const [layout] = useState(readInitialLayout);
    const [menuVisible, setMenuVisible] = useState(layout.menuVisible);

    const isLoading = useViewerStore((state) => state.isLoading);
    const showDropDownOverlay = useViewerStore((state) => state.showDropDownOverlay);

    // Picking or dropping an asset is a request to see it, and on mobile the
    // menu is covering it. Both paths land on `selectedModel`.
    useEffect(
        () =>
            subscribeToViewerState((state, previous) => {
                if (state.selectedModel !== previous.selectedModel && isMobile()) {
                    setMenuVisible(false);
                }
            }),
        []
    );

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

    return (
        <>
            <Toasts />
            <Overlay dropping={showDropDownOverlay} loading={isLoading} />

            {!layout.noUi && (
                <IconButton
                    label={menuVisible ? "Hide the controls" : "Show the controls"}
                    onClick={() => setMenuVisible((visible) => !visible)}
                    className="bg-rail/80 hover:bg-rail fixed top-4 right-4 z-40 p-2 backdrop-blur-sm"
                >
                    {menuVisible ? (
                        <ChevronRight size={22} aria-hidden="true" />
                    ) : (
                        <ChevronLeft size={22} aria-hidden="true" />
                    )}
                </IconButton>
            )}

            <div className="flex h-dvh w-full">
                <Viewer />
                {menuVisible && !layout.noUi && <Menu />}
            </div>
        </>
    );
}
