import { ChevronDown } from "lucide-react";
import { useState } from "react";

function isPlainObject(value) {
    return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        value.constructor === Object
    );
}

function isContainer(value) {
    return isPlainObject(value) || Array.isArray(value);
}

function isEmptyContainer(value) {
    return isPlainObject(value) ? Object.keys(value).length === 0 : value.length === 0;
}

// Strings are shown without quotes, dimmed instead so they stand apart from
// numbers and booleans.
function valueClass(value) {
    return typeof value === "string" ? "text-ink/70" : "";
}

/**
 * Recursive collapsible view of an arbitrary JSON value. Objects and arrays
 * collapse; primitives and empty containers render inline as `name: value`.
 */
export function JsonTree({ data, inner = false }) {
    if (data === null || data === undefined) {
        return null;
    }
    return (
        <div className="flex flex-col gap-1">
            {Object.entries(data).map(([name, value]) => (
                <JsonNode key={name} name={name} value={value} inner={inner} />
            ))}
        </div>
    );
}

function JsonNode({ name, value, inner }) {
    const collapsible = isContainer(value) && !isEmptyContainer(value);

    if (!collapsible) {
        const text = isContainer(value) ? (isPlainObject(value) ? "{}" : "[]") : String(value);
        return (
            <div
                className={`break-words rounded-md px-2 py-1.5 ${
                    inner ? "bg-card-inner" : "bg-card"
                }`}
            >
                <span className="font-light">{name}</span>
                <span className="text-ink/60">: </span>
                <span className={`font-extralight ${valueClass(value)}`}>{text}</span>
            </div>
        );
    }

    return <CollapsibleNode name={name} value={value} inner={inner} />;
}

function CollapsibleNode({ name, value, inner }) {
    const [open, setOpen] = useState(true);
    const isObject = isPlainObject(value);
    const count = isObject ? Object.keys(value).length : value.length;
    const hint = isObject ? `{${count}}` : `[${count}]`;

    return (
        <div
            className={`break-words rounded-md px-2 py-1.5 ${inner ? "bg-card-inner" : "bg-card"}`}
        >
            <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpen(!open)}
                className="flex w-full items-center justify-between gap-2 text-left"
            >
                <span className="font-light">
                    {name}
                    <span className="text-ink/60"> {hint}</span>
                </span>
                <ChevronDown
                    size={16}
                    aria-hidden="true"
                    className={`shrink-0 transition-transform ${open ? "" : "-rotate-90"}`}
                />
            </button>

            {open && (
                <div className="mt-1 text-base font-extralight">
                    {isObject ? (
                        <JsonTree data={value} inner={!inner} />
                    ) : (
                        value.map((item, index) => (
                            <JsonNode key={index} name={`[${index}]`} value={item} inner={!inner} />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
