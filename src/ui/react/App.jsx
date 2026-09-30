import { useEffect, useState } from "react";
import { notify } from "../../logic/notifications.js";
import { useViewerStore } from "./store.js";
import { Tabs, useTabState } from "./Tabs.jsx";
import { LoadingOverlay, Toasts } from "./Notices.jsx";
import { ModelsTab } from "./tabs/ModelsTab.jsx";

// Definition of mobile: https://bulma.io/documentation/start/responsiveness/
const MOBILE_BREAKPOINT = 768;

const TAB_META = [{ id: "models", label: "Models", icon: "Model" }];

function readInitialLayout() {
    const isMobile = document.documentElement.clientWidth <= MOBILE_BREAKPOINT;
    const noUi = new URLSearchParams(window.location.search).get("noUI") !== null;
    return { isMobile, noUi, uiVisible: !isMobile && !noUi };
}

export function App() {
    const [layout] = useState(readInitialLayout);
    const [uiVisible, setUiVisible] = useState(layout.uiVisible);
    const [selectedVariant, setSelectedVariant] = useState("None");

    const isLoading = useViewerStore((state) => state.isLoading);
    const showDropDownOverlay = useViewerStore((state) => state.showDropDownOverlay);

    const tabIds = TAB_META.map((tab) => tab.id);
    const { activeTab, collapsed, select, collapse } = useTabState(tabIds);

    useEffect(() => {
        const canvas = document.getElementById("canvas");
        const context = canvas.getContext("webgl2", { alpha: false, antialias: true });
        if (context === undefined || context === null) {
            notify(
                "The sample viewer requires WebGL 2.0, which is not supported by this browser or device. " +
                    "Please try again with another browser, or check https://get.webgl.org/webgl2/ " +
                    "if you believe you are seeing this message in error.",
                "is-danger"
            );
        }
    }, []);

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
            default:
                return null;
        }
    };

    const tabs = TAB_META.map((tab) => ({ ...tab, render: () => renderTab(tab.id) }));

    return (
        <>
            <Toasts />
            <LoadingOverlay active={isLoading} />

            <div className="canvasUIMaximize">
                {!(layout.isMobile && !collapsed) && !layout.noUi && (
                    <img
                        src={
                            uiVisible ? "assets/ui/Icon_Expand.svg" : "assets/ui/Icon_Collapse.svg"
                        }
                        onClick={() => setUiVisible((visible) => !visible)}
                        className="maximizeCanvasIcon"
                        width="30px"
                    />
                )}
            </div>

            <div className="column" style={uiVisible ? undefined : { display: "none" }}>
                <div
                    className={showDropDownOverlay ? "" : "is-hidden"}
                    id="dropZone"
                    style={{ pointerEvents: "none" }}
                >
                    <div className="is-overlay is-dropAreaCard is-flex" style={{ zIndex: 999 }}>
                        <div className="box has-text-centered">
                            <span className="icon is-large">
                                <i className="fas fa-folder-open fa-4x" />
                            </span>
                            <p className="is-size-2 has-text-weight-light">
                                Drag and drop files here
                            </p>
                            <p className="is-size-4">Supported files: glTF, glb &amp; hdr</p>
                        </div>
                    </div>
                </div>

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
