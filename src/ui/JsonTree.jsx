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

/**
 * Recursive collapsible view of an arbitrary JSON value. Objects and arrays
 * collapse; primitives and empty containers render inline as `name: value`.
 */
export function JsonTree({ data, inner = false }) {
    if (data === null || data === undefined) {
        return null;
    }
    return (
        <div className="flex flex-col gap-0.5">
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
                className={`break-words rounded-md px-2 py-0.5 ${
                    inner ? "bg-card-inner" : "bg-card"
                }`}
            >
                <span className="text-sm font-light">{name}</span>
                <span className="text-ink/60">: </span>
                <span className="text-ink/70 text-xs font-mono">{text}</span>
            </div>
        );
    }

    return <CollapsibleNode name={name} value={value} inner={inner} />;
}

function CollapsibleNode({ name, value, inner }) {
    const [open, setOpen] = useState(true);

    return (
        <div
            className={`break-words rounded-md px-2 py-0.5 ${inner ? "bg-card-inner" : "bg-card"}`}
        >
            <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpen(!open)}
                className="flex w-full items-center justify-between gap-2 text-left"
            >
                <span className="text-sm font-light">{name}</span>
                <ChevronDown
                    size={16}
                    aria-hidden="true"
                    className={`shrink-0 motion-safe:transition-transform ${open ? "" : "rotate-90"}`}
                />
            </button>

            {open && (
                <div className="mt-0.5">
                    <JsonTree data={value} inner={!inner} />
                </div>
            )}
        </div>
    );
}
