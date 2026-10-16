import { Field, Input, Switch } from "../controls.jsx";

// The Vue template repeated near-identical markup for each of these; they only
// differ by how many inputs to lay out and in which direction.
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

function NumberCell({ className, value, onChange }) {
    return (
        <Input
            className={className}
            type="number"
            value={value}
            required
            onChange={(event) => onChange(Number(event.target.value))}
        />
    );
}

export function CustomEventInput({ name, type, value, onChange }) {
    if (type === "bool") {
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                }}
            >
                <label className="smallerLabel" style={{ marginBottom: 0 }}>
                    {name}
                </label>
                <Switch checked={Boolean(value)} onChange={onChange} />
            </div>
        );
    }

    const label = (
        <label className="smallerLabel" style={{ display: "block", marginBottom: "0.5em" }}>
            {name}
        </label>
    );

    if (type === "float" || type === "int") {
        return (
            <div>
                {label}
                <Field>
                    <Input
                        className="longNumberInput"
                        type={type === "float" ? "number" : "text"}
                        step={type === "float" ? "any" : undefined}
                        pattern={type === "int" ? "[\\-]?[0-9]*" : undefined}
                        value={value ?? ""}
                        required
                        onChange={(event) => onChange(Number(event.target.value))}
                    />
                </Field>
            </div>
        );
    }

    const setAt = (index, next) =>
        onChange(value.map((item, position) => (position === index ? next : item)));

    const vectorSize = VECTOR_SIZES[type];
    if (vectorSize !== undefined) {
        return (
            <div>
                {label}
                <div style={{ display: "flex", gap: "0.5em" }}>
                    {value.map((item, index) => (
                        <div key={index}>
                            <NumberCell
                                className="vectorInput"
                                value={item}
                                onChange={(next) => setAt(index, next)}
                            />
                        </div>
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
                    style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${matrixSize}, 1fr)`,
                        gap: "0.3em",
                        width: "max-content"
                    }}
                >
                    {Array.from({ length: matrixSize }, (_, column) => (
                        <div
                            key={column}
                            style={{ display: "flex", flexDirection: "column", gap: "0.3em" }}
                        >
                            {Array.from({ length: matrixSize }, (_, row) => {
                                const index = column * matrixSize + row;
                                return (
                                    <div key={row}>
                                        <NumberCell
                                            className="matrixInput"
                                            value={value[index]}
                                            onChange={(next) => setAt(index, next)}
                                        />
                                    </div>
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
