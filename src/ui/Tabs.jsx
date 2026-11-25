import { useRef, useState } from "react";

/**
 * Vertical tab rail down the right-hand edge of the menu.
 *
 * Clicking the active tab collapses the panel; clicking another expands it.
 */
export function Tabs({ tabs, activeTab, onSelect }) {
    const tablistRef = useRef(null);

    // Moves keyboard focus to a tab, following an arrow-key selection.
    const focusTab = (id) => {
        tablistRef.current?.querySelector(`[data-testid="tab-${CSS.escape(id)}"]`)?.focus();
    };

    // The ARIA tabs pattern: arrow keys move between tabs (the rail is vertical,
    // so up/down lead), Home/End jump to the ends. Selecting on focus keeps the
    // keyboard behaviour identical to clicking.
    const onKeyDown = (event, tab) => {
        const index = tabs.findIndex((candidate) => candidate.id === tab.id);
        let next;
        switch (event.key) {
            case "ArrowDown":
            case "ArrowRight":
                next = tabs[(index + 1) % tabs.length];
                break;
            case "ArrowUp":
            case "ArrowLeft":
                next = tabs[(index - 1 + tabs.length) % tabs.length];
                break;
            case "Home":
                next = tabs[0];
                break;
            case "End":
                next = tabs[tabs.length - 1];
                break;
            default:
                return;
        }
        event.preventDefault();
        // The camera's keyboard tracker listens on `window`, so swallow the key
        // here to keep tab navigation from also steering the camera.
        event.stopPropagation();
        onSelect(next.id);
        focusTab(next.id);
    };

    return (
        <nav
            ref={tablistRef}
            className="bg-rail flex w-28 shrink-0 flex-col overflow-x-hidden overflow-y-auto"
            aria-orientation="vertical"
            role="tablist"
        >
            {/* Leaves room for the menu toggle in the top-right corner. */}
            <div className="pt-[8dvh]">
                {tabs.map((tab, index) => {
                    const expanded = tab.id === activeTab;
                    const Icon = tab.icon;
                    // Exactly one tab sits in the Tab order. With the panel
                    // collapsed no tab is selected, so the first stays reachable.
                    const tabbable = expanded || (activeTab === null && index === 0);
                    return (
                        <button
                            type="button"
                            key={tab.id}
                            role="tab"
                            aria-selected={expanded}
                            tabIndex={tabbable ? 0 : -1}
                            data-testid={`tab-${tab.id}`}
                            onClick={() => onSelect(tab.id)}
                            onKeyDown={(event) => onKeyDown(event, tab)}
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
