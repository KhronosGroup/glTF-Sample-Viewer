import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, FolderOpen } from "lucide-react";
import { notify } from "../logic/notifications.js";
import { useViewerStore } from "./store.js";
import { IconButton } from "./controls.jsx";
import { LoadingOverlay, Toasts } from "./Notices.jsx";
import { Menu } from "./Menu.jsx";
import { Viewer } from "./Viewer.jsx";

// Matches the `md` breakpoint the layout uses. This only decides whether the
// menu starts open; how it looks is left to Tailwind.
const DESKTOP_QUERY = "(min-width: 48rem)";

function readInitialLayout() {
    const noUi = new URLSearchParams(window.location.search).get("noUI") !== null;
    // The menu covers the whole screen on a phone, so it starts out of the way.
    return { noUi, menuVisible: !noUi && window.matchMedia(DESKTOP_QUERY).matches };
}

export function App() {
    const [layout] = useState(readInitialLayout);
    const [menuVisible, setMenuVisible] = useState(layout.menuVisible);

    const isLoading = useViewerStore((state) => state.isLoading);
    const showDropDownOverlay = useViewerStore((state) => state.showDropDownOverlay);

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
            <LoadingOverlay active={isLoading} />

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

            <div className="flex h-dvh w-full">
                <Viewer />
                {menuVisible && !layout.noUi && <Menu />}
            </div>
        </>
    );
}
