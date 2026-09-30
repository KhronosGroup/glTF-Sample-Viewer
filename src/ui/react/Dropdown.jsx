import { useEffect, useRef, useState } from "react";

/**
 * Reproduces Buefy's b-dropdown markup for a single-select list.
 */
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
        <div
            ref={rootRef}
            className={`dropdown dropdown-menu-animation is-mobile-modal${open ? " is-active" : ""}`}
        >
            <div tabIndex={0} className="dropdown-trigger" aria-haspopup="true">
                <button
                    className="button is-primary is-rounded"
                    type="button"
                    onClick={() => setOpen((wasOpen) => !wasOpen)}
                >
                    <span>{label}</span>
                    <span className="icon is-small">
                        <i className={`mdi mdi-menu-${open ? "up" : "down"}`} />
                    </span>
                </button>
            </div>
            <div
                className="background"
                aria-hidden="true"
                style={open ? undefined : { display: "none" }}
            />
            <div
                className="dropdown-menu"
                aria-hidden={!open}
                style={open ? undefined : { display: "none" }}
            >
                <div className="dropdown-content" role="list">
                    {items.map((item) => (
                        <a
                            key={item.value}
                            className={`dropdown-item${item.value === value ? " is-active" : ""}`}
                            role="listitem"
                            tabIndex={0}
                            onClick={() => {
                                onSelect(item.value);
                                setOpen(false);
                            }}
                        >
                            {item.label}
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}
