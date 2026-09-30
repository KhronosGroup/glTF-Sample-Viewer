import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function Dropdown({ label, items, value, onSelect }) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);

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

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                aria-expanded={open}
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
                <div className="bg-card animate-panel-in absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-md shadow-lg">
                    {items.map((item) => (
                        <button
                            type="button"
                            key={item.value}
                            className={`hover:bg-card-inner block w-full px-4 py-2 text-left transition-colors ${
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
