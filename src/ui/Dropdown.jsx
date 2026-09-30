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
                className="bg-accent text-ink-dim hover:bg-accent-hover flex w-full items-center justify-between gap-2 rounded-full px-4 py-1 transition-colors"
                onClick={() => setOpen((wasOpen) => !wasOpen)}
            >
                <span className="truncate">{label}</span>
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                    className={open ? "rotate-180" : undefined}
                >
                    <path
                        d="M2 5l6 6 6-6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </svg>
            </button>

            {open && (
                <div className="bg-card absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded shadow-lg">
                    {items.map((item) => (
                        <button
                            type="button"
                            key={item.value}
                            className={`hover:bg-card-inner block w-full px-4 py-2 text-left ${
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
