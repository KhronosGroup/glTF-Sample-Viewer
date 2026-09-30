import { ChevronDown } from "lucide-react";
import { useState } from "react";

/**
 * Recursive collapsible view of an arbitrary JSON value.
 */
export function JsonTree({ data, inner = false }) {
    if (data === null || data === undefined) {
        return null;
    }

    return (
        <div>
            {Object.entries(data).map(([name, value]) => (
                <JsonEntry key={name} name={name} value={value} inner={inner} />
            ))}
        </div>
    );
}

function JsonEntry({ name, value, inner }) {
    const [open, setOpen] = useState(true);
    const isObject = value !== null && value !== undefined && value.constructor === Object;

    return (
        <div
            className={`mb-2 rounded-md px-3 py-2 break-words ${inner ? "bg-card-inner" : "bg-card"}`}
        >
            <button
                type="button"
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-2 text-left"
                onClick={() => setOpen(!open)}
            >
                <span className="font-light">{name}</span>
                <ChevronDown
                    size={16}
                    aria-hidden="true"
                    className={`shrink-0 transition-transform ${open ? "" : "-rotate-90"}`}
                />
            </button>

            {open && (
                <div className="text-base font-extralight">
                    {isObject ? (
                        <JsonTree data={value} inner={!inner} />
                    ) : Array.isArray(value) ? (
                        value.map((item, index) => (
                            <span key={index} className="block">
                                {String(item)}
                            </span>
                        ))
                    ) : (
                        String(value)
                    )}
                </div>
            )}
        </div>
    );
}
