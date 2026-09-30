import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function Dropdown({ label, items, value, onSelect }) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    const listRef = useRef(null);

    useEffect(() => {
        if (!open) {
            return;
        }
        const onDocumentPointerDown = (event) => {
            if (!rootRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("pointerdown", onDocumentPointerDown);
        return () => document.removeEventListener("pointerdown", onDocumentPointerDown);
    }, [open]);

    // Focus follows the arrow keys, so the browser handles selection and
    // scrolling; the component only decides which option should have focus.
    const focusOption = (index) => {
        const options = listRef.current?.querySelectorAll("[role='option']") ?? [];
        if (options.length === 0) {
            return;
        }
        const wrapped = (index + options.length) % options.length;
        options[wrapped].focus();
    };

    const onKeyDown = (event) => {
        if (event.key === "Escape" && open) {
            event.preventDefault();
            setOpen(false);
            rootRef.current.querySelector("button").focus();
            return;
        }

        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
            return;
        }
        event.preventDefault();

        if (!open) {
            setOpen(true);
            return;
        }

        const options = Array.from(listRef.current?.querySelectorAll("[role='option']") ?? []);
        const current = options.indexOf(document.activeElement);
        focusOption(current + (event.key === "ArrowDown" ? 1 : -1));
    };

    return (
        <div ref={rootRef} className="relative" onKeyDown={onKeyDown}>
            <button
                type="button"
                aria-expanded={open}
                aria-haspopup="listbox"
                className="bg-accent text-ink-dim hover:bg-accent-hover focus-visible:outline-accent flex w-full items-center justify-between gap-2 rounded-full px-4 py-1.5 transition-colors focus-visible:outline focus-visible:outline-offset-2"
                onClick={() => setOpen((wasOpen) => !wasOpen)}
            >
                <span className="truncate">{label}</span>
                <ChevronDown
                    size={16}
                    aria-hidden="true"
                    className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                />
            </button>

            {open && (
                <div
                    ref={listRef}
                    role="listbox"
                    className="bg-card animate-panel-in absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-md shadow-lg"
                >
                    {items.map((item) => (
                        <button
                            type="button"
                            role="option"
                            aria-selected={item.value === value}
                            key={item.value}
                            className={`hover:bg-card-inner focus-visible:outline-accent block w-full px-4 py-2 text-left transition-colors focus-visible:-outline-offset-2 focus-visible:outline ${
                                item.value === value ? "bg-accent text-ink-dim" : ""
                            }`}
                            onClick={() => {
                                onSelect(item.value);
                                setOpen(false);
                            }}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
