import { useState } from "react";

/**
 * Vertical tab bar, reproducing the DOM Buefy's b-tabs emitted so the existing
 * stylesheet keeps applying.
 *
 * Clicking the active tab collapses the panel; clicking another expands it.
 * Buefy could not express that, so the Vue version reached into the generated
 * markup to add and remove `is-active` by hand. Here it is just state.
 */
export function Tabs({ tabs, activeTab, onSelect, collapsed, isMobile }) {
    return (
        <div
            id="tabsContainer"
            className={`b-tabs is-vertical is-right is-flex-wrap-nowrap ${
                collapsed ? "hideTabs " : ""
            }tabsContainer`}
        >
            <nav className="tabs is-toggle" style={isMobile ? undefined : { width: "100px" }}>
                <ul aria-orientation="vertical" role="tablist">
                    {tabs.map((tab) => {
                        const expanded = !collapsed && tab.id === activeTab;
                        return (
                            <li
                                key={tab.id}
                                className={expanded ? "is-active" : ""}
                                role="tab"
                                aria-selected={expanded}
                                style={
                                    isMobile && tab.id === tabs[0].id ? { marginTop: 0 } : undefined
                                }
                            >
                                <a tabIndex={tab.id === activeTab ? 0 : -1}>
                                    <div
                                        data-testid={`tab-${tab.id}`}
                                        onClick={() => onSelect(tab.id)}
                                        style={expanded ? { height: "100%" } : undefined}
                                    >
                                        {tab.renderHeader ? (
                                            tab.renderHeader(expanded)
                                        ) : (
                                            <img
                                                src={`assets/ui/${tab.icon} ${
                                                    expanded ? "50X50" : "30X30"
                                                }.svg`}
                                                width={expanded ? "50px" : "30px"}
                                                style={expanded ? { height: "100%" } : undefined}
                                            />
                                        )}
                                        {!isMobile && !expanded && <span>{tab.label}</span>}
                                    </div>
                                </a>
                            </li>
                        );
                    })}
                    <a href="https://github.com/KhronosGroup/glTF-Sample-Viewer">
                        <img
                            src="assets/ui/GitHub-Mark-Light-32px.png"
                            style={{ width: "22px", height: "22px" }}
                        />
                    </a>
                </ul>
            </nav>
            <section className="tab-content">
                {tabs.map((tab) =>
                    tab.id === activeTab ? (
                        <div
                            key={tab.id}
                            className="tab-item tabItemScrollable"
                            role="tabpanel"
                            tabIndex={0}
                        >
                            {tab.render()}
                        </div>
                    ) : null
                )}
            </section>
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
