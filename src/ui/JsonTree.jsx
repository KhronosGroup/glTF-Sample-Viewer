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

function formatPrimitive(value) {
    if (typeof value === "string") {
        return JSON.stringify(value);
    }
    return String(value);
}

function formatArray(value) {
    return `[${value.map(formatPrimitive).join(", ")}]`;
}

function formatInline(value) {
    if (isPlainObject(value)) {
        return "{}";
    }
    if (Array.isArray(value)) {
        return formatArray(value);
    }
    return formatPrimitive(value);
}

/**
 * Recursive collapsible view of an arbitrary JSON value. Only objects and arrays
 * that contain further objects/arrays collapse; primitives and flat arrays render
 * inline as `name: value`.
 */
export function JsonTree({ data, inner = false }) {
    if (data === null || data === undefined) {
        return null;
    }
    return (
        <div className="flex flex-col gap-1.5">
            {Object.entries(data).map(([name, value]) => (
                <JsonNode key={name} name={name} value={value} inner={inner} />
            ))}
        </div>
    );
}

function JsonNode({ name, value, inner }) {
    const collapsible =
        (isPlainObject(value) && Object.keys(value).length > 0) ||
        (Array.isArray(value) && value.some(isContainer));

    if (!collapsible) {
        return (
            <div
                className={`break-words rounded-md px-3 py-2 ${
                    inner ? "bg-card-inner" : "bg-card"
                }`}
            >
                <span className="font-light">{name}</span>
                <span className="text-ink/60">: </span>
                <span className="font-extralight">{formatInline(value)}</span>
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
        <div className={`break-words rounded-md px-3 py-2 ${inner ? "bg-card-inner" : "bg-card"}`}>
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
                <div className="mt-1.5 text-base font-extralight">
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
