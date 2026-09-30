import { useState } from "react";

/**
 * Vertical tab rail down the right-hand edge, with the panel to its left.
 *
 * Clicking the active tab collapses the panel; clicking another expands it.
 */
export function Tabs({ tabs, activeTab, onSelect, collapsed, isMobile }) {
    return (
        <div id="tabsContainer" className="flex h-dvh justify-end">
            <section
                className={
                    collapsed ? "hidden" : "w-[300px] shrink-0 overflow-x-hidden overflow-y-auto"
                }
            >
                {tabs.map((tab) =>
                    tab.id === activeTab ? <div key={tab.id}>{tab.render()}</div> : null
                )}
            </section>

            <nav
                className="bg-rail flex shrink-0 flex-col overflow-x-hidden overflow-y-auto"
                style={isMobile ? undefined : { width: "100px" }}
                aria-orientation="vertical"
                role="tablist"
            >
                {tabs.map((tab, index) => {
                    const expanded = !collapsed && tab.id === activeTab;
                    const Icon = tab.icon;
                    return (
                        <button
                            type="button"
                            key={tab.id}
                            role="tab"
                            aria-selected={expanded}
                            aria-label={tab.label}
                            data-testid={`tab-${tab.id}`}
                            onClick={() => onSelect(tab.id)}
                            style={index === 0 && !isMobile ? { marginTop: "11dvh" } : undefined}
                            className={`focus-visible:outline-accent flex h-[100px] shrink-0 flex-col items-center justify-center gap-1.5 border-r-[7.5px] px-1 text-center transition-colors focus-visible:-outline-offset-2 focus-visible:outline ${
                                expanded
                                    ? "border-accent bg-rail-active"
                                    : "hover:bg-rail-hover border-transparent"
                            }`}
                        >
                            {tab.renderHeader ? (
                                tab.renderHeader(expanded)
                            ) : (
                                <Icon
                                    size={expanded ? 34 : 26}
                                    strokeWidth={1.75}
                                    aria-hidden="true"
                                />
                            )}
                            {!isMobile && !expanded && (
                                <span className="text-base leading-tight">{tab.label}</span>
                            )}
                        </button>
                    );
                })}

                <a
                    href="https://github.com/KhronosGroup/glTF-Sample-Viewer"
                    className="mt-auto mb-4 flex shrink-0 justify-center pt-4 opacity-70 transition-opacity hover:opacity-100"
                    aria-label="View this project on GitHub"
                >
                    <img
                        src="assets/ui/GitHub-Mark-Light-32px.png"
                        className="h-[22px] w-[22px]"
                        alt=""
                    />
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

    return { activeTab, collapsed, select, collapse: () => setCollapsed(true) };
}
