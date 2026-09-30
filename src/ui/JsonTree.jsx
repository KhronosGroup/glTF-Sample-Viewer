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
        <div className={`mb-2 px-2 py-1 break-words ${inner ? "bg-card-inner" : "bg-card"}`}>
            <button
                type="button"
                className="flex w-full items-center justify-between text-left"
                onClick={() => setOpen(!open)}
            >
                <span className="font-light">{name}</span>
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                    className={open ? undefined : "rotate-180"}
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
