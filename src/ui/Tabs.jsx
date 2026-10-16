import { useState } from "react";

/**
 * Vertical tab rail down the right-hand edge of the menu.
 *
 * Clicking the active tab collapses the panel; clicking another expands it.
 */
export function Tabs({ tabs, activeTab, onSelect }) {
    return (
        <nav
            className="bg-rail flex w-28 shrink-0 flex-col overflow-x-hidden overflow-y-auto"
            aria-orientation="vertical"
            role="tablist"
        >
            {/* Leaves room for the menu toggle in the top-right corner. */}
            <div className="pt-[8dvh]">
                {tabs.map((tab) => {
                    const expanded = tab.id === activeTab;
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
                            <span className="text-sm leading-tight">{tab.label}</span>
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
                <img
                    src="assets/ui/GitHub_Invertocat_White_Clearspace.svg"
                    className="size-10"
                    alt=""
                />
            </a>
        </nav>
    );
}

export function useTabState(tabIds) {
    // null collapses the panel and leaves only the rail.
    const [selectedTab, setSelectedTab] = useState(tabIds[0]);

    // Physics and graphs tabs come and go with the asset, so a selection that
    // disappeared is resolved during render rather than in an effect.
    const activeTab =
        selectedTab !== null && !tabIds.includes(selectedTab) ? tabIds[0] : selectedTab;

    const select = (id) => setSelectedTab(id === activeTab ? null : id);

    return { activeTab, select };
}
