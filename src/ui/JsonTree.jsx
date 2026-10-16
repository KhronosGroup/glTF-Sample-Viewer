import { useState } from "react";

/**
 * Recursive collapsible view of an arbitrary JSON value, replacing the Vue
 * JsonToUiTemplate component. Reproduces Buefy's b-collapse markup.
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
    // Buefy's b-collapse defaults to open.
    const [open, setOpen] = useState(true);
    const isObject = value !== null && value !== undefined && value.constructor === Object;

    return (
        <div>
            <div
                className={inner ? "cardGrayMainInner" : "cardGrayMain"}
                style={{ wordBreak: "break-word" }}
            >
                <div className="cardHeader" role="button" onClick={() => setOpen(!open)}>
                    <p className="smallerLabel">{name}</p>
                    <a>
                        <span className="icon">
                            <i className={`mdi mdi-menu-${open ? "down" : "up"} mdi-24px`} />
                        </span>
                    </a>
                </div>
                {open && (
                    <div>
                        {isObject ? (
                            <JsonTree data={value} inner={!inner} />
                        ) : Array.isArray(value) ? (
                            value.map((item, index) => (
                                <label
                                    key={index}
                                    className="smallestLabel"
                                    style={{ display: "block" }}
                                >
                                    {String(item)}
                                </label>
                            ))
                        ) : (
                            <label className="smallestLabel">{String(value)}</label>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
