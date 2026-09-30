import { PanelRightClose } from "lucide-react";
import { useState } from "react";
import { IconButton } from "./controls.jsx";

/**
 * Vertical tab rail down the right-hand edge, with the panel to its left.
 *
 * Clicking the active tab collapses the panel; clicking another expands it.
 */
export function Tabs({ tabs, activeTab, onSelect, collapsed, isMobile, onHide, canHide }) {
    return (
        <div id="tabsContainer" className="flex h-dvh justify-end">
            {/* Width changes are deliberately instant: animating them would resize
                the canvas on every frame of the transition. The panel and rail
                widths add up to a constant, so the canvas keeps its size. */}
            <section
                className={collapsed ? "hidden" : "w-72 shrink-0 overflow-x-hidden overflow-y-auto"}
            >
                {tabs.map((tab) =>
                    tab.id === activeTab ? <div key={tab.id}>{tab.render()}</div> : null
                )}
            </section>

            <nav
                className="bg-rail flex w-28 shrink-0 flex-col overflow-x-hidden overflow-y-auto"
                aria-orientation="vertical"
                role="tablist"
            >
                {canHide && (
                    <IconButton
                        label="Hide the control panel"
                        onClick={onHide}
                        className="hover:bg-rail-hover mt-2 self-center"
                    >
                        <PanelRightClose size={22} aria-hidden="true" />
                    </IconButton>
                )}

                {/* The rail itself stays flush with the screen edge; only its
                    contents slide when the panel opens. */}
                <div
                    className={`transition-transform duration-200 ease-out ${
                        isMobile ? "" : "pt-[8dvh]"
                    } ${collapsed ? "translate-x-0" : "-translate-x-1"}`}
                >
                    {tabs.map((tab) => {
                        const expanded = !collapsed && tab.id === activeTab;
                        const Icon = tab.icon;
                        return (
                            <button
                                type="button"
                                key={tab.id}
                                role="tab"
                                aria-selected={expanded}
                                data-testid={`tab-${tab.id}`}
                                onClick={() => onSelect(tab.id)}
                                className={`focus-visible:outline-accent flex w-full flex-col items-center justify-center gap-2 border-r-8 px-3 py-5 text-center transition-colors focus-visible:-outline-offset-2 focus-visible:outline ${
                                    expanded
                                        ? "border-accent bg-rail-active"
                                        : "hover:bg-rail-hover border-transparent"
                                }`}
                            >
                                {tab.renderHeader ? (
                                    tab.renderHeader(expanded)
                                ) : (
                                    <Icon size={26} strokeWidth={1.75} aria-hidden="true" />
                                )}
                                {!isMobile && (
                                    <span className="text-sm leading-tight">{tab.label}</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <a
                    href="https://github.com/KhronosGroup/glTF-Sample-Viewer"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto mb-4 flex shrink-0 justify-center pt-4 opacity-70 transition-opacity hover:opacity-100"
                    aria-label="View this project on GitHub"
                >
                    <img src="assets/ui/GitHub-Mark-Light-32px.png" className="size-6" alt="" />
                </a>
            </nav>
        </div>
    );
}

export function useTabState(tabIds) {
    const [selectedTab, setSelectedTab] = useState(tabIds[0]);
    const [collapsed, setCollapsed] = useState(true);
    // Physics and graphs tabs come and go with the asset, so the selection is
    // resolved during render rather than corrected afterwards in an effect.
    const activeTab = tabIds.includes(selectedTab) ? selectedTab : tabIds[0];

    const select = (id) => {
        setCollapsed(id === activeTab ? (wasCollapsed) => !wasCollapsed : false);
        setSelectedTab(id);
    };

    return { activeTab, collapsed, select };
}
