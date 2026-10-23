/**
 * Form primitives, styled with Tailwind utilities.
 */

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, RotateCcw } from "lucide-react";

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
    const listRef = useRef(null);
    const typeahead = useRef({ text: "", time: 0 });
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [anchor, setAnchor] = useState(null);
    const isDesktop = useIsDesktop();

    const selectedIndex = options.findIndex((option) => option.value === value);

    const openList = (index = selectedIndex) => {
        setActiveIndex(Math.max(index, 0));
        setAnchor(buttonRef.current.getBoundingClientRect());
        setOpen(true);
    };

    const close = ({ restoreFocus = true } = {}) => {
        setOpen(false);
        if (restoreFocus) {
            buttonRef.current?.focus();
        }
    };

    const choose = (index) => {
        if (options[index] !== undefined) {
            onChange(options[index].value);
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
        const match = options.findIndex((option) => option.label.toLowerCase().startsWith(prefix));
        return match;
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
                openList(match === -1 ? selectedIndex : match);
            }
            return;
        }

        const last = options.length - 1;
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
                setActiveIndex(Math.min(activeIndex + 1, last));
                break;
            case "ArrowUp":
                event.preventDefault();
                setActiveIndex(Math.max(activeIndex - 1, 0));
                break;
            case "Home":
                event.preventDefault();
                setActiveIndex(0);
                break;
            case "End":
                event.preventDefault();
                setActiveIndex(last);
                break;
            default:
                if (printable) {
                    event.preventDefault();
                    const match = search(event.key);
                    if (match !== -1) {
                        setActiveIndex(match);
                    }
                }
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
                listRef.current?.contains(event.target) !== true
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
        if (open) {
            listRef.current?.children[activeIndex]?.scrollIntoView({ block: "nearest" });
        }
    }, [open, activeIndex]);

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
                <span className="min-w-0 truncate">{options[selectedIndex]?.label ?? value}</span>
                <ChevronDown size={16} aria-hidden="true" className="shrink-0" />
            </button>

            {open && (
                <>
                    {!isDesktop && (
                        <div className="fixed inset-0 z-30 bg-black/50" aria-hidden="true" />
                    )}
                    <ul
                        id={listId}
                        ref={listRef}
                        role="listbox"
                        aria-label={label}
                        className={classNames(
                            "border-ink/60 bg-surface fixed z-40 overflow-y-auto overscroll-contain rounded-md border py-1 shadow-[0_10px_20px_rgb(0_0_0/0.4)]",
                            !isDesktop && "inset-4"
                        )}
                        style={isDesktop ? popupPosition(anchor) : undefined}
                    >
                        {options.map((option, index) => (
                            <li
                                key={option.value}
                                id={`${listId}-${index}`}
                                role="option"
                                aria-selected={index === selectedIndex}
                                // Dragging a thumb over the list is scrolling,
                                // not pointing at a row.
                                onPointerMove={(event) =>
                                    event.pointerType === "mouse" && setActiveIndex(index)
                                }
                                onClick={() => choose(index)}
                                className={classNames(
                                    "flex cursor-pointer items-center gap-2 px-3 py-1.5",
                                    index === activeIndex && "bg-card-inner",
                                    index === selectedIndex && "text-accent"
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
                                <span className="min-w-0 truncate">{option.label}</span>
                            </li>
                        ))}
                    </ul>
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

export function Radio({ name, value, checked, onChange, children }) {
    return (
        <label className="inline-flex cursor-pointer items-center gap-2">
            <input
                type="radio"
                className="accent-accent h-4 w-4"
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
