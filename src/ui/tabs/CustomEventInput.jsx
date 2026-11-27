import { Input, Switch } from "../controls.jsx";

// These types only differ by how many inputs to lay out and in which direction,
// so one component covers them all.
const VECTOR_SIZES = { float2: 2, float3: 3, float4: 4 };
const MATRIX_SIZES = { float2x2: 2, float3x3: 3, float4x4: 4 };

export function defaultValueForType(type) {
    switch (type) {
        case "bool":
            return false;
        case "int":
            return 0;
        case "float":
            return 0.0;
        case "float2":
            return [0, 0];
        case "float3":
            return [0, 0, 0];
        case "float4":
            return [0, 0, 0, 0];
        case "float2x2":
            return [1, 0, 0, 1];
        case "float3x3":
            return [1, 0, 0, 0, 1, 0, 0, 0, 1];
        case "float4x4":
            return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
        default:
            return null;
    }
}

// Coerces a numeric field to a valid value once editing finishes: integers are
// rounded to the nearest whole number, everything else falls back to zero.
function finalizeNumber(type, raw) {
    const number = raw === "" ? NaN : Number(raw);
    if (type === "int") {
        return Number.isFinite(number) ? Math.round(number) : 0;
    }
    return Number.isFinite(number) ? number : 0;
}

function NumberCell({ className, value, onChange }) {
    return (
        <Input
            className={className}
            type="number"
            value={value ?? ""}
            onChange={(event) =>
                onChange(event.target.value === "" ? null : Number(event.target.value))
            }
            onBlur={(event) => onChange(finalizeNumber("float", event.target.value))}
        />
    );
}

export function CustomEventInput({ name, type, value, onChange }) {
    // Scalars sit on one row: the label on the left, the control at the end.
    if (type === "bool") {
        return (
            <div className="flex items-center justify-between gap-3">
                <label className="text-sm">{name}</label>
                <Switch className="mt-0! w-auto!" checked={Boolean(value)} onChange={onChange} />
            </div>
        );
    }

    if (type === "int" || type === "float" || type === "ref") {
        const isRef = type === "ref";
        return (
            <div className="flex items-center justify-between gap-3">
                <label className="text-sm">{name}</label>
                <Input
                    className="w-28 shrink-0"
                    type={isRef ? "text" : "number"}
                    placeholder={isRef ? "null" : undefined}
                    value={value ?? ""}
                    onChange={(event) => {
                        if (isRef) {
                            onChange(event.target.value);
                        } else {
                            const raw = event.target.value;
                            onChange(raw === "" ? null : Number(raw));
                        }
                    }}
                    onBlur={(event) => {
                        if (isRef) {
                            const raw = event.target.value;
                            onChange(raw === "" ? null : raw);
                        } else {
                            onChange(finalizeNumber(type, event.target.value));
                        }
                    }}
                />
            </div>
        );
    }

    // Vectors and matrices: the label above, the cells on the next line.
    const label = <label className="mb-2 block text-sm">{name}</label>;
    const setAt = (index, next) =>
        onChange(value.map((item, position) => (position === index ? next : item)));

    const vectorSize = VECTOR_SIZES[type];
    if (vectorSize !== undefined) {
        return (
            <div>
                {label}
                <div className="flex gap-2">
                    {value.map((item, index) => (
                        <NumberCell
                            key={index}
                            className="min-w-0 flex-1"
                            value={item}
                            onChange={(next) => setAt(index, next)}
                        />
                    ))}
                </div>
            </div>
        );
    }

    const matrixSize = MATRIX_SIZES[type];
    if (matrixSize !== undefined) {
        return (
            <div>
                {label}
                <div
                    className="grid gap-1"
                    style={{ gridTemplateColumns: `repeat(${matrixSize}, minmax(0, 1fr))` }}
                >
                    {Array.from({ length: matrixSize }, (_, column) => (
                        <div key={column} className="flex flex-col gap-1">
                            {Array.from({ length: matrixSize }, (_, row) => {
                                const index = column * matrixSize + row;
                                return (
                                    <NumberCell
                                        key={row}
                                        className="w-full min-w-0"
                                        value={value[index]}
                                        onChange={(next) => setAt(index, next)}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return null;
}
