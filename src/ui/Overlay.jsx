import { useState } from "react";
import { FolderOpen } from "lucide-react";

function DropPrompt() {
    return (
        <div className="border-accent text-ink flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed px-16 py-12 text-center">
            <FolderOpen size={72} strokeWidth={1.25} aria-hidden="true" />
            <p className="text-3xl font-light">Drag and drop files here</p>
            <p className="text-ink/70 text-lg">Supported files: glTF, glb &amp; hdr</p>
        </div>
    );
}

function Spinner() {
    return (
        <div
            data-testid="spinner"
            className="border-ink/35 border-t-accent size-16 animate-spin rounded-full border-[5px]"
        />
    );
}

/**
 * The single dimmed backdrop the viewer puts over the canvas. Dropping a file
 * swaps the prompt for the spinner without the backdrop fading in between.
 */
export function Overlay({ dropping, loading }) {
    const active = dropping || loading;
    const wanted = dropping ? "drop" : loading ? "loading" : null;

    // The last thing shown is kept while fading out, so the overlay does not
    // change its contents on the way off screen.
    const [shown, setShown] = useState(wanted);

    if (wanted !== null && wanted !== shown) {
        setShown(wanted);
    }

    if (shown === null) {
        return null;
    }

    // Unmounts only once the fade has run, so "spinner gone" still means the
    // element is detached rather than merely transparent. Pointer events never
    // reach it: the canvas below owns both the drop zone and the camera.
    return (
        <div
            className={`pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
                active ? "opacity-100" : "opacity-0"
            }`}
            onTransitionEnd={() => {
                if (!active) {
                    setShown(null);
                }
            }}
        >
            {shown === "drop" ? <DropPrompt /> : <Spinner />}
        </div>
    );
}
