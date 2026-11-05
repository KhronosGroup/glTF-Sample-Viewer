/**
 * Form primitives, styled with Tailwind utilities.
 */

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, RotateCcw, Search } from "lucide-react";

function classNames(...values) {
    return values.filter(Boolean).join(" ");
}

// Matches the breakpoint at which the menu stops covering the viewer, so a
// popup is only given the whole screen while the panel already owns it.
const DESKTOP_QUERY = "(min-width: 40rem)";

function useIsDesktop() {
    const [isDesktop, setIsDesktop] = useState(() => window.matchMedia(DESKTOP_QUERY).matches);
    useEffect(() => {
        const query = window.matchMedia(DESKTOP_QUERY);
        const update = () => setIsDesktop(query.matches);
        query.addEventListener("change", update);
        return () => query.removeEventListener("change", update);
    }, []);
    return isDesktop;
}

/**
 * Places a popup under its anchor, or over it when the space below is too
 * tight. Fixed rather than absolute: the panel it lives in scrolls, and an
 * absolute popup would be clipped by it.
 */
function popupPosition(anchor) {
    if (anchor === null) {
        return undefined;
    }
    const gap = 4;
    const margin = 16;
    const below = window.innerHeight - anchor.bottom - margin;
    const above = anchor.top - margin;
    const position = { left: anchor.left, width: anchor.width };
    if (below >= Math.min(320, above)) {
        return { ...position, top: anchor.bottom + gap, maxHeight: below };
    }
    return { ...position, bottom: window.innerHeight - anchor.top + gap, maxHeight: above };
}

const FOCUS_RING =
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent focus-visible:outline";

export function Field({ label, className, grouped = false, children }) {
    return (
        <div className={classNames("mt-6", className)}>
            {label !== undefined && <label className="mb-2 block font-medium">{label}</label>}
            {grouped ? <div className="flex flex-col gap-1">{children}</div> : children}
        </div>
    );
}

/**
 * A compact horizontal option picker: one pill per option, with the active
 * option filled. Used where a native `select` would take too much room.
 */
export function SegmentedControl({ options, value, onChange, label, className }) {
    return (
        <div
            role="group"
            aria-label={label}
            className={classNames(
                "inline-flex items-center rounded-full border border-accent/60 p-0.5",
                className
            )}
        >
            {options.map((option) => {
                const active = option.value === value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onChange(option.value)}
                        className={classNames(
                            "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                            active ? "bg-accent text-ink-dim" : "text-ink hover:bg-accent-dim"
                        )}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}

export function Switch({ checked, onChange, className, disabled = false, children, ...rest }) {
    return (
        <label
            className={classNames(
                "group w-full mt-2 inline-flex items-center gap-3 whitespace-nowrap",
                disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                className
            )}
            {...rest}
        >
            <input
                type="checkbox"
                className="peer sr-only"
                checked={checked}
                disabled={disabled}
                onChange={(event) => onChange(event.target.checked)}
            />
            <span className="bg-track peer-checked:bg-accent peer-disabled:opacity-50 h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors ease-out after:block after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform after:ease-out peer-checked:after:translate-x-5" />
            {children !== undefined && (
                <span className="text-base font-light truncate">{children}</span>
            )}
        </label>
    );
}

export function Select({ value, onChange, className, children, ...rest }) {
    return (
        <div className={classNames("relative", className)}>
            <select
                className={classNames(
                    "text-ink border-ink/60 hover:border-ink w-full cursor-pointer appearance-none rounded-md border bg-transparent py-2 pr-10 pl-3 transition-colors focus:outline-none",
                    "focus:border-accent"
                )}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                {...rest}
            >
                {children}
            </select>
            <ChevronDown
                size={16}
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-3 my-auto"
            />
        </div>
    );
}

function levenshtein(a, b) {
    if (a === b) {
        return 0;
    }
    const m = a.length;
    const n = b.length;
    if (m === 0) {
        return n;
    }
    if (n === 0) {
        return m;
    }
    let previous = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
        const current = [i];
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
        }
        previous = current;
    }
    return previous[n];
}

// Finds a window in `text` that matches `query` within `maxEdits` edits,
// returning its [start, end) range, or null when nothing is close enough.
function fuzzySubstringRange(text, query, maxEdits = 2) {
    const q = query.toLowerCase();
    const t = text.toLowerCase();
    let best = null;
    for (let length = Math.max(1, q.length - maxEdits); length <= q.length + maxEdits; length++) {
        for (let start = 0; start + length <= t.length; start++) {
            const distance = levenshtein(q, t.slice(start, start + length));
            if (
                distance <= maxEdits &&
                (best === null ||
                    distance < best.distance ||
                    (distance === best.distance && length < best.end - best.start))
            ) {
                best = { start, end: start + length, distance };
            }
        }
    }
    return best === null ? null : [best.start, best.end];
}

// Highlight ranges for `query` in `label`. Exact substrings are preferred;
// otherwise a fuzzy window within a couple of edits is accepted.
function matchRanges(label, query) {
    if (query === "") {
        return [];
    }
    const q = query.toLowerCase();
    const t = label.toLowerCase();
    const ranges = [];
    let index = t.indexOf(q);
    while (index !== -1) {
        ranges.push([index, index + q.length]);
        index = t.indexOf(q, index + 1);
    }
    if (ranges.length > 0) {
        return ranges;
    }
    const fuzzy = fuzzySubstringRange(t, q);
    return fuzzy === null ? null : [fuzzy];
}

function Highlight({ text, ranges }) {
    if (ranges.length === 0) {
        return text;
    }
    const parts = [];
    let cursor = 0;
    for (const [start, end] of ranges) {
        if (start > cursor) {
            parts.push(text.slice(cursor, start));
        }
        parts.push(
            <mark key={start} className="bg-accent/40 text-ink rounded-sm px-0.5">
                {text.slice(start, end)}
            </mark>
        );
        cursor = end;
    }
    if (cursor < text.length) {
        parts.push(text.slice(cursor));
    }
    return parts;
}

/**
 * A `Select` whose options carry a preview image.
 *
 * A native `option` cannot hold one, so this is the listbox pattern built from
 * scratch: focus stays on the button and `aria-activedescendant` points at the
 * highlighted row, which keeps Tab doing what it does everywhere else.
 */
export function ThumbnailSelect({ value, onChange, options, label, className, ...rest }) {
    const listId = useId();
    const buttonRef = useRef(null);
    const popupRef = useRef(null);
    const listRef = useRef(null);
    const typeahead = useRef({ text: "", time: 0 });
    const scrollOnActive = useRef(false);
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [anchor, setAnchor] = useState(null);
    const [query, setQuery] = useState("");
    const isDesktop = useIsDesktop();

    const selectedIndex = options.findIndex((option) => option.value === value);

    const filtered = (() => {
        const needle = query.trim();
        if (needle === "") {
            return options.map((option) => ({ option, ranges: [] }));
        }
        return options
            .map((option) => ({ option, ranges: matchRanges(option.label, needle) }))
            .filter((entry) => entry.ranges !== null);
    })();

    const selectedFilteredIndex = filtered.findIndex((entry) => entry.option.value === value);

    const openList = (index = selectedFilteredIndex) => {
        scrollOnActive.current = true;
        setActiveIndex(Math.max(index, 0));
        setAnchor(buttonRef.current.getBoundingClientRect());
        setOpen(true);
    };

    const close = ({ restoreFocus = true } = {}) => {
        setOpen(false);
        setQuery("");
        if (restoreFocus) {
            buttonRef.current?.focus();
        }
    };

    const choose = (index) => {
        const entry = filtered[index];
        if (entry !== undefined) {
            onChange(entry.option.value);
        }
        close();
    };

    // Letters jump to a name the way they do in a native select.
    const search = (key) => {
        const now = Date.now();
        typeahead.current.text =
            now - typeahead.current.time > 500 ? key : typeahead.current.text + key;
        typeahead.current.time = now;
        const prefix = typeahead.current.text.toLowerCase();
        return filtered.findIndex((entry) => entry.option.label.toLowerCase().startsWith(prefix));
    };

    const handleKeyDown = (event) => {
        const printable = event.key.length === 1 && !event.ctrlKey && !event.metaKey;

        if (!open) {
            if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
                event.preventDefault();
                openList();
            } else if (printable) {
                event.preventDefault();
                const match = search(event.key);
                openList(match === -1 ? selectedFilteredIndex : match);
            }
            return;
        }

        const last = filtered.length - 1;
        switch (event.key) {
            case "Escape":
                event.preventDefault();
                close();
                break;
            case "Tab":
                close({ restoreFocus: false });
                break;
            case "Enter":
            case " ":
                event.preventDefault();
                choose(activeIndex);
                break;
            case "ArrowDown":
                event.preventDefault();
                scrollOnActive.current = true;
                setActiveIndex(Math.min(activeIndex + 1, last));
                break;
            case "ArrowUp":
                event.preventDefault();
                scrollOnActive.current = true;
                setActiveIndex(Math.max(activeIndex - 1, 0));
                break;
            case "Home":
                event.preventDefault();
                scrollOnActive.current = true;
                setActiveIndex(0);
                break;
            case "End":
                event.preventDefault();
                scrollOnActive.current = true;
                setActiveIndex(last);
                break;
            default:
                if (printable) {
                    event.preventDefault();
                    const match = search(event.key);
                    if (match !== -1) {
                        scrollOnActive.current = true;
                        setActiveIndex(match);
                    }
                }
        }
    };

    const handleSearchKeyDown = (event) => {
        const last = filtered.length - 1;
        switch (event.key) {
            case "Escape":
                event.preventDefault();
                close();
                break;
            case "ArrowDown":
                event.preventDefault();
                scrollOnActive.current = true;
                setActiveIndex(Math.min(activeIndex + 1, last));
                break;
            case "ArrowUp":
                event.preventDefault();
                scrollOnActive.current = true;
                setActiveIndex(Math.max(activeIndex - 1, 0));
                break;
            case "Home":
                event.preventDefault();
                scrollOnActive.current = true;
                setActiveIndex(0);
                break;
            case "End":
                event.preventDefault();
                scrollOnActive.current = true;
                setActiveIndex(last);
                break;
            case "Enter":
                event.preventDefault();
                choose(activeIndex);
                break;
        }
    };

    useEffect(() => {
        if (!open) {
            return;
        }
        const reposition = () => setAnchor(buttonRef.current.getBoundingClientRect());
        const dismiss = (event) => {
            if (
                !buttonRef.current.contains(event.target) &&
                popupRef.current?.contains(event.target) !== true
            ) {
                setOpen(false);
            }
        };
        window.addEventListener("resize", reposition);
        // Capturing, since the panel this sits in is the element that scrolls.
        window.addEventListener("scroll", reposition, true);
        document.addEventListener("pointerdown", dismiss);
        return () => {
            window.removeEventListener("resize", reposition);
            window.removeEventListener("scroll", reposition, true);
            document.removeEventListener("pointerdown", dismiss);
        };
    }, [open]);

    useEffect(() => {
        if (open && scrollOnActive.current) {
            listRef.current?.children[activeIndex]?.scrollIntoView({ block: "nearest" });
            scrollOnActive.current = false;
        }
    }, [open, activeIndex]);

    // Filtering resets the view, so the top of the result list is shown.
    useEffect(() => {
        listRef.current?.scrollTo(0, 0);
    }, [query]);

    return (
        <div className={classNames("relative", className)}>
            <button
                type="button"
                ref={buttonRef}
                role="combobox"
                aria-label={label}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={open ? listId : undefined}
                aria-activedescendant={open ? `${listId}-${activeIndex}` : undefined}
                onClick={() => (open ? close() : openList())}
                onKeyDown={handleKeyDown}
                className={classNames(
                    "text-ink border-ink/60 hover:border-ink flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-left transition-colors focus:outline-none",
                    open ? "border-accent" : "focus:border-accent"
                )}
                {...rest}
            >
                <span
                    className={classNames(
                        "min-w-0 truncate",
                        options[selectedIndex]?.muted === true && "text-ink/50"
                    )}
                >
                    {options[selectedIndex]?.label ?? value}
                </span>
                <ChevronDown size={16} aria-hidden="true" className="shrink-0" />
            </button>

            {open && (
                <>
                    {!isDesktop && (
                        <div className="fixed inset-0 z-30 bg-black/50" aria-hidden="true" />
                    )}
                    <div
                        ref={popupRef}
                        className={classNames(
                            "border-ink/60 bg-surface fixed z-40 flex flex-col overflow-hidden rounded-md border shadow-[0_10px_20px_rgb(0_0_0/0.4)]",
                            !isDesktop && "inset-4"
                        )}
                        style={isDesktop ? popupPosition(anchor) : undefined}
                    >
                        <div className="border-ink/10 flex shrink-0 items-center gap-2 border-b px-3 py-2">
                            <Search size={14} aria-hidden="true" className="text-ink/50 shrink-0" />
                            <input
                                value={query}
                                onChange={(event) => {
                                    setQuery(event.target.value);
                                    setActiveIndex(0);
                                }}
                                onKeyDown={handleSearchKeyDown}
                                placeholder="Filter models"
                                aria-label="Filter models"
                                autoFocus
                                className="text-ink placeholder:text-ink/40 w-full bg-transparent focus:outline-none"
                            />
                        </div>
                        <ul
                            id={listId}
                            ref={listRef}
                            role="listbox"
                            aria-label={label}
                            className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1"
                        >
                            {filtered.map((entry, index) => {
                                const option = entry.option;
                                const selected = option.value === value;
                                return (
                                    <li
                                        key={option.value}
                                        id={`${listId}-${index}`}
                                        role="option"
                                        aria-selected={selected}
                                        // Dragging a thumb over the list is scrolling,
                                        // not pointing at a row.
                                        onPointerMove={(event) =>
                                            event.pointerType === "mouse" && setActiveIndex(index)
                                        }
                                        onClick={() => choose(index)}
                                        className={classNames(
                                            "flex cursor-pointer items-center gap-2 px-3 py-1.5",
                                            index === activeIndex && "bg-card-inner",
                                            selected && "text-accent"
                                        )}
                                    >
                                        {option.thumbnail !== undefined && (
                                            <img
                                                src={option.thumbnail}
                                                alt=""
                                                loading="lazy"
                                                decoding="async"
                                                className="bg-card-inner size-8 shrink-0 rounded object-cover"
                                            />
                                        )}
                                        <span
                                            className={classNames(
                                                "min-w-0 truncate",
                                                option.muted === true && "text-ink/50"
                                            )}
                                        >
                                            <Highlight text={option.label} ranges={entry.ranges} />
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </>
            )}
        </div>
    );
}

export function Button({ onClick, className, style, children, ...rest }) {
    return (
        <button
            type="button"
            className={classNames(
                "bg-accent text-ink-dim hover:bg-accent-hover active:bg-accent-active inline-flex items-center justify-center gap-2 rounded-full px-4 py-1.5 transition-colors",
                FOCUS_RING,
                className
            )}
            style={style}
            onClick={onClick}
            {...rest}
        >
            {children}
        </button>
    );
}

export function OutlineButton({ onClick, className, children, ...rest }) {
    return (
        <button
            type="button"
            className={classNames(
                "border-accent text-ink-dim hover:bg-accent-dim inline-flex items-center justify-center gap-2 rounded-full border-[1.5px] bg-transparent px-4 py-1.5 transition-colors",
                FOCUS_RING,
                className
            )}
            onClick={onClick}
            {...rest}
        >
            {children}
        </button>
    );
}

/**
 * An outline button that fills in while it is on. Both states carry the same
 * border, so toggling does not shift what sits below it.
 */
export function ToggleButton({ pressed, onToggle, className, children, ...rest }) {
    return (
        <button
            type="button"
            aria-pressed={pressed}
            onClick={() => onToggle(!pressed)}
            className={classNames(
                "border-accent text-ink-dim inline-flex items-center justify-center gap-2 rounded-full border-[1.5px] px-4 py-1.5 transition-colors",
                pressed ? "bg-accent" : "hover:bg-accent-dim bg-transparent",
                FOCUS_RING,
                className
            )}
            {...rest}
        >
            {children}
        </button>
    );
}

/** A bare icon control: no chrome until hovered or focused. */
export function IconButton({ onClick, label, className, children }) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            onClick={onClick}
            className={classNames(
                "hover:bg-card inline-flex items-center justify-center rounded-md p-1.5 transition-colors",
                FOCUS_RING,
                className
            )}
        >
            {children}
        </button>
    );
}

/**
 * Play/pause plus reset. The animation, graph and physics panels each had their
 * own copy of this row, with three different reset buttons.
 */
export function PlaybackControls({ active, onText, offText, onIcon, offIcon, onToggle, onReset }) {
    return (
        <div className="mt-4 mb-6 flex items-center gap-3">
            <Button className="w-28" onClick={() => onToggle(!active)}>
                {active ? onIcon : offIcon}
                {active ? onText : offText}
            </Button>
            <OutlineButton onClick={onReset}>
                <RotateCcw size={16} aria-hidden="true" />
                Reset
            </OutlineButton>
        </div>
    );
}

/** Stacks `Radio` rows into one card, rounded only at its outer corners. */
export function RadioGroup({ children }) {
    return <div className="flex flex-col gap-0.5">{children}</div>;
}

export function Radio({ name, value, checked, onChange, children }) {
    return (
        <label
            className={classNames(
                "flex cursor-pointer items-center gap-3 px-3 py-2 transition-colors first:rounded-t-md last:rounded-b-md",
                checked ? "bg-card-inner" : "bg-card hover:brightness-110"
            )}
        >
            <input
                type="radio"
                className="accent-accent h-4 w-4 shrink-0 cursor-pointer"
                name={name}
                checked={checked}
                onChange={() => onChange(value)}
            />
            <span className="text-base font-light">{children}</span>
        </label>
    );
}

export function Input({ className, ...rest }) {
    return (
        <input
            className={classNames(
                "text-ink border-ink/60 hover:border-ink focus:border-accent rounded-md border bg-transparent px-2 py-1 transition-colors focus:outline-none",
                className
            )}
            {...rest}
        />
    );
}

export function Title({ children }) {
    return <h2 className="mb-8 text-3xl leading-tight font-bold">{children}</h2>;
}

export function Subtitle({ children }) {
    return <h3 className="mt-10 mb-3 text-xl font-semibold">{children}</h3>;
}

export function SectionLabel({ className, children }) {
    return <p className={classNames("mt-8 mb-2 font-medium", className)}>{children}</p>;
}

/** Shared chrome for a tab panel: the heading and the scroll padding. */
export function Panel({ title, className, children }) {
    return (
        <div data-testid="panel" className="flex min-h-full flex-col px-5 pt-6 pb-12">
            <Title>{title}</Title>
            <div className={classNames("min-h-0 flex-1", className)}>{children}</div>
        </div>
    );
}
